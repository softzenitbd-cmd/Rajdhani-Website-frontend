import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Printer, Plus, ArrowLeft, Layers, ChevronDown, Eye, Edit, Trash2, DollarSign, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import QuickEditModal from '../../components/QuickEditModal';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { exportVisibleTable } from '../../utils/tableExport';

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

  const handleDelete = async (client) => {
    const isOk = await confirm({
      title: t("Delete Loan Client"),
      message: t("Are you sure you want to delete \"{{v0}}\"?", { v0: client.name }),
      confirmText: t("Delete"),
      variant: 'danger',
    });
    if (!isOk) return;
    try {
      await loanService.deleteLoanAccount(client.id || client.uuid);
      toast.success(t("Loan client deleted"));
      fetchLoanClients();
    } catch (e) {
      toast.error(e.message || t("Delete failed"));
    }
  };
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState(25);

  const visibleClients = (loanClients || [])
    .filter((c) => !search || `${c.name || ''} ${c.phone || ''} ${c.address || ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !fromDate || String(c.created_at || '').split('T')[0] >= fromDate)
    .filter((c) => !toDate || String(c.created_at || '').split('T')[0] <= toDate)
    .slice(0, entries);

  const fetchLoanClients = async () => {
    try {
      setLoading(true);
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setLoanClients(data);
    } catch (error) {
      console.error("Error fetching loan clients:", error);
      setLoanClients([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLoanClients();
  }, []);

  const toggleAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  return (
    <div className="premium-card">
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>{t("Customer List")}</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t("Go Back")}
          </button>
          <button className="btn-gray-outline" onClick={() => navigate('/crm/client-group')}>
            <Layers size={16} /> {t("Client Group")}
          </button>
          <Link to="/loan/client-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green">
              <Plus size={16} /> {t("Add New")}
            </button>
          </Link>
        </div>
      </div>

      <div className="premium-body">
        <PrintHeader />
        
        {/* Filters */}
        <div className="filter-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="input-badge-top" style={{ marginTop: '22px' }}>
            <span className="badge-top-label">{t("Search All")}</span>
            <input type="text" className="input-outline" placeholder={t("Search All")} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #0ea5e9', borderRadius: '4px' }} />
          </div>
          <div>
            <label className="filter-label" style={{ display: 'block', marginBottom: '8px' }}>{t('common.search_by_date')}</label>
            <div style={{ display: 'flex' }}>
              <input type="date" className="input-outline" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ borderRight: 'none', borderRadius: '4px 0 0 4px', width: '50%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db' }} />
              <input type="date" className="input-outline" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ borderRadius: '0 4px 4px 0', width: '50%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-gray-outline" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); }} style={{ height: '40px', width: '100%', justifyContent: 'center', background: 'var(--text-muted)', fontSize: '16px', color: 'white' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="table-controls-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="table-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#000' }}>
            {t("Show")} 
            <select className="input-outline" value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              {[10, 25, 50, 100, 500].map((n) => <option key={n} value={n}>{n}</option>)}
            </select> 
            {t("entries")}
          </div>
          <div className="table-controls-right" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={() => exportVisibleTable('xlsx')} className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>{t("Excel")}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.print')}</button>
            <button onClick={() => window.location.reload()} className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.reset')}</button>
          </div>
        </div>

        {/* Main Table */}
        <div style={{ width: '100%', overflowX: 'hidden', border: '1px solid #d1d5db', borderRadius: '4px', background: 'white' }}>
          <table className="custom-table crm-compact-table">
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th className="col-id">{t("ID NO")}</th>
                <th className="col-details">{t("CLIENT DETAILS")}</th>
                <th className="col-subtable">{t("DETAILS")}</th>
                <th className="col-action">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>{t("Loading loan clients...")}</td></tr>
              ) : visibleClients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>{t("No loan clients found.")}</td></tr>
              ) : (
                visibleClients.map((client, index) => (
                  <tr key={client.id || index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td className="col-id" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {client.id ? client.id.toString().slice(-5) : index + 1}
                    </td>
                    <td className="col-details">
                      <div className="crm-details-grid">
                        <div style={{ fontWeight: '600' }}>{t("Name")}</div><div>:</div><div style={{ fontWeight: 'bold' }}>{client.name}</div>
                        <div style={{ fontWeight: '600' }}>{t("Phone")}</div><div>:</div><div>{client.phone || '-'}</div>
                        {client.address && (
                          <>
                            <div style={{ fontWeight: '600' }}>{t("Address")}</div><div>:</div><div>{client.address}</div>
                          </>
                        )}
                        <div style={{ fontWeight: '600' }}>{t("Status")}</div><div>:</div><div>{client.status === 1 ? t("Activated") : t("Deactivated")}</div>
                      </div>
                    </td>
                    <td className="col-subtable" style={{ padding: 0 }}>
                      <table className="crm-subtable">
                        <tbody>
                          <tr>
                            <td>{t("Previous Due")}</td>
                            <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{client.previous_due || '0.00'} ৳</td>
                          </tr>
                          <tr>
                            <td>{t("Max Limit")}</td>
                            <td style={{ color: '#059669', fontWeight: 'bold' }}>{client.max_due_limit || '0.00'} ৳</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="col-action" style={{ position: 'relative' }}>
                      <button 
                        onClick={() => toggleAction(client.id)}
                        className="btn" 
                        style={{ background: 'var(--success)', color: 'white', padding: '4px 6px', fontSize: '9px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '2px', width: '100%', fontWeight: 'bold' }}
                      >
                        {t("Action")} <ChevronDown size={11} />
                      </button>
                      {activeAction === client.id && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '36px', 
                          right: '0',
                          background: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '6px', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
                          width: '150px',
                          zIndex: 100,
                          textAlign: 'left'
                        }}>
                          <div className="action-item" onClick={() => { setViewing(client); setActiveAction(null); }} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}><Eye size={12} /> {t("View")}</div>
                          <div className="action-item" onClick={() => { setEditing(client); setActiveAction(null); }} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}><Edit size={12} /> {t("Edit")}</div>
                          <div className="action-item" onClick={() => { handleDelete(client); setActiveAction(null); }} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#ef4444', borderBottom: '1px solid #f1f5f9' }}><Trash2 size={12} /> {t("Delete")}</div>
                          <div className="action-item" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }} onClick={() => navigate('/loan/payment-create', { state: { clientId: client.id || client.uuid } })}><DollarSign size={12} /> {t("Payment")}</div>
                          <div className="action-item" onClick={() => { navigate('/loan/statement', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px' }}><FileText size={12} /> {t("Statement")}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
      {editing && (
        <QuickEditModal
          title={t("Edit Loan Client")}
          record={editing}
          fields={[{ name: 'name', label: t("Name") }, { name: 'phone', label: t("Phone") }, { name: 'address', label: t("Address") }, { name: 'previous_due', label: t("Previous Due"), type: 'number' }, { name: 'max_due_limit', label: t("Max Due Limit"), type: 'number' }, { name: 'status', label: t("Status"), type: 'select', options: [{ value: 1, label: t("Activated") }, { value: 0, label: t("Deactivated") }] }]}
          onSave={(data) => loanService.updateLoanAccount(editing.id || editing.uuid, data)}
          onClose={(saved) => { setEditing(null); if (saved) fetchLoanClients(); }}
        />
      )}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '8px', width: '420px', maxWidth: '95vw', padding: '24px' }}>
            <h3 style={{ marginTop: 0 }}>{viewing.name}</h3>
            <table style={{ width: '100%', fontSize: '13px' }}><tbody>
              {[[t('Phone'), viewing.phone], [t('Address'), viewing.address], [t('Previous Due'), viewing.previous_due], [t('Max Due Limit'), viewing.max_due_limit], [t('Current Due'), viewing.due ?? viewing.current_due ?? viewing.balance], [t('Status'), viewing.status === 1 ? t('Activated') : t('Deactivated')]].map(([k, v]) => (
                <tr key={k}><td style={{ padding: '6px 0', fontWeight: 600, width: '40%' }}>{k}</td><td style={{ padding: '6px 0' }}>{v ?? '-'}</td></tr>
              ))}
            </tbody></table>
            <div style={{ textAlign: 'right', marginTop: '16px' }}><button onClick={() => setViewing(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t("Close")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanClientList;
