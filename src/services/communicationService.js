import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Communication / SMS module (see src/components/api_instructions/communication-api-instructions.md)
 *
 *  Instant : POST /api/communication/sms/instant/
 *            { body, client_ids[], client_group_ids[], supplier_ids[], supplier_group_ids[] }
 *  Schedule: POST /api/communication/sms/
 *            { body, scheduled_date, client | client_group | supplier | supplier_group }
 *            → ONE target per row, so a multi recipient schedule creates one row per recipient.
 */

const TARGET_KEY = {
  client: 'client',
  supplier: 'supplier',
  client_group: 'client_group',
  supplier_group: 'supplier_group',
};

const INSTANT_KEY = {
  client: 'client_ids',
  supplier: 'supplier_ids',
  client_group: 'client_group_ids',
  supplier_group: 'supplier_group_ids',
};

/**
 * Instant SMS payload.
 * @param {Object} o
 * @param {string} o.message       SMS body
 * @param {Array}  o.recipients    [{ id, name, phone }] selected contacts
 * @param {string} o.recipientType 'client' | 'supplier' | 'client_group' | 'supplier_group'
 * @param {string=} o.groupId      when a whole group is targeted (no individual ids)
 */
export const buildSmsPayload = ({ message, recipients = [], recipientType = 'client', groupId }) => {
  const payload = { body: message };
  const ids = recipients.map((r) => r.id).filter(Boolean);
  if (ids.length) {
    payload[INSTANT_KEY[recipientType] || 'client_ids'] = ids;
  } else if (groupId) {
    payload[recipientType.startsWith('supplier') ? 'supplier_group_ids' : 'client_group_ids'] = [groupId];
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

  /** Create one schedule row: { body, scheduled_date, <target>: id } */
  scheduleSms: async (data) => {
    return await apiClient.post(ENDPOINTS.COMMUNICATION_SMS, data);
  },

  /**
   * Schedule the same message for many recipients (one API row each).
   * @returns {{ok:number, failed:number, errors:string[]}}
   */
  scheduleSmsBulk: async ({ message, scheduledDate, recipientType = 'client', recipientIds = [], groupId }) => {
    const targets = recipientIds.length
      ? recipientIds.map((id) => ({ key: TARGET_KEY[recipientType] || 'client', id }))
      : groupId
        ? [{ key: recipientType.startsWith('supplier') ? 'supplier_group' : 'client_group', id: groupId }]
        : [];
    if (targets.length === 0) throw new Error('No recipient selected');

    const results = await Promise.allSettled(
      targets.map((t) =>
        apiClient.post(ENDPOINTS.COMMUNICATION_SMS, { body: message, scheduled_date: scheduledDate, [t.key]: t.id })
      )
    );
    const failed = results.filter((r) => r.status === 'rejected');
    return {
      ok: results.length - failed.length,
      failed: failed.length,
      errors: failed.map((r) => r.reason?.message || 'Failed'),
    };
  },

  // B. View SMS Schedules
  getSmsSchedules: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    return await apiClient.get(ENDPOINTS.COMMUNICATION_SMS, { params });
  },

  // C. Cancel Pending SMS
  cancelSmsSchedule: async (id) => {
    return await apiClient.patch(ENDPOINTS.COMMUNICATION_SMS_CANCEL(id), {});
  },
};

export default communicationService;
