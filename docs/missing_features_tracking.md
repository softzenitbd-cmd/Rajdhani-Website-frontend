# Missing APIs and Screens Tracking

Superseded by [`missing-api-screens/README.md`](./missing-api-screens/README.md) (full audit, 2026-09-12).

Summary of the original items:

- **Client Statement** – now implemented with `/api/accounting/reports/client-ledger/`.
- **Supplier Statement** – implemented with `/api/accounting/reports/supplier-ledger/`.
- **Due Collection Date** – no dedicated endpoint; date is PATCHed to the client and mirrored locally.
- **Client Cheques** – screen exists (`ClientChequeSchedule.jsx`) and is linked in the sidebar.
