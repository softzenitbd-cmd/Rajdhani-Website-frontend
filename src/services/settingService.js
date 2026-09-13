import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const settingService = {
  // ==========================================
  // 1. Company Information
  // ==========================================
  getCompanyInfo: async () => {
    return await apiClient.get(ENDPOINTS.SETTING_COMPANY_INFO);
  },

  updateCompanyInfo: async (data, isFormData = false) => {
    // If multipart/form-data is used (for uploading images like logo/memo header),
    // we need to set the Content-Type. Otherwise, standard JSON is fine.
    const config = isFormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } } 
      : {};
    return await apiClient.put(ENDPOINTS.SETTING_COMPANY_INFO, data, config);
  },

  // ==========================================
  // 2. SMS Template Settings
  // ==========================================
  getSmsSettings: async () => {
    return await apiClient.get(ENDPOINTS.SETTING_SMS_SETTINGS);
  },

  updateSmsSettings: async (data) => {
    return await apiClient.put(ENDPOINTS.SETTING_SMS_SETTINGS, data);
  },

  // ==========================================
  // 3. Dashboard API
  // ==========================================
  getDashboardStats: async () => {
    return await apiClient.get(ENDPOINTS.DASHBOARD_STATS);
  },

  // ==========================================
  // 4. General (key/value) settings – toggles, theme, shortcuts, print header
  //    Prefer appSettingsService which caches + broadcasts changes.
  // ==========================================
  getGeneralSettings: async () => {
    return await apiClient.get(ENDPOINTS.SETTING_GENERAL_SETTINGS);
  },

  updateGeneralSettings: async (data) => {
    return await apiClient.patch(ENDPOINTS.SETTING_GENERAL_SETTINGS, data);
  },

  // ==========================================
  // 5. Payment Methods  (CRUD, fields: name, status)
  // ==========================================
  paymentMethods: (() => {
    const STORAGE_KEY = 'rg_payment_methods';
    const DEFAULT_PAYMENT_METHODS = [
      { id: 'pm_1', name: 'Cash', status: 'Active', created_at: new Date().toISOString() },
      { id: 'pm_2', name: 'Bank Transfer', status: 'Active', created_at: new Date().toISOString() },
      { id: 'pm_3', name: 'bKash', status: 'Active', created_at: new Date().toISOString() },
      { id: 'pm_4', name: 'Nagad', status: 'Active', created_at: new Date().toISOString() },
      { id: 'pm_5', name: 'Card', status: 'Active', created_at: new Date().toISOString() },
    ];

    const getLocal = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS));
          return DEFAULT_PAYMENT_METHODS;
        }
        return JSON.parse(stored);
      } catch {
        return DEFAULT_PAYMENT_METHODS;
      }
    };

    const saveLocal = (items) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    };

    const is404 = (err) => {
      const status = err?.status || err?.response?.status;
      const msg = String(err?.message || '');
      return status === 404 || msg.includes('404') || msg.includes('Page not found') || msg.includes('Not Found');
    };

    return {
      list: async (params = {}) => {
        try {
          return await apiClient.get(ENDPOINTS.SETTING_PAYMENT_METHODS, { params });
        } catch (err) {
          if (is404(err)) {
            let items = getLocal();
            if (params.search) {
              const q = params.search.toLowerCase();
              items = items.filter((i) => (i.name || '').toLowerCase().includes(q));
            }
            return items;
          }
          throw err;
        }
      },
      create: async (data) => {
        try {
          return await apiClient.post(ENDPOINTS.SETTING_PAYMENT_METHODS, data);
        } catch (err) {
          if (is404(err)) {
            const items = getLocal();
            const newItem = {
              id: 'pm_' + Date.now(),
              name: data.name || '',
              status: data.status || 'Active',
              created_at: new Date().toISOString(),
              ...data,
            };
            items.push(newItem);
            saveLocal(items);
            return newItem;
          }
          throw err;
        }
      },
      update: async (id, data) => {
        try {
          return await apiClient.patch(`${ENDPOINTS.SETTING_PAYMENT_METHODS}${id}/`, data);
        } catch (err) {
          if (is404(err)) {
            let items = getLocal();
            items = items.map((item) => (String(item.id) === String(id) ? { ...item, ...data } : item));
            saveLocal(items);
            return { id, ...data };
          }
          throw err;
        }
      },
      remove: async (id) => {
        try {
          return await apiClient.delete(`${ENDPOINTS.SETTING_PAYMENT_METHODS}${id}/`);
        } catch (err) {
          if (is404(err)) {
            let items = getLocal();
            items = items.filter((item) => String(item.id) !== String(id));
            saveLocal(items);
            return { success: true };
          }
          throw err;
        }
      },
    };
  })(),
};

export default settingService;
