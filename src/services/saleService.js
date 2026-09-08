import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

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

  updateSalesInvoice: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.SALE_INVOICES}${id}/`, data);
  },

  deleteSalesInvoice: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.SALE_INVOICES}${id}/`);
  },

  // ==========================================
  // 2. Sales Report API
  // ==========================================
  getSalesReport: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.barcode) params.barcode = filters.barcode;
    if (filters.client_id) params.client_id = filters.client_id;
    if (filters.client_group_id) params.client_group_id = filters.client_group_id;
    if (filters.product_id) params.product_id = filters.product_id;
    if (filters.product_group_id) params.product_group_id = filters.product_group_id;
    return await apiClient.get(ENDPOINTS.SALE_REPORT, { params });
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
  }
};

export default saleService;
