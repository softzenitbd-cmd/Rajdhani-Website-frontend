# Project Guidelines - Rajdhani Garments Frontend

## UI Guidelines
- **No Native Browser Dialogs**: Never use `window.confirm()` or `window.alert()`.
- **Custom Confirmation Modal**: Always use `useConfirm()` from `src/context/ConfirmContext.jsx`.
- **Toasts**: Always use `useToast()` from `src/context/ToastContext.jsx`.

## Localization (English / Bangla)
- Every user-facing string goes through `react-i18next`: `const { t } = useTranslation();` then `t("Client List")`.
- The **English text is the key** (`keySeparator` is off). Bangla lives in `src/locales/bn.json` — add an entry there for every new key; a missing key simply falls back to the English text.
- Dynamic parts use interpolation: `t("Delete {{v0}}", { v0: name })`. Never build sentences by concatenating translated fragments.
- Outside React components (`.js` helpers, module-level code) use `import i18n from '../i18n'` and `i18n.t(...)`, but keep translatable constants as keys and translate them at render time so a language switch re-renders correctly.
- The active language is persisted in `localStorage` (`lang`) and mirrored to `<html lang>`; `index.css` switches to the Hind Siliguri font for `bn`.
