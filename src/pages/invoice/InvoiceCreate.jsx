import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, X, Calendar, Clock, Barcode, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AddOptionModal from '../../components/AddOptionModal';
import AddClientModal from '../../components/AddClientModal';
import AddProductModal from '../../components/AddProductModal';
import AddAccountModal from '../../components/AddAccountModal';
import SearchableSelect from '../../components/SearchableSelect';
import { crmService } from '../../services/crmService';
import { productService } from '../../services/productService';
import { accountingService } from '../../services/accountingService';
import { saleService } from '../../services/saleService';
import { useToast } from '../../context/ToastContext';

const InvoiceCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

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
    discountAmount: '0',
    receiveAmount: '0',
    sms: false
  });
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTotalBalanceAccModalOpen, setIsTotalBalanceAccModalOpen] = useState(false);
  const [isCashSellAccModalOpen, setIsCashSellAccModalOpen] = useState(false);

  const populateInvoiceData = (invData, currentProducts = products) => {
    if (!invData) return;
    setIsReceiveAmountManuallyEdited(true);
    setFormData(prev => ({
      ...prev,
      clientId: invData.client || invData.client_id || invData.clientName || prev.clientId,
      date: invData.date || (invData.created_at ? invData.created_at.split('T')[0] : prev.date),
      totalBalanceAcc: invData.account_id || invData.account || prev.totalBalanceAcc,
      cashSellAcc: invData.category_id || invData.category || prev.cashSellAcc,
      discountAmount: String(invData.discount || invData.total_discount || '0'),
      receiveAmount: String(invData.receive_amount || invData.receiveAmount || invData.paid || '0')
    }));

    const rawItems = invData.items || invData.invoice_items || invData.sale_items || [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const mappedItems = rawItems.map(item => {
        const prodId = typeof item.product === 'object' ? item.product?.id : (item.product || item.product_id || item.id);
        const matchingProd = (currentProducts || []).find(p => String(p.id) === String(prodId));

        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(
          item.selling_price ||
          item.price ||
          item.sales_price ||
          item.rate ||
          matchingProd?.sales_price ||
          matchingProd?.price ||
          (item.total_selling_price ? Number(item.total_selling_price) / qty : 0) ||
          0
        );

        const name = (
          item.name ||
          item.product_name ||
          (typeof item.product === 'object' ? (item.product?.name || item.product?.title) : null) ||
          matchingProd?.name ||
          matchingProd?.title ||
          `Product #${prodId}`
        );

        const stock = Number(item.stock ?? matchingProd?.stock ?? 0);
        const unit = item.unit || matchingProd?.unit_name || matchingProd?.unit || 'Pcs';

        return {
          id: prodId || `item-${Date.now()}-${Math.random()}`,
          name: name,
          stock: stock,
          price: price,
          quantity: qty,
          unit: unit
        };
      });
      setItems(mappedItems);
    }
  };

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

      if (isEditMode) {
        if (location.state?.invoice) {
          populateInvoiceData(location.state.invoice, prodData);
        } else {
          try {
            const invRes = await saleService.getSalesInvoiceById(id);
            if (invRes) {
              populateInvoiceData(invRes, prodData);
            }
          } catch (err) {
            console.error("Error fetching invoice for edit:", err);
          }
        }
      } else if (clientData && clientData.length > 0) {
        const defaultClient = clientData.find(c => {
          const name = String(c.name || c.company_name || '').toLowerCase();
          return name.includes('c.customer') || name.includes('c.castomer') || name.includes('c. customer') || name === 'default';
        }) || clientData[0];

        if (defaultClient) {
          setFormData(prev => ({ ...prev, clientId: defaultClient.id }));
        }
      }
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
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveInvoice(1, false);
      } else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveInvoice(1, true);
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleSaveInvoice(0, false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, items, clients, products, accounts]);

  const [isReceiveAmountManuallyEdited, setIsReceiveAmountManuallyEdited] = useState(false);

  useEffect(() => {
    if (!isReceiveAmountManuallyEdited) {
      const calculatedInvoiceBill = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
      const calculatedDiscount = Math.max(0, Number(formData.discountAmount || 0));
      const calculatedNet = Math.max(0, calculatedInvoiceBill - calculatedDiscount);
      setFormData(prev => ({ ...prev, receiveAmount: String(calculatedNet) }));
    }
  }, [items, formData.discountAmount, isReceiveAmountManuallyEdited]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'productId') {
      if (value) {
        handleSelectProduct(value);
      }
    } else {
      if (name === 'receiveAmount') {
        setIsReceiveAmountManuallyEdited(true);
      }
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
      const code = e.target.value.trim();
      if (!code) return;
      const prod = products.find(p => 
        String(p.code) === code || 
        String(p.barcode) === code || 
        String(p.custom_barcode_no) === code ||
        String(p.id) === code ||
        String(p.product_code) === code
      );
      if (prod) {
        handleSelectProduct(prod.id);
      } else {
        toast.error(t("Product with barcode \"{{v0}}\" not found.", { v0: code }));
      }
      setFormData(prev => ({ ...prev, barcode: '' }));
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
  const discountAmt = Math.max(0, Number(formData.discountAmount || 0));
  const netInvoiceBill = Math.max(0, invoiceBill - discountAmt);
  const totalBill = netInvoiceBill + dueAmount;
  const paymentAmt = Number(formData.receiveAmount || 0);
  const totalDue = Math.max(0, totalBill - paymentAmt);

  const handleSaveInvoice = async (status = 1, shouldPrint = false) => {
    if (!formData.clientId) {
      toast.error(t("Please select a customer / client."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one product item."));
      return;
    }

    // POST /api/sale/invoices/ (see sale-api-instructions.md)
    const payload = {
      client: formData.clientId,
      date: formData.date,
      discount: discountAmt.toFixed(2),
      discount_type: "flat",
      transport_fare: "0.00",
      labour_cost: "0.00",
      vat: "0.00",
      vat_type: "percentage",
      invoice_bill: invoiceBill.toFixed(2),
      total_vat: "0.00",
      total_discount: discountAmt.toFixed(2),
      grand_total: netInvoiceBill.toFixed(2),
      previous_due: dueAmount.toFixed(2),
      total_bill: totalBill.toFixed(2),
      receive_amount: paymentAmt.toFixed(2),
      total_due: totalDue.toFixed(2),
      account_id: formData.totalBalanceAcc || "TOTAL BALENCE",
      category_id: formData.cashSellAcc || "CASH SELL",
      status: status,
      items: items.map(item => ({
        product: item.id,
        product_id: item.id,
        name: item.name,
        product_name: item.name,
        quantity: String(item.quantity),
        selling_price: Number(item.price).toFixed(2),
        total_selling_price: (Number(item.price) * Number(item.quantity)).toFixed(2)
      }))
    };

    try {
      let result;
      if (isEditMode) {
        result = await saleService.updateSalesInvoice(id, payload);
      } else {
        result = await saleService.createSalesInvoice(payload);
      }

      const clientObj = (clients || []).find(c => String(c.id) === String(formData.clientId));
      const accObj = (accounts || []).find(a => String(a.id) === String(formData.cashSellAcc));

      const savedInvoiceObj = {
        ...payload,
        id: result?.id || result?.data?.id || id || `INV-${Date.now()}`,
        invoice_id: result?.invoice_id || result?.data?.invoice_id || `INV-${id || Date.now()}`,
        client_name: clientObj ? (clientObj.name || clientObj.company_name) : (formData.clientId === 'C.CASTOMER' ? 'C.CUSTOMER' : formData.clientId),
        category_name: accObj ? accObj.name : (formData.cashSellAcc || 'CASH SELL'),
        date: formData.date
      };

      if (status === 0) {
        toast.success(isEditMode ? t("Draft Invoice Updated Successfully!") : t("Draft Invoice Saved Successfully!"));
        navigate('/invoice/draft');
      } else {
        toast.success(isEditMode ? t("Sales Invoice Updated Successfully!") : t("Sales Invoice Created Successfully!"));
        navigate('/invoice/list', { state: { printInvoice: savedInvoiceObj, shouldPrint } });
      }
    } catch (err) {
      console.error("Error saving sales invoice:", err);
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to save invoice via API.";
      toast.error(t("API Error: {{v0}}", { v0: errMsg }));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '12px 24px', background: 'white' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
            {t('invoice.top_banner_shortcut', 'ADD INVOICE | CTRL + S = SAVE | ALT + S = SAVE & PRINT | CTRL + D = SAVE AS DRAFT')}
          </h2>
        </div>

        <div className="premium-body" style={{ background: 'white', paddingTop: '16px' }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Top Row */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '8px' }}>
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
                  placeholder={t('invoice.select_customer', 'Select Customer / Client')}
                  onAddClick={() => setIsClientModalOpen(true)}
                />
                <div style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', marginTop: '4px', color: '#0ea5e9' }}>
                  {t('common.due', 'Due')}: ৳ {dueAmount.toFixed(2)}
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative', marginBottom: '0' }}>
                <div className="badge-date" style={{ background: 'var(--info)' }}><Calendar size={12} /> {t('invoice.issued_date', 'Issued Date')}</div>
                <input 
                  type="date" 
                  name="date" 
                  className="input-date" 
                  value={formData.date} 
                  onChange={handleChange}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  style={{ cursor: 'pointer' }}
                />
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
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--primary)', color: 'white', padding: '2px 8px', fontSize: 'var(--fs-10, 10px)', borderRadius: '4px' }}>
                  {t('invoice.barcode_header', 'Barcode Number')}
                </div>
                <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden', background: 'var(--card-border)' }}>
                  <div style={{ padding: '12px', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
                    <Barcode size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <input 
                    type="text" 
                    name="barcode" 
                    placeholder={t('invoice.barcode_placeholder', 'Scan Barcode & Press Enter')}
                    value={formData.barcode} 
                    onChange={handleChange} 
                    onKeyDown={handleBarcodeKeyDown}
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', background: 'transparent' }} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <SearchableSelect
                  options={(products || []).map((p) => {
                    const barcode = p.custom_barcode_no || p.code || p.barcode || '';
                    return {
                      value: p.id,
                      label: `${p.name || p.title} ${barcode ? `[${barcode}]` : ''} - ৳${p.sales_price || p.price || 0}`,
                      searchValue: `${p.name || p.title} ${barcode}`
                    };
                  })}
                  value={formData.productId}
                  onChange={(val) => {
                    if (val) handleSelectProduct(val);
                  }}
                  clearOnSelect={true}
                  hideOptionsUntilSearch={true}
                  placeholder={t('invoice.select_product', 'Select Product')}
                  onAddClick={() => setIsProductModalOpen(true)}
                />
              </div>
            </div>

            {/* Product Table */}
            <div style={{ border: '1px solid #e2e8f0', marginBottom: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t('invoice.sl', 'SL')}</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>{t('invoice.product', 'PRODUCT')}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t('invoice.stock', 'STOCK')}</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '120px' }}>{t('invoice.price', 'PRICE')}</th>
                    <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>{t('invoice.quantity', 'QUANTITY')}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t('invoice.unit', 'UNIT')}</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>{t('invoice.total', 'TOTAL')}</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>{t('invoice.action', 'ACTION')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        {t('invoice.no_items', 'No items added yet. Select a product from dropdown or scan barcode.')}
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
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateItemField(idx, 'price', e.target.value)}
                            style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input
                            data-qty-idx={idx}
                            type="number"
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' && !e.shiftKey) {
                                const nextInput = document.querySelector(`input[data-qty-idx="${idx + 1}"]`);
                                if (nextInput) {
                                  e.preventDefault();
                                  nextInput.focus();
                                }
                              }
                            }}
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

            <div style={{ textAlign: 'center', fontSize: 'var(--fs-13, 13px)', marginBottom: '24px', fontWeight: 'bold' }}>
              {t('invoice.total_quantity', 'Total Quantity')}: {totalQuantity}
            </div>

            {/* Bottom Section */}
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
              {/* Left Column - Accounts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SearchableSelect
                  options={[
                    { value: 'TOTAL BALENCE', label: t("TOTAL BALENCE") },
                    ...(accounts || []).map((a) => ({ value: a.id, label: a.name }))
                  ]}
                  value={formData.totalBalanceAcc}
                  onChange={(val) => setFormData(prev => ({ ...prev, totalBalanceAcc: val }))}
                  placeholder={t('invoice.total_balance_acc', 'Select Account (Total Balance)')}
                  onAddClick={() => setIsTotalBalanceAccModalOpen(true)}
                />
                
                <SearchableSelect
                  options={[
                    { value: 'CASH SELL', label: t("CASH SELL") },
                    ...(accounts || []).map((a) => ({ value: a.id, label: a.name }))
                  ]}
                  value={formData.cashSellAcc}
                  onChange={(val) => setFormData(prev => ({ ...prev, cashSellAcc: val }))}
                  placeholder={t('invoice.cash_sell_acc', 'Select Sales / Cash Account')}
                  onAddClick={() => setIsCashSellAccModalOpen(true)}
                />

                <div style={{ position: 'relative' }}>
                  <div className="badge-date" style={{ background: '#dc2626' }}>{t('invoice.discount_amount', 'Discount Amount')}</div>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="discountAmount" 
                    className="input-date" 
                    value={formData.discountAmount} 
                    onChange={handleChange} 
                    placeholder="0.00"
                    style={{ fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)', color: '#dc2626' }} 
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <div className="badge-date" style={{ background: 'var(--info)' }}>{t('invoice.receive_amount', 'Receive Amount')}</div>
                  <input type="number" step="0.01" name="receiveAmount" className="input-date" value={formData.receiveAmount} onChange={handleChange} style={{ fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)' }} />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)' }}>
                    <span>{t('invoice.invoice_bill', 'Invoice Bill')}</span>
                    <span style={{ fontWeight: 'bold' }}>: ৳ {invoiceBill.toFixed(2)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)', color: '#dc2626', fontWeight: 'bold' }}>
                      <span>{t('invoice.discount_minus', 'Discount (-)')}</span>
                      <span>: ৳ {discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)' }}>
                    <span>{t('invoice.previous_due', 'Previous Due')}</span>
                    <span>: ৳ {dueAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>
                    <span>{t('invoice.total_bill', 'Total Bill')}</span>
                    <span style={{ color: '#2563eb' }}>: ৳ {totalBill.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)' }}>
                    <span>{t('invoice.payment', 'Payment')}</span>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>: ৳ {paymentAmt.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', color: '#ef4444' }}>
                    <span>{t('invoice.total_due', 'Total Due')}</span>
                    <span>: ৳ {totalDue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="toggle-switch" style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 16px', display: 'flex', alignItems: 'center', background: 'white' }}>
                  <MessageSquare size={18} style={{ color: '#111827', marginRight: '8px' }} />
                  <div className="toggle-label" style={{ flex: 1, fontWeight: 'bold' }}>{t('invoice.sms', 'SMS')}</div>
                  <label className="switch">
                    <input type="checkbox" name="sms" checked={formData.sms} onChange={handleChange} />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn-danger" onClick={() => navigate('/invoice/list')} style={{ background: 'var(--danger)', padding: '10px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }}>
                {t('invoice.cancel', 'Cancel')}
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(0)} style={{ background: '#64748b', padding: '10px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }}>
                  {t('invoice.save_draft', 'Save As Draft')}
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(1, true)} style={{ background: '#3b82f6', padding: '10px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }}>
                  {t('invoice.save_print', 'Save & Print')}
                </button>
                <button type="button" className="btn-primary" onClick={() => handleSaveInvoice(1)} style={{ background: 'var(--success)', padding: '10px 24px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px', fontWeight: 'bold' }}>
                  {t('invoice.add_invoice', 'Add Invoice')}
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
        isOpen={isCashSellAccModalOpen}
        onClose={() => setIsCashSellAccModalOpen(false)}
        onSuccess={(newAcc) => { 
          if (newAcc) {
            setAccounts(prev => [...prev, newAcc]);
            setFormData(prev => ({ ...prev, cashSellAcc: newAcc.id }));
          }
          setIsCashSellAccModalOpen(false); 
        }}
      />
    </div>
  );
};

export default InvoiceCreate;
