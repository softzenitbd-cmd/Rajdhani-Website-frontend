import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { crmService } from '../../../services/crmService';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { useToast } from '../../../context/ToastContext';
import CustomDatePicker from '../../../components/CustomDatePicker';


const SupplierChequeSchedule = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [cheques, setCheques] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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

  const fetchCheques = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_CHEQUES);
      let data = res.results || res.data || res || [];
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setCheques(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIERS);
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
        setSuppliers(fetchedSuppliers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCheques();
    fetchSuppliers();
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
    if (!formData.amount || !formData.bank_name) {
      toast.error(t("Please fill in all required fields (Amount, Bank Name)"));
      return;
    }

    try {
      const payload = {
        ...formData,
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
    if (window.confirm(t("Are you sure you want to delete this cheque?"))) {
      try {
        await del(`${ENDPOINTS.CRM_SUPPLIER_CHEQUES}${id}/`, t("Cheque deleted"));
        fetchCheques();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getSupplierName = (supplierVal) => {
    if (typeof supplierVal === 'object' && supplierVal !== null) {
      return supplierVal.name || 'Unknown';
    }
    const found = suppliers.find(s => s.id === supplierVal || s.uuid === supplierVal);
    return found ? found.name : supplierVal || 'Unknown';
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
      const sMatch = getSupplierName(c.supplier).toLowerCase().includes(q);
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
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
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
          <div style={{ position: 'absolute', top: '-10px', left: '10px', display: 'flex', gap: '8px' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
               {t("Supplier")}
            </div>
            {formData.supplier && (() => {
              const selectedSup = suppliers.find(s => String(s.id || s.uuid) === String(formData.supplier));
              const dueAmt = selectedSup ? Number(selectedSup.stats?.due || selectedSup.due || selectedSup.previous_due || 0) : 0;
              return (
                <div style={{ background: dueAmt > 0 ? '#ef4444' : (dueAmt < 0 ? '#10b981' : '#64748b'), color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
                  {dueAmt < 0 ? `${t("Advance")}: ${Math.abs(dueAmt).toFixed(2)}` : `${t("Due")}: ${dueAmt.toFixed(2)}`}
                </div>
              );
            })()}
          </div>
          <select 
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', background: 'white' }}
          >
            <option value="">{t("Select Supplier")}</option>
            {suppliers.map(s => (
              <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
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
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
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
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
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
                      <td style={{ verticalAlign: 'middle' }}>{cheque.date ? new Date(cheque.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td style={{ verticalAlign: 'middle' }}>{getSupplierName(cheque.supplier)}</td>
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
