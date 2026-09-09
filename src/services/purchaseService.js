import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const purchaseService = {
  // ==========================================
  // 1. Purchase Invoice API
  // ==========================================
  getPurchaseInvoices: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.supplier) params.supplier = filters.supplier;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.status !== undefined) params.status = filters.status;
    return await apiClient.get(ENDPOINTS.PURCHASE_INVOICES, { params });
  },

  createPurchaseInvoice: async (data) => {
    return await apiClient.post(ENDPOINTS.PURCHASE_INVOICES, data);
  },

  updatePurchaseInvoice: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.PURCHASE_INVOICES}${id}/`, data);
  },

  deletePurchaseInvoice: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.PURCHASE_INVOICES}${id}/`);
  },

  // ==========================================
  // 2. Purchase Report API
  // ==========================================
  getPurchaseReport: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.barcode) params.barcode = filters.barcode;
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    if (filters.supplier_group_id) params.supplier_group_id = filters.supplier_group_id;
    if (filters.product_id) params.product_id = filters.product_id;
    if (filters.product_group_id) params.product_group_id = filters.product_group_id;
    return await apiClient.get(ENDPOINTS.PURCHASE_REPORT, { params });
  },

  // ==========================================
  // 3. Purchase Return API
  // ==========================================
  getPurchaseReturns: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.supplier) params.supplier = filters.supplier;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.PURCHASE_RETURNS, { params });
  },

  createPurchaseReturn: async (data) => {
    return await apiClient.post(ENDPOINTS.PURCHASE_RETURNS, data);
  },

  deletePurchaseReturn: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.PURCHASE_RETURNS}${id}/`);
  }
};

export default purchaseService;
