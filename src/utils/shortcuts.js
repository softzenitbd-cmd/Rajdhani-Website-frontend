// Header quick-access buttons. Users manage them from Settings → Shortcut Menu.
// Persisted on the server under the `shortcuts` key of the general settings
// (/api/erpsetting/general-settings/) via appSettingsService.
import { appSettingsService } from '../services/appSettingsService';

export const SHORTCUT_KEY = 'shortcuts';
export const SHORTCUT_EVENT = appSettingsService.EVENT;

export const DEFAULT_SHORTCUTS = [
  { id: 'new-invoice', title: 'New Invoice', path: '/invoice/add-new', labelKey: 'header.new_invoice' },
  { id: 'receive', title: 'Receive', path: '/account/receive-create', labelKey: 'header.receive' },
  { id: 'expense', title: 'Expense', path: '/account/expense-create', labelKey: 'header.expense' },
  { id: 'staff-payment', title: 'Staff Payment', path: '/staff/payment/create', labelKey: 'header.staff_payment' },
  { id: 'sales-return', title: 'Sales Return', path: '/invoice/sales-return/add-new', labelKey: 'header.sales_return' },
  { id: 'purchase-return', title: 'Purchase Return', path: '/product/purchase-return/add-new', labelKey: 'header.purchase_return' },
  { id: 'supplier-payment', title: 'Supplier Payment', path: '/account/supplier-payment', labelKey: 'header.supplier_payment' },
];

/** Shortcuts from the settings cache (defaults until the server copy is loaded). */
export const readShortcuts = () => {
  const list = appSettingsService.get(SHORTCUT_KEY);
  return Array.isArray(list) ? list : DEFAULT_SHORTCUTS;
};

/** Make sure the settings are loaded, then return the shortcuts. */
export const loadShortcuts = async () => {
  await appSettingsService.load();
  return readShortcuts();
};

/** Save the list on the server (resolves with the saved list). */
export const writeShortcuts = async (list) => {
  await appSettingsService.set(SHORTCUT_KEY, list);
  return list;
};

// Every navigable screen a shortcut can point to
export const ALL_MENU_LINKS = [
  { title: 'Dashboard', path: '/dashboard' },
  { title: 'New Invoice', path: '/invoice/add-new' },
  { title: 'Invoice List', path: '/invoice/list' },
  { title: 'Draft Invoices', path: '/invoice/draft' },
  { title: 'Sales Return', path: '/invoice/sales-return/add-new' },
  { title: 'Sales Return List', path: '/invoice/sales-return/list' },
  { title: 'Receive', path: '/account/receive-create' },
  { title: 'Receive List', path: '/account/receive-list' },
  { title: 'Expense', path: '/account/expense-create' },
  { title: 'Expense List', path: '/account/expense-list' },
  { title: 'Supplier Payment', path: '/account/supplier-payment' },
  { title: 'Money Return', path: '/account/money-return' },
  { title: 'Transfer', path: '/account/transfer-create' },
  { title: 'Account Statement', path: '/account/statement' },
  { title: 'Account Balance', path: '/account/account-balance' },
  { title: 'Profit', path: '/account/profit' },
  { title: 'Client Create', path: '/crm/client-create' },
  { title: 'Client List', path: '/crm/client-list' },
  { title: 'Client Statement', path: '/crm/client-statement' },
  { title: 'Supplier Create', path: '/crm/supplier-create' },
  { title: 'Supplier List', path: '/crm/supplier-list' },
  { title: 'Supplier Statement', path: '/crm/supplier-statement' },
  { title: 'Product Create', path: '/product/create' },
  { title: 'Product List', path: '/product/list' },
  { title: 'Stock List', path: '/product/stock' },
  { title: 'Barcode', path: '/product/barcode' },
  { title: 'Purchase', path: '/product/purchase/add-new' },
  { title: 'Purchase List', path: '/product/purchase/list' },
  { title: 'Purchase Return', path: '/product/purchase-return/add-new' },
  { title: 'Staff Payment', path: '/staff/payment/create' },
  { title: 'Staff Salary', path: '/staff/salary/create' },
  { title: 'Staff Attendance', path: '/staff/attendance/create' },
  { title: 'Staff List', path: '/staff/list' },
  { title: 'Loan Receive', path: '/loan/receive-create' },
  { title: 'Loan Payment', path: '/loan/payment-create' },
  { title: 'Send SMS (Client)', path: '/sms/customer' },
  { title: 'Due Report', path: '/due-report/list' },
  { title: 'Sales Report', path: '/sales-report/all' },
  { title: 'Deposit Report', path: '/deposit-report/all' },
  { title: 'Expense Report', path: '/expense-report/all' },
  { title: 'Company Information', path: '/settings/company-information' },
  { title: 'Settings', path: '/settings/settings' },
];
