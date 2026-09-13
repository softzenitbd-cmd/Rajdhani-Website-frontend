import React, { useEffect, useMemo, useState } from 'react';
import { Send, Clock, Users, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { communicationService, buildSmsPayload } from '../services/communicationService';
import { useToast } from '../context/ToastContext';

/**
 * Shared "compose & send SMS" screen.
 *
 * props:
 *  - title
 *  - recipientType   'client' | 'supplier' | 'client_group' | 'supplier_group'
 *  - contacts        [{id, name, phone, group}] (already loaded)
 *  - groups          [{id, name}] optional – when given the picker works per group
 *  - loading
 *  - onAddNew        optional callback → opens the caller's "add new contact" modal
 */
const SMS_LIMIT = 160;

const box = { width: '100%', padding: '12px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' };

const SmsComposer = ({ title, recipientType, contacts = [], groups = null, loading, onAddNew }) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [message, setMessage] = useState('');
  const [groupId, setGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [mode, setMode] = useState('now'); // 'now' | 'schedule'
  const [scheduleAt, setScheduleAt] = useState('');
  const [sending, setSending] = useState(false);

  // contacts limited to the chosen group (when groups are used)
  const pool = useMemo(() => {
    let list = contacts;
    if (groups && groupId) {
      list = list.filter((c) => String(c.group?.id || c.group_id || c.group) === String(groupId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(q));
    }
    return list;
  }, [contacts, groups, groupId, search]);

  // selecting a group selects every member of it
  useEffect(() => {
    if (!groups) return;
    if (!groupId) {
      setSelected(new Set());
      return;
    }
    const members = contacts.filter((c) => String(c.group?.id || c.group_id || c.group) === String(groupId));
    setSelected(new Set(members.map((m) => m.id)));
  }, [groupId, groups, contacts]);

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const allVisibleSelected = pool.length > 0 && pool.every((c) => selected.has(c.id));
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allVisibleSelected) pool.forEach((c) => n.delete(c.id));
      else pool.forEach((c) => n.add(c.id));
      return n;
    });

  const recipients = contacts.filter((c) => selected.has(c.id));
  const withPhone = recipients.filter((r) => r.phone);
  const smsCount = Math.max(1, Math.ceil(message.length / SMS_LIMIT));

  const send = async () => {
    if (!message.trim()) return toast.error('Type a message first');
    if (withPhone.length === 0) return toast.error('Select at least one recipient with a phone number');
    if (mode === 'schedule' && !scheduleAt) return toast.error('Choose the schedule date & time');
    if (!window.confirm(`${mode === 'now' ? 'Send' : 'Schedule'} SMS to ${withPhone.length} recipient(s)?`)) return;

    try {
      setSending(true);
      if (mode === 'now') {
        const payload = buildSmsPayload({ message: message.trim(), recipients: withPhone, recipientType, groupId: groups ? groupId : undefined });
        const res = await communicationService.sendInstantSms(payload);
        toast.success(res?.message || `SMS sent to ${withPhone.length} recipient(s)`);
      } else {
        const { ok, failed, errors } = await communicationService.scheduleSmsBulk({
          message: message.trim(),
          scheduledDate: new Date(scheduleAt).toISOString(),
          recipientType,
          recipientIds: withPhone.map((r) => r.id),
          groupId: groups ? groupId : undefined,
        });
        if (failed) toast.error(`${failed} schedule(s) failed: ${errors[0]}`);
        if (ok) toast.success(`SMS scheduled for ${ok} recipient(s)`);
        if (ok) navigate('/sms/schedule-report');
      }
      setMessage('');
      setSelected(new Set());
    } catch (e) {
      toast.error(e.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{title}</h2>
          <button type="button" onClick={() => navigate(-1)} style={{ background: '#64748b', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: '24px' }}>
          {/* Left: message */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--label-color)', fontWeight: 600 }}>Message Body</label>
            <textarea
              placeholder="Type your message here ..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...box, height: '160px', resize: 'vertical' }}
            />
            <div style={{ fontSize: '12px', color: message.length > SMS_LIMIT ? '#b45309' : '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{message.length} characters · {smsCount} SMS part{smsCount > 1 ? 's' : ''}</span>
              <span>Remaining: {SMS_LIMIT - (message.length % SMS_LIMIT || (message.length ? SMS_LIMIT : 0))}</span>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setMode('now')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #0ea5e9', background: mode === 'now' ? '#0ea5e9' : 'white', color: mode === 'now' ? 'white' : '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                <Send size={14} /> Send Now
              </button>
              <button type="button" onClick={() => setMode('schedule')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #0ea5e9', background: mode === 'schedule' ? '#0ea5e9' : 'white', color: mode === 'schedule' ? 'white' : '#0ea5e9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                <Clock size={14} /> Schedule
              </button>
            </div>
            {mode === 'schedule' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--label-color)', fontWeight: 600 }}>Schedule Date & Time</label>
                <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} style={box} />
              </div>
            )}

            <div style={{ marginTop: '24px', padding: '12px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              <strong>{withPhone.length}</strong> recipient{withPhone.length === 1 ? '' : 's'} selected
              {recipients.length !== withPhone.length && <span style={{ color: '#b45309' }}> ({recipients.length - withPhone.length} without phone skipped)</span>}
            </div>

            <button type="button" onClick={send} disabled={sending} style={{ marginTop: '16px', width: '100%', background: 'var(--success)', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending...' : mode === 'now' ? 'Send SMS' : 'Schedule SMS'}
            </button>
          </div>

          {/* Right: recipients */}
          <div>
            {groups && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--label-color)', fontWeight: 600 }}>Select Group</label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={box}>
                  <option value="">-- All groups --</option>
                  {groups.map((g) => <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / phone" style={{ ...box, padding: '8px 10px' }} />
              {onAddNew && (
                <button type="button" onClick={onAddNew} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 14px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New</button>
              )}
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', maxHeight: '360px', overflowY: 'auto' }}>
              <div onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600, fontSize: '13px', position: 'sticky', top: 0 }}>
                {allVisibleSelected ? <CheckSquare size={16} color="#0ea5e9" /> : <Square size={16} />} Select all ({pool.length})
              </div>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
              ) : pool.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No contacts found</div>
              ) : (
                pool.map((c) => (
                  <div key={c.id} onClick={() => toggle(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderTop: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px', background: selected.has(c.id) ? '#f0f9ff' : 'white' }}>
                    {selected.has(c.id) ? <CheckSquare size={16} color="#0ea5e9" /> : <Square size={16} color="#94a3b8" />}
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: c.phone ? '#475569' : '#dc2626' }}>{c.phone || 'no phone'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsComposer;
