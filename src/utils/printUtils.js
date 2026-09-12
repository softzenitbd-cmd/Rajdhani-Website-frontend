/**
 * Print helpers shared by every list / report / invoice screen.
 *
 * - printPage()            → prints the current page (index.css @media print rules hide the chrome
 *                            and keep the <PrintHeader/> + table).
 * - printElement(target)   → prints ONLY one element (invoice, receipt, barcode sheet …) in a
 *                            hidden iframe with the app stylesheets and the company header.
 * - getCompanyInfo()       → cached company information used on printed documents.
 */

export const getCompanyInfo = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('companyInfoData') || 'null');
    return {
      company_name: 'রাজধানী গার্মেন্টস',
      address: '',
      phone_number: '',
      invoice_greetings: '',
      ...(saved || {}),
    };
  } catch {
    return { company_name: 'রাজধানী গার্মেন্টস', address: '', phone_number: '', invoice_greetings: '' };
  }
};

export const printPage = () => {
  window.print();
};

const collectStyles = () =>
  Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join('\n');

const companyHeaderHtml = (title) => {
  const info = getCompanyInfo();
  const img = localStorage.getItem('companyHeaderImage');
  const mode = localStorage.getItem('companyHeaderMode') || 'card';
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
  const { title = '', withHeader = true, pageSize = 'A4 portrait', extraCss = '' } = options;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title || document.title}</title>
    ${collectStyles()}
    <style>
      @page { size: ${pageSize}; margin: 10mm; }
      html, body { background: #fff !important; margin: 0; padding: 0; color: #000; font-family: inherit; }
      body { padding: 8px; }
      .no-print, .no-print-col, .action-column, button, input[type=button], input[type=submit] { display: none !important; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #94a3b8; padding: 4px 6px; font-size: 11px; }
      th { background: #f1f5f9; }
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
