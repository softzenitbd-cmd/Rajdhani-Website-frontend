# Backend Documentation: Sale Price Percentage Auto-Calculation

## Overview
A new feature has been added to the frontend to automatically calculate the "Selling Price" of a product based on its "Buying Price" using a configurable percentage. This feature is active when creating/editing products and when purchasing new items.

## Required Setting Fields
To support this feature and allow it to persist globally, the backend settings API (e.g., `GET /api/general-settings/` and `POST /api/general-settings/`) must store and return the following two fields:

1. `sale_price_auto_generate` (Boolean)
   - Indicates whether the automatic calculation feature is enabled.
   - Example: `true` or `false`

2. `sale_price_percentage` (String or Float)
   - The percentage markup to apply to the buying price to calculate the selling price.
   - Example: `"35.00"` or `35.00`

## How it works (Frontend)
When the user edits the "Buying Price" input field in either the `Product Create/Edit` form or the `Purchase Create/Edit` form:
- The frontend checks if `sale_price_auto_generate` is `true`.
- If enabled, it automatically calculates the selling price using the formula:
  `Selling Price = Buying Price + (Buying Price * (sale_price_percentage / 100))`
- The resulting value is instantly populated in the selling price input field.

The backend does not need to handle this calculation automatically upon saving a product; it is handled entirely on the frontend prior to form submission. The backend simply needs to ensure these settings are saved and served when the frontend fetches global app settings.
