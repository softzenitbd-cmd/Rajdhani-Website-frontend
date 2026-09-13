import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const createSubcategoryService = (endpoint, storageKey) => {
  const getLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  };

  const saveLocal = (items) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  };

  const is404 = (err) => {
    const status = err?.status || err?.response?.status;
    const msg = String(err?.message || '');
    return status === 404 || msg.includes('404') || msg.includes('Page not found') || msg.includes('Not Found');
  };

  return {
    list: async (params = {}) => {
      try {
        const res = await apiClient.get(endpoint, { params });
        return res;
      } catch (err) {
        if (is404(err)) {
          let items = getLocal();
          if (params.search) {
            const q = params.search.toLowerCase();
            items = items.filter(i => (i.name || '').toLowerCase().includes(q));
          }
          return items;
        }
        throw err;
      }
    },
    create: async (data) => {
      try {
        return await apiClient.post(endpoint, data);
      } catch (err) {
        if (is404(err)) {
          const items = getLocal();
          const newItem = {
            id: 'sub_' + Date.now(),
            name: data.name || '',
            category: data.category || '',
            created_at: new Date().toISOString()
          };
          items.push(newItem);
          saveLocal(items);
          return newItem;
        }
        throw err;
      }
    },
    update: async (id, data) => {
      try {
        return await apiClient.patch(`${endpoint}${id}/`, data);
      } catch (err) {
        if (is404(err)) {
          let items = getLocal();
          items = items.map(item => (item.id === id ? { ...item, ...data } : item));
          saveLocal(items);
          return { id, ...data };
        }
        throw err;
      }
    },
    remove: async (id) => {
      try {
        return await apiClient.delete(`${endpoint}${id}/`);
      } catch (err) {
        if (is404(err)) {
          let items = getLocal();
          items = items.filter(item => item.id !== id);
          saveLocal(items);
          return { success: true };
        }
        throw err;
      }
    }
  };
};

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
  // 1b. Sub-categories (fields: name, category)
  // Seamless 404 fallback to local storage if backend endpoint is not installed
  // ==========================================
  incomeSubcategories: createSubcategoryService(ENDPOINTS.ACCOUNTING_INCOME_SUBCATEGORIES, 'rg_income_subcategories'),
  expenseSubcategories: createSubcategoryService(ENDPOINTS.ACCOUNTING_EXPENSE_SUBCATEGORIES, 'rg_expense_subcategories'),

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
    const params = { ...filters };
    if (clientId) params.client_id = clientId;
    if (!params.client_id) {
      return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_DEPOSITS, { params });
    }
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_CLIENT_LEDGER, { params });
  },

  getSupplierLedger: async (supplierId, filters = {}) => {
    const params = { ...filters };
    if (supplierId) params.supplier_id = supplierId;
    if (!params.supplier_id) {
      return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_EXPENSES, { params });
    }
    return await apiClient.get(ENDPOINTS.ACCOUNTING_REPORT_SUPPLIER_LEDGER, { params });
  },

  updateStaffPaymentStatus: async (expenseId, status = true) => {
    return await apiClient.patch(`${ENDPOINTS.ACCOUNTING_EXPENSES}${expenseId}/`, { status });
  },

  deleteExpense: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.ACCOUNTING_EXPENSES}${id}/`);
  },

  deleteReceive: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.ACCOUNTING_RECEIVES}${id}/`);
  },

  /**
   * Payroll generation (POST /api/accounting/staff-payments/generate/).
   * Creates one "Staff Salary" expense per active staff for the given month.
   * @param {{month:number, year:number, date?:string, account?:string, category?:string}} data
   */
  generateStaffPayroll: async (data) => {
    return await apiClient.post(ENDPOINTS.ACCOUNTING_STAFF_PAYMENTS_GENERATE, data);
  },
};

export default accountingService;
