import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Search, Calendar, FileSpreadsheet, Printer, RotateCcw, ChevronDown } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import { useApi } from '../../../hooks/useApi';
import { useConfirm } from '../../../context/ConfirmContext';
import { useToast } from '../../../context/ToastContext';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportToExcel } from '../../../utils/excelExporter';
import { useTranslation } from 'react-i18next';
import crmService from '../../../services/crmService';

const ClientImageUploader = ({ client, onUploadSuccess }) => {
  const { patch } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(client.image || client.details?.image || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      await patch(`${ENDPOINTS.CRM_CLIENTS}${client.id || client.uuid}/`, formData, t("Image saved"), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onUploadSuccess) onUploadSuccess();
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to save image"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc' }}>
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, transparent 48%, #cbd5e1 48%, #cbd5e1 52%, transparent 52%)' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(-45deg, transparent 48%, #cbd5e1 48%, #cbd5e1 52%, transparent 52%)', borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <label style={{ 
          background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', 
          padding: '4px 8px', fontSize: '10px', cursor: 'pointer', display: 'inline-block', fontWeight: 'bold' 
        }}>
          {t("Choose a file")}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </label>
        <button 
          onClick={handleSave} 
          disabled={!selectedFile || uploading}
          style={{ 
            background: (!selectedFile || uploading) ? '#94a3b8' : '#64748b', 
            color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', 
            fontSize: '10px', cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer', fontWeight: 'bold' 
          }}
        >
          {uploading ? t("Saving") : t("Save")}
        </button>
      </div>
    </div>
  );
};

const CollectionDateModal = ({ isOpen, onClose, client, onUpdate }) => {
  const { patch } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      const d = client.due_date ? String(client.due_date).split('T')[0] : '';
      setDate(d);
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await patch(`${ENDPOINTS.CRM_CLIENTS}${client.id || client.uuid}/`, { due_date: date || null }, t("Collection date updated"));
      onUpdate({ due_date: date || null });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to update date"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'modalFadeIn 0.3s ease' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div className="form-group" style={{ marginBottom: '20px', position: 'relative', marginTop: '10px' }}>
          <div className="form-input floating-label" style={{ position: 'relative' }}>
            <label style={{ 
              position: 'absolute', top: '-12px', left: '12px', background: '#258b88', color: 'white', 
              padding: '2px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', zIndex: 10
            }}>
              {t("Due Collection Date", "বাকি গ্রহণের তারিখ")}
            </label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '16px 12px', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>
        
        <button 
          onClick={handleUpdate}
          disabled={loading}
          style={{ width: '100%', background: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? t("Updating...") : t("Update")}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ background: '#64748b', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

const num = (obj, ...keys) => {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      const n = Number(obj[k]);
      if (!isNaN(n)) return n;
    }
    if (obj.stats && obj.stats[k] !== undefined && obj.stats[k] !== null && obj.stats[k] !== '') {
      const n = Number(obj.stats[k]);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
};

const ClientList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  
  const [activeAction, setActiveAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewClient, setViewClient] = useState(null);
  const [dateModalClient, setDateModalClient] = useState(null);
  
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
      title: t("Delete Client"),
      message: t("Are you sure you want to delete this client?"),
      confirmText: t("Delete"),
      variant: 'danger'
    });
    if (isConfirmed) {
      try {
        await del(`${ENDPOINTS.CRM_CLIENTS}${id}/`, t("Client deleted successfully"));
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
    const actionLabel = newStatusBool ? t('activate') : t('deactivate');

    const isConfirmed = await confirm({
      title: t("{{v0}} Client", { v0: newStatusBool ? t("Activate") : t("Deactivate") }),
      message: t("Are you sure you want to {{v0}} this client?", { v0: actionLabel }),
      confirmText: newStatusBool ? t("Activate") : t("Deactivate"),
      variant: newStatusBool ? 'warning' : 'danger'
    });

    if (isConfirmed) {
      try {
        await patch(`${ENDPOINTS.CRM_CLIENTS}${id}/`, { status: newStatusBool }, t("Client {{v0}} successfully", { v0: newStatusBool ? t("activated") : t("deactivated") }));
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
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await get(url);
      const fetchedClients = res.results || res.data || res || [];
      
      try {
        const statsRes = await crmService.getClientDueReport();
        const statsData = statsRes.results || statsRes.data || statsRes || [];
        
        const updatedClients = fetchedClients.map(client => {
          const clientStats = statsData.find(s => String(s.client_id || s.id || s.uuid) === String(client.id || client.uuid));
          return { ...client, stats: clientStats || client.stats || {} };
        });
        setClients(updatedClients);
      } catch (statsErr) {
        console.error("Failed to fetch client stats", statsErr);
        setClients(fetchedClients);
      }
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
  }, [searchTerm, selectedGroup, fromDate, toDate]);

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
          <h2 className="card-title">{t("CUSTOMER LIST")}</h2>
          <div className="card-actions">
            <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '6px 12px', background: '#718096', color: 'white' }}>
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/crm/client-group')} style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }}>
              <Users size={14} /> {t("Client Group")}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/crm/client-create')} style={{ padding: '6px 12px', background: 'var(--success)' }}>
              <Plus size={14} /> {t("Add Client")}
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
              <label>{t("Search All")}</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="form-input floating-label">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">{t("All Groups")}</option>
                {groups.map(g => (
                  <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
                ))}
              </select>
              <label>{t("Search By Client Group")}</label>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <button
              className="btn btn-outline"
              style={{ height: '48px', width: '100%', background: '#718096', color: 'white', justifyContent: 'center' }}
              onClick={() => { setSearchTerm(''); setSelectedGroup(''); setFromDate(''); setToDate(''); }}
            >
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}>
              <option>25</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}>
              <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> {t("Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: '13px', borderRadius: '4px' }}>
              <Printer size={14} style={{ marginRight: '6px' }} /> {t("Print")}
            </button>
            <button onClick={() => window.location.reload()} className="btn" style={{ background: '#4318ff', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Collection Date Modal */}
        <CollectionDateModal 
          isOpen={!!dateModalClient} 
          onClose={() => setDateModalClient(null)} 
          client={dateModalClient} 
          onUpdate={(updatedFields) => {
            setClients(prev => prev.map(c => {
              // Try to match by id, uuid, or object reference
              const isMatch = c === dateModalClient ||
                              (c.id && c.id === dateModalClient.id) || 
                              (c.uuid && c.uuid === dateModalClient.uuid);
              return isMatch ? { ...c, ...updatedFields } : c;
            }));
          }} 
        />

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th width="50">{t("ID NO")}</th>
                <th width="120" style={{ textAlign: 'center' }}>{t("IMAGE")}</th>
                <th width="300">{t("CLIENT DETAILS")}</th>
                <th>{t("DETAILS")}</th>
                <th width="100">{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>{t("No clients found.")}</td></tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr key={client.id || client.uuid || index}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', textAlign: 'center' }}>{index + 1}</td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <ClientImageUploader client={client} onUploadSuccess={fetchClients} />
                    </td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: '13px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 10px 1fr', gap: '4px', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600' }}>{t("Name")}</div><div>:</div><div>{client.name || (client.details && client.details.name)}</div>
                        <div style={{ fontWeight: '600' }}>{t("Phone")}</div><div>:</div><div>{client.phone || (client.details && client.details.phone)}</div>
                        {(client.group || (client.details && client.details.group)) && (
                          <>
                            <div style={{ fontWeight: '600' }}>{t("Client Group")}</div>
                            <div>:</div>
                            <div>
                              {typeof client.group === 'object' && client.group !== null 
                                ? client.group.name 
                                : (groups.find(g => (g.id || g.uuid) === (client.group || (client.details && client.details.group)))?.name || client.group || (client.details && client.details.group))}
                            </div>
                          </>
                        )}
                        <div style={{ fontWeight: '600' }}>{t("Address")}</div><div>:</div><div>{client.address || (client.details && client.details.address)}</div>
                        <div style={{ fontWeight: '600' }}>{t("Status")}</div><div>:</div><div>{(client.status === true || client.status === 'Active' || client.status === 'Activated') ? t("Active") : t("Deactivated")}</div>
                        <div style={{ fontWeight: '600' }}>{t("Created At")}</div><div>:</div><div>{client.created_at || (client.details && client.details.createdAt) ? new Date(client.created_at || (client.details && client.details.createdAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                      </div>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Previous Due")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{num(client, 'previous_due', 'opening_due', 'prevDue').toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Bill")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{num(client, 'sales', 'sales_amount', 'total_sales', 'bill').toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Total Bill")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{(num(client, 'total_bill') || (num(client, 'previous_due', 'opening_due', 'prevDue') + num(client, 'sales', 'sales_amount', 'total_sales', 'bill'))).toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Receive")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{num(client, 'collection', 'receive', 'payment', 'paid', 'total_receive').toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Sales Return")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{num(client, 'sales_return', 'return_amount').toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}>{t("Money Return")}</td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0' }}>{num(client, 'money_return', 'return').toFixed(2)}</td></tr>
                          <tr><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px' }}><span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{t("Due")}</span></td><td style={{ borderBottom: '1px solid #e2e8f0', padding: '6px 12px', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold' }}>{num(client, 'due', 'current_due', 'balance').toFixed(2)}</td></tr>
                          <tr 
                            style={{ cursor: 'pointer', transition: 'background 0.2s' }} 
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setDateModalClient(client)}
                          >
                            <td style={{ padding: '6px 12px', borderBottom: '1px solid transparent' }}>{t("Collection Date")}</td>
                            <td style={{ padding: '6px 12px', borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid transparent' }}>
                              <Calendar size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle', color: '#2563eb' }}/> 
                              <span style={{ color: '#2563eb', fontWeight: '600', borderBottom: '1px dashed #2563eb' }}>
                                {client.due_date ? new Date(client.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : t('Set Date')}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', position: 'relative' }}>
                      <button 
                        onClick={() => toggleAction(client.id || client.uuid)}
                      className="btn" 
                      style={{ background: '#05cd99', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', width: '100%', justifyContent: 'space-between' }}
                    >
                      {t("Action")} <ChevronDown size={14} />
                    </button>
                    
                    {activeAction === (client.id || client.uuid) && (
                      <div style={{ position: 'absolute', top: '50px', right: '16px', background: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '8px', zIndex: 10, width: '160px', padding: '8px 0', border: '1px solid #e2e8f0' }}>
                        <div onClick={() => handleDeactivate(client.id || client.uuid, client.status)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item">
                          {(client.status === false || client.status === 'Deactivated') ? t("✅ Activate") : t("🚫 Deactivate")}
                        </div>
                        <div onClick={() => { setViewClient(client); setActiveAction(null); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>👁</span> {t("View")}</div>
                        <div onClick={() => { navigate('/account/receive-create', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>⬇️</span> {t("Receive")}</div>
                        <div onClick={() => navigate(`/crm/client-edit/${client.id || client.uuid}`)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>✏️</span> {t("Edit")}</div>
                        <div onClick={() => handleDelete(client.id || client.uuid)} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>🗑</span> {t("Delete")}</div>
                        <div onClick={() => navigate('/crm/client-statement')} style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} className="action-item"><span style={{ width: '14px', textAlign: 'center' }}>📄</span> {t("View Statement")}</div>
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
            
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 'bold', borderBottom: '2px solid #0ea5e9', paddingBottom: '8px' }}>{t("Customer Profile / Ledger Info")}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600' }}>{t("Customer ID:")}</div><div>{viewClient.id || viewClient.uuid}</div>
              <div style={{ fontWeight: '600' }}>{t("Name:")}</div><div style={{ fontWeight: 'bold' }}>{viewClient.name}</div>
              <div style={{ fontWeight: '600' }}>{t("Phone:")}</div><div>{viewClient.phone}</div>
              <div style={{ fontWeight: '600' }}>{t("Group:")}</div><div>{viewClient.group || '-'}</div>
              <div style={{ fontWeight: '600' }}>{t("Address:")}</div><div>{viewClient.address || '-'}</div>
              <div style={{ fontWeight: '600' }}>{t("Total Due:")}</div><div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>৳ {viewClient.due || viewClient.previous_due || '0.00'}</div>
            </div>

            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: '12px' }}>
                {t("Customer Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: '12px' }}>
                {t("Authorized Signature")}
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '8px 20px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>{t("🖨️ Print Memo")}</button>
              <button onClick={() => setViewClient(null)} className="btn" style={{ background: '#64748b', color: 'white', padding: '8px 16px', borderRadius: '6px' }}>{t("Close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
