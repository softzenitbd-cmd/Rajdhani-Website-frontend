# Accounting Module API

**Base URL:** `/api/accounting/`

## 1. Categories API
আয় এবং ব্যয়ের খাতের তালিকা ম্যানেজ করার জন্য।

### A. Income Category 
- **List & Create:** `/api/accounting/income-categories/`
- **Update & Delete:** `/api/accounting/income-categories/<uuid>/`
- **Search:** `?search=<name>`

### B. Expense Category 
- **List & Create:** `/api/accounting/expense-categories/`
- **Update & Delete:** `/api/accounting/expense-categories/<uuid>/`
- **Search:** `?search=<name>`

---

## 2. Account API (Cash/Bank)
টাকা জমা রাখা বা পেমেন্ট করার জন্য যে ক্যাশ বা ব্যাংক অ্যাকাউন্টগুলো ব্যবহৃত হবে, সেগুলো এখানে ম্যানেজ করা যাবে।
- **List & Create:** `/api/accounting/accounts/`
- **Update & Delete:** `/api/accounting/accounts/<uuid>/`
- **Search:** `?search=<name_or_account_number>`

---

## 3. Receive API (Deposit / Income)
যেকোনো টাকা রিসিভ করলে বা কাস্টমার পেমেন্ট দিলে এই API ব্যবহৃত হবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/accounting/receives/`
- **Search:** `?search=<description_or_reference>` 
- **Filters:** 
  - `?client=<client_uuid>` (নির্দিষ্ট ক্লায়েন্টের রিসিভ দেখতে)
  - `?account=<account_uuid>` (নির্দিষ্ট ব্যাংকে কত টাকা রিসিভ হয়েছে দেখতে)
  - `?category=<category_uuid>`
  - `?from_date=2026-08-01&to_date=2026-08-31`

### B. Receive তৈরি করা (POST)
- URL: `/api/accounting/receives/`
- **Background Actions (Auto Adjust):** 
  1. **Account Balance (+):** যে `account` সিলেক্ট করা হবে, সেই অ্যাকাউন্টের ব্যালেন্সের সাথে `amount` যোগ হবে।
  2. **Client Due (-):** যদি `client` আইডি পাঠানো হয়, তবে সেই ক্লায়েন্টের `previous_due` থেকে `amount` মাইনাস হবে।
- **বডি (JSON) Example:** 
  ```json
  {
    "type": "deposit",
    "transaction_type": "Invoice",
    "client": "<client_uuid>",
    "account": "<account_uuid>",
    "category": "<income_category_uuid>",
    "amount": "1000.00",
    "reference": "Payment for INV-0001",
    "status": 1
  }
  ```

### C. Receive আপডেট বা ইডিট করা (PATCH)
- URL: `/api/accounting/receives/<uuid>/`
- **Background Actions:** যদি কখনো টাকার পরিমাণ বা ক্লায়েন্ট ভুল হয় এবং আপনি সেটি ইডিট করে আপডেট করেন, তবে ব্যাকএন্ড অটোমেটিকভাবে আগের ভুল হিসাবটি রিভার্স করে নতুন হিসাবটি ব্যালেন্স এবং ডিউ-তে আপডেট করে দিবে।

---

## 4. Expense API (Cost / Payment / Staff Salary)
যেকোনো প্রকার খরচ, সাপ্লায়ারকে পেমেন্ট, বা স্টাফের স্যালারি দেওয়ার জন্য এই API ব্যবহৃত হবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/accounting/expenses/`
- **Search:** `?search=<description_or_reference>` 
- **Filters:** 
  - `?supplier=<supplier_uuid>` (নির্দিষ্ট সাপ্লায়ারের পেমেন্ট দেখতে)
  - `?staff=<staff_uuid>` (নির্দিষ্ট স্টাফের স্যালারি/খরচ দেখতে)
  - `?account=<account_uuid>` (নির্দিষ্ট ব্যাংক থেকে কত টাকা খরচ হয়েছে)
  - `?category=<category_uuid>`
  - `?from_date=2026-08-01&to_date=2026-08-31`
  - `?month=9&year=2026` (স্টাফ পেমেন্টের মাস ও বছরের জন্য)

### B. Expense তৈরি করা (POST)
- URL: `/api/accounting/expenses/`
- **Background Actions (Auto Adjust):** 
  1. **Account Balance (-):** যে `account` সিলেক্ট করা হবে, সেই অ্যাকাউন্টের ব্যালেন্স থেকে `amount` মাইনাস হবে (কারণ টাকা খরচ হয়ে যাচ্ছে)।
  2. **Supplier Due (-):** যদি `supplier` আইডি পাঠানো হয়, তবে সেই সাপ্লায়ারের `previous_due` থেকে `amount` মাইনাস হবে (কারণ তাকে পেমেন্ট করে দেওয়া হয়েছে)।
- **বডি (JSON) Example (Staff Payment):** 
  ```json
  {
    "type": "cost",
    "transaction_type": "Staff Payment",
    "staff": "<staff_uuid>",
    "account": "<account_uuid>",
    "category": "<expense_category_uuid>",
    "amount": "500.00",
    "month": 9,
    "year": 2026,
    "description": "AJMUL SALARY",
    "status": 1
  }
  ```

### C. Expense আপডেট বা ইডিট করা (PATCH)
- URL: `/api/accounting/expenses/<uuid>/`
- **Background Actions:** Receive এর মতই, কোনো ভুল এন্ট্রিকে আপডেট করলে ব্যাকএন্ড নিজে থেকেই আগের হিসাব রিভার্স করে নতুন হিসাব অ্যাডজাস্ট করে নিবে।

---

## 5. Account Statement API
একটি নির্দিষ্ট অ্যাকাউন্টের অথবা নির্দিষ্ট ক্লায়েন্ট/সাপ্লায়ারের সকল লেনদেনের (Receive এবং Expense) সম্মিলিত রিপোর্ট বা লেজার দেখার জন্য এই API ব্যবহৃত হবে।

### A. Statement রিপোর্ট দেখা (GET)
- URL: `/api/accounting/statement/`
- **Filters:**
  - `?type=deposit` (শুধু রিসিভ দেখতে) অথবা `?type=cost` (শুধু খরচ দেখতে)
  - `?client=<client_uuid>` (নির্দিষ্ট ক্লায়েন্টের লেনদেন দেখতে)
  - `?account=<account_uuid>` (নির্দিষ্ট অ্যাকাউন্টের লেনদেন দেখতে)
  - `?from_date=2026-08-01&to_date=2026-08-31` (ডেট রেঞ্জ অনুযায়ী)
- **Response Format:**
  এই API-টি Receive এবং Expense মডেল থেকে ডাইনামিকভাবে ডেটা নিয়ে একটি Unified List রিটার্ন করে।
  ```json
  [
    {
      "id": "uuid",
      "type": "DEPOSIT",
      "transaction_type": "Invoice",
      "date": "25 Apr 2026",
      "account_name": "Cash",
      "description": "Payment for INV-0001",
      "credit": "6050.00",
      "debit": "--",
      "source": "Client: RASHED"
    },
    {
      "id": "uuid",
      "type": "COST",
      "transaction_type": "Transfer",
      "date": "26 Apr 2026",
      "account_name": "Cash",
      "description": "Send money to DBBL",
      "credit": "--",
      "debit": "1000.00",
      "source": "Transfer to DBBL"
    }
  ]
  ```

---

## 6. Transfer API
এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে (যেমন: Cash থেকে Bank-এ) টাকা স্থানান্তর করার জন্য এই API ব্যবহৃত হবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/accounting/transfers/`
- **Filters:** 
  - `?from_account=<account_uuid>` (কোন অ্যাকাউন্ট থেকে টাকা গেছে)
  - `?to_account=<account_uuid>` (কোন অ্যাকাউন্টে টাকা এসেছে)
  - `?from_date=2026-08-01&to_date=2026-08-31`

### B. Transfer তৈরি করা (POST)
- URL: `/api/accounting/transfers/`
- **Background Actions:** `from_account` এর ব্যালেন্স থেকে টাকা মাইনাস হবে এবং `to_account` এর ব্যালেন্স প্লাস হবে। এটি অটোমেটিকভাবে Account Statement এ যুক্ত হয়ে যাবে।
- **বডি (JSON) Example:** 
  ```json
  {
    "from_account": "<uuid_cash>",
    "to_account": "<uuid_dbbl>",
    "amount": "1000.00",
    "description": "Office rent transfer"
  }
  ```

### C. Transfer আপডেট বা ইডিট করা (PATCH)
- URL: `/api/accounting/transfers/<uuid>/`
- **Background Actions:** পূর্বের এন্ট্রির অ্যাকাউন্ট ব্যালেন্স রিভার্স করে নতুন অ্যাকাউন্টে/অ্যামাউন্টে আপডেট করে দিবে।

---

## 7. Profit API (লাভ-ক্ষতির হিসাব)
সেলস, পারচেজ, রিসিভ এবং এক্সপেন্সের উপর ভিত্তি করে মোট কত টাকা লাভ বা ক্ষতি হয়েছে তা দেখার জন্য এই API ব্যবহৃত হবে।

### A. Profit দেখা (GET)
- URL: `/api/accounting/profit/`
- **Filters (Optional):**
  - `?from_date=2026-08-01&to_date=2026-08-31`
- **Response Format:**
  এই API-টি নির্দিষ্ট ডেট রেঞ্জের (বা সব সময়ের) ডেটা যোগ করে নিচের ফরম্যাটে রিপোর্ট দিবে:
  ```json
  {
    "Total Sales": "৳ 260550615.68",
    "Total Buy Price": "৳ 188037863.51",
    "Discount": "৳ 0.00",
    "Total Client Due": "৳ 7824583.00",
    "Total Supplier Due": "৳ 14929806.91",
    "Total Receive": "৳ 257977650.14",
    "Total Expense": "৳ 336859154.11",
    "Total Balance": "৳ -5064326.97",
    "Product Profit": "৳ 72512752.17",
    "Gross Profit": "৳ -78881503.97",
    "Net Profit": "৳ -415740658.08"
  }
  ```
- **ফর্মুলা লজিক:**
  - `Product Profit = Total Sales - Total Buy Price`
  - `Gross Profit = Total Receive - Total Expense`
  - `Net Profit = Product Profit - Total Expense` (সঠিক অ্যাকাউন্টিং ফর্মুলা অনুযায়ী)

---

## 8. Deposit Report API
যেকোনো প্রকার ডিপোজিট (রিসিভ) এর বিস্তারিত রিপোর্ট দেখার জন্য এই API ব্যবহৃত হবে।

### A. Deposit Report দেখা (GET)
- URL: `/api/accounting/reports/deposits/`
- **Filters:**
  - `?from_date=2026-08-01&to_date=2026-08-31`
  - `?client_id=<client_uuid>` (Customer wise)
  - `?category_id=<category_uuid>` (Category wise)
  - `?search=<text>` (Transaction type বা Reference দিয়ে সার্চ)
- **Response Format:**
  এই API-টি আগের সিস্টেমের মতো হুবহু ফিল্ডগুলো রিটার্ন করে।
  ```json
  [
    {
      "id": "uuid",
      "type": "deposit",
      "transaction_type": "Invoice",
      "client_id": "Name: C.CASTOMER | Number: 01",
      "amount": "612.00",
      "category_id": "CASH SELL",
      "date": "2026-09-01",
      "created_at": "01 Sep 2026",
      "receive_category": {
          "id": "uuid",
          "name": "CASH SELL",
          "created_by": "admin"
      }
    }
  ]
  ```

---

## 9. Expense Report API (Cost Report)
যেকোনো প্রকার খরচ বা পেমেন্ট (Expense/Cost) এর বিস্তারিত রিপোর্ট দেখার জন্য এই API ব্যবহৃত হবে।

### A. Expense Report দেখা (GET)
- URL: `/api/accounting/reports/expenses/`
- **Filters:**
  - `?from_date=2026-08-01&to_date=2026-08-31`
  - `?supplier_id=<supplier_uuid>` (Supplier wise)
  - `?staff_id=<staff_uuid>` (Staff wise)
  - `?category_id=<category_uuid>` (Category wise)
  - `?search=<text>` (Transaction type বা Reference দিয়ে সার্চ)
- **Response Format:**
  এই API-টিও Deposit Report-এর মতো সেম স্ট্রাকচারে ডেটা রিটার্ন করে, যেখানে `expense_category`, `supplier_id` এবং `staff_id` এর বিস্তারিত থাকে।
  ```json
  [
    {
      "id": "uuid",
      "type": "cost",
      "transaction_type": "Purchase",
      "supplier_id": "Name: SUPPLIER 1 | Number: 01",
      "staff_id": "",
      "amount": "1000.00",
      "category_id": "PRODUCT KROY",
      "date": "2026-09-01",
      "created_at": "01 Sep 2026",
      "expense_category": {
          "id": "uuid",
          "name": "PRODUCT KROY",
          "created_by": "admin"
      }
    }
  ]
  ```

---

## 10. Staff Payment Report API
স্টাফদের পেমেন্ট (Salary/Advance) এর রিপোর্ট দেখার জন্য এই API ব্যবহৃত হবে। এটি মূলত Expense Report কেই স্টাফদের জন্য ফিল্টার করে দেয়।

### A. Staff Payment Report দেখা (GET)
- URL: `/api/accounting/reports/staff-payments/`
- **Filters:**
  - `?from_date=2026-08-01&to_date=2026-08-31`
  - `?staff_id=<staff_uuid>` (Staff wise)
  - `?month=9&year=2026` (Month/Year wise)
  - `?search=<text>` (Transaction type বা Reference দিয়ে সার্চ)
- **Response Format:**
  এই API-টিও Expense Report-এর মতো সেম স্ট্রাকচারে ডেটা রিটার্ন করে, শুধু `transaction_type` সাধারণত "Staff Payment" থাকে।
  ```json
  [
    {
      "id": "183999",
      "type": "cost",
      "transaction_type": "Staff Payment",
      "staff_id": "Name: BAPPY | Phone: 01...",
      "month": 9,
      "year": 2026,
      "date": "2026-09-01",
      "account_id": "TOTAL BALENCE",
      "description": "BAPPY SALARI",
      "amount": "2300.00",
      "category_id": "DOKAN KOROJ",
      "created_at": "01 Sep 2026"
    }
  ]
  ```

---

## 11. Ledger / Statement Reports

### A. Client Ledger API (GET)
- URL: `/api/accounting/reports/client-ledger/`
- **Query Params:**
  - `?client_id=<uuid>` (Required)
  - `?from_date=2026-08-01`
  - `?to_date=2026-08-31`
- **Response Format:**
  ```json
  {
      "client": {
          "id": "uuid",
          "name": "Client 1",
          "phone": "01xxx",
          "current_due": "5000.00"
      },
      "ledger": [
          {
              "id": "uuid",
              "date": "2026-09-01",
              "type": "Sale Invoice",
              "reference": "Invoice: uuid",
              "debit": "1000.00",
              "credit": "0.00",
              "balance": "1000.00"
          }
      ]
  }
  ```

### B. Supplier Ledger API (GET)
- URL: `/api/accounting/reports/supplier-ledger/`
- **Query Params:**
  - `?supplier_id=<uuid>` (Required)
  - `?from_date=2026-08-01`
  - `?to_date=2026-08-31`
- **Response Format:**
  একই রকম, শুধু `supplier` অবজেক্ট থাকবে এবং Purchase, Purchase Return ও Payments এর হিসাব থাকবে।

### B. Staff Payment Update (Mark as Paid) (PATCH)
- URL: `/api/accounting/expenses/<expense_id>/`
- এই API ব্যবহার করে পেন্ডিং পেমেন্টকে "Paid" বা কমপ্লিট করা যাবে।
- **Body:**
  ```json
  {
      "status": true
  }
  ```

### C. Bulk Generate Payroll (POST)
নির্দিষ্ট মাসের সব অ্যাকটিভ স্টাফদের জন্য একসাথে Pending পেমেন্ট তৈরি করার API।
- URL: `/api/accounting/staff-payments/generate/`
- **Body:**
  ```json
  {
      "month": 9,
      "year": 2026,
      "account_id": "<uuid>" // Mandatory: Account from which money will be deducted when paid
  }
  ```
- **Optional Fields:** `"category_id": "<uuid>"` (যদি Salary এর জন্য কোনো নির্দিষ্ট Expense Category থাকে)
- **Response Format:**
  ```json
  {
      "message": "Successfully generated 5 pending staff payments for 9/2026."
  }
  ```
