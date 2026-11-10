/**
 * Print helpers shared by every list / report / invoice screen.
 *
 * - printPage()            → prints the current page (index.css @media print rules hide the chrome
 *                            and keep the <PrintHeader/> + table).
 * - printElement(target)   → prints ONLY one element (invoice, receipt, barcode sheet …) in a
 *                            hidden iframe with the app stylesheets and the company header.
 * - getCompanyInfo()       → company information (from the company-info API cache) used on printed documents.
 */

import { companyStore, companyHeaderImage } from '../services/companyStore';
import { appSettingsService } from '../services/appSettingsService';

export const getCompanyInfo = () => ({
  company_name: '',
  address: '',
  phone_number: '',
  invoice_greetings: '',
  ...companyStore.getCached(),
});

export const printPage = () => {
  window.print();
};

const collectStyles = () =>
  Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join('\n');

const companyHeaderHtml = (title) => {
  const info = getCompanyInfo();
  const img = companyHeaderImage(info);
  const mode = appSettingsService.get('print_header_mode', 'card');
  if (mode === 'image' && img) {
    return `<div style="text-align:center;margin-bottom:12px"><img src="${img}" style="max-width:100%;max-height:140px;object-fit:contain"/></div>
      ${title ? `<h3 style="text-align:center;margin:6px 0 12px;font-size:15px">${title}</h3>` : ''}`;
  }
  return `
    <div style="text-align:center;border-bottom:2px solid #1e293b;padding-bottom:8px;margin-bottom:12px">
      ${info.invoice_greetings ? `<div style="font-size:11px;color:#475569">${info.invoice_greetings}</div>` : ''}
      <div style="font-size:22px;font-weight:800;color:#1e293b">${info.company_name || ''}</div>
      ${info.address ? `<div style="font-size:12px;color:#334155">${info.address}</div>` : ''}
      ${info.phone_number ? `<div style="font-size:12px;color:#334155">Phone: ${info.phone_number}</div>` : ''}
      ${title ? `<div style="display:inline-block;margin-top:8px;padding:3px 14px;border:1px solid #1e293b;border-radius:4px;font-weight:700;font-size:13px">${title}</div>` : ''}
    </div>`;
};

/**
 * Print a single DOM element (or element id) in isolation.
 * @param {HTMLElement|string} target  element or its id
 * @param {{title?: string, withHeader?: boolean, pageSize?: string, extraCss?: string}} options
 */
export const printElement = (target, options = {}) => {
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) {
    window.print();
    return;
  }
  const isPos = options.isPos || options.pageSize?.includes('80mm') || options.pageSize?.includes('58mm') || (typeof target === 'string' && target.includes('pos'));
  const { title = '', withHeader = true, pageSize = isPos ? '80mm auto' : 'A4 portrait', extraCss = '' } = options;
  const pageMargin = options.margin !== undefined ? options.margin : (isPos ? '1mm 2mm' : '10mm');
  const bodyPadding = options.bodyPadding !== undefined ? options.bodyPadding : (isPos ? '1mm' : '8px');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title || document.title}</title>
    ${collectStyles()}
    <style>
      @page { size: ${pageSize}; margin: ${pageMargin}; }
      html, body { background: #fff !important; margin: 0; padding: 0; color: #000; font-family: 'Segoe UI', Arial, sans-serif, 'Hind Siliguri'; }
      body { padding: ${bodyPadding}; box-sizing: border-box; }
      .no-print, .no-print-col, .action-column, button, input[type=button], input[type=submit] { display: none !important; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #000; padding: 3px 4px; font-size: 11px; color: #000; }
      th { background: #f8fafc; font-weight: bold; }
      ${isPos ? `
        @page { size: 80mm auto; margin: 1mm 2mm; }
        body { width: 76mm !important; max-width: 80mm !important; margin: 0 auto !important; padding: 1mm !important; }
        .pos-receipt-wrapper { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
        .receipt-header-image img { max-width: 100% !important; height: auto !important; max-height: 85px !important; object-fit: contain !important; }
        table { border-collapse: collapse !important; width: 100% !important; color: black !important; font-size: 11px !important; }
        th, td { border: 1px solid black !important; padding: 3px 4px !important; color: black !important; }
      ` : ''}
      ${extraCss}
    </style></head><body>
    ${withHeader ? companyHeaderHtml(title) : ''}
    ${el.outerHTML}
    </body></html>`);
  doc.close();

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => iframe.remove(), 1000);
    }
  };

  // Wait for images (logo / barcodes) before opening the print dialog
  const images = Array.from(doc.images || []);
  if (images.length === 0) {
    setTimeout(finish, 100);
    return;
  }
  let pending = images.length;
  const done = () => {
    pending -= 1;
    if (pending <= 0) finish();
  };
  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.onload = done;
      img.onerror = done;
    }
  });
  setTimeout(finish, 2500); // safety net
};

export default { printPage, printElement, getCompanyInfo };
