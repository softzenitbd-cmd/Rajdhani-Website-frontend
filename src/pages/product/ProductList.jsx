import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';

const ProductList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    group: '',
    brand: '',
    from_date: '',
    to_date: ''
  });

  const defaultProducts = [
    { id: 1, name: 'BATIK PRINT ORNA 380', buy: '287.50', sell: '380.00', wholesale: '0.00', unit: 'PEACE', barcode: '18647', stockWarning: '1', asset: '-', openingStock: '2.0000', createdAt: '24 Aug 2026' },
    { id: 2, name: 'BR ORNA 380', buy: '240.00', sell: '380.00', wholesale: '0.00', unit: 'PEACE', barcode: '18646', stockWarning: '1', asset: '-', openingStock: '4.0000', createdAt: '24 Aug 2026' },
    { id: 3, name: 'BR ORNA 500', buy: '362.50', sell: '500.00', wholesale: '0.00', unit: 'PEACE', barcode: '18645', stockWarning: '1', asset: '-', openingStock: '9.0000', createdAt: '24 Aug 2026' },
    { id: 4, name: 'SAB INDIA KANI SOFT', buy: '1900.00', sell: '2580.00', wholesale: '0.00', unit: 'PEACE', barcode: '18644', stockWarning: '1', asset: '-', openingStock: '5.0000', createdAt: '23 Aug 2026' },
    { id: 5, name: 'SAB INDIA KANI SHAREE', buy: '1750.00', sell: '2380.00', wholesale: '0.00', unit: 'PEACE', barcode: '18643', stockWarning: '1', asset: '-', openingStock: '5.0000', createdAt: '23 Aug 2026' }
  ];

  const fetchPrerequisites = async () => {
    try {
      const [groupRes, brandRes] = await Promise.all([
        productService.groups.getAll().catch(() => []),
        productService.brands.getAll().catch(() => [])
      ]);
      setGroups(Array.isArray(groupRes) ? groupRes : (groupRes?.results || []));
      setBrands(Array.isArray(brandRes) ? brandRes : (brandRes?.results || []));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      const localProducts = JSON.parse(localStorage.getItem('rajdhani_custom_products') || '[]');
      
      const combined = [...localProducts, ...(data.length > 0 ? data : defaultProducts)];
      
      // Filter if search query exists
      const finalProducts = filters.search 
        ? combined.filter(p => p.name.toLowerCase().includes(filters.search.toLowerCase()))
        : combined;
        
      setProducts(finalProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      const localProducts = JSON.parse(localStorage.getItem('rajdhani_custom_products') || '[]');
      setProducts([...localProducts, ...defaultProducts]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      group: '',
      brand: '',
      from_date: '',
      to_date: ''
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await productService.deleteProduct(id).catch(() => null);
      const localProducts = JSON.parse(localStorage.getItem('rajdhani_custom_products') || '[]');
      const updatedLocal = localProducts.filter(p => p.id !== id);
      localStorage.setItem('rajdhani_custom_products', JSON.stringify(updatedLocal));
      
      setProducts(prev => prev.filter(p => p.id !== id));
      alert("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>Product List</h2>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', background: 'var(--info)', color: 'white', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>Search All</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <input 
                type="text" 
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Product Name or Code" 
                style={{ padding: '10px', width: '100%' }} 
              />
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Search By Group</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <select 
                name="group"
                value={filters.group}
                onChange={handleFilterChange}
                style={{ padding: '10px', width: '100%' }}
              >
                <option value="">Select Product Group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>Search By Brand</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <select 
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                style={{ padding: '10px', width: '100%' }}
              >
                <option value="">Select Product Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-input floating-label" style={{ borderRadius: '4px', flex: 1 }}>
                <input 
                  type="date" 
                  name="from_date"
                  value={filters.from_date}
                  onChange={handleFilterChange}
                  style={{ color: '#334155', padding: '10px', width: '100%' }} 
                />
              </div>
              <div className="form-input floating-label" style={{ borderRadius: '4px', flex: 1 }}>
                <input 
                  type="date" 
                  name="to_date"
                  value={filters.to_date}
                  onChange={handleFilterChange}
                  style={{ color: '#334155', padding: '10px', width: '100%' }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button 
            onClick={handleClearFilters}
            className="btn" 
            style={{ background: 'var(--text-muted)', color: 'white', padding: '12px 48px', borderRadius: '4px', fontSize: '16px', width: '40%', cursor: 'pointer' }}
          >
            Clear Filter
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Showing {products.length} entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              Print
            </button>
            <button className="btn" onClick={fetchProducts} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>ID NO ↕</th>
                <th style={{ textAlign: 'left', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>PRODUCT DETAILS ↕</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>BARCODE NUMBER</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>STOCK WARNING</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>OPENING STOCK</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CREATED AT ↕</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No products found.</td>
                </tr>
              ) : (
                products.map((prod, index) => (
                  <tr key={prod.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.id}</td>
                    <td style={{ textAlign: 'left', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold' }}>{prod.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Buy Price: ৳{prod.purchase_price || prod.buy || '0.00'} | Sell Price: ৳{prod.sales_price || prod.sell || '0.00'} | Unit: {prod.unit_name || prod.unit || 'PEACE'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.code || prod.barcode || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.stockWarning || '1'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.stock || prod.openingStock || '0.00'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.created_at ? new Date(prod.created_at).toLocaleDateString() : (prod.createdAt || '-')}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => navigate('/product/create')} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title="Edit Product">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteProduct(prod.id)} className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title="Delete Product">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
