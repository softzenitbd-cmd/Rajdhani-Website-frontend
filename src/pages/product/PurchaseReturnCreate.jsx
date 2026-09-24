import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { List, Settings, Calendar, Barcode, Trash2, Edit, Plus, Search, CheckCircle, Save, X } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import SearchableSelect from '../../components/SearchableSelect';
import AddOptionModal from '../../components/AddOptionModal';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';
import { productService } from '../../services/productService';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';
import CustomDatePicker from '../../components/CustomDatePicker';


const PurchaseReturnCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const returnDataState = location.state?.returnData;

  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    barcode: '',
    product: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);



  const { get, post } = useApi();
  const toast = useToast();

  const fetchPrerequisites = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        crmService.getSuppliers(),
        productService.getProducts()
      ]);

      const supData = Array.isArray(supRes) ? supRes : (supRes?.results || []);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.results || []);

      setSuppliers(supData);
      setProducts(prodData);
      
      return prodData; // Return products to be used in fetching existing return
    } catch (err) {
      toast.error(err?.message || t("Failed to load suppliers / products"));
      setSuppliers([]);
      setProducts([]);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      const prodData = await fetchPrerequisites();
      
      if (id) {
        try {
          const ret = await purchaseService.getPurchaseReturnById(id);
          setFormData(prev => ({
            ...prev,
            supplier: ret.supplier || ret.supplier_id || '',
            date: ret.date ? ret.date.split('T')[0] : prev.date
          }));
          
          if (ret.items && Array.isArray(ret.items)) {
            const mappedItems = ret.items.map(item => {
              const prod = prodData.find(p => String(p.id) === String(item.product));
              return {
                id: item.product, // Product UUID
                itemId: item.id, // The specific item ID (for updating)
                name: prod ? (prod.name || prod.title) : 'Product',
                quantity: Number(item.quantity) || 1,
                buyingPrice: Number(item.buying_price) || 0,
                salePrice: Number(item.selling_price) || 0,
                barcode: prod ? (prod.code || prod.barcode || `BC-${prod.id}`) : ''
              };
            });
            setItems(mappedItems);
          }
        } catch (err) {
          toast.error(err?.message || t("Failed to load return details."));
        }
      }
    };
    init();
  }, [id]);

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
          buyingPrice: Number(prod.purchase_price || prod.buy || prod.price || 0),
          salePrice: Number(prod.sales_price || prod.sell || 0),
          barcode: prod.code || prod.barcode || `BC-${prod.id}`
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
    // useApi.post already shows a toast on failure; rethrow so the modal stays open
    const res = await post(ENDPOINTS.CRM_SUPPLIERS, { name: name.trim() }, t("Supplier Added"));
    const newSup = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || name.trim() };
    setSuppliers(prev => [newSup, ...prev]);
    setFormData(prev => ({ ...prev, supplier: newSup.id }));
    setIsSupplierModalOpen(false);
  };

  // Summary Totals safely calculated before render & submit
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalBuying = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.buyingPrice) || 0)), 0);
  const totalSale = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.salePrice) || 0)), 0);

  const handleSubmitReturn = async (e) => {
    if (e) e.preventDefault();

    if (!formData.supplier) {
      toast.error(t("Please select a supplier."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one item to return."));
      return;
    }

    setSubmitting(true);

    // POST /api/purchase/returns/ – total_due is deducted from the supplier's previous due
    const payload = {
      supplier: formData.supplier,
      date: formData.date,
      discount: '0.00',
      grand_total: Number(totalBuying).toFixed(2),
      total_due: Number(totalBuying).toFixed(2),
      status: 1,
      items: items.map(i => ({
        ...(i.itemId ? { id: i.itemId } : {}),
        product: i.id,
        quantity: String(i.quantity),
        buying_price: Number(i.buyingPrice).toFixed(2),
        selling_price: Number(i.salePrice).toFixed(2),
        total_buying_price: (Number(i.quantity) * Number(i.buyingPrice)).toFixed(2),
        total_selling_price: (Number(i.quantity) * Number(i.salePrice)).toFixed(2),
      })),
    };

    try {
      let createdReturn;
      if (id) {
        createdReturn = await purchaseService.updatePurchaseReturn(id, payload);
        toast.success(t("Purchase Return updated successfully!"));
      } else {
        createdReturn = await purchaseService.createPurchaseReturn(payload);
        toast.success(t("Purchase Return created successfully!"));
      }
      
      const supplierName = suppliers.find(s => String(s.id) === String(formData.supplier))?.name || 'Unknown';
      const invoiceNum = createdReturn?.invoice || createdReturn?.invoice_no || 
        (createdReturn?.id ? (String(createdReturn.id).length > 8 ? `RET-${String(createdReturn.id).replace(/\D/g, '').padEnd(6, '0').slice(0, 6)}` : createdReturn.id) : 'N/A');

      setReceiptModal({
        ...createdReturn,
        supplierName,
        date: formData.date,
        items: payload.items.map(i => {
           const productData = products.find(p => String(p.id) === String(i.product));
           return {
              name: productData?.name || productData?.title || 'Product',
              quantity: i.quantity,
              buyingPrice: i.buying_price,
              total: i.total_buying_price
           };
        }),
        total: payload.grand_total,
        invoice: invoiceNum
      });
      
    } catch (err) {
      console.error("Error creating purchase return:", err);
      toast.error(err?.message || t("Failed to create purchase return."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', margin: 0 }}>
            {id ? t("Purchase Return Update") : t("Purchase Return Create")}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => navigate('/product/purchase-return/list')} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)' }}>
              <List size={16} /> {t("Return List")}
            </button>
            <button type="button" onClick={fetchPrerequisites} className="btn" style={{ background: '#64748b', color: 'white', padding: '8px', borderRadius: '4px' }}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <form onSubmit={handleSubmitReturn}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              
              {/* Select Suppliers */}
              <div className="form-group" style={{ marginBottom: '0' }}>
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

              {/* Date */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--info)', color: 'white', fontSize: 'var(--fs-11, 11px)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {t("Date")}
                  </div>
                  <CustomDatePicker  name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '14px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} />
                </div>
              </div>

              {/* Barcode Number */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #0ea5e9', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    <Barcode size={24} />
                  </div>
                  <input 
                    type="text" 
                    name="barcode" 
                    value={formData.barcode} 
                    onChange={handleChange} 
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder={t("Scan Barcode & Press Enter")} 
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', color: '#334155' }} 
                  />
                </div>
              </div>

              {/* Select Product */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <SearchableSelect
                  options={products.map(p => ({
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
                  pushContentBelow={true}
                  placeholder={t("Select Product to Return")}
                  onAddClick={() => setIsProductModalOpen(true)}
                />
              </div>

            </div>

            {/* Return Items Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', marginBottom: '24px', borderRadius: '4px' }}>
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
                      <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        {t("No return products added yet. Select a product or scan a barcode above to add items to return.")}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', padding: '10px', fontWeight: '600' }}>{item.name}</td>
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
                            style={{ width: '60px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.buyingPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateItemField(idx, 'buyingPrice', e.target.value)}
                            style={{ width: '90px', padding: '6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
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
                            style={{ width: '90px', padding: '6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                          ৳ {(item.quantity * item.salePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>{item.barcode}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                            title={t("Remove Item")}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>{t("Line Total")}</td>
                    <td style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>{totalQty}</td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}></td>
                    <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>৳ {totalBuying.toFixed(2)}</td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}></td>
                    <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>৳ {totalSale.toFixed(2)}</td>
                    <td colSpan="2" style={{ borderTop: '1px solid #cbd5e1' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary" 
                style={{ padding: '14px 48px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {submitting ? t("Submitting...") : (id ? t("Update Return") : t("Purchase Return"))}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleAddSupplier}
        title={t("Add Supplier")}
        label={t("Supplier Name")}
      />

      {/* Return Voucher Modal on Success */}
      {receiptModal && (
        <div className="printable-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="printable-modal-content" style={{ background: 'white', width: '700px', maxWidth: '95vw', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <PrintHeader showOnScreen={true} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #0ea5e9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#0f172a' }}>{t("Purchase Return Voucher")}</h3>
                <span style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b', fontWeight: '600' }}>{t("Invoice #")}{receiptModal.invoice}</span>
              </div>
              <button onClick={() => { setReceiptModal(null); window.location.reload(); }} className="no-print" style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: 'var(--fs-13, 13px)', marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div><strong>{t("Supplier Name:")}</strong> {receiptModal.supplierName}</div>
              <div><strong>{t("Return Date:")}</strong> {receiptModal.date}</div>
              <div><strong>{t("Invoice Number:")}</strong> {receiptModal.invoice}</div>
              <div><strong>{t("Grand Total:")}</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>৳ {receiptModal.total}</span></div>
            </div>

            {receiptModal.items && receiptModal.items.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: 'var(--fs-13, 13px)' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: 'white' }}>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px' }}>{t("SL")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>{t("Product Name")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>{t("Qty")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '100px' }}>{t("Rate")}</th>
                    <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px' }}>{t("Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptModal.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>৳ {(Number(item.buyingPrice) || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>৳ {(Number(item.total) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1' }}>{t("Total Amount")}</td>
                    <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                      {receiptModal.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)}
                    </td>
                    <td style={{ border: '1px solid #cbd5e1' }}></td>
                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #cbd5e1', color: '#059669', fontSize: 'var(--fs-14, 14px)' }}>৳ {receiptModal.total}</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Signature Footer for Print */}
            <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Supplier / Receiver Signature")}
              </div>
              <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '180px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                {t("Authorized Signature")}
              </div>
            </div>

            <div className="no-print" style={{ textAlign: 'right', marginTop: '16px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '10px 24px', borderRadius: '6px', marginRight: '8px', fontWeight: '600' }}>
                {t("🖨️ Print Memo")}
              </button>
              <button onClick={() => { setReceiptModal(null); window.location.reload(); }} className="btn" style={{ background: '#64748b', color: 'white', padding: '10px 20px', borderRadius: '6px' }}>
                {t("Close & Continue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturnCreate;
