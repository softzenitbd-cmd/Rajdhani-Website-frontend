// This file holds all your API route endpoints.
// Keeping them here makes it easy to update endpoints in one place.

export const ENDPOINTS = {
  // Auth & Users
  AUTH_REGISTER: '/api/auth/register/',
  AUTH_LOGIN: '/api/auth/login/',
  AUTH_TOKEN_REFRESH: '/api/auth/token/refresh/',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password/',
  AUTH_ADMIN_CHANGE_PASSWORD: '/api/auth/admin-change-password/',
  AUTH_PROFILE: '/api/auth/profile/',
  AUTH_USERS: '/api/auth/users/',
  
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
  // Communication Module
  COMMUNICATION_SMS_INSTANT: '/api/communication/sms/instant/',
  COMMUNICATION_SMS: '/api/communication/sms/',
  COMMUNICATION_SMS_CANCEL: (id) => `/api/communication/sms/${id}/cancel/`,

  // CRM Module
  CRM_CLIENT_GROUPS: '/api/crm/client-groups/',
  CRM_CLIENTS: '/api/crm/clients/',
  CRM_SUPPLIER_GROUPS: '/api/crm/supplier-groups/',
  CRM_SUPPLIERS: '/api/crm/suppliers/',
  CRM_SUPPLIER_CHEQUES: '/api/crm/supplier-cheques/',
  CRM_CLIENT_CHEQUES: '/api/crm/client-cheques/',
  CRM_REPORT_CLIENT_DUE: '/api/crm/reports/client-due/',
  CRM_REPORT_SUPPLIER_DUE: '/api/crm/reports/supplier-due/',

  // ERP Setting & Dashboard Module
  SETTING_COMPANY_INFO: '/api/erpsetting/company-info/',
  SETTING_SMS_SETTINGS: '/api/erpsetting/sms-settings/',
  DASHBOARD_STATS: '/api/erpsetting/dashboard/',

  // Product Module
  PRODUCT_UNITS: '/api/product/units/',
  PRODUCT_GROUPS: '/api/product/groups/',
  PRODUCT_BRANDS: '/api/product/brands/',
  PRODUCT_COLORS: '/api/product/colors/',
  PRODUCT_SIZES: '/api/product/sizes/',
  PRODUCT_WAREHOUSES: '/api/product/warehouses/',
  PRODUCT_LIST: '/api/product/list/',
  PRODUCT_REPORT_STOCK: '/api/product/reports/stock/',

  // Purchase Module
  PURCHASE_INVOICES: '/api/purchase/invoices/',
  PURCHASE_REPORT: '/api/purchase/reports/purchases/',
  PURCHASE_RETURNS: '/api/purchase/returns/',

  // Sales Module
  SALE_INVOICES: '/api/sale/invoices/',
  SALE_REPORT: '/api/sale/reports/sales/',
  SALE_RETURNS: '/api/sale/returns/',

  // Staff (HR & Payroll) Module
  STAFF_DEPARTMENTS: '/api/staff/departments/',
  STAFF_DESIGNATIONS: '/api/staff/designations/',
  STAFF_LIST: '/api/staff/list/',
  STAFF_ATTENDANCE: '/api/staff/attendance/',
  STAFF_ATTENDANCE_REPORT: '/api/staff/attendance-report/',
};
