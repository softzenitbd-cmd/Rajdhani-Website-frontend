import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Trash2, Barcode, HelpCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import SearchableSelect from '../../components/SearchableSelect';
import AddOptionModal from '../../components/AddOptionModal';
import AddSupplierModal from '../../components/AddSupplierModal';
import AddProductModal from '../../components/AddProductModal';
import FormSettingsModal from '../../components/FormSettingsModal';
import { crmService } from '../../services/crmService';
import { productService } from '../../services/productService';
import { purchaseService } from '../../services/purchaseService';
import settingService from '../../services/settingService';
import { useToast } from '../../context/ToastContext';

const PurchaseCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    invoice_id: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    barcode: '',
    product: '',
    discount: '',
    discount_type: 'Percentage (%)',
    transport_fare: '',
    vat: '',
    vat_type: 'Percentage (%)',
    receive_amount: '',
    warehouse: '',
    account: '',
    category: '',
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);



  const fetchPrerequisites = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        crmService.getSuppliers().catch(() => null),
        productService.getProducts().catch(() => null)
      ]);

      const supData = Array.isArray(supRes) ? supRes : (supRes?.results || []);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.results || []);

      setSuppliers(supData);
      setProducts(prodData);
    } catch (err) {
      console.error("Error loading purchase prerequisites:", err);
      setSuppliers([]);
      setProducts([]);
    }
  };

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [visibleFields, setVisibleFields] = useState({
    invoice_id: true,
    date: true,
    supplier: true,
    warehouse: true,
    discount: true,
    transport_fare: true,
    vat: true,
    accounts: true,
    category: true,
    receive_amount: true
  });

  const loadFormSettings = async () => {
    try {
      const saved = await settingService.getFormSettings('purchase_create');
      if (saved && Object.keys(saved).length > 0) {
        const parsedSaved = {};
        for (const [key, value] of Object.entries(saved)) {
          if (value === 'false' || value === 'False' || value === 0) parsedSaved[key] = false;
          else if (value === 'true' || value === 'True' || value === 1) parsedSaved[key] = true;
          else parsedSaved[key] = value;
        }
        setVisibleFields(prev => ({ ...prev, ...parsedSaved }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
    loadFormSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'product') {
      if (value) {
        handleSelectProduct(value);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
          quantity: 1,
          buyingPrice: Number(prod.purchase_price || prod.buying_price || prod.price || 0),
          salePrice: Number(prod.sales_price || prod.selling_price || 0),
          barcode: prod.code || prod.barcode || "-"
        }];
      }
    });

    setFormData(prev => ({ ...prev, product: '' }));
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = e.target.value.trim();
      if (!code) return;
      const prod = products.find(p => 
        String(p.code) === code || 
        String(p.barcode) === code || 
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

  const handleAddSupplier = async (name) => {
    if (!name?.trim()) return;
    const supName = name.trim();
    try {
      const created = await crmService.createSupplier({ name: supName, phone: '', address: '' });
      const newSup = { ...created, id: created?.id || created?.uuid, name: created?.name || supName };
      setSuppliers(prev => [...prev, newSup]);
      setFormData(prev => ({ ...prev, supplier: newSup.id }));
      setIsSupplierModalOpen(false);
    } catch (err) {
      toast.error(t("Failed to create supplier: {{v0}}", { v0: err?.message || t("server error") }));
    }
  };

  const handleAddProduct = async (name) => {
    if (!name?.trim()) return;
    const prodName = name.trim();
    try {
      const created = await productService.createProduct({ name: prodName, purchase_price: 0, sales_price: 0 });
      const newProd = { purchase_price: 0, sales_price: 0, ...created, id: created?.id || created?.uuid, name: created?.name || prodName };
      setProducts(prev => [...prev, newProd]);
      handleSelectProduct(newProd.id);
      setIsProductModalOpen(false);
    } catch (err) {
      toast.error(t("Failed to create product: {{v0}}", { v0: err?.message || t("server error") }));
    }
  };

  const handleSubmitPurchase = async (status = 1, shouldPrint = false) => {
    if (!formData.supplier) {
      toast.error(t("Please select a supplier."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one product to purchase list."));
      return;
    }

    try {
      setSubmitting(true);
      // POST /api/purchase/invoices/ (see purchase-api-instructions.md)
      const payload = {
        supplier: formData.supplier,
        date: formData.date,
        discount: discountAmt.toFixed(2),
        discount_type: formData.discount_type === 'Flat' ? 'flat' : 'percentage',
        transport_fare: transportAmt.toFixed(2),
        vat: Number(formData.vat || 0).toFixed(2),
        vat_type: formData.vat_type === 'Flat' ? 'flat' : 'percentage',
        purchase_bill: totalBuying.toFixed(2),
        total_vat: '0.00',
        total_discount: discountAmt.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        receive_amount: paidAmt.toFixed(2),
        total_due: totalDue.toFixed(2),
        warehouse: formData.warehouse || "",
        account: formData.account || "",
        category: formData.category || "",
        status: status,
        items: items.map(i => ({
          product: i.id,
          quantity: String(i.quantity),
          buying_price: Number(i.buyingPrice).toFixed(2),
          selling_price: Number(i.salePrice).toFixed(2),
          total_buying_price: (Number(i.quantity) * Number(i.buyingPrice)).toFixed(2),
          total_selling_price: (Number(i.quantity) * Number(i.salePrice)).toFixed(2),
        }))
      };

      const created = await purchaseService.createPurchaseInvoice(payload);
      toast.success(t("Purchase invoice {{v0}}created successfully!", { v0: created?.invoice_id ? created.invoice_id + ' ' : '' }));
      
      if (shouldPrint) {
        navigate('/product/purchase/list', { state: { printPurchase: created?.id || true } });
      } else {
        navigate('/product/purchase/list');
      }
    } catch (err) {
      console.error("Error creating purchase:", err);
      toast.error(t("Failed to create purchase: {{v0}}", { v0: err?.message || t("server error") }));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const totalBuying = items.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.buyingPrice || 0)), 0);
  const totalSale = items.reduce((sum, i) => sum + (Number(i.quantity || 0) * Number(i.salePrice || 0)), 0);
  const discountAmt = Math.max(0, Number(formData.discount || 0)); // Note: if percentage, need to calc properly based on totalBuying
  const transportAmt = Math.max(0, Number(formData.transport_fare || 0));
  const vatAmt = Math.max(0, Number(formData.vat || 0));
  const grandTotal = Math.max(0, totalBuying - discountAmt + transportAmt + vatAmt);
  const paidAmt = Math.max(0, Number(formData.receive_amount || 0));
  const totalDue = Math.max(0, grandTotal - paidAmt);

  const BadgeLabel = ({ icon, text }) => (
    <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--info, #38bdf8)', color: 'white', fontSize: 'var(--fs-11, 11px)', padding: '2px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {icon} {text}
    </div>
  );

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {t("Purchase Create")}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              title={t("Form Settings")}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Top Row: Supplier, Date, Invoice ID */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {visibleFields.supplier !== false && (
                <div className="form-group" style={{ flex: '1 1 250px', marginBottom: '0' }}>
                  <SearchableSelect
                    options={suppliers.map(sup => ({
                      value: sup.id,
                      label: sup.name,
                      searchValue: sup.name
                    }))}
                    value={formData.supplier}
                    onChange={(val) => setFormData(prev => ({ ...prev, supplier: val }))}
                    placeholder={t("Select Suppliers")}
                    onAddClick={() => setIsSupplierModalOpen(true)}
                  />
                </div>
              )}

              {visibleFields.date !== false && (
                <div className="form-group" style={{ flex: '1 1 250px', position: 'relative', marginBottom: 0 }}>
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
              )}

              {visibleFields.invoice_id !== false && (
                <div className="form-group" style={{ flex: '1 1 250px', position: 'relative', marginBottom: 0 }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--primary)', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '4px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {t("Invoice ID No")}
                  </div>
                  <input 
                    type="text" 
                    name="invoice_id" 
                    value={formData.invoice_id} 
                    onChange={handleChange} 
                    placeholder={t("Invoice Id")} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', height: '48px', boxSizing: 'border-box' }} 
                  />
                </div>
              )}
            </div>

            {/* Additional Fields Row based on form settings */}
            {(visibleFields.warehouse !== false || visibleFields.category !== false || visibleFields.accounts !== false) && (
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {visibleFields.warehouse !== false && (
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0', position: 'relative', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <BadgeLabel text={t("Warehouse")} />
                      <input type="text" name="warehouse" value={formData.warehouse} onChange={handleChange} placeholder={t("Warehouse Name")} style={{ width: '100%', padding: '16px', border: 'none', background: 'transparent', outline: 'none' }} />
                    </div>
                )}
                {visibleFields.category !== false && (
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0', position: 'relative', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <BadgeLabel text={t("Category")} />
                      <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder={t("Category")} style={{ width: '100%', padding: '16px', border: 'none', background: 'transparent', outline: 'none' }} />
                    </div>
                )}
                {visibleFields.accounts !== false && (
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0', position: 'relative', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <BadgeLabel text={t("Account")} />
                      <input type="text" name="account" value={formData.account} onChange={handleChange} placeholder={t("Account Name")} style={{ width: '100%', padding: '16px', border: 'none', background: 'transparent', outline: 'none' }} />
                    </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', alignItems: 'start' }}>
              {/* Barcode Number */}
              <div className="form-group" style={{ marginBottom: '0', position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px', background: 'white' }}>
                <BadgeLabel text={t("Barcode Number")} />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ padding: '0 16px', color: 'var(--text-muted)' }}>
                    <Barcode size={24} />
                  </div>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder={t("Barcode Number")}
                    style={{ flex: 1, padding: '16px 16px 16px 0', border: 'none', outline: 'none', background: 'transparent', color: '#334155' }}
                  />
                </div>
              </div>

              {/* Select Product */}
              <div className="form-group" style={{ marginBottom: '40px', position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px', padding: '8px 16px' }}>
                <BadgeLabel text={t("Product Name")} />
                <SearchableSelect
                  searchPlaceholder={t("Search by product name or barcode...")}
                  options={(products || []).map(p => ({
                    value: p.id,
                    label: `${p.name || p.title} ${p.code || p.barcode ? `[${p.code || p.barcode}]` : ''}`,
                    searchValue: `${p.name || p.title} ${p.code || p.barcode || ''}`
                  }))}
                  value={formData.product}
                  onChange={(val) => {
                    if (val) {
                      setFormData(prev => ({ ...prev, product: val }));
                      handleSelectProduct(val);
                    }
                  }}
                  clearOnSelect={true}
                  hideOptionsUntilSearch={true}
                  placeholder={t("Select Product")}
                  onAddClick={() => setIsProductModalOpen(true)}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '50px' }}>{t("SL")}</th>
                    <th style={{ textAlign: 'left', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("PRODUCT")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '90px' }}>{t("QUANTITY")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '120px' }}>{t("BUYING PRICE")}</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("TOTAL BUYING PRICE")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)', width: '120px' }}>{t("SALE PRICE")}</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("TOTAL SALE PRICE")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("BARCODE")}</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("ACTION")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        {t("No products added to purchase list yet. Select a product or scan barcode above.")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', padding: '10px', fontWeight: '500' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
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
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.buyingPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateItemField(idx, 'buyingPrice', e.target.value)}
                            style={{ width: '90px', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                          ৳ {(item.quantity * item.buyingPrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.salePrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateItemField(idx, 'salePrice', e.target.value)}
                            style={{ width: '90px', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                          ৳ {(item.quantity * item.salePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: 'var(--fs-11, 11px)', color: '#64748b', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.barcode}>
                          {item.barcode}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => navigate('/product/barcode', { state: { product: item } })}
                              style={{ border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title={t("Generate Barcode")}
                            >
                              <Barcode size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              style={{ border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title={t("Remove")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>{t("Line Total")}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>{totalQty}</td>
                    <td style={{ borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}></td>
                    <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>৳ {totalBuying.toFixed(2)}</td>
                    <td style={{ borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}></td>
                    <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>৳ {totalSale.toFixed(2)}</td>
                    <td colSpan="2" style={{ borderTop: '1px solid #e2e8f0' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bill summary and Bottom fields */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {/* Left Column Form fields */}
              <div style={{ flex: '1 1 500px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignContent: 'start' }}>
                {visibleFields.discount !== false && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                      <BadgeLabel icon={<HelpCircle size={12}/>} text={t("Discount")} />
                      <input type="number" step="0.01" name="discount" value={formData.discount} onChange={handleChange} placeholder="0" style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }} />
                    </div>
                    <div style={{ flex: 1, border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                      <select name="discount_type" value={formData.discount_type} onChange={handleChange} style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }}>
                        <option>Percentage (%)</option>
                        <option>Flat</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {visibleFields.transport_fare !== false && (
                  <div style={{ position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                    <BadgeLabel icon={<HelpCircle size={12}/>} text={t("Transport Fare")} />
                    <input type="number" step="0.01" name="transport_fare" value={formData.transport_fare} onChange={handleChange} placeholder="0" style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }} />
                  </div>
                )}

                {visibleFields.vat !== false && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                      <BadgeLabel icon={<HelpCircle size={12}/>} text={t("Vat")} />
                      <input type="number" step="0.01" name="vat" value={formData.vat} onChange={handleChange} placeholder="0" style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }} />
                    </div>
                    <div style={{ flex: 1, border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                      <select name="vat_type" value={formData.vat_type} onChange={handleChange} style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }}>
                        <option>Percentage (%)</option>
                        <option>Flat</option>
                      </select>
                    </div>
                  </div>
                )}

                {visibleFields.receive_amount !== false && (
                  <div style={{ position: 'relative', border: '1px solid #0ea5e9', borderRadius: '8px' }}>
                    <BadgeLabel icon={<HelpCircle size={12}/>} text={t("Payment Amount")} />
                    <input type="number" step="0.01" name="receive_amount" value={formData.receive_amount} onChange={handleChange} placeholder="0" style={{ width: '100%', padding: '16px', border: 'none', outline: 'none', background: 'transparent' }} />
                  </div>
                )}
              </div>

              {/* Right Column totals */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b', textTransform: 'uppercase' }}>{t("Purchase Bill")}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)' }}>৳ {totalBuying.toFixed(2)}</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#047857', textTransform: 'uppercase' }}>{t("Grand Total")}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)' }}>৳ {grandTotal.toFixed(2)}</div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#b91c1c', textTransform: 'uppercase' }}>{t("Due")}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--fs-15, 15px)' }}>৳ {totalDue.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <button
                type="button"
                onClick={() => window.history.back()}
                style={{ background: "#f1f5f9", color: "#475569", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", border: "none", cursor: "pointer", borderRadius: "4px" }}
              >
                {t("Cancel")}
              </button>
              <div className="form-action-group" style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSubmitPurchase(0)}
                  disabled={submitting}
                  style={{ background: "#64748b", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", borderRadius: "4px", border: 'none', cursor: 'pointer', color: 'white' }}
                >
                  {t("Save As Draft")}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSubmitPurchase(1, true)}
                  disabled={submitting}
                  style={{ background: "#3b82f6", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", borderRadius: "4px", border: 'none', cursor: 'pointer', color: 'white' }}
                >
                  {t("Save & Print")}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSubmitPurchase(1)}
                  disabled={submitting}
                  style={{ background: "var(--success)", padding: "10px 24px", fontSize: "var(--fs-14, 14px)", borderRadius: "4px", fontWeight: "bold", border: 'none', cursor: 'pointer', color: 'white' }}
                >
                  {submitting ? t("Processing...") : t("Add Invoice")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Add Supplier Modal component */}
      <AddSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={(newSupplier) => {
          if (newSupplier) {
            const formattedSupplier = { ...newSupplier, id: newSupplier.id || newSupplier.uuid };
            setSuppliers(prev => [...prev, formattedSupplier]);
            setFormData(prev => ({ ...prev, supplier: formattedSupplier.id }));
          }
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

      <FormSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t("Receive Form Settings")}
        fields={[
          { key: 'invoice_id', label: t("Invoice ID") },
          { key: 'date', label: t("Issued Date") },
          { key: 'supplier', label: t("Supplier") },
          { key: 'warehouse', label: t("Warehouse") },
          { key: 'discount', label: t("Discount") },
          { key: 'transport_fare', label: t("Transport Fare") },
          { key: 'vat', label: t("Vat") },
          { key: 'accounts', label: t("Accounts") },
          { key: 'category', label: t("Category") },
          { key: 'receive_amount', label: t("Receive Amount") }
        ]}
        initialSettings={visibleFields}
        onSave={async (newSettings) => {
          setVisibleFields(newSettings);
          setIsSettingsOpen(false);
          toast.success(t("Settings saved successfully!"));
          try {
            await settingService.updateFormSettings('purchase_create', newSettings);
          } catch (err) {
            console.error("Failed to save settings to API", err);
          }
        }}
      />
    </div>
  );
};

export default PurchaseCreate;

