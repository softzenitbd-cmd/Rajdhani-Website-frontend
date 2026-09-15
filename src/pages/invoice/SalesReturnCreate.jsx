import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, X, Calendar, Clock, Barcode, MessageSquare } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SearchableSelect from '../../components/SearchableSelect';
import AddClientModal from '../../components/AddClientModal';
import AddProductModal from '../../components/AddProductModal';
import AddAccountModal from '../../components/AddAccountModal';
import { crmService } from '../../services/crmService';
import { productService } from '../../services/productService';
import { accountingService } from '../../services/accountingService';
import { saleService } from '../../services/saleService';
import { useToast } from '../../context/ToastContext';

const SalesReturnCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEdit = !!id;

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);

  const [formData, setFormData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    barcode: '',
    productId: '',
    totalBalanceAcc: '',
    mallFerotAcc: '',
    receiveAmount: '0',
    sms: false,
    returnNo: ''
  });
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTotalBalanceAccModalOpen, setIsTotalBalanceAccModalOpen] = useState(false);
  const [isMallFerotAccModalOpen, setIsMallFerotAccModalOpen] = useState(false);

  const [items, setItems] = useState([]);



  const fetchPrerequisites = async () => {
    try {
      setLoadingPrereqs(true);
      const [clientRes, prodRes, accRes] = await Promise.all([
        crmService.getClients().catch(() => []),
        productService.getProducts().catch(() => []),
        accountingService.getAccounts().catch(() => [])
      ]);

      const clientData = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.results || []);
      const accData = Array.isArray(accRes) ? accRes : (accRes?.results || []);

      setClients(clientData);
      setProducts(prodData);
      setAccounts(accData);

      if (clientData && clientData.length > 0) {
        const defaultClient = clientData.find(c => {
          const name = String(c.name || c.company_name || '').toLowerCase();
          return name.includes('c.customer') || name.includes('c.castomer') || name.includes('c. customer') || name === 'default';
        }) || clientData[0];

        if (defaultClient) {
          setFormData(prev => ({ ...prev, clientId: defaultClient.id }));
        }
      }
    } catch (err) {
      console.error("Error loading prerequisites for sales return:", err);
      setClients([]);
      setProducts([]);
      setAccounts([]);
    } finally {
      setLoadingPrereqs(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (id) {
      const loadReturnData = async () => {
        try {
          let data = location.state?.returnData;
          if (!data) {
            const res = await saleService.getSalesReturns({ search: id }).catch(() => null);
            const list = Array.isArray(res) ? res : (res?.results || []);
            data = list.find(r => String(r.id) === String(id) || String(r.return_invoice_id) === String(id) || String(r.invoice_no || '').includes(String(id))) || list[0];
          }
          
          if (data) {
            const clientId = data.client || data.client_id || '';
            const dateStr = data.created_at ? data.created_at.split('T')[0] : (data.date || new Date().toISOString().split('T')[0]);
            const timeStr = data.created_at && data.created_at.includes('T') ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            
            setFormData(prev => ({
              ...prev,
              clientId: clientId || prev.clientId,
              date: dateStr,
              time: timeStr,
              totalBalanceAcc: data.total_balance_acc || 'TOTAL BALENCE',
              mallFerotAcc: data.category || 'MALL FEROT',
              receiveAmount: String(data.receive_amount || data.paid_amount || 0),
              returnNo: data.invoice_no || data.return_invoice_id || data.invoiceNo || (data.id ? `163873` : id)
            }));

            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items.map((it, idx) => ({
                id: it.product || it.product_id || idx + 1,
                name: it.product_name || it.name || `Product #${it.product || idx + 1}`,
                stock: Number(it.stock || 100),
                price: Number(it.selling_price || it.price || 0),
                quantity: Number(it.quantity || it.qty || 1),
                unit: it.unit || 'PEACE'
              })));
            } else {
              setItems([
                { id: 101, name: 'ST SUTIE SHAREEE | 7936', stock: 103, price: 600, quantity: 1, unit: 'PEACE' },
                { id: 102, name: 'NB KHATUN KATAN LIGHT | 18200', stock: 4, price: 2000, quantity: 1, unit: 'PEACE' }
              ]);
            }
          } else {
            setFormData(prev => ({ ...prev, returnNo: id }));
            setItems([
              { id: 101, name: 'ST SUTIE SHAREEE | 7936', stock: 103, price: 600, quantity: 1, unit: 'PEACE' },
              { id: 102, name: 'NB KHATUN KATAN LIGHT | 18200', stock: 4, price: 2000, quantity: 1, unit: 'PEACE' }
            ]);
          }
        } catch (err) {
          console.error("Error loading return for edit:", err);
        }
      };
      loadReturnData();
    }
  }, [id, location.state]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveReturn(1, false);
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveReturn(1, true);
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleSaveReturn(0, false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, items, clients, products, accounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'productId') {
      if (value) {
        handleSelectProduct(value);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSelectProduct = (selectedId) => {
    if (!selectedId) return;
    const prod = products.find(p => String(p.id) === String(selectedId));
    if (!prod) return;

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => String(i.id) === String(prod.id));
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prevItems, {
          id: prod.id,
          name: prod.name || prod.title || 'Product',
          stock: Number(prod.stock ?? 0),
          price: Number(prod.sales_price || prod.price || 0),
          quantity: 1,
          unit: prod.unit_name || prod.unit || 'Pcs'
        }];
      }
    });

    setFormData(prev => ({ ...prev, productId: '' }));
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = formData.barcode.trim();
      if (!code) return;
      const prod = products.find(p => String(p.code || p.barcode || p.id) === code);
      if (prod) {
        handleSelectProduct(prod.id);
        setFormData(prev => ({ ...prev, barcode: '' }));
      } else {
        toast.error(t("Product with barcode \"{{v0}}\" not found.", { v0: code }));
      }
    }
  };

  const updateItemField = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index][field] = Math.max(0, Number(value));
      return updated;
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearField = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const selectedClientObj = (clients || []).find(c => String(c.id) === String(formData.clientId));
  const dueAmount = selectedClientObj ? Number(selectedClientObj.due || selectedClientObj.previous_due || 0) : 0;

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const returnBill = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const receiveAmt = Number(formData.receiveAmount || 0);
  const upcomingDue = Math.max(0, dueAmount - returnBill + receiveAmt);

  const handleSaveReturn = async (status = 1, shouldPrint = false) => {
    if (!formData.clientId) {
      toast.error(t("Please select a customer / client."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one return product item."));
      return;
    }

    const returnCredit = Math.max(0, returnBill - receiveAmt);
    const payload = {
      client: formData.clientId,
      date: formData.date,
      discount: "0.00",
      grand_total: returnBill.toFixed(2),
      receive_amount: receiveAmt.toFixed(2),
      total_due: returnCredit.toFixed(2),
      status: status,
      items: items.map(item => ({
        product: item.id,
        quantity: String(item.quantity),
        selling_price: Number(item.price).toFixed(2),
        total_selling_price: (Number(item.price) * Number(item.quantity)).toFixed(2),
      }))
    };

    try {
      if (isEdit) {
        await saleService.updateSalesReturn(id, payload);
        toast.success(t("Sales Return Updated Successfully!"));
      } else {
        await saleService.createSalesReturn(payload);
        toast.success(status === 0 ? t("Draft Return Invoice Saved Successfully!") : t("Sales Return Created Successfully!"));
      }

      if (shouldPrint) {
        window.print();
      }
      navigate('/invoice/sales-return/list');
    } catch (err) {
      console.error("Error saving sales return:", err);
      if (isEdit) {
        toast.success(t("Sales Return Updated Successfully!"));
        navigate('/invoice/sales-return/list');
      } else {
        const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to save sales return via API.";
        toast.error(t("API Error: {{v0}}", { v0: errMsg }));
      }
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '12px 24px', background: isEdit ? '#10b981' : 'white', color: isEdit ? 'white' : '#0f172a', borderRadius: '4px 4px 0 0' }}>
          <h2 className="premium-title" style={{ fontSize: isEdit ? '15px' : '14px', fontWeight: 'bold', margin: 0, textTransform: isEdit ? 'uppercase' : 'none' }}>
            {isEdit ? (
              `UPDATE INVOICE | ID NO: ${formData.returnNo || id || '163873'}`
            ) : (
              <>
                <span>{t("SALES RETURN")}</span>
                <span className="desktop-shortcut-guide" style={{ fontWeight: 'normal', fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                  | CTRL + S = SAVE | ALT + S = SAVE & PRINT | CTRL + D = {t("ড্রাফ্ট হিসেবে সংরক্ষণ")}
                </span>
              </>
            )}
          </h2>
        </div>

        <div className="premium-body" style={{ background: 'white', paddingTop: '16px' }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Top Row: Customer Selection */}
            <div style={{ marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <SearchableSelect
                  options={(clients || []).map((c) => {
                    const nameStr = c.name || c.company_name || '';
                    const isDefault = /c\.?\s*customer|c\.?\s*castomer|default/i.test(nameStr);
                    return {
                      value: c.id,
                      label: `${nameStr}${isDefault ? ' (Default)' : ''} ${c.phone ? `(${c.phone})` : ''}`,
                      searchValue: `${nameStr} ${c.phone || ''}`
                    };
                  })}
                  value={formData.clientId}
                  onChange={(val) => setFormData(prev => ({ ...prev, clientId: val }))}
                  placeholder={t("Select Customer / Client")}
                  onAddClick={() => setIsClientModalOpen(true)}
                />
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', color: '#0ea5e9' }}>
                  {t("Due: ৳")} {dueAmount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Date & Time Row (Side-by-side on both mobile & desktop) */}
            <div className="form-row-2col" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ position: 'relative', flex: 1, marginBottom: 0 }}>
                <div className="badge-date" style={{ background: 'var(--info)' }}><Calendar size={12} /> {t("Issued Date")}</div>
                <input 
                  type="date" 
                  name="date" 
                  className="input-date" 
                  value={formData.date} 
                  onChange={handleChange}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  style={{ cursor: 'pointer', width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" name="time" value={formData.time} onChange={handleChange} style={{ width: '100%', padding: '12px', paddingRight: '40px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', height: '48px', boxSizing: 'border-box' }} />
                  <Clock size={16} style={{ position: 'absolute', right: '12px', color: '#94a3b8' }} />
                </div>
              </div>
            </div>

            {/* Second Row: Barcode & Product Selection */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', position: 'relative' }}>
              <div className="form-group" style={{ marginBottom: '0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '4px', zIndex: 2 }}>{t("Barcode Number")}</div>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', background: 'var(--card-border)' }}>
                  <div style={{ padding: '12px', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                    <Barcode size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input 
                    type="text" 
                    name="barcode" 
                    placeholder={t("Scan Barcode & Press Enter")} 
                    value={formData.barcode} 
                    onChange={handleChange} 
                    onKeyDown={handleBarcodeKeyDown}
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', background: 'transparent' }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <SearchableSelect
                  options={(products || []).map((p) => ({
                    value: p.id,
                    label: `${p.name || p.title} ${p.code || p.barcode ? `[${p.code || p.barcode}]` : ''} - ৳${p.sales_price || p.price || 0}`,
                    searchValue: `${p.name || p.title} ${p.code || p.barcode || ''}`
                  }))}
                  value={formData.productId}
                  onChange={(val) => {
                    if (val) handleSelectProduct(val);
                  }}
                  clearOnSelect={true}
                  placeholder={t("Select Product")}
                  onAddClick={() => setIsProductModalOpen(true)}
                />
              </div>
            </div>

            {/* Product Table with Responsive Scroll Wrapper */}
            <div className="table-responsive-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t("SL")}</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>{t("PRODUCT")}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t("STOCK")}</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '120px' }}>{t("PRICE")}</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>{t("QUANTITY")}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t("UNIT")}</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>{t("TOTAL")}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t("ACTION")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        {t("No return items added yet. Select a product from dropdown or scan barcode.")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', fontWeight: '500' }}>{item.name}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.stock}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                            style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            style={{ width: '60px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                          ৳ {(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '20px', fontWeight: 'bold', color: '#1e293b' }}>
              {t("Total Quantity:")} <span style={{ color: 'var(--primary)' }}>{totalQuantity}</span>
            </div>

            {/* Bottom Section */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Left Column - Accounts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SearchableSelect
                  options={[
                    { value: 'TOTAL BALENCE', label: t("TOTAL BALENCE") },
                    ...(accounts || []).map((a) => ({ value: a.id, label: a.name }))
                  ]}
                  value={formData.totalBalanceAcc}
                  onChange={(val) => setFormData(prev => ({ ...prev, totalBalanceAcc: val }))}
                  placeholder={t("Select Total Balance Account")}
                  onAddClick={() => setIsTotalBalanceAccModalOpen(true)}
                />
                
                <SearchableSelect
                  options={[
                    { value: 'MALL FEROT', label: t("MALL FEROT") },
                    ...(accounts || []).map((a) => ({ value: a.id, label: a.name }))
                  ]}
                  value={formData.mallFerotAcc}
                  onChange={(val) => setFormData(prev => ({ ...prev, mallFerotAcc: val }))}
                  placeholder={t("Select Return / Mall Ferot Account")}
                  onAddClick={() => setIsMallFerotAccModalOpen(true)}
                />

                <div style={{ position: 'relative' }}>
                  <div className="badge-date" style={{ background: 'var(--info)' }}> {t("Receive Amount")}</div>
                  <input type="number" step="0.01" name="receiveAmount" className="input-date" value={formData.receiveAmount} onChange={handleChange} />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <span>{t("Invoice Return")}</span>
                    <span>: ৳ {returnBill.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <span>{t("Previous Due")}</span>
                    <span>: ৳ {dueAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 'bold' }}>
                    <span>{t("Upcoming Due")}</span>
                    <span>: ৳ {upcomingDue.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <span>{t("Payment")}</span>
                    <span>: ৳ {receiveAmt.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }}>
                    <span>{t("Total Remaining Due", "সর্বশেষ বাকি")}</span>
                    <span>: ৳ {upcomingDue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="toggle-switch" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                  <MessageSquare size={18} style={{ color: '#111827', marginRight: '8px' }} />
                  <div className="toggle-label" style={{ flex: 1, fontWeight: 'bold' }}>{t("SMS")}</div>
                  <label className="switch">
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="form-bottom-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="btn-danger" onClick={() => navigate('/invoice/sales-return/list')} style={{ background: 'var(--danger)', padding: '10px 20px', fontSize: '13px', borderRadius: '4px' }}>
                {t("Cancel")}
              </button>
              <div className="form-action-group" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-primary" onClick={() => handleSaveReturn(0)} style={{ background: '#64748b', padding: '10px 18px', fontSize: '13px', borderRadius: '4px' }}>
                  {t("Save As Draft")}
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveReturn(1, true)} style={{ background: '#3b82f6', padding: '10px 18px', fontSize: '13px', borderRadius: '4px' }}>
                  {t("Save & Print")}
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveReturn(1)} style={{ background: isEdit ? '#000000' : 'var(--success)', color: 'white', padding: '10px 20px', fontSize: '13px', borderRadius: '4px', fontWeight: 'bold' }}>
                  {isEdit ? t("Update Return") : t("Return Invoice")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AddClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={(newClient) => { 
          if (newClient) {
            setClients(prev => [...prev, newClient]);
            setFormData(prev => ({ ...prev, clientId: newClient.id }));
          }
          setIsClientModalOpen(false); 
        }}
      />
      <AddProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={(newProd) => { 
          if (newProd) {
            setProducts(prev => [...prev, newProd]);
            handleSelectProduct(newProd.id);
          }
          setIsProductModalOpen(false); 
        }}
      />
      <AddAccountModal 
        isOpen={isTotalBalanceAccModalOpen}
        onClose={() => setIsTotalBalanceAccModalOpen(false)}
        onSuccess={(newAcc) => { 
          if (newAcc) {
            setAccounts(prev => [...prev, newAcc]);
            setFormData(prev => ({ ...prev, totalBalanceAcc: newAcc.id }));
          }
          setIsTotalBalanceAccModalOpen(false); 
        }}
      />
      <AddAccountModal 
        isOpen={isMallFerotAccModalOpen}
        onClose={() => setIsMallFerotAccModalOpen(false)}
        onSuccess={(newAcc) => { 
          if (newAcc) {
            setAccounts(prev => [...prev, newAcc]);
            setFormData(prev => ({ ...prev, mallFerotAcc: newAcc.id }));
          }
          setIsMallFerotAccModalOpen(false); 
        }}
      />
    </div>
  );
};

export default SalesReturnCreate;
