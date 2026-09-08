import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const crmService = {
  // ==========================================
  // 1. Client Groups API
  // ==========================================
  getClientGroups: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return await apiClient.get(ENDPOINTS.CRM_CLIENT_GROUPS, { params });
  },

  createClientGroup: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_CLIENT_GROUPS, data);
  },

  updateClientGroup: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_CLIENT_GROUPS}${id}/`, data);
  },

  deleteClientGroup: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_CLIENT_GROUPS}${id}/`);
  },

  // ==========================================
  // 2. Clients API
  // ==========================================
  getClients: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.group) params.group = filters.group;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return await apiClient.get(ENDPOINTS.CRM_CLIENTS, { params });
  },

  createClient: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_CLIENTS, data);
  },

  updateClient: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_CLIENTS}${id}/`, data);
  },

  deleteClient: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_CLIENTS}${id}/`);
  },

  // ==========================================
  // 3. Supplier Groups API
  // ==========================================
  getSupplierGroups: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return await apiClient.get(ENDPOINTS.CRM_SUPPLIER_GROUPS, { params });
  },

  createSupplierGroup: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_SUPPLIER_GROUPS, data);
  },

  updateSupplierGroup: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_SUPPLIER_GROUPS}${id}/`, data);
  },

  deleteSupplierGroup: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_SUPPLIER_GROUPS}${id}/`);
  },

  // ==========================================
  // 4. Suppliers API
  // ==========================================
  getSuppliers: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.group) params.group = filters.group;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return await apiClient.get(ENDPOINTS.CRM_SUPPLIERS, { params });
  },

  createSupplier: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_SUPPLIERS, data);
  },

  updateSupplier: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_SUPPLIERS}${id}/`, data);
  },

  deleteSupplier: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_SUPPLIERS}${id}/`);
  },

  // ==========================================
  // 5. Cheques API
  // ==========================================
  getSupplierCheques: async (filters = {}) => {
    const params = {};
    if (filters.supplier) params.supplier = filters.supplier;
    if (filters.status !== undefined) params.status = filters.status;
    return await apiClient.get(ENDPOINTS.CRM_SUPPLIER_CHEQUES, { params });
  },

  createSupplierCheque: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_SUPPLIER_CHEQUES, data);
  },

  updateSupplierCheque: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}${id}/`, data);
  },

  deleteSupplierCheque: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}${id}/`);
  },

  getClientCheques: async (filters = {}) => {
    const params = {};
    if (filters.client) params.client = filters.client;
    if (filters.status !== undefined) params.status = filters.status;
    return await apiClient.get(ENDPOINTS.CRM_CLIENT_CHEQUES, { params });
  },

  createClientCheque: async (data) => {
    return await apiClient.post(ENDPOINTS.CRM_CLIENT_CHEQUES, data);
  },

  updateClientCheque: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.CRM_CLIENT_CHEQUES}${id}/`, data);
  },

  deleteClientCheque: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.CRM_CLIENT_CHEQUES}${id}/`);
  },

  // ==========================================
  // 6. Due Reports API
  // ==========================================
  getClientDueReport: async (filters = {}) => {
    const params = {};
    if (filters.client_id) params.client_id = filters.client_id;
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.has_due) params.has_due = filters.has_due;
    return await apiClient.get(ENDPOINTS.CRM_REPORT_CLIENT_DUE, { params });
  },

  getSupplierDueReport: async (filters = {}) => {
    const params = {};
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    if (filters.group_id) params.group_id = filters.group_id;
    if (filters.has_due) params.has_due = filters.has_due;
    return await apiClient.get(ENDPOINTS.CRM_REPORT_SUPPLIER_DUE, { params });
  }
};

export default crmService;
