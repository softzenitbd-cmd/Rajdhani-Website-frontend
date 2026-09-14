import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Plus, Barcode, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddOptionModal from '../../components/AddOptionModal';
import { crmService } from '../../services/crmService';
import { productService } from '../../services/productService';
import { purchaseService } from '../../services/purchaseService';
import { useToast } from '../../context/ToastContext';

const PurchaseCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    barcode: '',
    product: '',
    discount: '0',
    transport_fare: '0',
    receive_amount: '0',
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

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

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
          barcode: prod.code || prod.barcode || `BC-${prod.id}`
        }];
      }
    });

    setFormData(prev => ({ ...prev, product: '' }));
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

  const handleSubmitPurchase = async () => {
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
        discount_type: 'flat',
        transport_fare: transportAmt.toFixed(2),
        vat: '0.00',
        vat_type: 'percentage',
        purchase_bill: totalBuying.toFixed(2),
        total_vat: '0.00',
        total_discount: discountAmt.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        receive_amount: paidAmt.toFixed(2),
        total_due: totalDue.toFixed(2),
        status: 1,
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
      navigate('/product/purchase/list');
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
  const discountAmt = Math.max(0, Number(formData.discount || 0));
  const transportAmt = Math.max(0, Number(formData.transport_fare || 0));
  const grandTotal = Math.max(0, totalBuying - discountAmt + transportAmt);
  const paidAmt = Math.max(0, Number(formData.receive_amount || 0));
  const totalDue = Math.max(0, grandTotal - paidAmt);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {t("Purchase Create")}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

              {/* Select Suppliers */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="supplier" value={formData.supplier} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">{t("Select Suppliers")}</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="append-btn" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0' }}><Plus size={20} /></button>
                </div>
              </div>

              {/* Date */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--info)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {t("Date")}
                  </div>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '14px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} />
                </div>
              </div>

              {/* Barcode Number */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
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
                <div className="input-with-append">
                  <select name="product" value={formData.product} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">{t("Select Product")}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.title} {p.code || p.barcode ? `[${p.code || p.barcode}]` : ''}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsProductModalOpen(true)} className="append-btn" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0' }}><Plus size={20} /></button>
                </div>
              </div>

            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '50px' }}>{t("SL")}</th>
                    <th style={{ textAlign: 'left', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("PRODUCT")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '90px' }}>{t("QUANTITY")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '120px' }}>{t("BUYING PRICE")}</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("TOTAL BUYING PRICE")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '120px' }}>{t("SALE PRICE")}</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("TOTAL SALE PRICE")}</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>{t("BARCODE")}</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>{t("ACTION")}</th>
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
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            style={{ width: '60px', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.buyingPrice}
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
                            onChange={(e) => updateItemField(idx, 'salePrice', e.target.value)}
                            style={{ width: '90px', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                          ৳ {(item.quantity * item.salePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '11px', color: '#64748b' }}>{item.barcode}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
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

            {/* Bill summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px', maxWidth: '900px', marginLeft: 'auto' }}>
              {[
                { label: t("Purchase Bill"), value: `৳ ${totalBuying.toFixed(2)}` },
              ].map((r) => (
                <div key={r.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{r.label}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{r.value}</div>
                </div>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{t("Discount")}
                <input type="number" step="0.01" name="discount" value={formData.discount} onChange={handleChange} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', textTransform: 'none' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{t("Transport Fare")}
                <input type="number" step="0.01" name="transport_fare" value={formData.transport_fare} onChange={handleChange} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }} />
              </label>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: '#047857', textTransform: 'uppercase' }}>{t("Grand Total")}</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>৳ {grandTotal.toFixed(2)}</div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{t("Paid Amount")}
                <input type="number" step="0.01" name="receive_amount" value={formData.receive_amount} onChange={handleChange} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }} />
              </label>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: '#b91c1c', textTransform: 'uppercase' }}>{t("Due")}</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>৳ {totalDue.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitPurchase}
                className="btn-primary"
                style={{ padding: '12px 32px', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}
              >
                {submitting ? t("Processing...") : t("Buy Product")}
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

      <AddOptionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleAddProduct}
        title={t("Add Product")}
        label={t("Product Name")}
      />
    </div>
  );
};

export default PurchaseCreate;

