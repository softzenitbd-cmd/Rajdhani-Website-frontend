import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { crmService } from '../../../services/crmService';
import { lookupCache } from '../../../services/lookupCache';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { useToast } from '../../../context/ToastContext';
import { useConfirm } from '../../../context/ConfirmContext';
import CustomDatePicker from '../../../components/CustomDatePicker';
import SearchableSelect from '../../../components/SearchableSelect';
import { money } from '../../../utils/apiHelpers';


const SupplierChequeSchedule = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  
  const [cheques, setCheques] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [clients, setClients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const [formData, setFormData] = useState({
    supplier: '',
    cheque_number: '',
    bank_name: '',
    date: '',
    amount: ''
  });

  const { get, post, patch, del, loading } = useApi();

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    if (typeof dateVal === 'string') {
      const clean = dateVal.split('T')[0].trim();
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
      if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
        return clean;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return dateVal;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchCheques = async () => {
    try {
      const res = await get(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}?page_size=5000`);
      let data = res.results || res.data || res || [];
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setCheques(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await get(`${ENDPOINTS.CRM_SUPPLIERS}?page_size=5000`);
      let fetchedSuppliers = res.results || res.data || res || [];
      if (!Array.isArray(fetchedSuppliers) || fetchedSuppliers.length === 0) {
        try {
          fetchedSuppliers = await lookupCache.getSuppliers();
        } catch (e) {}
      }
      
      try {
        const statsRes = await get(`${ENDPOINTS.CRM_REPORT_SUPPLIER_DUE}?page_size=5000`);
        const statsData = statsRes.results || statsRes.data || statsRes || [];
        
        const updatedSuppliers = fetchedSuppliers.map(sup => {
          const stats = statsData.find(s => String(s.supplier_id || s.id || s.uuid) === String(sup.id || sup.uuid));
          return { ...sup, stats: stats || sup.stats || {} };
        });
        setSuppliers(updatedSuppliers);
      } catch (statsErr) {
        setSuppliers(fetchedSuppliers);
      }
    } catch (err) {
      console.error(err);
      try {
        const fallback = await lookupCache.getSuppliers();
        setSuppliers(fallback);
      } catch (e) {}
    }
  };

  const fetchClients = async () => {
    try {
      const res = await get(`${ENDPOINTS.CRM_CLIENTS}?page_size=5000`);
      let fetchedClients = res.results || res.data || res || [];
      if (!Array.isArray(fetchedClients) || fetchedClients.length === 0) {
        try {
          fetchedClients = await lookupCache.getClients();
        } catch (e) {}
      }
      setClients(fetchedClients);
    } catch (err) {
      try {
        const fallback = await lookupCache.getClients();
        setClients(fallback);
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchCheques();
    fetchSuppliers();
    fetchClients();
  }, []);

  const handleEditClick = (cheque) => {
    if (editingId === cheque.id || editingId === cheque.uuid) {
      setEditingId(null);
    } else {
      setEditingId(cheque.id || cheque.uuid);
      setIsAdding(false);
      setFormData({
        supplier: cheque.supplier?.id || cheque.supplier?.uuid || cheque.supplier || '',
        cheque_number: cheque.cheque_number || cheque.chequeNo || '',
        bank_name: cheque.bank_name || cheque.bank || '',
        date: cheque.date || '',
        amount: cheque.amount || ''
      });
    }
  };

  const handleAddClick = () => {
    setIsAdding(!isAdding);
    setEditingId(null);
    setFormData({
      supplier: '',
      cheque_number: '',
      bank_name: '',
      date: new Date().toISOString().split('T')[0],
      amount: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.supplier) {
      toast.error(t("Please select a supplier"));
      return;
    }
    if (!formData.amount) {
      toast.error(t("Please enter amount"));
      return;
    }

    try {
      const payload = {
        ...formData,
        bank_name: formData.bank_name || '-',
        cheque_number: formData.cheque_number || '-',
        amount: parseFloat(formData.amount) || 0
      };

      if (isAdding) {
        await post(ENDPOINTS.CRM_SUPPLIER_CHEQUES, payload, t("Cheque added successfully"));
        setIsAdding(false);
      } else if (editingId) {
        await patch(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}${editingId}/`, payload, t("Cheque updated successfully"));
        setEditingId(null);
      }
      fetchCheques();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t("Delete Cheque"),
      message: t("Are you sure you want to delete this cheque?"),
      confirmText: t("Delete"),
      confirmColor: "var(--danger, #dc2626)"
    });
    if (ok) {
      try {
        await del(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}${id}/`, t("Cheque deleted"));
        fetchCheques();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getSupplierName = (supplierVal, cheque = {}) => {
    if (cheque?.supplier_name) return cheque.supplier_name;
    if (cheque?.supplier?.name) return cheque.supplier.name;
    if (cheque?.supplier?.company_name) return cheque.supplier.company_name;

    if (typeof supplierVal === 'object' && supplierVal !== null) {
      return supplierVal.name || supplierVal.company_name || supplierVal.supplier_name || t("Unknown Supplier");
    }

    const sValStr = String(supplierVal || '').trim().toLowerCase();
    if (!sValStr) return '-';

    // 1. Search in suppliers
    const foundSupplier = suppliers.find(s => {
      const idStr = String(s.id || '').trim().toLowerCase();
      const uuidStr = String(s.uuid || '').trim().toLowerCase();
      const supIdStr = String(s.supplier_id || '').trim().toLowerCase();
      return idStr === sValStr || uuidStr === sValStr || supIdStr === sValStr;
    });
    if (foundSupplier) {
      return foundSupplier.name || foundSupplier.company_name || t("Unknown Supplier");
    }

    // 2. Search in clients (in case client was linked)
    const foundClient = clients.find(c => {
      const idStr = String(c.id || '').trim().toLowerCase();
      const uuidStr = String(c.uuid || '').trim().toLowerCase();
      const clientIdStr = String(c.client_id || '').trim().toLowerCase();
      return idStr === sValStr || uuidStr === sValStr || clientIdStr === sValStr;
    });
    if (foundClient) {
      return foundClient.name || foundClient.company_name || t("Unknown Supplier");
    }

    // If it is a raw UUID and not found in any list, don't show the raw hex UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sValStr);
    if (isUuid) {
      return t("Unknown Supplier");
    }

    return supplierVal || t("Unknown Supplier");
  };

  const filteredCheques = cheques.filter(c => {
    let match = true;
    const sId = String(c.supplier?.id || c.supplier?.uuid || c.supplier || '');
    if (selectedSupplier && sId !== String(selectedSupplier)) {
      match = false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const bMatch = (c.bank_name || c.bank || '').toLowerCase().includes(q);
      const cMatch = (c.cheque_number || c.chequeNo || '').toLowerCase().includes(q);
      const sMatch = getSupplierName(c.supplier, c).toLowerCase().includes(q);
      if (!bMatch && !cMatch && !sMatch) match = false;
    }
    
    // Date filter handling with Date objects to avoid string format issues
    if (c.date) {
      const chequeDateObj = new Date(c.date);
      chequeDateObj.setHours(0, 0, 0, 0);
      
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0);
        if (chequeDateObj < fromDateObj) match = false;
      }
      
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(0, 0, 0, 0);
        if (chequeDateObj > toDateObj) match = false;
      }
    }
    
    return match;
  });

  const totalAmount = filteredCheques.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);


  const renderInlineForm = () => (
    <td colSpan="7" style={{ padding: '20px', background: '#f8fafc', border: '2px solid var(--primary)', borderRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 10 }}>
             {t("Date")}
          </div>
          <CustomDatePicker 
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '-11px',
            left: '10px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: 'var(--fs-10, 10px)',
              fontWeight: 'bold'
            }}>
              {t("Supplier")}
            </div>
            {formData.supplier && (() => {
              const selectedSup = suppliers.find(s => String(s.id || s.uuid) === String(formData.supplier));
              const dueAmt = selectedSup ? Number(selectedSup.stats?.due || selectedSup.due || selectedSup.previous_due || 0) : 0;
              return (
                <div style={{
                  background: dueAmt > 0 ? '#ef4444' : (dueAmt < 0 ? '#10b981' : '#64748b'),
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: 'var(--fs-11, 11px)',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span>{dueAmt < 0 ? t("Advance") : t("Due")}:</span>
                  <span style={{ fontWeight: '800' }}>৳ {money(Math.abs(dueAmt))}</span>
                </div>
              );
            })()}
          </div>
          <SearchableSelect
            options={suppliers.map(s => ({
              value: s.id || s.uuid,
              label: s.name || s.company_name || s.supplier_name || '',
              searchValue: s.phone || s.mobile || ''
            }))}
            value={formData.supplier}
            onChange={(value) => setFormData(prev => ({ ...prev, supplier: value }))}
            placeholder={t("Select Supplier")}
            searchPlaceholder={t("Search Supplier")}
            hideOptionsUntilSearch
            style={{ width: '100%', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 10 }}>
             {t("Bank Name")}
          </div>
          <input 
            type="text" 
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            placeholder={t("e.g. IFIC Bank")}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 10 }}>
             {t("Cheque Number")}
          </div>
          <input 
            type="text" 
            name="cheque_number"
            value={formData.cheque_number}
            onChange={handleChange}
            placeholder={t("e.g. 8572056")}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold', zIndex: 10 }}>
             {t("Amount")}
          </div>
          <input 
            type="number" 
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{ flex: 1, background: 'var(--success)', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? t("Saving...") : (isAdding ? t("Save Cheque") : t("Update Cheque"))}
          </button>
          <button 
            onClick={() => { setIsAdding(false); setEditingId(null); }}
            style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}>
            {t("Cancel")}
          </button>
        </div>
      </div>
    </td>
  );

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">{t("SUPPLIER CHEQUE SCHEDULE")}</h2>
        <div className="card-actions">
          <button className="btn btn-primary" onClick={handleAddClick} style={{ padding: '6px 12px', background: 'var(--success)' }}>
            <Plus size={14} /> {t("Add Cheque")}
          </button>
        </div>
      </div>

      <div className="card-body">

        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>{t("Search All")}</label>
            <div className="form-input floating-label">
              <input type="text" placeholder=" " value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <label>{t("Search")}</label>
            </div>
          </div>
          
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Supplier")}</label>
            <div className="form-input floating-label">
              <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                <option value="">{t("Select Supplier")}</option>
                {suppliers.map(s => (
                  <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '8px' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-input floating-label" style={{ flex: 1, padding: '0 8px' }}>
                <CustomDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="form-input floating-label" style={{ flex: 1, padding: '0 8px' }}>
                <CustomDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <button 
              className="btn btn-outline" 
              style={{ height: '48px', width: '100%', background: '#718096', color: 'white', justifyContent: 'center' }}
              onClick={() => { setSearchTerm(''); setSelectedSupplier(''); setFromDate(''); setToDate(''); }}
            >
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th width="80" style={{ textAlign: 'center' }}>{t("ID NO ↕")}</th>
                <th width="150" style={{ textAlign: 'left' }}>{t("DATE ↕")}</th>
                <th style={{ textAlign: 'left' }}>{t("SUPPLIER ↕")}</th>
                <th style={{ textAlign: 'left' }}>{t("BANK ↕")}</th>
                <th style={{ textAlign: 'left' }}>{t("CHEQUE NO ↕")}</th>
                <th style={{ textAlign: 'right' }}>{t("AMOUNT ↕")}</th>
                <th width="120" style={{ textAlign: 'center' }}>{t("ACTION ↕")}</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && <tr>{renderInlineForm()}</tr>}

              {filteredCheques.length === 0 && !isAdding && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    {loading ? t("Loading...") : t("No cheques found")}
                  </td>
                </tr>
              )}

              {filteredCheques.map((cheque, index) => {
                const cId = cheque.id || cheque.uuid;
                return (
                  <React.Fragment key={cId}>
                    <tr>
                      <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ verticalAlign: 'middle' }}>{formatDate(cheque.date)}</td>
                      <td style={{ verticalAlign: 'middle', fontWeight: '500' }}>{getSupplierName(cheque.supplier, cheque)}</td>
                      <td style={{ verticalAlign: 'middle' }}>{cheque.bank_name || cheque.bank || '-'}</td>
                      <td style={{ verticalAlign: 'middle' }}>{cheque.cheque_number || cheque.chequeNo || '-'}</td>
                      <td style={{ verticalAlign: 'middle', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{parseFloat(cheque.amount || 0).toFixed(2)}</td>
                      <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => handleEditClick(cheque)}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title={t("Edit")}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cId)}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title={t("Delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {editingId === cId && (
                      <tr>
                        {renderInlineForm()}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {filteredCheques.length > 0 && !isAdding && (
              <tfoot>
                <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                  <td colSpan="5" style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold' }}>{t("Total Amount:")}</td>
                  <td style={{ textAlign: 'right', padding: '12px', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)' }}>{totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierChequeSchedule;
