# Rule: Never Use Native Browser Dialogs (window.alert / window.confirm / alert() / confirm())

## Context
Native browser dialogs (`window.alert`, `window.confirm`, `alert()`, `confirm()`) disrupt the UI/UX with intrusive operating-system/browser level popups.

## Guidelines
1. **Never use native `window.alert` or `window.confirm`** anywhere in this project.
2. **For Confirmations**: Use `useConfirm` from `src/context/ConfirmContext.jsx`.
   - Example:
     ```javascript
     const confirm = useConfirm();
     
     const handleDelete = async (id) => {
       if (await confirm('Are you sure you want to delete this item?')) {
         // handle deletion
       }
     };
     ```
3. **For Notifications/Alerts**: Use `useToast` from `src/context/ToastContext.jsx`.
   - Example:
     ```javascript
     const toast = useToast();
     toast.success('Action completed successfully!');
     toast.error('An error occurred!');
     ```
