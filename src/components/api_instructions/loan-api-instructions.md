# Loan API Instructions
**Base URL:** `/api/loan/`

এই মডিউলটি লোন (Loan) পরিচালনার জন্য তৈরি করা হয়েছে। পুরোনো সিস্টেমে লোনকে সাধারণ Client এবং Income/Expense এর সাথে মিক্স করা হয়েছিল যা অ্যাকাউন্টিংয়ের জন্য ভুল। নতুন মডিউলে লোন সম্পূর্ণ আলাদা রাখা হয়েছে। 

---

## 1. Loan Account API
লোন অ্যাকাউন্ট (যেমন: IDLC Loan Account, United Finance) তৈরি এবং ম্যানেজ করার জন্য।

### A. List & Search (GET)
- URL: `/api/loan/accounts/`
- **Search (Query Params):** `?search=IDLC` (নাম, ফোন, বা ঠিকানা দিয়ে সার্চ)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "IDLC LOON ACOUNT",
      "phone": "01",
      "address": "JESSORE",
      "previous_due": "4635435.00",
      "max_due_limit": "0.00",
      "status": 1
    }
  ]
  ```

### B. Create Loan Account (POST)
- URL: `/api/loan/accounts/`
- **Body:**
  ```json
  {
    "name": "IDLC LOON ACOUNT",
    "phone": "01",
    "address": "JESSORE"
  }
  ```

### C. Update (PATCH) / Delete (DELETE)
- URL: `/api/loan/accounts/<uuid>/`

---

## 2. Loan Receive API (লোন নেওয়া)
যখন আপনি কারো কাছ থেকে লোন নিবেন। 
**Background Action:** এটি Cash/Bank এর ব্যালেন্স বৃদ্ধি করবে (+) এবং Loan Account এর Due বৃদ্ধি করবে (+) কারণ আপনি তার কাছে ঋণী হলেন।

### A. Create Loan Receive (POST)
- URL: `/api/loan/receives/`
- **Body:**
  ```json
  {
    "loan_account": "<uuid_of_idlc>",
    "account": "<uuid_of_cash_or_bank>",
    "amount": "9000000.00",
    "description": "Business Loan from IDLC"
  }
  ```

### B. List (GET) & Edit (PATCH)
- URL List: `/api/loan/receives/`
- URL Edit: `/api/loan/receives/<uuid>/` (Edit করলে আগের ট্রানজেকশন রিভার্স করে নতুন করে আপডেট হবে)।

---

## 3. Loan Payment API (লোন পরিশোধ করা)
যখন আপনি লোনের টাকা শোধ করবেন।
**Background Action:** এটি Cash/Bank এর ব্যালেন্স কমাবে (-) এবং Loan Account এর Due কমাবে (-) কারণ আপনার ঋণ শোধ হলো।

### A. Create Loan Payment (POST)
- URL: `/api/loan/payments/`
- **Body:**
  ```json
  {
    "loan_account": "<uuid_of_united>",
    "account": "<uuid_of_cash_or_bank>",
    "amount": "1150050.00",
    "description": "UNAYTED LOON PAID"
  }
  ```

### B. List (GET) & Edit (PATCH)
- URL List: `/api/loan/payments/`
- URL Edit: `/api/loan/payments/<uuid>/`

---

## 4. Loan Statement API (নির্দিষ্ট লোন অ্যাকাউন্টের লেজার)
যেকোনো লোন অ্যাকাউন্টের শুরু থেকে শেষ পর্যন্ত কত টাকা লোন নিয়েছেন এবং কত টাকা শোধ করেছেন তার সম্মিলিত লেজার। 

### A. View Statement (GET)
- URL: `/api/loan/statement/`
- **Filters:** 
  - `?loan_account=<uuid>` (নির্দিষ্ট অ্যাকাউন্টের জন্য)
  - `?from_date=2026-08-01&to_date=2026-08-31`
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "type": "RECEIVE",
      "transaction_type": "Loan Receive",
      "date": "30 Oct 2025",
      "account_name": "Cash",
      "description": "Initial Loan",
      "credit": "9000000.00",
      "debit": "--",
      "source": "Loan Account: IDLC LOON ACOUNT"
    },
    {
      "id": "uuid",
      "type": "PAYMENT",
      "transaction_type": "Loan Payment",
      "date": "19 Aug 2024",
      "account_name": "Cash",
      "description": "UNAYTED LOON PAID",
      "credit": "--",
      "debit": "1150050.00",
      "source": "Loan Account: IDLC LOON ACOUNT"
    }
  ]
  ```
