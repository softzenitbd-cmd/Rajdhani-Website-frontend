import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { toList, nameOf } from '../utils/apiHelpers';
import { crmService } from './crmService';
import { productService } from './productService';

const idOf = (v) => (v && typeof v === 'object' ? v.id || v.uuid || v.pk : v);
const num = (v) => Number(v || 0);

/**
 * Sale item rows used by every Sales Report screen.
 *
 * 1. GET /api/sale/reports/sales/ (documented item-wise report) is tried first.
 * 2. When the deployed backend does not expose it (404) the same rows are built
 *    from final invoices (`/api/sale/invoices/`) and their items (nested `items`,
 *    or `/api/sale/items/`), joined with products / clients for barcode, group and profit.
 */
let reportEndpointMissing = false;

const reportParams = (filters = {}) => {
  const params = {};
  ['from_date', 'to_date', 'barcode', 'client_id', 'client_group_id', 'product_id', 'product_group_id'].forEach((k) => {
    if (filters[k]) params[k] = filters[k];
  });
  return params;
};

// rows from /api/sale/reports/sales/ → add the flat aliases the screens read
const normalizeReportRow = (r) => {
  const inv = r.invoice || {};
  const qty = num(r.product_qty ?? r.quantity ?? r.qty);
  const price = num(r.product_sale_price ?? r.selling_price ?? r.price);
  const amount = num(r.amount) || qty * price;
  const clientName = r.client?.client_name || r.client_name || (typeof r.client_id === 'string' ? r.client_id.split(' | ')[0] : '');
  return {
    ...r,
    invoice: inv,
    invoice_id: inv.id || r.invoice_id,
    voucher: inv.id || r.invoice_id,
    client: clientName,
    client_name: clientName,
    product: r.products || r.product_name || '',
    product_name: r.products || r.product_name || '',
    unit: r.unit_id || r.unit || '',
    qty,
    quantity: qty,
    product_qty: qty,
    price,
    unit_price: price,
    product_sale_price: price,
    amount,
    total: amount,
    total_amount: amount,
    discount: num(inv.discount),
    grand_total: num(inv.grand_total),
    receive: num(inv.receive_amount),
    receive_amount: num(inv.receive_amount),
    due: num(inv.due_amount ?? r.current_due),
    due_amount: num(inv.due_amount ?? r.current_due),
    profit: num(r.profit),
    buy_price: num(r.product_purchase_price ?? r.purchase_price ?? r.buying_price ?? r.cost),
    date: r.date || r.issued_date,
  };
};

const getSalesReport = async (filters = {}) => {
  if (!reportEndpointMissing) {
    try {
      const res = await apiClient.get(ENDPOINTS.SALE_REPORT, { params: reportParams(filters) });
      return toList(res).map(normalizeReportRow);
    } catch (err) {
      if (err?.status !== 404) throw err;
      reportEndpointMissing = true; // fall back for the rest of the session
    }
  }
  return buildSalesReport(filters);
};

const buildSalesReport = async (filters = {}) => {
  const invParams = { status: 1 };
  if (filters.from_date) invParams.from_date = filters.from_date;
  if (filters.to_date) invParams.to_date = filters.to_date;
  if (filters.client_id) invParams.client = filters.client_id;

  const needProducts = true; // barcode / group / purchase price for profit
  const needClients = !!filters.client_group_id;

  const [invRes, prodRes, clientRes] = await Promise.all([
    apiClient.get(ENDPOINTS.SALE_INVOICES, { params: invParams }),
    needProducts ? productService.getProducts().catch(() => []) : [],
    needClients ? crmService.getClients().catch(() => []) : [],
  ]);

  const invoices = toList(invRes).filter((inv) => inv.status === undefined || Number(inv.status) === 1);
  const products = new Map(toList(prodRes).map((p) => [String(p.id || p.uuid), p]));
  const clients = new Map(toList(clientRes).map((c) => [String(c.id || c.uuid), c]));

  // Items: prefer nested, otherwise load the item table once and group by invoice
  let itemsByInvoice = null;
  if (!invoices.some((inv) => Array.isArray(inv.items) && inv.items.length)) {
    const allItems = toList(await apiClient.get(ENDPOINTS.SALE_ITEMS).catch(() => []));
    itemsByInvoice = new Map();
    allItems.forEach((it) => {
      const key = String(idOf(it.sale ?? it.invoice ?? it.sale_invoice ?? it.sale_id ?? it.invoice_id));
      if (!itemsByInvoice.has(key)) itemsByInvoice.set(key, []);
      itemsByInvoice.get(key).push(it);
    });
  }

  const rows = [];
  invoices.forEach((inv) => {
    const invId = String(inv.id || inv.uuid);
    const items = Array.isArray(inv.items) && inv.items.length ? inv.items : itemsByInvoice?.get(invId) || [];
    const clientId = idOf(inv.client);
    const client = clients.get(String(clientId)) || (typeof inv.client === 'object' ? inv.client : null);
    const clientName = inv.client_name || nameOf(inv.client, '') || client?.name || client?.company_name || '';
    const clientGroupId = idOf(client?.group ?? client?.client_group ?? inv.client_group);
    const date = inv.date || inv.issued_date || inv.created_at;
    const voucher = inv.invoice_id || inv.invoice_no || inv.voucher || invId.slice(0, 8);

    items.forEach((it, idx) => {
      const productId = idOf(it.product);
      const product = products.get(String(productId)) || (typeof it.product === 'object' ? it.product : null);
      const qty = num(it.quantity ?? it.qty ?? it.product_qty);
      const price = num(it.selling_price ?? it.sales_price ?? it.price ?? it.product_sale_price ?? product?.sales_price);
      const amount = num(it.total_selling_price ?? it.total ?? it.amount) || qty * price;
      const cost = num(it.purchase_price ?? product?.purchase_price ?? product?.buying_price);
      const barcode = it.barcode || product?.barcode || product?.code || '';
      const productName = it.product_name || it.name || nameOf(it.product, '') || product?.name || '';
      const productGroupId = idOf(product?.group ?? product?.product_group ?? it.product_group);
      const unit = it.unit_name || nameOf(it.unit, '') || product?.unit_name || nameOf(product?.unit, '');

      rows.push({
        id: it.id || `${invId}-${idx}`,
        date,
        issued_date: date,
        invoice: inv,
        invoice_id: voucher,
        voucher,
        client: clientName,
        client_name: clientName,
        client_id: clientId,
        client_group_id: clientGroupId,
        product: productName,
        product_name: productName,
        products: productName,
        product_id: productId,
        product_group_id: productGroupId,
        barcode,
        unit,
        qty,
        quantity: qty,
        product_qty: qty,
        price,
        unit_price: price,
        product_sale_price: price,
        amount,
        total: amount,
        total_amount: amount,
        discount: num(inv.total_discount ?? inv.discount),
        grand_total: num(inv.grand_total),
        receive: num(inv.receive_amount),
        receive_amount: num(inv.receive_amount),
        due: num(inv.total_due ?? inv.due),
        due_amount: num(inv.total_due ?? inv.due),
        profit: cost ? (price - cost) * qty : 0,
        buy_price: cost,
      });
    });
  });

  const eq = (a, b) => String(a ?? '') === String(b ?? '');
  return rows.filter((r) => {
    if (filters.barcode && !String(r.barcode).toLowerCase().includes(String(filters.barcode).toLowerCase())) return false;
    if (filters.product_id && !eq(r.product_id, filters.product_id)) return false;
    if (filters.product_group_id && !eq(r.product_group_id, filters.product_group_id)) return false;
    if (filters.client_group_id && !eq(r.client_group_id, filters.client_group_id)) return false;
    if (filters.client_id && !eq(r.client_id, filters.client_id)) return false;
    return true;
  });
};

export const saleService = {
  // ==========================================
  // 1. Sales Invoice API
  // ==========================================
  getSalesInvoices: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.client) params.client = filters.client;
    if (filters.account_id) params.account_id = filters.account_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.status !== undefined) params.status = filters.status; // Draft vs General
    return await apiClient.get(ENDPOINTS.SALE_INVOICES, { params });
  },

  createSalesInvoice: async (data) => {
    return await apiClient.post(ENDPOINTS.SALE_INVOICES, data);
  },

  getSalesInvoiceById: async (id) => {
    return await apiClient.get(`${ENDPOINTS.SALE_INVOICES}${id}/`);
  },

  updateSalesInvoice: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.SALE_INVOICES}${id}/`, data);
  },

  deleteSalesInvoice: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.SALE_INVOICES}${id}/`);
  },

  // ==========================================
  // 2. Sales Report (item-wise rows built from invoices + items)
  // ==========================================
  getSalesReport,

  getSaleItems: async (params = {}) => {
    return await apiClient.get(ENDPOINTS.SALE_ITEMS, { params });
  },

  // ==========================================
  // 3. Sales Return API
  // ==========================================
  getSalesReturns: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.client) params.client = filters.client;
    if (filters.account_id) params.account_id = filters.account_id;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.status !== undefined) params.status = filters.status;
    return await apiClient.get(ENDPOINTS.SALE_RETURNS, { params });
  },

  createSalesReturn: async (data) => {
    return await apiClient.post(ENDPOINTS.SALE_RETURNS, data);
  },

  updateSalesReturn: async (id, data) => {
    // Specifically useful for converting draft returns to final (status: 1)
    return await apiClient.patch(`${ENDPOINTS.SALE_RETURNS}${id}/`, data);
  },

  deleteSalesReturn: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.SALE_RETURNS}${id}/`);
  },
};

export default saleService;
