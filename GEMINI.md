# Project Guidelines - Rajdhani Garments Frontend

## UI Guidelines
- **No Native Browser Dialogs**: Never use `window.confirm()` or `window.alert()`.
- **Custom Confirmation Modal**: Always use `useConfirm()` from `src/context/ConfirmContext.jsx`.
- **Toasts**: Always use `useToast()` from `src/context/ToastContext.jsx`.
