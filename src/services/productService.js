import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

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
    if (filters.group) params.group = filters.group;
    if (filters.brand) params.brand = filters.brand;
    if (filters.status !== undefined) params.status = filters.status;
    return await apiClient.get(ENDPOINTS.PRODUCT_LIST, { params });
  },

  createProduct: async (data) => {
    return await apiClient.post(ENDPOINTS.PRODUCT_LIST, data);
  },

  updateProduct: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.PRODUCT_LIST}${id}/`, data);
  },

  deleteProduct: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.PRODUCT_LIST}${id}/`);
  },

  // ==========================================
  // 3. Stock Report API
  // ==========================================
  getStockReport: async (filters = {}) => {
    const params = {};
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.brand_id) params.brand_id = filters.brand_id;
    if (filters.barcode) params.barcode = filters.barcode;
    return await apiClient.get(ENDPOINTS.PRODUCT_REPORT_STOCK, { params });
  }
};

export default productService;
