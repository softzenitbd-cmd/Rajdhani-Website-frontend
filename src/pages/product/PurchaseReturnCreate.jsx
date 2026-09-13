import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Settings, Barcode, Calendar, Trash2, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import AddOptionModal from '../../components/AddOptionModal';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';
import { productService } from '../../services/productService';
import { purchaseService } from '../../services/purchaseService';
import { crmService } from '../../services/crmService';

const PurchaseReturnCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    } catch (err) {
      toast.error(err?.message || 'Failed to load suppliers / products');
      setSuppliers([]);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
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
      const code = formData.barcode.trim();
      if (!code) return;
      const prod = products.find(p => String(p.code || p.barcode || p.id) === code);
      if (prod) {
        handleSelectProduct(prod.id);
        setFormData(prev => ({ ...prev, barcode: '' }));
      } else {
        toast.error(`Product with barcode "${code}" not found.`);
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
    // useApi.post already shows a toast on failure; rethrow so the modal stays open
    const res = await post(ENDPOINTS.CRM_SUPPLIERS, { name: name.trim() }, "Supplier Added");
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
      toast.error('Please select a supplier.');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item to return.');
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
        product: i.id,
        quantity: String(i.quantity),
        buying_price: Number(i.buyingPrice).toFixed(2),
        selling_price: Number(i.salePrice).toFixed(2),
        total_buying_price: (Number(i.quantity) * Number(i.buyingPrice)).toFixed(2),
        total_selling_price: (Number(i.quantity) * Number(i.salePrice)).toFixed(2),
      })),
    };

    try {
      await purchaseService.createPurchaseReturn(payload);
      toast.success('Purchase Return created successfully!');
      navigate('/product/purchase-return/list');
    } catch (err) {
      console.error("Error creating purchase return:", err);
      toast.error(err?.message || 'Failed to create purchase return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', margin: 0 }}>
            Purchase Return Create
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => navigate('/product/purchase-return/list')} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <List size={16} /> Return List
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
                <div style={{ display: 'flex' }}>
                  <select name="supplier" value={formData.supplier} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #0ea5e9', borderRadius: '4px 0 0 4px', outline: 'none', appearance: 'none', background: 'white', color: '#334155' }} required>
                    <option value="">Select Suppliers</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsSupplierModalOpen(true)} style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Date */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--info)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> Date
                  </div>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '14px', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none' }} />
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
                    placeholder="Scan Barcode & Press Enter" 
                    style={{ flex: 1, padding: '12px', border: 'none', outline: 'none', color: '#334155' }} 
                  />
                </div>
              </div>

              {/* Select Product */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="product" value={formData.product} onChange={handleChange} style={{ padding: '14px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', appearance: 'none', background: 'white', color: '#334155' }}>
                  <option value="">Select Product to Return</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.title} {p.code || p.barcode ? `[${p.code || p.barcode}]` : ''}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Return Items Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', marginBottom: '24px', borderRadius: '4px' }}>
              <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '50px' }}>SL</th>
                    <th style={{ textAlign: 'left', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRODUCT</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '90px' }}>QUANTITY</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '120px' }}>BUYING PRICE</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL BUYING PRICE</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '120px' }}>SALE PRICE</th>
                    <th style={{ textAlign: 'right', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>TOTAL SALE PRICE</th>
                    <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BARCODE</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No return products added yet. Select a product or scan a barcode above to add items to return.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                        <td style={{ textAlign: 'center', padding: '10px' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', padding: '10px', fontWeight: '600' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            style={{ width: '60px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <input
                            type="number"
                            value={item.buyingPrice}
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
                            onChange={(e) => updateItemField(idx, 'salePrice', e.target.value)}
                            style={{ width: '90px', padding: '6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>
                          ৳ {(item.quantity * item.salePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: '#64748b' }}>{item.barcode}</td>
                        <td style={{ textAlign: 'center', padding: '10px' }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                            title="Remove Item"
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
                    <td colSpan="2" style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>Line Total</td>
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
                style={{ padding: '14px 48px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {submitting ? 'Submitting...' : 'Purchase Return'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleAddSupplier}
        title="Add Supplier"
        label="Supplier Name"
      />
    </div>
  );
};

export default PurchaseReturnCreate;
