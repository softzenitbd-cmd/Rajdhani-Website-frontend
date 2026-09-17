import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, FileSpreadsheet, Printer, RotateCcw, ChevronDown, Eye, Edit, Trash2, DollarSign, FileText, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../../components/PrintHeader';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportToExcel } from '../../../utils/excelExporter';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import SupplierViewModal from './SupplierViewModal';

const SupplierList = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSupplierView, setSelectedSupplierView] = useState(null);
  
  const { get, loading } = useApi();

  const toggleAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      let url = ENDPOINTS.CRM_SUPPLIERS;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGroup) params.append('group', selectedGroup);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await get(url);
      const fetchedSuppliers = res.results || res.data || res || [];
      
      try {
        const statsRes = await get(ENDPOINTS.CRM_REPORT_SUPPLIER_DUE);
        const statsData = statsRes.results || statsRes.data || statsRes || [];
        
        const updatedSuppliers = fetchedSuppliers.map(sup => {
          const stats = statsData.find(s => String(s.supplier_id || s.id || s.uuid) === String(sup.id || sup.uuid));
          return { ...sup, stats: stats || sup.stats || {} };
        });
        setSuppliers(updatedSuppliers);
      } catch (statsErr) {
        console.error("Failed to fetch supplier stats", statsErr);
        setSuppliers(fetchedSuppliers);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  // Calculate total due from all suppliers dynamically
  const totalSupplierDue = suppliers.reduce((sum, sup) => {
    const due = sup.stats?.due !== undefined ? Number(sup.stats.due) : Number(sup.due || sup.previous_due || 0);
    return sum + (isNaN(due) ? 0 : due);
  }, 0);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedGroup, fromDate, toDate]);

  const handleExportExcel = () => {
    const dataToExport = suppliers.map((sup, i) => ({
      'SL': i + 1,
      'Supplier Code': sup.supplier_code || sup.code || '-',
      'Company Name': sup.company_name || sup.name || '-',
      'Owner Name': sup.owner_name || sup.name || '-',
      'Group': sup.group || sup.group_name || '-',
      'Phone': sup.phone || sup.mobile || '-',
      'Email': sup.email || '-',
      'Opening Balance': sup.opening_balance || 0,
      'Current Balance': sup.current_balance || sup.balance || 0,
      'Status': sup.status ? 'Active' : 'Inactive'
    }));
    exportToExcel(dataToExport, 'Supplier_List');
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">{t("SUPPLIER LIST")}</h2>
        <div className="card-actions">
          <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '6px 12px', background: '#718096', color: 'white' }}>
            <ArrowLeft size={14} /> {t("Go Back")}
          </button>
          <button className="btn btn-outline" style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }} onClick={() => navigate('/crm/supplier-group')}>
            <Users size={14} /> {t("Supplier Group")}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/crm/supplier-create')} style={{ padding: '6px 12px', background: 'var(--success)' }}>
            <Plus size={14} /> {t("Add Supplier")}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>{t("Search All")}</label>
            <div className="form-input floating-label">
              <input type="text" placeholder=" " value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <label>{t("Search All")}</label>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Supplier Group")}</label>
            <div className="form-input floating-label">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">{t("All Groups")}</option>
                {groups.map(g => (
                  <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-input floating-label" style={{ flex: 1, padding: '0 8px' }}>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ color: '#94a3b8' }} />
              </div>
              <div className="form-input floating-label" style={{ flex: 1, padding: '0 8px' }}>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ color: '#94a3b8' }} />
              </div>
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

        {/* Total Due Label */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: 'var(--fs-18, 18px)', fontWeight: '700', color: '#000' }}>{t("Total Supplier Due:")} {totalSupplierDue.toFixed(2)}</h3>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Show")} 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}>
              <option>25</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', cursor: 'pointer' }}>
              <FileSpreadsheet size={16} style={{ marginRight: '6px' }} /> {t("Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <Printer size={16} style={{ marginRight: '6px' }} /> {t("Print")}
            </button>
            <button onClick={() => window.location.reload()} className="btn" style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <RotateCcw size={16} style={{ marginRight: '6px' }} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th width="50" style={{ textAlign: 'center' }}>{t("ID NO ↕")}</th>
                <th width="400">{t("SUPPLIER DETAILS")}</th>
                <th width="250">{t("ACCOUNT ↕")}</th>
                <th width="100" style={{ textAlign: 'center' }}>{t("ACTION ↕")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("No suppliers found.")}</td></tr>
              ) : (
                suppliers.map((supplier, index) => (
                  <tr key={supplier.id || supplier.uuid || index} style={{ background: 'white' }}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: 'var(--fs-13, 13px)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '120px', fontWeight: '700', padding: '2px 0', border: 'none' }}>{t("Name")}</td>
                            <td style={{ padding: '2px 0', border: 'none' }}>: {supplier.name}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: '700', padding: '2px 0', border: 'none' }}>{t("Phone")}</td>
                            <td style={{ padding: '2px 0', border: 'none' }}>: {supplier.phone}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: '700', padding: '2px 0', border: 'none' }}>{t("Supplier Group")}</td>
                            <td style={{ padding: '2px 0', border: 'none' }}>: {supplier.group || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: '700', padding: '2px 0', border: 'none' }}>{t("Address")}</td>
                            <td style={{ padding: '2px 0', border: 'none' }}>: {supplier.address}</td>
                          </tr>
                          {supplier.bank_info && (
                            <tr>
                              <td colSpan="2" style={{ padding: '8px 0 2px', border: 'none', color: '#475569', whiteSpace: 'pre-wrap' }}>
                                {supplier.bank_info}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Previous Due")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{Number(supplier.previous_due || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Bill")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{Number(supplier.stats?.purchase_amount || supplier.bill || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Total Bill")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{(Number(supplier.previous_due || 0) + Number(supplier.stats?.purchase_amount || supplier.bill || 0)).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("SalesReturn")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{Number(supplier.stats?.return_amount || supplier.sales_return || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Paid")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{Number(supplier.stats?.payment || supplier.paid || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#3b82f6', color: 'white' }}>{t("Due")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: '#3b82f6', color: 'white', fontWeight: 'bold' }}>{Number(supplier.stats?.due || supplier.due || supplier.previous_due || 0).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingTop: '32px', position: 'relative', textAlign: 'center' }}>
                      <button 
                        onClick={() => toggleAction(supplier.id || supplier.uuid)}
                      className="btn" 
                      style={{ background: 'var(--success)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {t("Action")} <ChevronDown size={14} />
                    </button>

                    {activeAction === (supplier.id || supplier.uuid) && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '64px', 
                        right: '50%',
                        transform: 'translateX(50%)',
                        background: 'white', 
                        border: '1px solid var(--secondary)', 
                        borderRadius: '8px', 
                        boxShadow: 'var(--shadow-md)', 
                        width: '160px',
                        zIndex: 100,
                        textAlign: 'left'
                      }}>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }} onClick={() => { setSelectedSupplierView(supplier); setActiveAction(null); }}><Eye size={14} /> {t("View")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }} onClick={() => navigate(`/crm/supplier-edit/${supplier.id || supplier.uuid}`)}><Edit size={14} /> {t("Edit")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }} onClick={() => toast.info(t("Delete supplier feature coming soon!"))}><Trash2 size={14} /> {t("Delete")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }} onClick={() => navigate('/account/supplier-payment')}><DollarSign size={14} /> {t("Payment")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }} onClick={() => navigate('/expense-report/supplier-purchase')}><FileText size={14} /> {t("Payment Report")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}onClick={() => { navigate("/product/purchase/report", { state: { supplierId: supplier.id || supplier.uuid } }); setActiveAction(null); }}><FileBarChart size={14} /> {t("Purchase Report")}</div>
                        <div className="action-item" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)' }}onClick={() => { navigate("/crm/supplier-statement", { state: { supplierId: supplier.id || supplier.uuid } }); setActiveAction(null); }}><FileText size={14} /> {t("Statement")}</div>
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
      <SupplierViewModal supplier={selectedSupplierView} onClose={() => setSelectedSupplierView(null)} />
    </div>
  );
};

export default SupplierList;
