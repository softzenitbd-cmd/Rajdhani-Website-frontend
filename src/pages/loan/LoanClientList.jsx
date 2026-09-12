import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Printer, Plus, ArrowLeft, Layers, ChevronDown, Eye, Edit, Trash2, DollarSign, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import QuickEditModal from '../../components/QuickEditModal';
import { useToast } from '../../context/ToastContext';
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

  const handleDelete = async (client) => {
    if (!window.confirm(`Delete loan client "${client.name}"?`)) return;
    try {
      await loanService.deleteLoanAccount(client.id || client.uuid);
      toast.success('Loan client deleted');
      fetchLoanClients();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
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
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>Customer List</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
          <button className="btn-gray-outline" onClick={() => navigate('/crm/client-group')}>
            <Layers size={16} /> Client Group
          </button>
          <Link to="/loan/client-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green">
              <Plus size={16} /> Add New
            </button>
          </Link>
        </div>
      </div>

      <div className="premium-body">
        <PrintHeader />
        
        {/* Filters */}
        <div className="filter-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="input-badge-top" style={{ marginTop: '22px' }}>
            <span className="badge-top-label">Search All</span>
            <input type="text" className="input-outline" placeholder="Search All" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #0ea5e9', borderRadius: '4px' }} />
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
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="table-controls-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#000' }}>
            Show 
            <select className="input-outline" value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              {[10, 25, 50, 100, 500].map((n) => <option key={n} value={n}>{n}</option>)}
            </select> 
            entries
          </div>
          <div className="table-controls-right" style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => exportVisibleTable('xlsx')} className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}>Excel</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.print')}</button>
            <button onClick={() => window.location.reload()} className="btn-blue" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' }}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.reset')}</button>
          </div>
        </div>

        {/* Main Data Table */}
        <div style={{ overflowX: 'auto', paddingBottom: '100px' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
            <thead>
              <tr>
                <th style={{ background: 'var(--secondary)', color: 'white', padding: '12px', textAlign: 'center', width: '60px', borderRight: '1px solid #d1d5db' }}>ID NO</th>
                <th style={{ background: 'var(--secondary)', color: 'white', padding: '12px', textAlign: 'left', borderRight: '1px solid #d1d5db' }}>CLIENT DETAILS</th>
                <th style={{ background: 'var(--secondary)', color: 'white', padding: '12px', textAlign: 'left', width: '280px', borderRight: '1px solid #d1d5db' }}>DETAILS</th>
                <th style={{ background: 'var(--secondary)', color: 'white', padding: '12px', textAlign: 'center', width: '100px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((client, index) => (
                <tr key={client.id || index} style={{ borderBottom: '1px solid #d1d5db' }}>
                  
                  {/* ID Column */}
                  <td style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid #d1d5db', verticalAlign: 'top' }}>
                    {client.id ? client.id.toString().slice(-5) : index + 1}
                  </td>
                  
                  {/* Client Details Column */}
                  <td style={{ padding: '16px', borderRight: '1px solid #d1d5db', verticalAlign: 'top' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 10px 1fr', gap: '4px', fontSize: '13px', color: '#000', fontWeight: '600' }}>
                      <div>Name</div><div>:</div><div>{client.name}</div>
                      <div>Phone</div><div>:</div><div>{client.phone}</div>
                      {client.address && <><div>Address</div><div>:</div><div>{client.address}</div></>}
                      <div>Status</div><div>:</div><div>{client.status === 1 ? 'Activated' : 'Deactivated'}</div>
                    </div>
                  </td>

                  {/* Details Column (Nested Table) */}
                  <td style={{ padding: '16px', borderRight: '1px solid #d1d5db', verticalAlign: 'top' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#000', fontWeight: '500' }}>
                      <tbody>
                        <tr>
                          <td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Previous Due</td>
                          <td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.previous_due || '0.00'} ৳</td>
                        </tr>
                        <tr>
                          <td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', fontWeight: 'bold' }}>Max Limit</td>
                          <td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold' }}>{client.max_due_limit || '0.00'} ৳</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>

                  {/* Action Column */}
                  <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top', position: 'relative' }}>
                    <button 
                      onClick={() => toggleAction(client.id)}
                      className="btn-green" 
                      style={{ padding: '6px 12px', fontSize: '13px', margin: '0 auto', display: 'flex', alignItems: 'center' }}
                    >
                      Action <ChevronDown size={14} style={{ marginLeft: '4px' }} />
                    </button>
                    {activeAction === client.id && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '50px', 
                        right: '50%',
                        transform: 'translateX(50%)',
                        background: 'white', 
                        border: '1px solid var(--secondary)', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
                        width: '160px',
                        zIndex: 100,
                        textAlign: 'left'
                      }}>
                        <div className="action-item" onClick={() => { setViewing(client); setActiveAction(null); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><Eye size={14} /> View</div>
                        <div className="action-item" onClick={() => { setEditing(client); setActiveAction(null); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><Edit size={14} /> Edit</div>
                        <div className="action-item" onClick={() => { handleDelete(client); setActiveAction(null); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><Trash2 size={14} /> Delete</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/loan/payment-create', { state: { clientId: client.id || client.uuid } })}><DollarSign size={14} /> Payment</div>
                        <div className="action-item" onClick={() => { navigate('/loan/statement', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><FileText size={14} /> Statement</div>
                      </div>
                    )}
                  </td>
                  
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>Loading loan clients...</td>
                </tr>
              )}
              {!loading && loanClients.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No loan clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
      {editing && (
        <QuickEditModal
          title="Edit Loan Client"
          record={editing}
          fields={[{ name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone' }, { name: 'address', label: 'Address' }, { name: 'previous_due', label: 'Previous Due', type: 'number' }, { name: 'max_due_limit', label: 'Max Due Limit', type: 'number' }, { name: 'status', label: 'Status', type: 'select', options: [{ value: 1, label: 'Activated' }, { value: 0, label: 'Deactivated' }] }]}
          onSave={(data) => loanService.updateLoanAccount(editing.id || editing.uuid, data)}
          onClose={(saved) => { setEditing(null); if (saved) fetchLoanClients(); }}
        />
      )}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '8px', width: '420px', maxWidth: '95vw', padding: '24px' }}>
            <h3 style={{ marginTop: 0 }}>{viewing.name}</h3>
            <table style={{ width: '100%', fontSize: '13px' }}><tbody>
              {[['Phone', viewing.phone], ['Address', viewing.address], ['Previous Due', viewing.previous_due], ['Max Due Limit', viewing.max_due_limit], ['Current Due', viewing.due ?? viewing.current_due ?? viewing.balance], ['Status', viewing.status === 1 ? 'Activated' : 'Deactivated']].map(([k, v]) => (
                <tr key={k}><td style={{ padding: '6px 0', fontWeight: 600, width: '40%' }}>{k}</td><td style={{ padding: '6px 0' }}>{v ?? '-'}</td></tr>
              ))}
            </tbody></table>
            <div style={{ textAlign: 'right', marginTop: '16px' }}><button onClick={() => setViewing(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanClientList;
