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
  }
};

export default settingService;
