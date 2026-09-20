import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useApi } from '../../../hooks/useApi';
import { useConfirm } from '../../../context/ConfirmContext';
import { ENDPOINTS } from '../../../api/endpoints';
import CustomDatePicker from '../../../components/CustomDatePicker';


const ClientChequeSchedule = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [cheques, setCheques] = useState([]);
  const [clients, setClients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    client: '',
    cheque_number: '',
    bank_name: '',
    date: '',
    amount: ''
  });

  const { get, post, patch, del, loading } = useApi();

  const fetchCheques = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_CHEQUES);
      setCheques(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENTS);
      setClients(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCheques();
    fetchClients();
  }, []);

  const handleEditClick = (cheque) => {
    if (editingId === cheque.id || editingId === cheque.uuid) {
      setEditingId(null);
    } else {
      setEditingId(cheque.id || cheque.uuid);
      setIsAdding(false);
      setFormData({
        client: cheque.client?.id || cheque.client?.uuid || cheque.client || '',
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
      client: '',
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
    try {
      const payload = {
        ...formData,
        // Ensure numbers are formatted
        amount: parseFloat(formData.amount) || 0
      };

      if (isAdding) {
        await post(ENDPOINTS.CRM_CLIENT_CHEQUES, payload, t("Cheque added successfully"));
        setIsAdding(false);
      } else if (editingId) {
        await patch(`${ENDPOINTS.CRM_CLIENT_CHEQUES}${editingId}/`, payload, t("Cheque updated successfully"));
        setEditingId(null);
      }
      fetchCheques();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (await confirm(t("Are you sure you want to delete this cheque?"))) {
      try {
        await del(`${ENDPOINTS.CRM_CLIENT_CHEQUES}${id}/`, t("Cheque deleted"));
        fetchCheques();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to find client name
  const getClientName = (clientVal) => {
    if (typeof clientVal === 'object' && clientVal !== null) {
      return clientVal.name || 'Unknown';
    }
    const found = clients.find(c => c.id === clientVal || c.uuid === clientVal);
    return found ? found.name : clientVal || 'Unknown';
  };

  const renderInlineForm = () => (
    <td colSpan="7" style={{ padding: '20px', background: '#f8fafc', border: '2px solid #3b82f6', borderRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        {/* Date Field */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
             {t("Date")}
          </div>
          <CustomDatePicker 
             
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
        
        {/* Client Field */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
             {t("Client")}
          </div>
          <select 
            name="client"
            value={formData.client}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', background: 'white' }}
          >
            <option value="">{t("Select Client")}</option>
            {clients.map(c => (
              <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Bank Name Field */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
             {t("Bank Name")}
          </div>
          <input 
            type="text" 
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            placeholder={t("e.g. IFIC Bank")}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        {/* Cheque Number Field */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
             {t("Cheque Number")}
          </div>
          <input 
            type="text" 
            name="cheque_number"
            value={formData.cheque_number}
            onChange={handleChange}
            placeholder={t("e.g. 8572056")}
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>

        {/* Amount Field */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-10, 10px)', fontWeight: 'bold' }}>
             {t("Amount")}
          </div>
          <input 
            type="number" 
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b' }} 
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleSave}
            disabled={loading}
            style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? t("Saving...") : (isAdding ? t("Save Cheque") : t("Update Cheque"))}
          </button>
          <button 
            onClick={() => { setIsAdding(false); setEditingId(null); }}
            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer' }}>
            {t("Cancel")}
          </button>
        </div>
      </div>
    </td>
  );

  return (
    <div className="dashboard-content" style={{ paddingBottom: '50px' }}>
      <div className="card" style={{ border: 'none', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div className="card-header" style={{ background: '#3b82f6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold' }}>{t("Client Cheque Schedule")}</h2>
          <button onClick={handleAddClick} className="btn" style={{ background: '#2563eb', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 16px', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> {t("Add")}
          </button>
        </div>

        <div className="card-body" style={{ padding: '24px', background: 'white' }}>
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>{t("ID NO")}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>{t("CHEQUE NO")}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>{t("DATE")}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>{t("CLIENT")}</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>{t("BANK")}</th>
                  <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #e2e8f0' }}>{t("AMOUNT")}</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{t("ACTION")}</th>
                </tr>
              </thead>
              <tbody>
                {/* Inline Add Form at the top */}
                {isAdding && (
                  <tr>
                    {renderInlineForm()}
                  </tr>
                )}

                {cheques.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      {loading ? t("Loading...") : t("No cheques found")}
                    </td>
                  </tr>
                )}

                {cheques.map((cheque, index) => {
                  const cId = cheque.id || cheque.uuid;
                  return (
                    <React.Fragment key={cId}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{cheque.cheque_number || cheque.chequeNo || '-'}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{cheque.date || '-'}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{getClientName(cheque.client)}</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{cheque.bank_name || cheque.bank || '-'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: '600' }}>{parseFloat(cheque.amount || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button 
                              onClick={() => handleEditClick(cheque)}
                              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                              title={t("Edit")}
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(cId)}
                              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                              title={t("Delete")}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Inline Edit Form */}
                      {editingId === cId && (
                        <tr>
                          {renderInlineForm()}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientChequeSchedule;
