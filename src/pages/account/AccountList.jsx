import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Printer, RotateCcw, Edit, Plus, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { exportVisibleTable } from '../../utils/tableExport';
import { printPage } from '../../utils/printUtils';
import QuickEditModal from '../../components/QuickEditModal';

const cell = { padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' };

// Mirrors the original CRM "একাউন্ট লিস্ট" card:
// green header (back / add / youtube) → show entries + export toolbar → table with edit action
const AccountList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(100);
  const [editing, setEditing] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getAccounts();
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const headerBtn = (bg) => ({ background: bg, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)', cursor: 'pointer', fontWeight: 'bold' });
  const toolBtn = { background: '#3b82f6', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)' };

  const visible = accounts.slice(0, limit);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: '#f1f5f9', minHeight: '100vh', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderBottom: '6px solid #2e7d32' }}>
        {/* Header */}
        <div className="no-print" style={{ background: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold' }}>{t("Account List")}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate(-1)} style={headerBtn('#64748b')}><ArrowLeft size={14} /> {t("Go Back")}</button>
            <button onClick={() => navigate('/account/account-create')} style={headerBtn('#16a34a')}><Plus size={14} /> {t("Add New")}</button>
            <button style={headerBtn('#dc2626')}><Play size={14} /> {t("YouTube")}</button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Table Controls */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: 'var(--fs-14, 14px)' }}>
              {t("Show")}
              <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 100)} style={{ width: '60px', margin: '0 8px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} />
              {t("entries")}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => exportVisibleTable('xlsx', 'Account_List')} style={toolBtn}>{t("Excel")}</button>
              <button onClick={() => exportVisibleTable('csv', 'Account_List')} style={toolBtn}>{t("CSV")}</button>
              <button onClick={() => printPage()} style={toolBtn}>{t("PDF")}</button>
              <button onClick={() => window.print()} style={toolBtn}><Printer size={14} /> {t("Print")}</button>
              <button onClick={fetchAccounts} style={toolBtn}><RotateCcw size={14} /> {t("Reset")}</button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white' }}>
                  <th style={cell}>{t("ID")}</th>
                  <th style={cell}>{t("TITLE")}</th>
                  <th style={cell}>{t("ACCOUNT")}</th>
                  <th style={cell}>{t("DESCRIPTION")}</th>
                  <th style={cell}>{t("CONTACT NUMBER")}</th>
                  <th style={cell}>{t("PHONE NUMBER")}</th>
                  <th style={cell} className="no-print">{t("ACTION")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ ...cell, padding: '20px' }}>{t("Loading accounts...")}</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="7" style={{ ...cell, padding: '20px' }}>{t("No accounts found.")}</td></tr>
                ) : (
                  visible.map((acc, idx) => (
                    <tr key={acc.id || idx}>
                      <td style={cell}>{idx + 1}</td>
                      <td style={{ ...cell, fontWeight: '600' }}>{acc.name}</td>
                      <td style={cell}>{acc.account_number || acc.accountNumber || ''}</td>
                      <td style={cell}>{acc.description || ''}</td>
                      <td style={cell}>{acc.contact_person || ''}</td>
                      <td style={cell}>{acc.phone || ''}</td>
                      <td style={cell} className="no-print">
                        <button onClick={() => setEditing(acc)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }} title={t("Edit")}>
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '10px', fontSize: 'var(--fs-13, 13px)', color: '#475569' }}>
            {t("Showing {{from}} to {{to}} of {{total}} entries", { from: visible.length ? 1 : 0, to: visible.length, total: accounts.length })}
          </div>
        </div>
      </div>

      {editing && (
        <QuickEditModal
          title={t("Edit Account")}
          record={editing}
          fields={[
            { name: 'name', label: t("Account Title") },
            { name: 'account_number', label: t("Account Number") },
            { name: 'contact_person', label: t("Contact Person") },
            { name: 'phone', label: t("Phone Number") },
            { name: 'description', label: t("Description") },
          ]}
          onSave={(changed) => accountingService.updateAccount(editing.id, changed)}
          onClose={(saved) => { setEditing(null); if (saved) fetchAccounts(); }}
        />
      )}
    </div>
  );
};

export default AccountList;
