# Sales (Invoice) Module API

**Base URL:** `/api/sale/`

## 1. Sales Invoice API
এই API এর মাধ্যমে Sales Invoice তৈরি, দেখা, এবং ফিল্টার/সার্চ করা যাবে। ড্রাফট ইনভয়েসও এখান থেকেই হ্যান্ডেল করা হবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/sale/invoices/`
- **Search:** `?search=<invoice_id_or_barcode>` (Invoice ID বা প্রোডাক্ট বারকোড দিয়ে সার্চ)
- **Filter by Client:** `?client=<client_uuid>`
- **Filter by Date Range:** `?from_date=2026-08-01&to_date=2026-08-31`
- **Filter by Account:** `?account_id=<account_name>`
- **Filter by Status (Draft vs General):** 
  - `?status=1` (শুধু General বা Final ইনভয়েস দেখতে)
  - `?status=0` (শুধু **Draft** ইনভয়েস দেখতে)

### B. Sales Invoice তৈরি করা (POST)
- URL: `/api/sale/invoices/`
- **Background Actions (Stock & Due):** 
  - **যদি status=1 (General) হয়:** 
    1. Product এর Stock থেকে বিক্রিত পরিমাণ মাইনাস (-) হবে এবং Sell Quantity প্লাস (+) হবে।
    2. Client এর Previous Due এর সাথে এই ইনভয়েসের Total Due যোগ (+) হবে।
  - **যদি status=0 (Draft) হয়:** কোনো স্টক বা ডিউ আপডেট হবে না।
- **বডি (JSON) Example:** 
  ```json
  {
    "client": "<client_uuid>",
    "discount": "0.00",
    "discount_type": "percentage",
    "transport_fare": "0.00",
    "labour_cost": "0.00",
    "vat": "0.00",
    "vat_type": "percentage",
    "invoice_bill": "380.00",
    "total_vat": "0.00",
    "total_discount": "0.00",
    "grand_total": "380.00",
    "receive_amount": "380.00",
    "total_due": "0.00",
    "account_id": "TOTAL BALENCE",
    "category_id": "CASH SELL",
    "status": 1, 
    "items": [
      {
        "product": "<product_uuid>",
        "quantity": "2",
        "selling_price": "190.00",
        "total_selling_price": "380.00"
      }
    ]
  }
  ```
*(Note: `invoice_id` পাঠাতে হবে না, ব্যাকএন্ড নিজে থেকে `INV-0001` স্টাইলে জেনারেট করে নিবে)*

### C. ড্রাফট থেকে ফাইনালে কনভার্ট করা (PATCH)
- URL: `/api/sale/invoices/<uuid>/`
- **বডি:** `{"status": 1}`
- **Action:** যদি কোনো ইনভয়েস আগে ড্রাফট (0) হিসেবে সেভ করা থাকে এবং পরে তাকে `status: 1` করে আপডেট করা হয়, তখন স্বয়ংক্রিয়ভাবে স্টক মাইনাস হবে এবং ক্লায়েন্টের ডিউ প্লাস হবে।

## 2. Sales Report API (বিস্তারিত সেলস রিপোর্ট)
কোন কাস্টমার কোন ইনভয়েসে কী কী প্রোডাক্ট কিনেছে এবং সেখানে কত টাকা প্রফিট হয়েছে তার বিস্তারিত (Item-wise) রিপোর্ট পাওয়ার জন্য এই API ব্যবহার করা হবে। (আগের সিস্টেমের `Sales Report` এর হুবহু রেপ্লিকা)

- **URL:** `GET /api/sale/reports/sales/`
- **Dynamic Filters:** 
  - `?from_date=2026-08-01&to_date=2026-08-31` (Daily/Date-wise)
  - `?barcode=12` (Barcode-wise)
  - `?client_id=<uuid>` (Customer-wise)
  - `?client_group_id=<uuid>` (Client Group-wise)
  - `?product_id=<uuid>` (Product-wise)
  - `?product_group_id=<uuid>` (Product Group-wise)
- **Response Format (Example):**
  এই API টির রেসপন্স একদম আগের সিস্টেমের মতো Nested JSON আকারে আসবে, যেখানে প্রতিটি সেলস আইটেমের সাথে ইনভয়েস এবং কাস্টমারের সমস্ত তথ্য যুক্ত থাকবে।
  ```json
  [
    {
      "id": "uuid",
      "type": "deposit",
      "transaction_type": "invoice",
      "client_id": "RANIG CUSTOMER | 01 | ALL",
      "invoice_id": "uuid",
      "date": "2024-04-25 10:08:52",
      "amount": "340.00",
      "current_due": "0.00",
      "invoice": {
          "id": "INV-0001",
          "discount": "0.00",
          "receive_amount": "314.50",
          "due_amount": "0.00",
          "grand_total": "314.50",
          "invoice_items": [
             {
                "product_id": "uuid",
                "selling_price": "68.00",
                "quantity": "5",
                "product": {
                    "name": "S VOIL 70",
                    "buying_price": "51.50"
                }
             }
          ]
      },
      "client": {
          "client_name": "RANIG CUSTOMER 2024",
          "previous_due": "0.00"
      },
      "products": "S VOIL 70",
      "unit_id": "GOZ",
      "barcode": "12",
      "product_qty": "5.00",
      "product_sale_price": "68.00",
      "profit": "60.00",
      "issued_date": "25 Apr 2024"
    }
  ]
  ```

---

## 3. Sales Return API
এই API এর মাধ্যমে ক্লায়েন্ট কর্তৃক প্রোডাক্ট রিটার্ন ম্যানেজ করা যাবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/sale/returns/`
- **Search:** `?search=<return_invoice_id_or_barcode>` 
- **Filter by Client:** `?client=<client_uuid>`
- **Filter by Account:** `?account_id=<account_name>`
- **Filter by Date Range:** `?from_date=2026-08-01&to_date=2026-08-31`
- **Filter by Status:** `?status=1` (Final) বা `?status=0` (Draft)

### B. Sales Return তৈরি করা (POST)
- URL: `/api/sale/returns/`
- **Background Actions:** 
  - **যদি status=1 (Final) হয়:**
    1. Product এর Stock-এ `quantity` **প্লাস (+)** হবে এবং Sell Quantity থেকে **মাইনাস (-)** হবে।
    2. Client এর Previous Due থেকে এই রিটার্নের `total_due` **মাইনাস (-)** হবে।
  - **যদি status=0 (Draft) হয়:** কোনো স্টক বা ডিউ আপডেট হবে না।
- **বডি (JSON) Example:** 
  ```json
  {
    "client": "<client_uuid>",
    "discount": "0.00",
    "total_due": "29500.00",
    "status": 1,
    "items": [
      {
        "product": "<product_uuid>",
        "quantity": "50"
      }
    ]
  }
  ```
*(Note: `return_invoice_id` পাঠাতে হবে না, ব্যাকএন্ড নিজে থেকে `SR-0001` স্টাইলে জেনারেট করে নিবে)*

### C. ড্রাফট রিটার্ন ফাইনালে কনভার্ট করা (PATCH)
- URL: `/api/sale/returns/<uuid>/`
- **বডি:** `{"status": 1}`
- **Action:** যদি রিটার্ন বিলটি ড্রাফট (0) হিসেবে থাকে এবং পরে তাকে `status: 1` করে আপডেট করা হয়, তখন স্টক এবং ডিউ উপরোক্ত নিয়মে আপডেট হবে।
