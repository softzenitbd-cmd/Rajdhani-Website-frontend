# CRM (Client & Supplier) API Instructions

এই ফাইলে "Client" এবং "Supplier" মডিউলের API এর ব্যবহারবিধি দেওয়া হলো। সবগুলো API-তেই `Bearer Token` প্রয়োজন এবং ইউজারের `custom_permissions` অনুযায়ী অ্যাক্সেস কন্ট্রোল করা হবে।

> **Base URL:** `/api/crm/`

## 1. Client Groups API
**Permission Check:** "Clients Group" মডিউলের `Visibility`, `Create`, `Edit`, `Delete` পারমিশন অনুযায়ী কাজ করবে।

- **লিস্ট দেখা ও সার্চ করা (GET):**
  - URL: `/api/crm/client-groups/`
  - Search: `/api/crm/client-groups/?search=GroupName`
  - Pagination: `/api/crm/client-groups/?page=1&page_size=10`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/crm/client-groups/`
  - Body: `{"name": "Regular Clients"}`
- **আপডেট (PATCH) এবং ডিলিট (DELETE):**
  - URL: `/api/crm/client-groups/<id>/`

## 2. Clients API
**Permission Check:** "Clients" মডিউলের পারমিশন।

- **লিস্ট দেখা, সার্চ এবং ফিল্টার (GET):**
  - URL: `/api/crm/clients/`
  - Search by Name/Phone: `/api/crm/clients/?search=Jamal`
  - Filter by Group: `/api/crm/clients/?group=<group_uuid>`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/crm/clients/`
  - Body:
    ```json
    {
      "name": "Jamal Hossain",
      "phone": "01711000000",
      "address": "Dhaka",
      "previous_due": "5000.00",
      "group": "<group_uuid_here>"
    }
    ```
- **আপডেট (PATCH) এবং ডিলিট (DELETE):**
  - URL: `/api/crm/clients/<id>/`

## 3. Supplier Groups API
**Permission Check:** "Suppliers Group" মডিউলের পারমিশন।

- **লিস্ট দেখা ও সার্চ করা (GET):**
  - URL: `/api/crm/supplier-groups/`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/crm/supplier-groups/`
  - Body: `{"name": "Local Suppliers"}`
- **আপডেট (PATCH) এবং ডিলিট (DELETE):**
  - URL: `/api/crm/supplier-groups/<id>/`

## 4. Suppliers API
**Permission Check:** "Suppliers" মডিউলের পারমিশন।

- **লিস্ট দেখা, সার্চ এবং ফিল্টার (GET):**
  - URL: `/api/crm/suppliers/`
  - Search by Name/Phone: `/api/crm/suppliers/?search=Rahim`
  - Filter by Group: `/api/crm/suppliers/?group=<group_uuid>`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/crm/suppliers/`
  - Body:
    ```json
    {
      "name": "Rahim Traders",
      "phone": "01811000000",
      "address": "Chattogram",
      "previous_due": "10000.00",
      "group": "<group_uuid_here>"
    }
    ```
- **আপডেট (PATCH) এবং ডিলিট (DELETE):**
  - URL: `/api/crm/suppliers/<id>/`

---

## 5. Cheques API (চেক ম্যানেজমেন্ট)
- **Supplier Cheques** (Supplier-দের দেওয়া চেক):
  - URL List: `/api/crm/supplier-cheques/` (Filters: `?supplier=<uuid>`, `?status=0/1/2`)
  - URL Create: `/api/crm/supplier-cheques/`
  - URL Edit/Delete: `/api/crm/supplier-cheques/<uuid>/`
  - Body Example: `{"supplier": "<uuid>", "amount": "5000", "bank_name": "DBBL", "cheque_no": "123456", "cheque_date": "2026-08-31", "status": 0}` (0=Pending, 1=Cleared, 2=Bounced)

- **Client Cheques** (Client-দের থেকে পাওয়া চেক):
  - URL List: `/api/crm/client-cheques/` (Filters: `?client=<uuid>`, `?status=0/1/2`)
  - URL Create: `/api/crm/client-cheques/`
  - URL Edit/Delete: `/api/crm/client-cheques/<uuid>/`

---

## 6. Due Reports API (বকেয়া রিপোর্ট)
কাস্টমার এবং সাপ্লায়ারদের বকেয়ার বিস্তারিত রিপোর্ট পাওয়ার জন্য।

### A. Client Due Report (কাস্টমার বকেয়া)
- **URL:** `GET /api/crm/reports/client-due/`
- **Filters:** 
  - `?client_id=<uuid>` (নির্দিষ্ট কাস্টমারের জন্য)
  - `?group_id=<uuid>` (নির্দিষ্ট গ্রুপের জন্য)
  - `?has_due=true` (শুধুমাত্র যাদের বকেয়া আছে তাদের জন্য)
- **Response Format:**
  ```json
  [
    {
      "client_id": "uuid",
      "client_name": "HIRA APA",
      "phone": "01621803265",
      "address": "FOYLA MASTAR PARA",
      "group_name": "Retailer",
      "sales_amount": "500.00",
      "collection": "380.00",
      "return_amount": "0.00",
      "due": "120.00"
    }
  ]
  ```

### B. Supplier Due Report (সাপ্লায়ার বকেয়া)
- **URL:** `GET /api/crm/reports/supplier-due/`
- **Filters:** 
  - `?supplier_id=<uuid>` 
  - `?group_id=<uuid>` 
  - `?has_due=true`
- **Response Format:**
  ```json
  [
    {
      "supplier_id": "uuid",
      "supplier_name": "Zahan Fabrics",
      "phone": "017...",
      "address": "Dhaka",
      "group_name": "Wholesaler",
      "purchase_amount": "50000.00",
      "payment": "30000.00",
      "return_amount": "5000.00",
      "due": "15000.00"
    }
  ]
  ```
