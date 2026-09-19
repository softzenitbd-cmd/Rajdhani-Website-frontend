import React, { useEffect, useState } from 'react';
import { Clock, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { communicationService } from '../../services/communicationService';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import { toList } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

/**
 * Schedule an SMS for a later time. Recipients can be picked from clients,
 * suppliers, or typed manually (comma / newline separated numbers).
 */
const box = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };
const label = { display: 'block', fontSize: 'var(--fs-12, 12px)', marginBottom: '6px', color: 'var(--label-color)', fontWeight: 600 };

const SmsSchedule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [source, setSource] = useState('client'); // client | supplier (the API schedules per contact)
  const [contacts, setContacts] = useState([]);
  const [contactId, setContactId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetcher = source === 'client' ? crmService.getClients : crmService.getSuppliers;
    fetcher()
      .then((r) => setContacts(toList(r).map((c) => ({ id: c.id || c.uuid, name: c.name, phone: c.phone || c.mobile }))))
      .catch((e) => { toast.error(e?.message || t("Failed to load {{v0}}s", { v0: source })); setContacts([]); });
    setContactId('');
  }, [source]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolveRecipients = () => {
    if (contactId === 'all') return contacts.filter((c) => c.phone);
    const c = contacts.find((x) => String(x.id) === String(contactId));
    return c ? [c] : [];
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error(t("Type a message"));
    if (!scheduleAt) return toast.error(t("Pick a schedule date & time"));
    const recipients = resolveRecipients();
    if (recipients.length === 0) return toast.error(t("Select at least one recipient"));

    try {
      setSending(true);
      const { ok, failed, errors } = await communicationService.scheduleSmsBulk({
        message: message.trim(),
        scheduledDate: new Date(scheduleAt).toISOString(),
        recipientType: source,
        recipientIds: recipients.map((r) => r.id).filter(Boolean),
      });
      if (failed) toast.error(t("{{v0}} schedule(s) failed: {{v1}}", { v0: failed, v1: errors[0] }));
      if (ok) {
        toast.success(t("SMS scheduled for {{v0}} recipient(s)", { v0: ok }));
        navigate('/sms/schedule-report');
      }
    } catch (err) {
      toast.error(err.message || t("Failed to schedule SMS"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>{t("SCHEDULE SMS")}</h2>
          <button type="button" onClick={() => navigate('/sms/schedule-report')} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <List size={14} /> {t("Schedule Report")}
          </button>
        </div>

        <form onSubmit={submit} className="premium-body" style={{ background: 'white', padding: '24px', maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={label}>{t("Message Body")}</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("Type your message here ...")} style={{ ...box, height: '140px', resize: 'vertical' }} />
            <div style={{ fontSize: 'var(--fs-12, 12px)', color: '#64748b', marginTop: '6px' }}>{message.length} {t("characters ·")} {Math.max(1, Math.ceil(message.length / 160))} {t("SMS")}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={label}><Clock size={12} /> {t("Schedule Date & Time")}</label>
              <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} style={box} required />
            </div>
            <div>
              <label style={label}>{t("Recipient Type")}</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} style={box}>
                <option value="client">{t("Client")}</option>
                <option value="supplier">{t("Supplier")}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={label}>{source === 'client' ? t("Client") : t("Supplier")}</label>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} style={box}>
              <option value="">{t("Select")} {source}</option>
              <option value="all">{t("— All")} {source}{t("s with phone (")}{contacts.filter((c) => c.phone).length}) —</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
            </select>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button type="submit" disabled={sending} style={{ background: 'var(--success)', color: 'white', padding: '12px 32px', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? t("Scheduling...") : t("Schedule SMS")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmsSchedule;
