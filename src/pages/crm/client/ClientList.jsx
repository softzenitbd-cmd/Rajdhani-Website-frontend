import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Search, Calendar, FileSpreadsheet, Printer, RotateCcw, ChevronDown } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import { useApi } from '../../../hooks/useApi';
import { useConfirm } from '../../../context/ConfirmContext';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportToExcel } from '../../../utils/excelExporter';

const ClientList = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  
  const [activeAction, setActiveAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [viewClient, setViewClient] = useState(null);
  
  const { get, del, patch, loading } = useApi();

  const toggleAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client?',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (isConfirmed) {
      try {
        await del(`${ENDPOINTS.CRM_CLIENTS}${id}/`, 'Client deleted successfully');
        fetchClients();
        setActiveAction(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const isCurrentlyActive = currentStatus === true || currentStatus === 'Active' || currentStatus === 'Activated';
    const newStatusBool = !isCurrentlyActive;
    const actionLabel = newStatusBool ? 'activate' : 'deactivate';

    const isConfirmed = await confirm({
      title: `${newStatusBool ? 'Activate' : 'Deactivate'} Client`,
      message: `Are you sure you want to ${actionLabel} this client?`,
      confirmText: newStatusBool ? 'Activate' : 'Deactivate',
      variant: newStatusBool ? 'warning' : 'danger'
    });

    if (isConfirmed) {
      try {
        await patch(`${ENDPOINTS.CRM_CLIENTS}${id}/`, { status: newStatusBool }, `Client ${newStatusBool ? 'activated' : 'deactivated'} successfully`);
        fetchClients();
        setActiveAction(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      let url = ENDPOINTS.CRM_CLIENTS;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGroup) params.append('group', selectedGroup);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await get(url);
      setClients(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300); // 300ms debounce for search
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedGroup]);

  // Use the fetched clients directly
  const filteredClients = clients;

  const handleExportExcel = () => {
    const dataToExport = filteredClients.map((c, i) => ({
      'SL': i + 1,
      'Client Code': c.client_code || c.code || '-',
      'Company Name': c.company_name || c.name || '-',
      'Owner Name': c.owner_name || c.name || '-',
      'Group': c.group || c.group_name || '-',
      'Phone': c.phone || c.mobile || '-',
      'Email': c.email || '-',
      'Opening Balance': c.opening_balance || 0,
      'Current Balance': c.current_balance || c.balance || 0,
      'Status': c.status ? 'Active' : 'Inactive'
    }));
    exportToExcel(dataToExport, 'Customer_List');
  };

  return (
    <div className="dashboard-content">
      <div className="chart-card">
        {/* Header */}
        <div className="card-header">
          <h2 className="card-title">CUSTOMER LIST</h2>
          <div className="card-actions">
            <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '6px 12px', background: '#718096', color: 'white' }}>
              <ArrowLeft size={14} /> Go Back
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/crm/client-group')} style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }}>
              <Users size={14} /> Client Group
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/crm/client-create')} style={{ padding: '6px 12px', background: 'var(--success)' }}>
              <Plus size={14} /> Add Client
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div className="form-group">
            <div className="form-input floating-label">
              <Search size={16} className="input-icon" />
              <input 
                type="text" 
                placeholder=" " 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label>Search All</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="form-input floating-label">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">All Groups</option>
                {groups.map(g => (
                  <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
                ))}
              </select>
              <label>Search By Client Group</label>
            </div>
          </div>

          <div className="form-group">
            <button 
              className="btn btn-outline" 
              style={{ height: '48px', width: '100%', background: '#718096', color: 'white', justifyContent: 'center' }}
              onClick={() => { setSearchTerm(''); setSelectedGroup(''); }}
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Show 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}>
              <option>25</option>
            </select>
            entries
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}>
              <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> Excel
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <Printer size={14} style={{ marginRight: '6px' }} /> Print
            </button>
            <button onClick={() => window.location.reload()} className="btn" style={{ background: '#4318ff', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th width="50">ID NO</th>
                <th width="300">CLIENT DETAILS</th>
                <th>DETAILS</th>
                <th width="100">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No clients found.</td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id || client.uuid}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>{client.id || client.uuid}</td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: '13px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 10px 1fr', gap: '4px', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600' }}>Name</div><div>:</div><div>{client.name || (client.details && client.details.name)}</div>
                        <div style={{ fontWeight: '600' }}>Phone</div><div>:</div><div>{client.phone || (client.details && client.details.phone)}</div>
                        {(client.group || (client.details && client.details.group)) && <><div style={{ fontWeight: '600' }}>Client Group</div><div>:</div><div>{client.group || (client.details && client.details.group)}</div></>}
                        <div style={{ fontWeight: '600' }}>Address</div><div>:</div><div>{client.address || (client.details && client.details.address)}</div>
                        <div style={{ fontWeight: '600' }}>Status</div><div>:</div><div>{(client.status === true || client.status === 'Active' || client.status === 'Activated') ? 'Active' : 'Deactivated'}</div>
                        <div style={{ fontWeight: '600' }}>Created At</div><div>:</div><div>{client.created_at || (client.details && client.details.createdAt)}</div>
                      </div>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Previous Due</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.previous_due || (client.stats && client.stats.prevDue) || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Bill</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.bill || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Total Bill</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.total_bill || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Receive</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.receive || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Sales Return</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.sales_return || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>Money Return</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{client.money_return || '0.00'}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}><span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Due</span></td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold' }}>{client.due || client.previous_due || '0.00'}</td></tr>
                          <tr><td style={{ padding: '6px 12px' }}>Collection Date</td><td style={{ padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}><Calendar size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}/> {client.collection_date || '-'}</td></tr>
                        </tbody>
                      </table>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', position: 'relative' }}>
                      <button 
                        onClick={() => toggleAction(client.id || client.uuid)}
                      className="btn" 
                      style={{ background: '#05cd99', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', width: '100%', justifyContent: 'space-between' }}
                    >
                      Action <ChevronDown size={14} />
                    </button>
                    
                    {activeAction === (client.id || client.uuid) && (
                      <div style={{ position: 'absolute', top: '50px', right: '16px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '8px', zIndex: 10, width: '160px', padding: '8px 0', border: '1px solid #e2e8f0' }}>
                        <div onClick={() => handleDeactivate(client.id || client.uuid, client.status)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item">
                          {(client.status === false || client.status === 'Deactivated') ? '✅ Activate' : '🚫 Deactivate'}
                        </div>
                        <div onClick={() => { setViewClient(client); setActiveAction(null); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>👁</span> View</div>
                        <div onClick={() => { navigate('/account/receive-create', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>⬇️</span> Receive</div>
                        <div onClick={() => navigate(`/crm/client-edit/${client.id || client.uuid}`)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>✏️</span> Edit</div>
                        <div onClick={() => handleDelete(client.id || client.uuid)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>🗑</span> Delete</div>
                        <div onClick={() => navigate('/crm/client-statement')} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>📄</span> View Statement</div>
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

      {/* View Modal */}
      {viewClient && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '550px', maxWidth: '90vw', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <PrintHeader />
            
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #0ea5e9', paddingBottom: '8px' }}>Customer Profile / Ledger Info</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600' }}>Customer ID:</div><div>{viewClient.id || viewClient.uuid}</div>
              <div style={{ fontWeight: '600' }}>Name:</div><div style={{ fontWeight: 'bold' }}>{viewClient.name}</div>
              <div style={{ fontWeight: '600' }}>Phone:</div><div>{viewClient.phone}</div>
              <div style={{ fontWeight: '600' }}>Group:</div><div>{viewClient.group || '-'}</div>
              <div style={{ fontWeight: '600' }}>Address:</div><div>{viewClient.address || '-'}</div>
              <div style={{ fontWeight: '600' }}>Total Due:</div><div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>৳ {viewClient.due || viewClient.previous_due || '0.00'}</div>
            </div>

            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: '12px' }}>
                Customer Signature
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: '12px' }}>
                Authorized Signature
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '8px 20px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>🖨️ Print Memo</button>
              <button onClick={() => setViewClient(null)} className="btn" style={{ background: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '6px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
