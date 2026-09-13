# Staff (HR & Payroll) API Instructions

এই ফাইলে "Staff", "Department", "Designation", এবং "Attendance" মডিউলের API এর ব্যবহারবিধি দেওয়া হলো।
সবগুলো API-তেই `Bearer Token` প্রয়োজন এবং ইউজারের `custom_permissions` অনুযায়ী অ্যাক্সেস কন্ট্রোল করা হবে (Required Module: `Staff`)।

> **Base URL:** `/api/staff/`

## 1. Department API
- **লিস্ট দেখা ও সার্চ করা (GET):** `/api/staff/departments/`
- **নতুন তৈরি করা (POST):**
  - Body: `{"name": "IT"}`
- **আপডেট ও ডিলিট:** `/api/staff/departments/<id>/`

## 2. Designation API
- **লিস্ট দেখা ও সার্চ করা (GET):** `/api/staff/designations/`
- **নতুন তৈরি করা (POST):**
  - Body: `{"name": "Software Engineer"}`
- **আপডেট ও ডিলিট:** `/api/staff/designations/<id>/`

## 3. Staff API (Important: Handles User Creation)
- **লিস্ট দেখা, সার্চ এবং ফিল্টার (GET):**
  - URL: `/api/staff/list/`
  - Search by User Name/Phone: `/api/staff/list/?search=01711`
  - Filter by Department: `/api/staff/list/?department=<uuid>`
- **নতুন তৈরি করা (POST):**
  - URL: `/api/staff/list/`
  - **বডি (JSON):** (এখানে ইউজারের ইনফরমেশনও দিতে হবে, ব্যাকএন্ড অটোমেটিকভাবে User তৈরি করে নিবে)
    ```json
    {
      "username": "rahim123",
      "password": "securepassword",
      "full_name": "Rahim Hossain",
      "phone_number": "01711000000",
      "email": "rahim@example.com",
      "department": "<department_uuid_here>",
      "designation": "<designation_uuid_here>",
      "basic_salary": "25000.00",
      "joining_date": "2026-09-01",
      "status": "active"
    }
    ```
- **আপডেট (PATCH) এবং ডিলিট (DELETE):** 
  - URL: `/api/staff/list/<id>/`
  - *Note: Staff ডিলিট করলে তার সাথে থাকা User অ্যাকাউন্টটিও ডিলিট হয়ে যাবে।*

## 4. Staff Attendance API
- **লিস্ট দেখা (GET):** `/api/staff/attendance/`
- **এন্ট্রি করা (POST):**
  - URL: `/api/staff/attendance/`
  - Body:
    ```json
    {
      "staff": "<staff_uuid_here>",
      "date": "2026-09-01",
      "in_time": "09:00:00",
      "out_time": "18:00:00",
      "status": "present" 
    }
    ```
    *Status options: `present`, `absence`, `late`, `leave`*

## 5. Attendance Report API (Monthly Aggregation)
এই API টি একটি নির্দিষ্ট মাস এবং বছরের সকল স্টাফের অ্যাটেন্ডেন্স রিপোর্ট দিবে।
- **রিপোর্ট দেখা (GET):** 
  - URL: `/api/staff/attendance-report/?month=9&year=2026`
  - **Response Example:**
    ```json
    [
      {
        "staff_id": "uuid...",
        "staff_name": "Rahim Hossain",
        "designation": "Software Engineer",
        "department": "IT",
        "present_count": 20,
        "absence_count": 1,
        "late_count": 2,
        "leave_count": 1
      }
    ]
    ```
