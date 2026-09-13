# Product (Inventory) API Instructions

এই ফাইলে "Product" এবং এর সাথে সম্পর্কিত ৬টি সাপোর্টিং মডিউলের API এর ব্যবহারবিধি দেওয়া হলো।
সবগুলো API-তেই `Bearer Token` প্রয়োজন এবং ইউজারের `custom_permissions` অনুযায়ী অ্যাক্সেস কন্ট্রোল করা হবে।

> **Base URL:** `/api/product/`

## 1. Supporting APIs (Base Data)
প্রোডাক্ট তৈরির আগে এই ডেটাগুলো তৈরি করে নিতে হবে। প্রত্যেকটির জন্য `GET`, `POST`, `PATCH`, `DELETE` কাজ করবে।
- **Units:** `/api/product/units/`
- **Groups / Categories:** `/api/product/groups/`
- **Brands:** `/api/product/brands/`
- **Colors:** `/api/product/colors/`
- **Sizes:** `/api/product/sizes/`
- **Warehouses:** `/api/product/warehouses/`

*(নতুন তৈরি করার জন্য বডিতে শুধু `{"name": "Name Here"}` পাঠালেই হবে। সার্চ করার জন্য `?search=Name` ব্যবহার করা যাবে।)*

## 2. Main Product API
- **লিস্ট দেখা, সার্চ এবং ফিল্টার (GET):**
  - URL: `/api/product/list/`
  - Search by Name/Barcode: `/api/product/list/?search=Shoe`
  - Filter examples: 
    - `/api/product/list/?group=<uuid>&brand=<uuid>`
    - `/api/product/list/?status=1`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/product/list/`
  - **বডি (JSON):** 
    ```json
    {
      "name": "SAV SHOES MOD --012",
      "custom_barcode_no": "123456789",
      "buying_price": "450.00",
      "selling_price": "680.00",
      "wholesale_price": "600.00",
      "opening_stock": "24.00",
      "stock": "24.00",
      "stock_warning": 5,
      "unit": "<uuid>",
      "group": "<uuid>",
      "brand": null,
      "color": null,
      "size": null,
      "warehouse": "<uuid>",
      "status": 1
    }
    ```
- **আপডেট (PATCH) এবং ডিলিট (DELETE):** 
  - URL: `/api/product/list/<id>/`

**Note:** GET রিকোয়েস্ট করলে রেসপন্সে `group_details`, `unit_details` সহ সকল ফরেন কির ডিটেইলস পপুলেট হয়ে আসবে।

---

## 3. Stock Report API

প্রোডাক্টের বর্তমান স্টক এবং স্টকের মোট কেনা ও বেচা মূল্য (ভ্যালুয়েশন) দেখার জন্য এই API ব্যবহৃত হয়।

### A. Stock Report দেখা (GET)
- URL: `/api/product/reports/stock/`
- **Filters:**
  - `?group_id=<uuid>` (Group wise)
  - `?brand_id=<uuid>` (Brand wise)
  - `?barcode=<text>` (Barcode search)
- **Response Format:**
  ```json
  [
      {
          "product_id": "uuid",
          "name": "Product 1",
          "barcode": "12345",
          "group_name": "Group A",
          "brand_name": "Brand X",
          "unit_name": "Pcs",
          "buying_price": "100.00",
          "selling_price": "150.00",
          "current_stock": "50.00",
          "total_buying_value": "5000.00",
          "total_selling_value": "7500.00"
      }
  ]
  ```
