# Purchase (Invoice) API Instructions

এই ফাইলে "Purchase" মডিউলের API এর ব্যবহারবিধি দেওয়া হলো।

> **Base URL:** `/api/purchase/`

## 1. Purchase Invoice API
এই API এর মাধ্যমে Purchase Invoice তৈরি, দেখা, এবং ফিল্টার/সার্চ করা যাবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/purchase/invoices/`
- **Search:** `?search=<invoice_id_or_barcode>` (Invoice ID বা প্রোডাক্ট বারকোড দিয়ে সার্চ)
- **Filter by Supplier:** `?supplier=<supplier_uuid>`
- **Filter by Date Range:** `?from_date=2026-08-01&to_date=2026-08-31`
- **Filter by Status:** `?status=1`

### B. Purchase Invoice তৈরি করা (POST)
- URL: `/api/purchase/invoices/`
- **Background Actions:** এই রিকোয়েস্ট হিট করার সাথে সাথে অটোমেটিকভাবে:
  1. Product এর Stock এবং Buy Quantity প্লাস হবে।
  2. Supplier এর Previous Due এর সাথে এই ইনভয়েসের Total Due যোগ হবে।
- **বডি (JSON) Example:** 
  ```json
  {
    "supplier": "<supplier_uuid>",
    "discount": "0.00",
    "discount_type": "percentage",
    "transport_fare": "500.00",
    "vat": "0.00",
    "vat_type": "percentage",
    "purchase_bill": "10000.00",
    "total_vat": "0.00",
    "total_discount": "0.00",
    "grand_total": "10500.00",
    "receive_amount": "5000.00",
    "total_due": "5500.00",
    "status": 1,
    "items": [
      {
        "product": "<product_uuid>",
        "quantity": "40",
        "buying_price": "108.00",
        "selling_price": "125.00",
        "total_buying_price": "4320.00",
        "total_selling_price": "5000.00"
      },
      {
        "product": "<another_product_uuid>",
        "quantity": "10",
        "buying_price": "50.00",
        "selling_price": "80.00",
        "total_buying_price": "500.00",
        "total_selling_price": "800.00"
      }
    ]
  }
  ```
*(Note: `invoice_id` পাঠাতে হবে না, ব্যাকএন্ড নিজে থেকে `PUR-0001` স্টাইলে জেনারেট করে নিবে)*

### C. আপডেট (PATCH) এবং ডিলিট (DELETE)
- URL: `/api/purchase/invoices/<uuid>/`
- *Note: আপডেট করলে ফিল্ডগুলো আপডেট হবে, কিন্তু নেস্টেড items বা স্টক আপডেট করার জটিলতা আপাতত এড়িয়ে যাওয়া হয়েছে। শুধু বেসিক ইনভয়েস ডেটা আপডেট করা যাবে।*

## 2. Purchase Report API (বিস্তারিত পারচেজ রিপোর্ট)
কোন সাপ্লায়ারের কাছ থেকে কোন ইনভয়েসে কী কী প্রোডাক্ট কেনা হয়েছে তার বিস্তারিত (Item-wise) রিপোর্ট পাওয়ার জন্য এই API ব্যবহার করা হবে। (আগের সিস্টেমের `Purchase Report` এর হুবহু রেপ্লিকা, যা Sales Report এর মতোই Nested JSON রিটার্ন করে)

- **URL:** `GET /api/purchase/reports/purchases/`
- **Dynamic Filters:** 
  - `?from_date=2026-08-01&to_date=2026-08-31` (Daily/Date-wise)
  - `?barcode=12` (Barcode-wise)
  - `?supplier_id=<uuid>` (Supplier-wise)
  - `?supplier_group_id=<uuid>` (Supplier Group-wise)
  - `?product_id=<uuid>` (Product-wise)
  - `?product_group_id=<uuid>` (Product Group-wise)
- **Response Format (Example):**
  এই API টির রেসপন্স একদম Sales Report এর মতো Nested JSON আকারে আসবে, যেখানে প্রতিটি পারচেজ আইটেমের সাথে ইনভয়েস এবং সাপ্লায়ারের সমস্ত তথ্য যুক্ত থাকবে।
  ```json
  [
    {
      "id": "uuid",
      "type": "cost",
      "transaction_type": "purchase",
      "supplier_id": "SUPPLIER 1 | 01 | DHAKA",
      "invoice_id": "uuid",
      "date": "2024-04-25 10:08:52",
      "amount": "340.00",
      "current_due": "0.00",
      "invoice": {
          "id": "PUR-0001",
          "discount": "0.00",
          "payment_amount": "314.50",
          "due_amount": "0.00",
          "grand_total": "314.50",
          "invoice_items": [
             {
                "product_id": "uuid",
                "buying_price": "51.50",
                "quantity": "5",
                "product": {
                    "name": "S VOIL 70",
                    "buying_price": "51.50"
                }
             }
          ]
      },
      "supplier": {
          "supplier_name": "SUPPLIER 1",
          "previous_due": "0.00"
      },
      "products": "S VOIL 70",
      "unit_id": "GOZ",
      "barcode": "12",
      "product_qty": "5.00",
      "product_buying_price": "51.50",
      "issued_date": "25 Apr 2024"
    }
  ]
  ```

---

## 3. Purchase Return API
এই API এর মাধ্যমে প্রোডাক্ট রিটার্ন করা যাবে এবং রিটার্ন রিপোর্ট দেখা যাবে।

### A. লিস্ট দেখা এবং ফিল্টার করা (GET)
- URL: `/api/purchase/returns/`
- **Search:** `?search=<return_invoice_id_or_barcode>` 
- **Filter by Supplier:** `?supplier=<supplier_uuid>`
- **Filter by Date Range:** `?from_date=2026-08-01&to_date=2026-08-31`

### B. Purchase Return তৈরি করা (POST)
- URL: `/api/purchase/returns/`
- **Background Actions (Minus Logic):** এই রিকোয়েস্ট হিট করার সাথে সাথে অটোমেটিকভাবে:
  1. Product এর Stock থেকে `quantity` **মাইনাস (-)** হবে।
  2. Supplier এর Previous Due থেকে এই রিটার্নের `total_due` **মাইনাস (-)** হবে।
- **বডি (JSON) Example:** *(একদম Purchase এর মতোই, শুধু URL ভিন্ন)*
  ```json
  {
    "supplier": "<supplier_uuid>",
    "discount": "0.00",
    "total_due": "5500.00",
    "status": 1,
    "items": [
      {
        "product": "<product_uuid>",
        "quantity": "40"
      }
    ]
  }
  ```
*(Note: `return_invoice_id` পাঠাতে হবে না, ব্যাকএন্ড নিজে থেকে `PR-0001` স্টাইলে জেনারেট করে নিবে)*
