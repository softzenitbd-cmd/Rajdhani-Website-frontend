// This file holds all your API route endpoints.
// Keeping them here makes it easy to update endpoints in one place.

export const ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users
  GET_USER_PROFILE: '/users/profile',
  UPDATE_USER: (id) => `/users/${id}`, // Example of dynamic route
  
  // Products (Example)
  GET_PRODUCTS: '/products',
  GET_PRODUCT_DETAILS: (id) => `/products/${id}`,
  CREATE_PRODUCT: '/products',
  
  // Loan Module
  LOAN_ACCOUNTS: '/api/loan/accounts/',
  LOAN_RECEIVES: '/api/loan/receives/',
  LOAN_PAYMENTS: '/api/loan/payments/',
  LOAN_STATEMENT: '/api/loan/statement/',

  // Accounting Module
  ACCOUNTING_INCOME_CATEGORIES: '/api/accounting/income-categories/',
  ACCOUNTING_EXPENSE_CATEGORIES: '/api/accounting/expense-categories/',
  ACCOUNTING_ACCOUNTS: '/api/accounting/accounts/',
  ACCOUNTING_RECEIVES: '/api/accounting/receives/',
  ACCOUNTING_EXPENSES: '/api/accounting/expenses/',
  ACCOUNTING_STATEMENT: '/api/accounting/statement/',
  ACCOUNTING_TRANSFERS: '/api/accounting/transfers/',
  ACCOUNTING_PROFIT: '/api/accounting/profit/',
  ACCOUNTING_REPORT_DEPOSITS: '/api/accounting/reports/deposits/',
  ACCOUNTING_REPORT_EXPENSES: '/api/accounting/reports/expenses/',
  ACCOUNTING_REPORT_STAFF_PAYMENTS: '/api/accounting/reports/staff-payments/',
  ACCOUNTING_REPORT_CLIENT_LEDGER: '/api/accounting/reports/client-ledger/',
  ACCOUNTING_REPORT_SUPPLIER_LEDGER: '/api/accounting/reports/supplier-ledger/',
  ACCOUNTING_STAFF_PAYMENTS_GENERATE: '/api/accounting/staff-payments/generate/',
};
