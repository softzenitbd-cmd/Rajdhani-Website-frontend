import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, X, Calendar, Clock, Barcode, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddOptionModal from '../../components/AddOptionModal';
import { crmService } from '../../services/crmService';
import { productService } from '../../services/productService';
import { accountingService } from '../../services/accountingService';
import { saleService } from '../../services/saleService';

const InvoiceCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);

  const [formData, setFormData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    barcode: '',
    productId: '',
    totalBalanceAcc: '',
    cashSellAcc: '',
    receiveAmount: '0',
    sms: false
  });
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTotalBalanceAccModalOpen, setIsTotalBalanceAccModalOpen] = useState(false);
  const [isCashSellAccModalOpen, setIsCashSellAccModalOpen] = useState(false);




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
    } catch (err) {
      console.error("Error loading prerequisites for invoice:", err);
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
          stock: prod.stock || prod.quantity || 100,
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
        alert(`Product with barcode "${code}" not found.`);
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

  // Calculations
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const invoiceBill = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const totalBill = invoiceBill + dueAmount;
  const paymentAmt = Number(formData.receiveAmount || 0);
  const totalDue = Math.max(0, totalBill - paymentAmt);

  const handleSaveInvoice = async (status = 1, shouldPrint = false) => {
    if (!formData.clientId) {
      alert("Please select a customer / client.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one product item.");
      return;
    }

    const payload = {
      client: formData.clientId,
      discount: "0.00",
      discount_type: "percentage",
      transport_fare: "0.00",
      labour_cost: "0.00",
      vat: "0.00",
      vat_type: "percentage",
      invoice_bill: invoiceBill.toFixed(2),
      total_vat: "0.00",
      total_discount: "0.00",
      grand_total: invoiceBill.toFixed(2),
      receive_amount: paymentAmt.toFixed(2),
      total_due: totalDue.toFixed(2),
      account_id: formData.totalBalanceAcc || "TOTAL BALENCE",
      category_id: formData.cashSellAcc || "CASH SELL",
      status: status,
      items: items.map(item => ({
        product: item.id,
        quantity: String(item.quantity),
        selling_price: Number(item.price).toFixed(2),
        total_selling_price: (Number(item.price) * Number(item.quantity)).toFixed(2)
      }))
    };

    try {
      const created = await saleService.createSalesInvoice(payload);
      if (status === 0) {
        alert("Draft Invoice Saved Successfully!");
        navigate('/invoice/draft');
      } else {
        alert("Sales Invoice Created Successfully!");
        // hand the created invoice to the list page which opens the printable receipt
        navigate('/invoice/list', { state: shouldPrint ? { printInvoice: created?.data || created } : undefined });
      }
    } catch (err) {
      console.error("Error creating sales invoice:", err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to save invoice via API.";
      alert(`API Error: ${errMsg}`);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '12px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold' }}>
            ADD INVOICE | CTRL + S = SAVE | ALT + S = SAVE & PRINT | CTRL + D = ড্রাফ্ট হিসেবে সংরক্ষণ
          </h2>
        </div>

        <div className="premium-body" style={{ background: 'white', paddingTop: '16px' }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Top Row */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '8px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="clientId" value={formData.clientId} onChange={handleChange}>
                    <option value="">Select Customer / Client</option>
                    <option value="C.CASTOMER">C.CASTOMER (Default)</option>
                    {(clients || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.company_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.clientId && (
                    <button type="button" className="clear-btn" onClick={() => clearField('clientId')}><X size={16} /></button>
                  )}
                  <button type="button" className="append-btn" onClick={() => setIsClientModalOpen(true)}><Plus size={20} /></button>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', color: '#0ea5e9' }}>
                  Due: ৳ {dueAmount.toFixed(2)}
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative', marginBottom: '0' }}>
                <div className="badge-date" style={{ background: 'var(--info)' }}><Calendar size={12} /> Issued Date</div>
                <input type="date" name="date" className="input-date" value={formData.date} onChange={handleChange} />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" name="time" value={formData.time} onChange={handleChange} style={{ width: '100%', padding: '12px', paddingRight: '40px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }} />
                  <Clock size={16} style={{ position: 'absolute', right: '12px', color: '#94a3b8' }} />
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group" style={{ marginBottom: '0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '4px' }}>Barcode Number</div>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', background: 'var(--card-border)' }}>
                  <div style={{ padding: '12px', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                    <Barcode size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input 
                    type="text" 
                    name="barcode" 
                    placeholder="Scan Barcode & Press Enter" 
                    value={formData.barcode} 
                    onChange={handleChange} 
                    onKeyDown={handleBarcodeKeyDown}
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', background: 'transparent' }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="productId" value={formData.productId} onChange={handleChange}>
                    <option value="">Select Product</option>
                    {(products || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title} {p.code || p.barcode ? `[${p.code || p.barcode}]` : ''} - ৳{p.sales_price || p.price || 0}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="append-btn" onClick={() => setIsProductModalOpen(true)}><Plus size={20} /></button>
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div style={{ border: '1px solid #e2e8f0', marginBottom: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'center' }}>SL</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>PRODUCT</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>STOCK</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '120px' }}>PRICE</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>QUANTITY</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>UNIT</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>TOTAL</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No items added yet. Select a product from dropdown or scan barcode.
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
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'center', fontSize: '13px', marginBottom: '24px', fontWeight: 'bold' }}>
              Total Quantity: {totalQuantity}
            </div>

            {/* Bottom Section */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
              {/* Left Column - Accounts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-with-append">
                  <select name="totalBalanceAcc" value={formData.totalBalanceAcc} onChange={handleChange}>
                    <option value="">Select Account (Total Balance)</option>
                    <option value="TOTAL BALENCE">TOTAL BALENCE</option>
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {formData.totalBalanceAcc && (
                    <button type="button" className="clear-btn" onClick={() => clearField('totalBalanceAcc')}><X size={16} /></button>
                  )}
                  <button type="button" className="append-btn" onClick={() => setIsTotalBalanceAccModalOpen(true)}><Plus size={20} /></button>
                </div>
                
                <div className="input-with-append">
                  <select name="cashSellAcc" value={formData.cashSellAcc} onChange={handleChange}>
                    <option value="">Select Sales / Cash Account</option>
                    <option value="CASH SELL">CASH SELL</option>
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {formData.cashSellAcc && (
                    <button type="button" className="clear-btn" onClick={() => clearField('cashSellAcc')}><X size={16} /></button>
                  )}
                  <button type="button" className="append-btn" onClick={() => setIsCashSellAccModalOpen(true)}><Plus size={20} /></button>
                </div>

                <div style={{ position: 'relative' }}>
                  <div className="badge-date" style={{ background: 'var(--info)' }}> Receive Amount</div>
                  <input type="number" step="0.01" name="receiveAmount" className="input-date" value={formData.receiveAmount} onChange={handleChange} style={{ fontWeight: 'bold', fontSize: '15px' }} />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <span>Invoice Bill</span>
                    <span style={{ fontWeight: 'bold' }}>: ৳ {invoiceBill.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <span>Previous Due</span>
                    <span>: ৳ {dueAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>Total Bill</span>
                    <span style={{ color: '#2563eb' }}>: ৳ {totalBill.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' }}>
                    <span>Payment</span>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>: ৳ {paymentAmt.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                    <span>Total Due</span>
                    <span>: ৳ {totalDue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="toggle-switch" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 16px', display: 'flex', alignItems: 'center', background: 'white' }}>
                  <MessageSquare size={18} style={{ color: '#111827', marginRight: '8px' }} />
                  <div className="toggle-label" style={{ flex: 1, fontWeight: 'bold' }}>SMS</div>
                  <label className="switch">
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn-danger" onClick={() => navigate('/invoice/list')} style={{ background: 'var(--danger)', padding: '10px 24px', fontSize: '14px', borderRadius: '4px' }}>
                Cancel
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(0)} style={{ background: '#64748b', padding: '10px 24px', fontSize: '14px', borderRadius: '4px' }}>
                  Save As Draft
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(1, true)} style={{ background: '#3b82f6', padding: '10px 24px', fontSize: '14px', borderRadius: '4px' }}>
                  Save & Print
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(1)} style={{ background: 'var(--success)', padding: '10px 24px', fontSize: '14px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Add Invoice
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <AddOptionModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (val) => { 
          if (val?.trim()) {
            try {
              const created = await crmService.createClient({ name: val.trim(), phone: '', address: '' }).catch(() => null);
              const newObj = { id: created?.id || `client-${Date.now()}`, name: val.trim() };
              setClients(prev => [...prev, newObj]);
              setFormData(prev => ({ ...prev, clientId: newObj.id }));
            } catch (err) {
              console.error("Error creating client:", err);
              const fallback = { id: `client-${Date.now()}`, name: val.trim() };
              setClients(prev => [...prev, fallback]);
              setFormData(prev => ({ ...prev, clientId: fallback.id }));
            }
          }
          setIsClientModalOpen(false); 
        }}
        title="Add Client"
        label="Client Name"
      />
      <AddOptionModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={async (val) => { 
          if (val?.trim()) {
            try {
              const created = await productService.createProduct({ name: val.trim(), sales_price: 0, stock: 100 }).catch(() => null);
              const newProd = { id: created?.id || `prod-${Date.now()}`, name: val.trim(), sales_price: 0, stock: 100, unit: 'Pcs' };
              setProducts(prev => [...prev, newProd]);
              handleSelectProduct(newProd.id);
            } catch (err) {
              console.error("Error creating product:", err);
              const fallbackProd = { id: `prod-${Date.now()}`, name: val.trim(), sales_price: 0, stock: 100, unit: 'Pcs' };
              setProducts(prev => [...prev, fallbackProd]);
              handleSelectProduct(fallbackProd.id);
            }
          }
          setIsProductModalOpen(false); 
        }}
        title="Add Product"
        label="Product Name"
      />
      <AddOptionModal 
        isOpen={isTotalBalanceAccModalOpen}
        onClose={() => setIsTotalBalanceAccModalOpen(false)}
        onSave={async (val) => { 
          if (val?.trim()) {
            try {
              const created = await accountingService.createAccount({ name: val.trim() }).catch(() => null);
              const newAcc = { id: created?.id || val.trim(), name: val.trim() };
              setAccounts(prev => [...prev, newAcc]);
              setFormData(prev => ({ ...prev, totalBalanceAcc: newAcc.id }));
            } catch (err) {
              console.error("Error creating account:", err);
              const fallbackAcc = { id: val.trim(), name: val.trim() };
              setAccounts(prev => [...prev, fallbackAcc]);
              setFormData(prev => ({ ...prev, totalBalanceAcc: fallbackAcc.id }));
            }
          }
          setIsTotalBalanceAccModalOpen(false); 
        }}
        title="Add Account"
        label="Account Name"
      />
      <AddOptionModal 
        isOpen={isCashSellAccModalOpen}
        onClose={() => setIsCashSellAccModalOpen(false)}
        onSave={async (val) => { 
          if (val?.trim()) {
            try {
              const created = await accountingService.createAccount({ name: val.trim() }).catch(() => null);
              const newAcc = { id: created?.id || val.trim(), name: val.trim() };
              setAccounts(prev => [...prev, newAcc]);
              setFormData(prev => ({ ...prev, cashSellAcc: newAcc.id }));
            } catch (err) {
              console.error("Error creating account:", err);
              const fallbackAcc = { id: val.trim(), name: val.trim() };
              setAccounts(prev => [...prev, fallbackAcc]);
              setFormData(prev => ({ ...prev, cashSellAcc: fallbackAcc.id }));
            }
          }
          setIsCashSellAccModalOpen(false); 
        }}
        title="Add Account"
        label="Account Name"
      />
    </div>
  );
};

export default InvoiceCreate;
