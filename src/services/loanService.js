import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const loanService = {
  // 1. Loan Accounts API
  getLoanAccounts: async (search = '') => {
    const params = search ? { search } : {};
    return await apiClient.get(ENDPOINTS.LOAN_ACCOUNTS, { params });
  },

  createLoanAccount: async (data) => {
    return await apiClient.post(ENDPOINTS.LOAN_ACCOUNTS, data);
  },

  updateLoanAccount: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.LOAN_ACCOUNTS}${id}/`, data);
  },

  deleteLoanAccount: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.LOAN_ACCOUNTS}${id}/`);
  },

  // 2. Loan Receives API
  getLoanReceives: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.loan_account) params.loan_account = filters.loan_account;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.LOAN_RECEIVES, { params });
  },

  createLoanReceive: async (data) => {
    return await apiClient.post(ENDPOINTS.LOAN_RECEIVES, data);
  },

  updateLoanReceive: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.LOAN_RECEIVES}${id}/`, data);
  },

  deleteLoanReceive: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.LOAN_RECEIVES}${id}/`);
  },

  // 3. Loan Payments API
  getLoanPayments: async (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.loan_account) params.loan_account = filters.loan_account;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.LOAN_PAYMENTS, { params });
  },

  createLoanPayment: async (data) => {
    return await apiClient.post(ENDPOINTS.LOAN_PAYMENTS, data);
  },

  updateLoanPayment: async (id, data) => {
    return await apiClient.patch(`${ENDPOINTS.LOAN_PAYMENTS}${id}/`, data);
  },

  deleteLoanPayment: async (id) => {
    return await apiClient.delete(`${ENDPOINTS.LOAN_PAYMENTS}${id}/`);
  },

  // 4. Loan Statement API
  getLoanStatement: async (filters = {}) => {
    const params = {};
    if (filters.loan_account) params.loan_account = filters.loan_account;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    return await apiClient.get(ENDPOINTS.LOAN_STATEMENT, { params });
  }
};

export default loanService;
