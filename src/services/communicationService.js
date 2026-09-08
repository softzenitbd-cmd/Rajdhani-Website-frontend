import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const communicationService = {
  // ==========================================
  // 1. Instant SMS Send
  // ==========================================
  sendInstantSms: async (data) => {
    return await apiClient.post(ENDPOINTS.COMMUNICATION_SMS_INSTANT, data);
  },

  // ==========================================
  // 2. Schedule SMS
  // ==========================================
  
  // A. Create SMS Schedule
  scheduleSms: async (data) => {
    return await apiClient.post(ENDPOINTS.COMMUNICATION_SMS, data);
  },

  // B. View SMS Schedules
  getSmsSchedules: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.search) params.search = filters.search;
    return await apiClient.get(ENDPOINTS.COMMUNICATION_SMS, { params });
  },

  // C. Cancel Pending SMS
  cancelSmsSchedule: async (id) => {
    return await apiClient.patch(ENDPOINTS.COMMUNICATION_SMS_CANCEL(id), {});
  }
};

export default communicationService;
