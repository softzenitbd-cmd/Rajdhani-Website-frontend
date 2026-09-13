# ERP Setting API Instructions

এই মডিউলটির মাধ্যমে আপনি Company Information এবং SMS Configuration সরাসরি সিস্টেম থেকে পরিবর্তন করতে পারবেন।

## Company Information Management

### View Company Information
- **URL:** `GET /api/erpsetting/company-info/`
- **Response Format:**
  ```json
  {
      "id": 1,
      "company_name": "রাজধানী গার্মেন্টস",
      "proprietor": "RAJDHANI",
      "company_type": "Cloth Store",
      "present_address": "নেছা শপিংমল এর দ্বিতীয় তলা .কালিগঞ্জ,ঝিনাইদহ",
      "address": "নেছা শপিংমল এর দ্বিতীয় তলা .কালিগঞ্জ,ঝিনাইদহ",
      "email": "demo@gmail.com",
      "phone_number": "01716912350, 01727902498",
      "city": "Jhinaidah",
      "state": "Bangladesh",
      "zip_code": "9000",
      "stock_warning": 10,
      "currency_symbol": "৳",
      "invoice_greetings": "বিসমিল্লাহ্হির রাহমানির রাহিম",
      "invoice_footer": "Invoice Footer",
      "status": true,
      "logo": null,
      "memo_header_image": null,
      "sms_api_key": "6223a...",
      "sms_secret_key": "d59...",
      "sms_sender_id": "8809617...",
      "sms_base_url": "http://sms.sasbulksms.com:3040/sendtext"
  }
  ```

### Update Company Information
যেহেতু এখানে ছবি আপলোড করার সুযোগ রয়েছে (`logo`, `memo_header_image`), তাই রিকোয়েস্টটি `multipart/form-data` বা `application/json` যেকোনো ফরম্যাটে করা যাবে।
- **URL:** `PUT /api/erpsetting/company-info/`
- **Request Body Example (`application/json`):**
  ```json
  {
      "company_name": "নতুন কোম্পানি নাম",
      "sms_sender_id": "880123456789"
  }
  ```
- **Request Body Example (`multipart/form-data`):**
  - Key: `logo`, Value: [File Upload]
  - Key: `company_name`, Value: "Rajdhani Updated"
- **Response Format:** Returns the updated object.

**Note:** The system will always use `sms_api_key`, `sms_secret_key`, `sms_sender_id`, and `sms_base_url` from this API directly to send SMS. If these fields are missing, it will fallback to `.env` variables.

## SMS Template Settings

### View SMS Templates & Status
- **URL:** `GET /api/erpsetting/sms-settings/`
- **Response Format:**
  ```json
  {
      "id": 1,
      "receive_sms_status": false,
      "receive_sms_body": "Dear {client_name},\nThank you for the payment of {receive_amount} TK\nDue : {due_amount} for {description}. \nRAJDHANI FABRICS & GARMENTS\nHELPLINE: {company_mobile}",
      "invoice_sms_status": false,
      "invoice_sms_body": "Dear {client_name},\nThank you for purchasing our products.\nTotal bill: {total_bill} TK\nPayment: {total_payment}\nDue : {invoice_due}\nTotal Due: {client_total_due}. \nRAJDHANI FABRICS & GARMENTS\nHELPLINE: {company_mobile}"
  }
  ```

### Update SMS Templates & Status
- **URL:** `PUT /api/erpsetting/sms-settings/`
- **Request Body Example (`application/json`):**
  ```json
  {
      "receive_sms_status": true,
      "receive_sms_body": "Dear {client_name}, your payment of {receive_amount} TK is received.",
      "invoice_sms_status": true
  }
  ```

### Available Dynamic Variables in SMS Templates:
- **Receive SMS:** `{client_name}`, `{receive_amount}`, `{due_amount}`, `{description}`, `{company_mobile}`
- **Invoice SMS:** `{client_name}`, `{total_bill}`, `{total_payment}`, `{invoice_due}`, `{client_total_due}`, `{company_mobile}`

## Dashboard API

### Get Dashboard Statistics
- **URL:** `GET /api/erpsetting/dashboard/`
- **Description:** Returns summary statistics for "Today" and "Current Month" including Total Sales, Total Receive, Total Expense, Due, and Balance.
- **Response Format:**
  ```json
  {
      "today": {
          "sales_total": 0.00,
          "receive_total": 0.00,
          "expense_total": 0.00,
          "due": 0.00,
          "balance": 0.00
      },
      "current_month": {
          "month_name": "September",
          "sales_total": 256678.25,
          "receive_total": 256140.25,
          "expense_total": 632062.00,
          "due": 15778.00,
          "balance": -375921.75
      }
  }
  ```
