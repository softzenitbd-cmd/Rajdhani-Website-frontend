import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Settings, Barcode, Calendar, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { ENDPOINTS } from '../../api/endpoints';
import { productService } from '../../services/productService';

const PurchaseReturnCreate = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    barcode: '',
    product: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const { get } = useApi();

  const defaultProducts = [
    { id: '1', name: 'FABRIC T-SHIRT 2026', code: 'TS-101', purchase_price: 300, sales_price: 450, barcode: '10001' },
    { id: '2', name: 'PREMIUM DENIM JEANS', code: 'DJ-202', purchase_price: 800, sales_price: 1200, barcode: '10002' },
    { id: '3', name: 'COTTON CASUAL SHIRT', code: 'CS-303', purchase_price: 550, sales_price: 850, barcode: '10003' }
  ];

  const fetchPrerequisites = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        get(ENDPOINTS.CRM_SUPPLIERS).catch(() => []),
        productService.getProducts().catch(() => [])
      ]);

      const supData = Array.isArray(supRes) ? supRes : (supRes?.results || []);
      const prodData = Array.isArray(prodRes) ? prodRes : (prodRes?.results || []);

      setSuppliers(supData);
      setProducts(prodData.length > 0 ? prodData : defaultProducts);
    } catch (err) {
      console.error(err);
      setProducts(defaultProducts);
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

  const handleSubmitReturn = async (e) => {
    if (e) e.preventDefault();

    if (!formData.supplier) {
      alert('Please select a supplier.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item to return.');
      return;
    }

    const payload = {
      supplier: formData.supplier,
      date: formData.date,
      items: items.map(i => ({
        product_id: i.id,
        name: i.name,
        quantity: i.quantity,
        buying_price: i.buyingPrice,
        sale_price: i.salePrice,
        barcode: i.barcode
      })),
      total_amount: totalBuying,
      total_sale_amount: totalSale
    };

    try {
      await purchaseService.createPurchaseReturn(payload);
    } catch (err) {
      console.warn("Backend API error, storing return locally:", err);
    }

    // Always store to local storage for persistence across UI
    const existing = JSON.parse(localStorage.getItem('rajdhani_purchase_returns') || '[]');
    const selectedSupplier = suppliers.find(s => String(s.id) === String(formData.supplier));

    const newReturn = {
      id: Date.now(),
      date: formData.date,
      invoice: `RET-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: selectedSupplier ? selectedSupplier.name : 'Supplier',
      supplier_id: formData.supplier,
      total: totalBuying.toFixed(2),
      total_sale: totalSale.toFixed(2),
      items: items
    };

    localStorage.setItem('rajdhani_purchase_returns', JSON.stringify([newReturn, ...existing]));

    alert('Purchase Return created successfully!');
    setItems([]);
    setFormData({
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      barcode: '',
      product: ''
    });
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Purchase Return Create
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={fetchPrerequisites} className="btn" style={{ background: 'var(--text-muted)', color: 'white', padding: '8px', borderRadius: '4px' }}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
        <PrintHeader />
          <form onSubmit={handleSubmitReturn}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              
              {/* Select Suppliers */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="supplier" value={formData.supplier} onChange={handleChange} style={{ padding: '14px', width: '100%', border: '1px solid #0ea5e9', borderRadius: '4px', outline: 'none', appearance: 'none', background: 'white', color: '#334155' }}>
                  <option value="">Select Suppliers</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
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
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.title} {p.code || p.barcode ? `[${p.code || p.barcode}]` : ''}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
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
                      <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No return products added yet. Select a product or scan barcode above.
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
              <button type="submit" className="btn-primary" style={{ padding: '12px 32px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>
                Purchase Return
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnCreate;

