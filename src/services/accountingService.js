import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const accountingService = {
  // ==========================================
  // 1. Income Categories API
  // ==========================================
  getIncomeCategories: async (search = '') => {
    const params = search ? { search } : {};
    return await apiClient.get(ENDPOINTS.ACCOUNTING_INCOME_CATEGORIES, { params });
  },

  createIncomeCategory: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_INCOME_CATEGORIES, data);
  },

  updateIncomeCategory: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_INCOME_CATEGORIES}${id}/`, data);
  },

  deleteIncomeCategory: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.ACCOUNTING_INCOME_CATEGORIES}${id}/`);
  },

  // ==========================================
  // 1. Expense Categories API
  // ==========================================
  getExpenseCategories: async (search = '') => {
    const params = search ? { search } : {};
    return await apiClient.get(ENDPOINTS.ACCOUNTING_EXPENSE_CATEGORIES, { params });
  },

  createExpenseCategory: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_EXPENSE_CATEGORIES, data);
  },

  updateExpenseCategory: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_EXPENSE_CATEGORIES}${id}/`, data);
  },

  deleteExpenseCategory: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.ACCOUNTING_EXPENSE_CATEGORIES}${id}/`);
  },

  // ==========================================
  // 2. Account API (Cash/Bank)
  // ==========================================
  getAccounts: async (search = '') => {
    const params = search ? { search } : {};
    return await apiClient.get(ENDPOINTS.ACCOUNTING_ACCOUNTS, { params });
  },

  createAccount: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_ACCOUNTS, data);
  },

  updateAccount: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_ACCOUNTS}${id}/`, data);
  },

  deleteAccount: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.ACCOUNTING_ACCOUNTS}${id}/`);
  },

  // ==========================================
  // 3. Receive API (Deposit / Income)
  // ==========================================
  getReceives: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.client) params.client = filters.client;
    if (filters.account) params.account = filters.account;
    if (filters.category) params.category = filters.category;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_RECEIVES, { params });
  },

  createReceive: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_RECEIVES, data);
  },

  updateReceive: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_RECEIVES}${id}/`, data);
  },

  // ==========================================
  // 4. Expense API (Cost / Payment / Staff Salary)
  // ==========================================
  getExpenses: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.supplier) params.supplier = filters.supplier;
    if (filters.staff) params.staff = filters.staff;
    if (filters.account) params.account = filters.account;
    if (filters.category) params.category = filters.category;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_EXPENSES, { params });
  },

  createExpense: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_EXPENSES, data);
  },

  updateExpense: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_EXPENSES}${id}/`, data);
  },

  // ==========================================
  // 5. Account Statement API
  // ==========================================
  getStatement: async (filters = {}) => {
    const params = {};
    if (filters.type) params.type = filters.type; // deposit or cost
    if (filters.client) params.client = filters.client;
    if (filters.account) params.account = filters.account;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_STATEMENT, { params });
  },

  // ==========================================
  // 6. Transfer API
  // ==========================================
  getTransfers: async (filters = {}) => {
    const params = {};
    if (filters.from_account) params.from_account = filters.from_account;
    if (filters.to_account) params.to_account = filters.to_account;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_TRANSFERS, { params });
  },

  createTransfer: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_TRANSFERS, data);
  },

  updateTransfer: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_TRANSFERS}${id}/`, data);
  },

  // ==========================================
  // 7. Profit API
  // ==========================================
  getProfit: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_PROFIT, { params });
  },

  // ==========================================
  // 8. Deposit Report API
  // ==========================================
  getDepositReport: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.client_id) params.client_id = filters.client_id;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.search) params.search = filters.search;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_DEPOSITS, { params });
  },

  // ==========================================
  // 9. Expense Report API
  // ==========================================
  getExpenseReport: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.supplier_id) params.supplier_id = filters.supplier_id;
    if (filters.staff_id) params.staff_id = filters.staff_id;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.search) params.search = filters.search;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_EXPENSES, { params });
  },

  // ==========================================
  // 10. Staff Payment Report API
  // ==========================================
  getStaffPaymentReport: async (filters = {}) => {
    const params = {};
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.staff_id) params.staff_id = filters.staff_id;
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    if (filters.search) params.search = filters.search;
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_STAFF_PAYMENTS, { params });
  },

  // ==========================================
  // 11. Ledger & Payroll Special APIs
  // ==========================================
  getClientLedger: async (clientId, filters = {}) => {
    const params = { client_id: clientId, ...filters };
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_CLIENT_LEDGER, { params });
  },

  getSupplierLedger: async (supplierId, filters = {}) => {
    const params = { supplier_id: supplierId, ...filters };
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER, { params });
  },

  updateStaffPaymentStatus: async (expenseId, status = true) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_EXPENSES}${expenseId}/`, { status });
  },
};

export default accountingService;
