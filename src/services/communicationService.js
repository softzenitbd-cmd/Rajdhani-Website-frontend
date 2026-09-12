import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Builds the SMS payload used by both the instant and the scheduled endpoints.
 *
 * @param {Object} o
 * @param {string}   o.message        SMS body
 * @param {Array}    o.recipients     [{ id, name, phone }] resolved contacts
 * @param {string}   o.recipientType  'client' | 'supplier' | 'client_group' | 'supplier_group' | 'custom'
 * @param {string=}  o.groupId        group uuid when a whole group is targeted
 * @param {string=}  o.scheduleAt     ISO datetime for scheduled SMS
 */
export const buildSmsPayload = ({ message, recipients = [], recipientType = 'client', groupId, scheduleAt }) => {
  const phones = [...new Set(recipients.map((r) => String(r.phone || '').trim()).filter(Boolean))];
  const ids = recipients.map((r) => r.id).filter(Boolean);
  const payload = {
    message,
    recipient_type: recipientType,
    phone_numbers: phones,
    recipients: recipients.map((r) => ({ id: r.id, name: r.name, phone: r.phone })),
  };
  if (recipientType.startsWith('client')) payload.clients = ids;
  if (recipientType.startsWith('supplier')) payload.suppliers = ids;
  if (groupId) payload.group = groupId;
  if (scheduleAt) {
    payload.schedule_at = scheduleAt;
    payload.scheduled_at = scheduleAt;
  }
  return payload;
};

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
  },
};

export default communicationService;
