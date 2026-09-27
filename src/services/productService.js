import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { toList } from '../utils/apiHelpers';

// Helper function to generate basic CRUD methods for supporting APIs
const generateCrudMethods = (endpoint) => ({
  getAll: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    return await apiClient.get(endpoint, { params });
  },
  create: async (data) => {
    return await apiClient.post(endpoint, data);
  },
  update: async (id, data) => {
    return await apiClient.patch(`${endpoint}${id}/`, data);
  },
  delete: async (id) => {
    return await apiClient.delete(`${endpoint}${id}/`);
  }
});

const nameOfDetail = (row, key) => {
  const d = row[`${key}_details`] || row[`${key}_detail`];
  if (d && typeof d === 'object') return d.name || '';
  if (row[key] && typeof row[key] === 'object') return row[key].name || '';
  return row[`${key}_name`] || '';
};

/**
 * Normalise a product row from GET /api/product/list/.
 * Documented fields: name, custom_barcode_no, buying_price, selling_price, wholesale_price,
 * opening_stock, stock, stock_warning, unit, group, brand, color, size, warehouse, status
 * plus populated `*_details` objects. The aliases below let every screen use one spelling.
 */
export const normalizeProduct = (p) => {
  if (!p || typeof p !== 'object') return p;
  const idOf = (v) => (v && typeof v === 'object' ? v.id ?? v.uuid : v);
  const barcode = p.custom_barcode_no || p.barcode || p.code || '';
  const buying = p.buying_price ?? p.purchase_price ?? p.buy_price ?? 0;
  const selling = p.selling_price ?? p.sales_price ?? p.sell_price ?? p.price ?? 0;
  return {
    ...p,
    unit: idOf(p.unit),
    group: idOf(p.group),
    brand: idOf(p.brand),
    color: idOf(p.color),
    size: idOf(p.size),
    warehouse: idOf(p.warehouse),
    custom_barcode_no: barcode,
    barcode,
    code: barcode,
    buying_price: buying,
    purchase_price: buying,
    selling_price: selling,
    sales_price: selling,
    price: selling,
    stock: p.stock ?? p.current_stock ?? 0,
    unit_name: nameOfDetail(p, 'unit'),
    group_name: nameOfDetail(p, 'group'),
    brand_name: nameOfDetail(p, 'brand'),
    color_name: nameOfDetail(p, 'color'),
    size_name: nameOfDetail(p, 'size'),
    warehouse_name: nameOfDetail(p, 'warehouse'),
  };
};

/**
 * A row of GET /api/product/reports/stock/ carries different field names than
 * the product list (`product_id`, `current_stock`, `selling_price`). Map it onto
 * the product shape so a product found through the stock report can be used
 * anywhere a normal product is.
 */
const stockRowToProduct = (row = {}) =>
  normalizeProduct({
    ...row,
    id: row.product_id || row.id,
    custom_barcode_no: row.barcode || row.custom_barcode_no || '',
    selling_price: row.selling_price ?? row.sales_price ?? 0,
    buying_price: row.buying_price ?? row.purchase_price ?? 0,
    stock: row.current_stock ?? row.stock ?? 0,
  });

const normalizeList = (res) => {
  if (Array.isArray(res)) return res.map(normalizeProduct);
  if (Array.isArray(res?.results)) return { ...res, results: res.results.map(normalizeProduct) };
  return toList(res).map(normalizeProduct);
};

/** Map any legacy spelling used by the forms onto the documented write fields. */
export const toProductPayload = (data = {}) => {
  const out = { ...data };
  const move = (from, to) => {
    if (out[from] !== undefined && out[to] === undefined) out[to] = out[from];
    delete out[from];
  };
  move('purchase_price', 'buying_price');
  move('buy_price', 'buying_price');
  move('sales_price', 'selling_price');
  move('sell_price', 'selling_price');
  move('price', 'selling_price');
  move('barcode', 'custom_barcode_no');
  move('code', 'custom_barcode_no');
  ['unit_name', 'group_name', 'brand_name', 'color_name', 'size_name', 'warehouse_name',
    'unit_details', 'group_details', 'brand_details', 'color_details', 'size_details', 'warehouse_details'].forEach((k) => delete out[k]);
  ['unit', 'group', 'brand', 'color', 'size', 'warehouse'].forEach((k) => {
    if (out[k] === '') out[k] = null;
  });
  if (out.custom_barcode_no === '') delete out.custom_barcode_no;
  return out;
};

export const productService = {
  // ==========================================
  // 1. Supporting APIs (Base Data)
  // ==========================================
  units: generateCrudMethods(ENDPOINTS.PRODUCT_UNITS),
  groups: generateCrudMethods(ENDPOINTS.PRODUCT_GROUPS),
  brands: generateCrudMethods(ENDPOINTS.PRODUCT_BRANDS),
  colors: generateCrudMethods(ENDPOINTS.PRODUCT_COLORS),
  sizes: generateCrudMethods(ENDPOINTS.PRODUCT_SIZES),
  warehouses: generateCrudMethods(ENDPOINTS.PRODUCT_WAREHOUSES),

  // ==========================================
  // 2. Main Product API
  // ==========================================
  getProducts: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.barcode) params.barcode = filters.barcode;
    if (filters.group) params.group = filters.group;
    if (filters.brand) params.brand = filters.brand;
    if (filters.status !== undefined) params.status = filters.status;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return normalizeList(await apiClient.get(ENDPOINTS.PRODUCT_LIST, { params }));
  },

  getProductById: async (id) => {
    return normalizeProduct(await apiClient.get(`${ENDPOINTS.PRODUCT_LIST}${id}/`));
  },

  /**
   * Resolve one product from the code printed on its barcode label.
   *
   * `/api/product/list/?search=` does not find every product — older rows whose
   * barcode was recorded before the current `custom_barcode_no` field, for
   * instance, stay invisible to it even though the product is right there in
   * the stock report. So the lookup walks through every endpoint that can
   * answer for a barcode and, when the stock report is the one that answers,
   * re-reads the real product row by id so price and stock are correct.
   *
   * @returns {Promise<object|null>} normalised product, or null when nothing matches
   */
  findByBarcode: async (rawCode) => {
    const code = String(rawCode ?? '').trim();
    if (!code) return null;
    const wanted = code.toLowerCase();

    const isMatch = (p) =>
      [p?.custom_barcode_no, p?.barcode, p?.code, p?.product_code, p?.id].some(
        (v) => String(v ?? '').trim().toLowerCase() === wanted
      );

    // An exact barcode hit wins; a single unambiguous result is accepted too.
    const pick = (res) => {
      const list = Array.isArray(res) ? res : res?.results || [];
      return list.find(isMatch) || (list.length === 1 ? list[0] : null);
    };

    // 1. Product list search (name + barcode on most builds)
    try {
      const found = pick(await productService.getProducts({ search: code }));
      if (found) return found;
    } catch { /* try the next endpoint */ }

    // 2. Explicit barcode filter
    try {
      const found = pick(await productService.getProducts({ barcode: code }));
      if (found) return found;
    } catch { /* try the next endpoint */ }

    // 3. Stock report — the one place old barcodes are always resolvable
    try {
      const res = await productService.getStockReport({ barcode: code });
      const list = Array.isArray(res) ? res : res?.results || [];
      const row = list.find(isMatch) || (list.length === 1 ? list[0] : null);
      if (row) {
        const id = row.product_id || row.id;
        if (id) {
          try {
            const full = await productService.getProductById(id);
            // Keep the stock number the report gave us; the list row can lag.
            if (full?.id) return { ...full, stock: row.current_stock ?? full.stock ?? 0 };
          } catch { /* fall back to the report row below */ }
        }
        return stockRowToProduct(row);
      }
    } catch { /* try the next endpoint */ }

    // 4. A plain number may be the product id itself
    if (/^\d+$/.test(code)) {
      try {
        const byId = await productService.getProductById(code);
        if (byId?.id) return byId;
      } catch { /* nothing else to try */ }
    }

    return null;
  },

  createProduct: async (data) => {
    return normalizeProduct(await apiClient.post(ENDPOINTS.PRODUCT_LIST, toProductPayload(data)));
  },

  updateProduct: async (id, data) => {
    return normalizeProduct(await apiClient.patch(`${ENDPOINTS.PRODUCT_LIST}${id}/`, toProductPayload(data)));
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.PRODUCT_LIST}${id}/`);
  },

  // ==========================================
  // 3. Stock Report API
  //    rows: product_id, name, barcode, group_name, brand_name, unit_name, buying_price,
  //          selling_price, current_stock, total_buying_value, total_selling_value
  // ==========================================
  getStockReport: async (filters = {}) => {
    const params = {};
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.brand_id) params.brand_id = filters.brand_id;
    if (filters.barcode) params.barcode = filters.barcode;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    if (filters.search) params.search = filters.search;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.PRODUCT_REPORT_STOCK, { params });
  }
};

export default productService;
