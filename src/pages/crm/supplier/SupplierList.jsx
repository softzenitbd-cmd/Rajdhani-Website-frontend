import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, FileSpreadsheet, Printer, RotateCcw, ChevronDown, Eye, Edit, Trash2, DollarSign, FileText, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../../components/PrintHeader';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportToExcel } from '../../../utils/excelExporter';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { crmService } from '../../../services/crmService';
import { useTranslation } from 'react-i18next';
import SupplierViewModal from './SupplierViewModal';
import CustomDatePicker from '../../../components/CustomDatePicker';

const amountOrNull = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value === undefined || value === null || value === '') continue;
    const amount = Number(value);
    if (Number.isFinite(amount)) return amount;
  }
  return null;
};

const getSupplierFinancials = (supplier) => {
  const previousDue = amountOrNull(supplier, 'previous_due', 'opening_balance') ?? 0;
  const bill = amountOrNull(supplier.stats, 'purchase_amount', 'purchase_bill')
    ?? amountOrNull(supplier, 'bill') ?? 0;
  const totalBill = amountOrNull(supplier.stats, 'total_bill') ?? previousDue + bill;
  const returnAmount = amountOrNull(supplier.stats, 'return_amount', 'return')
    ?? amountOrNull(supplier, 'sales_return') ?? 0;
  const paid = amountOrNull(supplier.stats, 'payment', 'collection')
    ?? amountOrNull(supplier, 'paid') ?? 0;

  return {
    previousDue,
    bill,
    totalBill,
    returnAmount,
    paid,
    due: totalBill - returnAmount - paid
  };
};


const SupplierList = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveAction(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      params.append('page_size', '5000');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await get(url);
      const fetchedSuppliers = res.results || res.data || res || [];
      
      try {
        const statsRes = await get(`${ENDPOINTS.CRM_REPORT_SUPPLIER_DUE}?page_size=5000`);
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

  const handleDeleteSupplier = async (supplier) => {
    setActiveAction(null);
    const ok = await confirm({
      title: t("Delete Supplier"),
      message: t("Are you sure you want to delete this supplier?"),
      confirmText: t("Delete"),
      confirmColor: "var(--danger, #dc2626)"
    });
    if (!ok) return;

    try {
      await crmService.deleteSupplier(supplier.id || supplier.uuid);
      toast.success(t("Supplier deleted successfully!"));
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t("Failed to delete supplier"));
    }
  };
  
  // Calculate total due from all suppliers dynamically
  const totalSupplierDue = suppliers.reduce((sum, sup) => {
    return sum + getSupplierFinancials(sup).due;
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
                <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ color: '#94a3b8' }} />
              </div>
              <div className="form-input floating-label" style={{ flex: 1, padding: '0 8px' }}>
                <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ color: '#94a3b8' }} />
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
              suppliers.map((supplier, index) => {
                const { previousDue, bill, totalBill, returnAmount, paid, due } = getSupplierFinancials(supplier);

                  return (
                  <tr key={supplier.id || supplier.uuid || index} style={{ background: 'white' }}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: 'var(--fs-13, 13px)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '4px', textAlign: 'left', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '600' }}>{t("Name")}</div><div>:</div><div>{supplier.name}</div>
                        <div style={{ fontWeight: '600' }}>{t("Phone")}</div><div>:</div><div>{supplier.phone}</div>
                        <div style={{ fontWeight: '600' }}>{t("Supplier Group")}</div><div>:</div><div>{supplier.group || '-'}</div>
                        <div style={{ fontWeight: '600' }}>{t("Address")}</div><div>:</div><div>{supplier.address}</div>
                        {supplier.bank_info && (
                          <div style={{ gridColumn: '1 / -1', color: '#475569', whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                            {supplier.bank_info}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Previous Due")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{previousDue.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Bill")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{bill.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Total Bill")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{totalBill.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Purchase Return")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{returnAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{t("Paid")}</td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>{paid.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                              <span style={{ 
                                background: due > 0 ? '#ef4444' : due < 0 ? '#10b981' : '#64748b',
                                color: 'white', padding: '2px 6px', borderRadius: '4px' 
                              }}>
                                {due < 0 ? t("Advance") : t("Due")}
                              </span>
                            </td>
                            <td style={{ padding: '4px 8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                              {Math.abs(due).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingTop: '32px', position: 'relative', textAlign: 'center' }} className="action-dropdown-container">
                      <button 
                        onClick={() => toggleAction(supplier.id || supplier.uuid)}
                        className="btn" 
                        style={{ 
                          background: 'var(--success)', 
                          color: 'white', 
                          padding: '6px 12px', 
                          fontSize: 'var(--fs-12, 12px)', 
                          fontWeight: '600',
                          borderRadius: '6px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        {t("Action")} <ChevronDown size={14} />
                      </button>

                    {activeAction === (supplier.id || supplier.uuid) && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '68px', 
                        right: '50%',
                        transform: 'translateX(50%)',
                        background: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                        minWidth: '180px',
                        zIndex: 100,
                        padding: '6px',
                        textAlign: 'left'
                      }}>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { setSelectedSupplierView(supplier); setActiveAction(null); }}><Eye size={16} color="#0284c7" /> <span>{t("View")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { setActiveAction(null); navigate(`/crm/supplier-edit/${supplier.id || supplier.uuid}`); }}><Edit size={16} color="#4f46e5" /> <span>{t("Edit")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#dc2626' }} onClick={() => handleDeleteSupplier(supplier)}><Trash2 size={16} color="#dc2626" /> <span>{t("Delete")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { setActiveAction(null); navigate('/account/supplier-payment', { state: { supplierId: supplier.id || supplier.uuid, openAdd: true } }); }}><DollarSign size={16} color="#059669" /> <span>{t("Payment")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { setActiveAction(null); navigate('/expense-report/supplier-purchase', { state: { supplierId: supplier.id || supplier.uuid } }); }}><FileText size={16} color="#64748b" /> <span>{t("Payment Report")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { navigate("/product/purchase/report", { state: { supplierId: supplier.id || supplier.uuid } }); setActiveAction(null); }}><FileBarChart size={16} color="#0284c7" /> <span>{t("Purchase Report")}</span></div>
                        <div className="action-item" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: 'var(--fs-13, 13px)', borderRadius: '6px', color: '#334155' }} onClick={() => { navigate("/crm/supplier-statement", { state: { supplierId: supplier.id || supplier.uuid } }); setActiveAction(null); }}><FileText size={16} color="#64748b" /> <span>{t("Statement")}</span></div>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
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
