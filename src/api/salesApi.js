import apiClient from './apiClient';
import { ENDPOINTS } from './endpoints';
import { saleService } from '../services/saleService';

// ==========================================
// 1. Sales Invoice API
// ==========================================

/**
 * Get a list of sales invoices with optional filters
 * 
 * Filters:
 * - search: <invoice_id_or_barcode>
 * - client: <client_uuid>
 * - from_date: YYYY-MM-DD
 * - to_date: YYYY-MM-DD
 * - account_id: <account_name>
 * - status: 1 (Final) or 0 (Draft)
 * 
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>}
 */
export const getSalesInvoices = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.SALE_INVOICES, { params });
};

/**
 * Create a new sales invoice
 * Note: If status=1, stock and due are updated. If status=0 (Draft), they are not.
 * @param {Object} invoiceData - Data for creating the sales invoice
 * @returns {Promise<Object>}
 */
export const createSalesInvoice = async (invoiceData) => {
  return await apiClient.post(ENDPOINTS.SALE_INVOICES, invoiceData);
};

/**
 * Convert a draft sales invoice to final/general status
 * Action: Automatically minus stock and plus client due.
 * @param {string} id - The UUID of the sales invoice
 * @returns {Promise<Object>}
 */
export const convertDraftToFinalInvoice = async (id) => {
  return await apiClient.patch(`${ENDPOINTS.SALE_INVOICES}${id}/`, { status: 1 });
};

// ==========================================
// 2. Sales Report (built from invoices + items, see saleService)
// ==========================================

/**
 * Item-wise sales rows. Filters: from_date, to_date, barcode, client_id,
 * client_group_id, product_id, product_group_id
 */
export const getSalesReports = async (params = {}) => {
  return await saleService.getSalesReport(params);
};

// ==========================================
// 3. Sales Return API
// ==========================================

/**
 * Get a list of sales returns with optional filters
 * 
 * Filters:
 * - search: <return_invoice_id_or_barcode>
 * - client: <client_uuid>
 * - account_id: <account_name>
 * - from_date, to_date (YYYY-MM-DD)
 * - status: 1 (Final) or 0 (Draft)
 * 
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>}
 */
export const getSalesReturns = async (params = {}) => {
  return await apiClient.get(ENDPOINTS.SALE_RETURNS, { params });
};

/**
 * Create a new sales return
 * Note: If status=1, stock is incremented and client due is decremented. If status=0, no change.
 * @param {Object} returnData - Data for creating the sales return
 * @returns {Promise<Object>}
 */
export const createSalesReturn = async (returnData) => {
  return await apiClient.post(ENDPOINTS.SALE_RETURNS, returnData);
};

/**
 * Convert a draft sales return to final status
 * Action: Automatically plus stock and minus client due.
 * @param {string} id - The UUID of the sales return
 * @returns {Promise<Object>}
 */
export const convertDraftToFinalReturn = async (id) => {
  return await apiClient.patch(`${ENDPOINTS.SALE_RETURNS}${id}/`, { status: 1 });
};

export default {
  getSalesInvoices,
  createSalesInvoice,
  convertDraftToFinalInvoice,
  getSalesReports,
  getSalesReturns,
  createSalesReturn,
  convertDraftToFinalReturn
};
