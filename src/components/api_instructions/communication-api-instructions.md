# Communication / SMS API Instructions

এই API এর মাধ্যমে আপনি সরাসরি SMS পাঠাতে বা শিডিউল (Schedule) করতে পারবেন।

## 1. Instant SMS Send (সরাসরি এসএমএস পাঠানো)
সাথে সাথে এসএমএস পাঠানোর জন্য এই API ব্যবহার করুন।

- **URL:** `POST /api/communication/sms/instant/`
- **Request Body:**
  ```json
  {
      "body": "Hello, this is a test SMS.",
      "client_ids": ["uuid-1", "uuid-2"], // Optional
      "client_group_ids": ["group-uuid"], // Optional
      "supplier_ids": ["uuid"], // Optional
      "supplier_group_ids": ["group-uuid"] // Optional
  }
  ```
- **Response Format:**
  ```json
  {
      "message": "Instant SMS dispatched to 15 recipients."
  }
  ```

## 2. Schedule SMS (ভবিষ্যতের জন্য এসএমএস সেট করা)

### A. Create SMS Schedule (POST)
- **URL:** `POST /api/communication/sms/`
- **Request Body:**
  ```json
  {
      "body": "Happy New Year!",
      "scheduled_date": "2027-01-01T00:00:00Z",
      "client": "client-uuid" // Only one target field should be provided at a time
  }
  ```
  **Target Fields:** `client`, `client_group`, `supplier`, `supplier_group`

### B. View SMS Schedules (GET)
- **URL:** `GET /api/communication/sms/`
- **Query Params:**
  - `?status=pending` (or sent, failed, cancelled)
  - `?from_date=2026-09-01&to_date=2026-09-30`
  - `?search=Happy` (Search by SMS body)
- **Response Format (Paginated):**
  ```json
  {
      "count": 1,
      "results": [
          {
              "id": "uuid",
              "body": "Happy New Year!",
              "scheduled_date": "2027-01-01T00:00:00Z",
              "status": "pending",
              "client_name": "Rahim",
              ...
          }
      ]
  }
  ```

### C. Cancel Pending SMS (PATCH)
কোনো পেন্ডিং এসএমএস ক্যানসেল করার জন্য:
- **URL:** `PATCH /api/communication/sms/<id>/cancel/`
- **Request Body:** Empty
- **Response Format:**
  ```json
  {
      "status": "cancelled"
  }
  ```
