# User API Documentation

এই ডকুমেন্টে `User` মডিউলের জন্য তৈরি করা API-গুলোর বিস্তারিত বিবরণ দেওয়া হলো। বেস ইউআরএল (Base URL) হিসেবে `http://localhost:8000` বা আপনার সার্ভারের আইপি ধরে নিতে হবে।

---

## 1. User Registration API
নতুন ইউজার তৈরি করার জন্য এই এপিআই ব্যবহার করতে হবে।

- **URL:** `/api/auth/register/`
- **Method:** `POST`
- **Permission:** `IsAuthenticated` (শুধুমাত্র `superadmin` এবং `admin` রোল এর ইউজাররা নতুন ইউজার তৈরি করতে পারবে, তাই রিকোয়েস্ট হেডারে Bearer Token দিতে হবে)

### Request Body (JSON)
```json
{
    "username": "johndoe",
    "password": "securepassword123",
    "email": "johndoe@example.com",
    "full_name": "John Doe",
    "phone_number": "01700000000",
    "present_address": "Dhaka, Bangladesh",
    "permanent_address": "Dhaka, Bangladesh",
    "nationality": "Bangladeshi",
    "nid": "1234567890",
    "blood_group": "A+",
    "date_of_birth": "1990-01-01"
}
```
*(নোট: `image` আপলোড করতে চাইলে `multipart/form-data` ব্যবহার করতে হবে)*

### Response (201 Created)
```json
{
    "username": "johndoe",
    "email": "johndoe@example.com",
    "full_name": "John Doe"
}
```

---

## 2. User Login API
লগইন করে JWT (Access & Refresh) টোকেন পাওয়ার জন্য এই এপিআই ব্যবহার করতে হবে। এখন থেকে **ইমেইলের বদলে `username` দিয়ে লগইন** করতে হবে।

- **URL:** `/api/auth/login/`
- **Method:** `POST`
- **Permission:** `AllowAny`

### Request Body (JSON)
```json
{
    "username": "johndoe",
    "password": "securepassword123"
}
```

### Response (200 OK)
লগইন সফল হলে রেসপন্সে টোকেনসহ ইউজারের বিস্তারিত ডেটা এবং তার **`custom_permissions`** পাওয়া যাবে।
```json
{
    "access": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "id": 2,
    "user_id": "A002",
    "username": "johndoe",
    "full_name": "John Doe",
    "email": "johndoe@example.com",
    "role": "admin",
    "custom_permissions": {
        "Main": {"All": false},
        "Clients": {"Visibility": false, "Create": false, "Edit": false, "View": false, "Delete": false}
    }
}
```

### Response (400 Bad Request)
ভুল ইউজারনেম বা পাসওয়ার্ড দিলে:
```json
{
    "error": "Invalid username or password"
}
```

---

## 3. Token Refresh API
অ্যাক্সেস টোকেনের মেয়াদ (১ দিন) শেষ হয়ে গেলে, রিফ্রেশ টোকেন (৭ দিন মেয়াদ) ব্যবহার করে নতুন অ্যাক্সেস টোকেন জেনারেট করার জন্য এই এপিআই।

- **URL:** `/api/auth/token/refresh/`
- **Method:** `POST`
- **Permission:** `AllowAny`

### Request Body (JSON)
```json
{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

### Response (200 OK)
```json
{
    "access": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

---

## 4. Change Password API (For Current User)
লগইন থাকা যেকোনো ইউজার তার নিজের পাসওয়ার্ড পরিবর্তন করার জন্য এই এপিআই ব্যবহার করবে। এখানে হেডার হিসেবে Bearer Token দিতে হবে।

- **URL:** `/api/auth/change-password/`
- **Method:** `POST`
- **Permission:** `IsAuthenticated` (Bearer Token Required)

### Request Body (JSON)
```json
{
    "old_password": "securepassword123",
    "new_password": "newsecurepassword123"
}
```

### Response (200 OK)
```json
{
    "message": "Password changed successfully"
}
```

---

## 5. Admin Change User Password API
সুপার অ্যাডমিন চাইলে যেকোনো ইউজারের পাসওয়ার্ড পরিবর্তন করে দিতে পারবে। এর জন্য টার্গেট ইউজারের `id` (UUID) URL-এর সাথে পাঠাতে হবে। এখানেও সুপার অ্যাডমিনের Bearer Token দিতে হবে।

- **URL:** `/api/auth/admin-change-password/<user_id>/`
- **Method:** `POST`
- **Permission:** `IsAuthenticated` (Only `superadmin` role is allowed)

### Request Body (JSON)
```json
{
    "new_password": "newpasswordforuser"
}
```

### Response (200 OK)
```json
{
    "message": "Password for johndoe changed successfully"
}
```

---

## 6. User Profile API
লগইন থাকা ইউজার তার নিজের প্রোফাইল দেখতে এবং আপডেট করতে পারবে।

- **URL:** `/api/auth/profile/`
- **Method:** `GET` (প্রোফাইল দেখতে) / `PATCH` (প্রোফাইল আপডেট করতে)
- **Permission:** `IsAuthenticated` (Bearer Token Required)

### Request Body (`PATCH` এর ক্ষেত্রে)
```json
{
    "full_name": "Updated Name",
    "present_address": "New Address"
}
```

### Response (200 OK)
রেসপন্সে ইউজারের আপডেট করা সম্পূর্ণ ডেটা পাওয়া যাবে।

---

## 7. User List API
সিস্টেমে থাকা সকল ইউজারের লিস্ট দেখার জন্য এই এপিআই। এটি শুধু `superadmin` এবং `admin` ব্যবহার করতে পারবে।

- **URL:** `/api/auth/users/`
- **Method:** `GET`
- **Permission:** `IsAuthenticated` (Only `superadmin` or `admin` role)

### Response (200 OK)
```json
[
    {
        "id": "UUID",
        "user_id": "SA001",
        "username": "admin",
        ...
    },
    ...
]
```

---

## 8. User Detail API (View/Update/Delete by Admin)
অ্যাডমিন চাইলে স্পেসিফিক কোনো ইউজারের ডিটেইলস দেখতে পারবে, আপডেট করতে পারবে অথবা ইউজারকে ডিলিট করে দিতে পারবে। 

- **URL:** `/api/auth/users/<id>/` (যেখানে `<id>` হলো ইউজারের UUID)
- **Method:** `GET` (দেখতে), `PATCH` (আপডেট করতে), `DELETE` (ডিলিট করতে)
- **Permission:** `IsAuthenticated` (Only `superadmin` or `admin` role)

---

## 9. Update User Permissions API
সুপার অ্যাডমিন চাইলে যেকোনো ইউজারের `custom_permissions` JSON আপডেট করে দিতে পারবে। 

- **URL:** `/api/auth/users/<id>/permissions/`
- **Method:** `PATCH`
- **Permission:** `IsAuthenticated` (Only `superadmin` role)

### Request Body
```json
{
    "custom_permissions": {
        "Main": {"All": false},
        "Clients": {"Visibility": true, "Create": true, "Edit": true, "View": true, "Delete": true}
    }
}
```

### Response (200 OK)
```json
{
    "message": "User permissions updated successfully",
    "custom_permissions": { ... }
}
```
