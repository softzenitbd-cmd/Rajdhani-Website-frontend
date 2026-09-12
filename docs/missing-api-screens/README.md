# Screens Without a Backend API

এই ফোল্ডারে সেই স্ক্রিনগুলোর লিস্ট আছে যেগুলোর জন্য ব্যাকএন্ডে কোনো API নেই।
প্রতিটি স্ক্রিন এখন **কাজ করে** (লোকাল স্টোরেজ / অন্য API দিয়ে), কিন্তু ব্যাকএন্ডে সঠিক API যোগ হলে
নিচের ফাইলগুলোতে সার্ভিস বদলে দিলেই হবে।

Audit date: 2026-09-12

## 1. No API at all (data kept in browser localStorage)

| # | Screen (Sidebar name) | File | Current behaviour | API needed |
|---|---|---|---|---|
| 1 | Settings → Payment Method | `src/pages/settings/PaymentMethod.jsx` | CRUD saved in localStorage (`rajdhane_payment_methods`) | `GET/POST/PATCH/DELETE /api/erpsetting/payment-methods/` |
| 2 | Settings → Receive (Income) Subcategory | `src/pages/settings/IncomeSubcategory.jsx` | CRUD saved in localStorage; parent category from `/api/accounting/income-categories/` | `/api/accounting/income-subcategories/` (fields: `name`, `category`) |
| 3 | Settings → Expense Subcategory | `src/pages/settings/ExpenseSubcategory.jsx` | CRUD saved in localStorage; parent from `/api/accounting/expense-categories/` | `/api/accounting/expense-subcategories/` (fields: `name`, `category`) |
| 4 | Settings → Shortcut Menu | `src/pages/settings/ShortcutMenu.jsx` | Saved in localStorage (`rajdhane_shortcuts`); drives the header quick buttons | `/api/erpsetting/shortcuts/` (per-user) — optional |
| 5 | Settings → General Settings (toggles: Invoice/Receive/Product/Purchase/Client/Supplier/E-mail tabs) | `src/pages/settings/GeneralSettings.jsx` | All toggles saved in localStorage (`rajdhane_local_settings`). **SMS tab** and **Color tab** are real (SMS → `/api/erpsetting/sms-settings/`) | `/api/erpsetting/general-settings/` (key/value JSON) |
| 6 | CRM → Client → Due Collection Date | `src/pages/crm/client/DueCollectionDate.jsx` | Date is `PATCH`ed to `/api/crm/clients/{id}/` as `collection_date` **and** mirrored in localStorage (`rajdhane_due_collection_dates`) in case the backend ignores the field | Add `collection_date` field to Client model, or `/api/crm/due-collection/` |
| 7 | Staff → Salary Create / Salary Report | `src/pages/staff/StaffSalaryCreate.jsx`, `StaffSalaryReport.jsx` | Works through the **Expense API** (`type=cost`, `transaction_type="Staff Salary"`, `staff`, `month`, `year`) and the Staff Payment Report | Dedicated payroll API (`/api/staff/salaries/`, bulk generate) — optional |
| 8 | Softhost IT Support (Support Dashboard) | `src/pages/support/SupportDashboard.jsx` | Static vendor page; buttons open the vendor support site | Vendor ticket/invoice API — not part of this backend |

## 2. Screens that use an existing API but the exact request/response shape was NOT verifiable

কোনো API ডকুমেন্ট / টেস্ট লগইন ছাড়া নিচের payload গুলো আমি অনুমান করে বানিয়েছি।
ব্যাকএন্ড ডেভ যেন একবার মিলিয়ে নেন (সব `src/services/*` ও `src/api/*` তে আছে):

| Screen | Endpoint | Assumed request | Notes |
|---|---|---|---|
| SMS → Client / Client Group / Supplier / Supplier Group / Schedule | `POST /api/communication/sms/instant/`, `POST /api/communication/sms/` | `{ message, recipient_type, phone_numbers: [], recipients: [{id,name,phone}], clients: [], suppliers: [], group, schedule_at }` | built in `buildSmsPayload()` – `src/services/communicationService.js` |
| SMS → Schedule Report | `GET /api/communication/sms/`, `PATCH /api/communication/sms/{id}/cancel/` | filters `status, from_date, to_date, search` | row fields read: `sent_to / phone_numbers / recipients, message, schedule_at, status` |
| Staff → Create / Edit | `POST/PATCH /api/staff/list/` | `{ name, phone, email, address, department, designation, salary, joining_date, is_active, image }` (multipart when image) | `src/pages/staff/StaffCreate.jsx` |
| Staff → Attendance Create | `POST /api/staff/attendance/` | tries **bulk array** first `[{staff, date, status, in_time, out_time}]`, falls back to one POST per staff on HTTP 400 | `src/pages/staff/StaffAttendanceCreate.jsx` |
| Staff → Attendance Report / Monthly | `GET /api/staff/attendance/?date=`, `GET /api/staff/attendance-report/?month=&year=` | monthly report renders as staff×day matrix if rows contain `days[]`, otherwise summary columns | `StaffAttendanceReport.jsx`, `StaffMonthlyAttendanceReport.jsx` |
| Staff → Payment Create | `POST /api/accounting/expenses/` | `{ type:'cost', transaction_type:'Staff Salary|Advance|…', staff, account, category, amount, description, date, status:1 }` | `StaffPaymentCreate.jsx` |
| Dashboard | `GET /api/erpsetting/dashboard/` | reads `today_*`, `month_*`, `total_due` (several spellings tolerated). If no `weekly/chart` series is returned the 14-day chart is built from sales invoices + receives | `src/pages/Dashboard.jsx` |
| CRM → Client Statement | `GET /api/accounting/reports/client-ledger/?client_id=&from_date=&to_date=` | rows: `date, product, quantity, unit, price, description, bill, sales_return, receive, money_return, balance` (running balance computed if `balance` absent) | `ClientStatement.jsx` |
| Due Report → All / Client wise / Group wise | `GET /api/crm/reports/client-due/?client_id=&group_id=&has_due=` | rows: `client_name, address, phone, group_name, previous_due, sales, total_bill, sales_return, collection, money_return, due` | `src/components/ClientDueReport.jsx` |
| Deposit / Expense reports (category / customer / supplier wise) | `GET /api/accounting/reports/deposits/`, `GET /api/accounting/reports/expenses/` | grouped client-side by category / client / supplier | `src/components/TransactionReport.jsx` |
| Settings → Users & Permissions | `GET/POST /api/auth/users/`, `POST /api/auth/register/`, `PATCH /api/auth/users/{id}/permissions/`, `POST /api/auth/admin-change-password/{id}/` | register: `{ username, password, full_name, email, phone, role, is_active }`; permissions: `{ custom_permissions: { module: { view, create, edit, delete } } }` | `src/pages/settings/UserManagement.jsx` |
| Settings → Bank List | `GET/POST/PATCH/DELETE /api/accounting/accounts/` | Bank list = accounts that have an `account_number` | `BankList.jsx` |
| Loan → Receive / Payment list edit & delete | `PATCH/DELETE /api/loan/receives/{id}/`, `/api/loan/payments/{id}/` | DELETE assumed (standard DRF ViewSet) | `loanService.js` |

## 3. Removed for production

* All dummy / fallback data (fake clients, invoices, staff, reports) removed from every page. Empty state is shown when the API returns nothing.
* `via.placeholder.com` banners and `i.pravatar.cc` avatars removed (those hosts are dead → broken images).
* "YouTube" placeholder buttons removed; every Excel / CSV / PDF / Print / Reset / Reload button now works.
* Unauthenticated users are redirected to `/login`; expired access tokens are refreshed automatically (`src/api/apiClient.js`).

## 4. Backend test login

`admin / 123456` (pre-filled in the login form) was rejected by the server during this audit, so nothing above could be verified against live data. Please share a working test user so the assumed payloads in section 2 can be confirmed.

## 5. Backend bugs found while testing (backend দেভ কে দিতে হবে)

| Endpoint | Error | Where |
|---|---|---|
| `GET /api/accounting/reports/deposits/` | **500 AttributeError**: `'IncomeCategory' object has no attribute 'created_by'` | `accounting/views.py` → `DepositReportAPIView` (the view/serializer reads `category.created_by`, but the `IncomeCategory` model has no such field). Affects: Deposit Report → All / Category wise / Customer wise. |
