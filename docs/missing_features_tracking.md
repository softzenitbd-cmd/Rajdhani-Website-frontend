# Missing APIs and Screens Tracking

This document tracks the gaps between the Frontend Screens (UI) and the Backend APIs provided. As we progress module by module, any missing APIs or missing screens will be logged here.

## 1. CRM Module (Client & Supplier)

### ❌ Missing APIs (Screen exists, but API not provided)
- **Client Statement:** UI exists (`ClientStatement.jsx`), but no endpoint provided for fetching the client statement/ledger.
- **Supplier Statement:** UI exists (`SupplierStatement.jsx`), but no endpoint provided for fetching the supplier statement.
- **Due Collection Date:** UI exists (`DueCollectionDate.jsx`), but no endpoint provided to fetch or update collection schedules.

### ❌ Missing Screens (API provided, but Screen not built)
- **Client Cheques:** API provided (`/api/crm/client-cheques/`), but no UI screen exists for managing Client Cheques (unlike Supplier Cheques which has `SupplierChequeSchedule.jsx`).

---

*Note: This list will be updated continuously as we check other modules.*
