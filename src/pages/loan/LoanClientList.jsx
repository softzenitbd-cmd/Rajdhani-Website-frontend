import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, ArrowLeft, Layers, ChevronDown, Eye, Edit, Trash2, DollarSign, FileText, ToggleLeft, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import QuickEditModal from '../../components/QuickEditModal';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportVisibleTable } from '../../utils/tableExport';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';
import SearchableSelect from '../../components/SearchableSelect';
import CustomDatePicker from '../../components/CustomDatePicker';

const normalizeDate = (d) => {
  if (!d) return '';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
    const [day, month, year] = s.split('-');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [day, month, year] = s.split('/');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return s;
};

const formatDisplayDate = (d) => {
  if (!d) return '-';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, day] = s.slice(0, 10).split('-');
    return `${day}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.replace(/\//g, '-');
  const dateObj = new Date(s);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${day}-${m}-${y}`;
  }
  return s;
};

const LoanClientList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loanClients, setLoanClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();
  const { get } = useApi();

  const [search, setSearch] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState(25);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
        setGroups(res.results || res.data || res || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, [get]);

  const fetchLoanClients = async () => {
    try {
      setLoading(true);
      const [accountsRes, receivesRes, paymentsRes] = await Promise.allSettled([
        loanService.getLoanAccounts(),
        loanService.getLoanReceives(),
        loanService.getLoanPayments()
      ]);
      const data = accountsRes.status === 'fulfilled' ? (Array.isArray(accountsRes.value) ? accountsRes.value : (accountsRes.value?.results || accountsRes.value?.data || [])) : [];
      const receives = receivesRes.status === 'fulfilled' ? (Array.isArray(receivesRes.value) ? receivesRes.value : (receivesRes.value?.results || receivesRes.value?.data || [])) : [];
      const payments = paymentsRes.status === 'fulfilled' ? (Array.isArray(paymentsRes.value) ? paymentsRes.value : (paymentsRes.value?.results || paymentsRes.value?.data || [])) : [];

      const enriched = data.map(client => {
        const cId = String(client.id || client.uuid);
        const clientReceives = receives.filter(r => String(r.loan_account?.id || r.loan_account?.uuid || r.loan_account || r.account_id || r.loan_account_id) === cId);
        const clientPayments = payments.filter(p => String(p.loan_account?.id || p.loan_account?.uuid || p.loan_account || p.account_id || p.loan_account_id) === cId);

        const totalReceive = clientReceives.reduce((sum, r) => sum + (Number(String(r.amount || r.credit || 0).replace(/,/g, '')) || 0), 0);
        const totalPayment = clientPayments.reduce((sum, p) => sum + (Number(String(p.amount || p.debit || 0).replace(/,/g, '')) || 0), 0);
        const prevDue = Number(String(client.previous_due || 0).replace(/,/g, '')) || 0;
        const balance = prevDue + totalReceive - totalPayment;

        return {
          ...client,
          total_receive: totalReceive,
          total_payment: totalPayment,
          balance: balance
        };
      });

      setLoanClients(enriched);
    } catch (error) {
      console.error("Error fetching loan clients:", error);
      setLoanClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanClients();
  }, []);

  const handleDelete = async (client) => {
    const isConfirmed = await confirm(t("Delete loan client \"{{v0}}\"?", { v0: client.name }), t("Are you sure you want to delete this client?"));
    if (!isConfirmed) return;
    try {
      await loanService.deleteLoanAccount(client.id || client.uuid);
      toast.success(t("Loan client deleted"));
      fetchLoanClients();
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
    }
  };

  const toggleAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  const visibleClients = (loanClients || [])
    .filter((c) => !search || `${c.name || ''} ${c.phone || ''} ${c.address || ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !searchGroup || String(c.group || c.group_id) === String(searchGroup))
    .filter((c) => {
      const cDate = normalizeDate(c.created_at || c.date);
      const normFrom = normalizeDate(fromDate);
      const normTo = normalizeDate(toDate);
      if (normFrom && cDate && cDate < normFrom) return false;
      if (normTo && cDate && cDate > normTo) return false;
      return true;
    })
    .slice(0, entries);

  return (
    <div className="premium-card">
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase', fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold' }}>{t("CUSTOMER LIST")}</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate(-1)} style={{ background: '#718096', color: 'white', border: 'none' }}>
            <ArrowLeft size={16} /> {t("Go Back")}
          </button>
          <button className="btn-gray-outline" onClick={() => navigate('/crm/client-group')} style={{ background: '#718096', color: 'white', border: 'none' }}>
            <Layers size={16} /> {t("Client Group")}
          </button>
          <Link to="/loan/client-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green">
              <Plus size={16} /> {t("Add New")}
            </button>
          </Link>
          <button className="btn-red" style={{ background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: 'none', borderRadius: '4px' }}>
             ▶ YouTube
          </button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '24px' }}>
        <PrintHeader />
        
        {/* Filters */}
        <div className="filter-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 0.8fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600' }}>{t("Search All")}</label>
            <input type="text" className="input-outline" placeholder={t("Search All")} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
          </div>
          <div>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600' }}>{t("Search By Client Group")}</label>
            <div style={{ height: '38px', marginTop: '1px' }}>
              <SearchableSelect
                options={groups.map(g => ({ value: g.id || g.uuid, label: g.name, searchValue: g.name }))}
                value={searchGroup}
                onChange={(val) => setSearchGroup(val)}
                placeholder={t("Select client group")}
              />
            </div>
          </div>
          <div>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', textAlign: 'center' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', background: 'white', height: '38px', alignItems: 'center' }}>
              <CustomDatePicker style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <CustomDatePicker style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-gray-outline" onClick={() => { setSearch(''); setSearchGroup(''); setFromDate(''); setToDate(''); }} style={{ height: '38px', width: '100%', justifyContent: 'center', background: '#718096', fontSize: 'var(--fs-14, 14px)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="table-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-13, 13px)', color: '#000', fontWeight: '500' }}>
            {t("Show")} 
            <select className="input-outline" value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              {[10, 25, 50, 100, 500].map((n) => <option key={n} value={n}>{n}</option>)}
            </select> 
            {t("entries")}
          </div>
          <div className="table-controls-right" style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => exportVisibleTable('xlsx')} className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>{t("Excel")}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }} onClick={() => window.print()}>{t("Print")}</button>
            <button onClick={() => window.location.reload()} className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>{t("Reset")}</button>
          </div>
        </div>

        {/* Main Data Table */}
        <div style={{ overflowX: 'auto', paddingBottom: '100px' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #9ca3af' }}>
            <thead>
              <tr style={{ background: '#8e949d' }}>
                <th style={{ color: 'white', padding: '12px 16px', textAlign: 'left', width: '80px', borderRight: '1px solid #d1d5db', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t("ID NO")}</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.7 }} />
                  </div>
                </th>
                <th style={{ color: 'white', padding: '12px 16px', textAlign: 'left', borderRight: '1px solid #d1d5db', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t("CLIENT DETAILS")}</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.7 }} />
                  </div>
                </th>
                <th style={{ color: 'white', padding: '12px 16px', textAlign: 'left', width: '320px', borderRight: '1px solid #d1d5db', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t("DETAILS")}</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.7 }} />
                  </div>
                </th>
                <th style={{ color: 'white', padding: '12px 16px', textAlign: 'center', width: '120px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{t("ACTION")}</span>
                    <ArrowUpDown size={12} style={{ opacity: 0.7 }} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((client, index) => (
                <tr key={client.id || index} style={{ borderBottom: '1px solid #d1d5db' }}>
                  
                  {/* ID Column */}
                  <td style={{ padding: '12px 16px', borderRight: '1px solid #d1d5db', verticalAlign: 'top' }}>
                    <div style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{index + 1}</div>
                  </td>
                  
                  {/* Client Details Column */}
                  <td style={{ padding: '16px', borderRight: '1px solid #d1d5db', verticalAlign: 'top', textAlign: 'left' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 10px 1fr', gap: '6px', fontSize: 'var(--fs-12, 12px)', color: '#000', fontWeight: '700', textAlign: 'left' }}>
                      <div style={{ textAlign: 'left' }}>{t("Name")}</div><div>:</div><div style={{ textAlign: 'left' }}>{client.name}</div>
                      <div style={{ textAlign: 'left' }}>{t("Phone")}</div><div>:</div><div style={{ textAlign: 'left' }}>{client.phone}</div>
                      <div style={{ textAlign: 'left' }}>{t("Client Group")}</div><div>:</div><div style={{ textAlign: 'left' }}>{client.group || '-'}</div>
                      <div style={{ textAlign: 'left' }}>{t("Address")}</div><div>:</div><div style={{ textAlign: 'left' }}>{client.address || '-'}</div>
                      <div style={{ textAlign: 'left' }}>{t("Status")}</div><div>:</div><div style={{ textAlign: 'left' }}>{client.status === 1 || client.status === undefined ? t("Activated") : t("Deactivated")}</div>
                      <div style={{ textAlign: 'left' }}>{t("Created At")}</div><div>:</div><div style={{ textAlign: 'left' }}>{formatDisplayDate(client.created_at)}</div>
                    </div>
                  </td>

                  {/* Details Column (Nested Table) */}
                  <td style={{ padding: '16px', borderRight: '1px solid #d1d5db', verticalAlign: 'top' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)', color: '#000', border: '1px solid #cbd5e1' }}>
                      <tbody>
                        <tr>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>{t("Previous Due")}</td>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: '700' }}>{Number(client.previous_due || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳</td>
                        </tr>
                        <tr>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>{t("Loan Receive")}</td>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: '700', color: Number(client.total_receive || 0) > 0 ? '#15803d' : 'inherit' }}>{Number(client.total_receive || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳</td>
                        </tr>
                        <tr>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>{t("Loan Payment")}</td>
                          <td style={{ borderBottom: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: '700', color: Number(client.total_payment || 0) > 0 ? '#b91c1c' : 'inherit' }}>{Number(client.total_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #cbd5e1', fontWeight: '600' }}>{t("Balance")}</td>
                          <td style={{ padding: '4px 8px', fontWeight: '700', color: '#0f172a' }}>{Number(client.balance !== undefined ? client.balance : (client.previous_due || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* Action Column */}
                  <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top', position: 'relative' }}>
                    <button 
                      onClick={() => toggleAction(client.id)}
                      style={{ background: '#10b981', color: 'white', border: '2px solid #000', borderRadius: '6px', padding: '4px 10px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', margin: '0 auto', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      {t("Action")} <ChevronDown size={14} style={{ marginLeft: '4px' }} />
                    </button>
                    {activeAction === client.id && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '46px', 
                        right: '16px',
                        background: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '6px', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
                        width: '180px',
                        zIndex: 100,
                        textAlign: 'left',
                        overflow: 'hidden'
                      }}>
                        <style>{`.action-item:hover { background-color: #f8fafc; color: #2563eb !important; }`}</style>
                        <div className="action-item" onClick={() => { setActiveAction(null); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', color: '#334155' }}><ToggleLeft size={16} /> {t("Deactive")}</div>
                        <div className="action-item" onClick={() => { setViewing(client); setActiveAction(null); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', color: '#334155' }}><Eye size={16} /> {t("View")}</div>

                        <div className="action-item" onClick={() => { setEditing(client); setActiveAction(null); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', color: '#334155' }}><Edit size={16} /> {t("Edit")}</div>
                        <div className="action-item" onClick={() => { handleDelete(client); setActiveAction(null); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', color: '#334155' }}><Trash2 size={16} /> {t("Delete")}</div>
                        <div className="action-item" onClick={() => { navigate('/loan/statement', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', color: '#334155' }}><FileText size={16} /> {t("View Statement")}</div>
                      </div>
                    )}
                  </td>
                  
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>{t("Loading loan clients...")}</td>
                </tr>
              )}
              {!loading && loanClients.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>{t("No loan clients found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals omitted for brevity, keeping only functionality */}
      {editing && (
        <QuickEditModal
          title={t("Edit Loan Client")}
          record={editing}
          fields={[{ name: 'name', label: t("Name") }, { name: 'phone', label: t("Phone") }, { name: 'address', label: t("Address") }, { name: 'previous_due', label: t("Previous Due"), type: 'number' }, { name: 'max_due_limit', label: t("Max Due Limit"), type: 'number' }]}
          onSave={(data) => loanService.updateLoanAccount(editing.id || editing.uuid, data)}
          onClose={(saved) => { setEditing(null); if (saved) fetchLoanClients(); }}
        />
      )}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '4px', width: '500px', maxWidth: '95vw', padding: '24px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold' }}>{t("Client View")} | {viewing.name}</h3>
            <table style={{ width: '100%', fontSize: 'var(--fs-13, 13px)', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
              <tbody>
                {[
                  [t('ID No'), viewing.id || ''],
                  [t('Name'), viewing.name || ''],
                  [t('Email'), viewing.email || ''],
                  [t('Mobile'), viewing.phone || ''],
                  [t('Date Of Birth'), viewing.dob || viewing.date_of_birth || ''],
                  [t('Address'), viewing.address || ''],
                  [t('Group'), viewing.group || ''],
                  [t('ZIP Code'), viewing.zip || viewing.zip_code || '']
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ padding: '6px 12px', border: '1px solid #d1d5db', width: '120px' }}>{k}</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #d1d5db', width: '30px', textAlign: 'center' }}>:</td>
                    <td style={{ padding: '6px 12px', border: '1px solid #d1d5db' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => setViewing(null)} style={{ padding: '8px 20px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--fs-13, 13px)' }}>{t("Close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanClientList;
