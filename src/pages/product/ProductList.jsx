import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { exportToExcel } from '../../utils/excelExporter';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import CustomDatePicker from '../../components/CustomDatePicker';
import Pagination from '../../components/Pagination';


const ProductList = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const confirm = useConfirm();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(50);

  const [filters, setFilters] = useState({
    search: '',
    group: '',
    brand: '',
    from_date: '',
    to_date: ''
  });

  const handleExportExcel = () => {
    const dataToExport = products.map((p, index) => ({
      'SL': (currentPage - 1) * limit + index + 1,
      'Product Name': p.name,
      'Buying Price (BDT)': p.purchase_price || p.buy || '0.00',
      'Selling Price (BDT)': p.sales_price || p.sell || '0.00',
      'Unit': p.unit_name || p.unit || 'Pcs',
      'Barcode': p.code || p.barcode || '-',
      'Stock Warning': p.stockWarning || '1',
      'Opening Stock': p.stock || p.openingStock || '0.00',
      'Created Date': p.created_at ? new Date(p.created_at).toLocaleDateString() : (p.createdAt || '-')
    }));
    exportToExcel(dataToExport, 'Product_List');
  };

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
      const res = await productService.getProducts({ ...filters, page: currentPage, page_size: limit });
      const apiData = Array.isArray(res) ? res : (res?.results || []);
      const combined = apiData;
      setTotalCount(res?.count || combined.length);
      
      // Filter if search query exists
      const finalProducts = filters.search 
        ? combined.filter(p => {
            const query = filters.search.toLowerCase();
            const nameMatch = p.name?.toLowerCase().includes(query);
            const barcodeMatch = p.custom_barcode_no?.toLowerCase().includes(query) || p.barcode?.toLowerCase().includes(query) || p.code?.toLowerCase().includes(query);
            return nameMatch || barcodeMatch;
          })
        : combined;
        
      if (filters.search) {
          setTotalCount(finalProducts.length);
      }
        
      setProducts(finalProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage, limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      group: '',
      brand: '',
      from_date: '',
      to_date: ''
    });
    setCurrentPage(1);
  };

  const handleDeleteProduct = async (id) => {
    const isConfirmed = await confirm({
      title: t("Delete Product"),
      message: t("Are you sure you want to delete this product?"),
      confirmText: t("Delete"),
      cancelText: t("Cancel"),
    });

    if (!isConfirmed) return;

    try {
      await productService.deleteProduct(id);
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(t("Product deleted successfully!"));
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(t("Failed to delete product."));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Product List")}</h2>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', background: 'var(--info)', color: 'white', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px' }}>{t("Search All")}</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <input 
                type="text" 
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={t("Product Name or Code")} 
                style={{ padding: '10px', width: '100%' }} 
              />
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Search By Group")}</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <select 
                name="group"
                value={filters.group}
                onChange={handleFilterChange}
                style={{ padding: '10px', width: '100%' }}
              >
                <option value="">{t("Select Product Group")}</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t("Search By Brand")}</div>
            <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
              <select 
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                style={{ padding: '10px', width: '100%' }}
              >
                <option value="">{t("Select Product Brand")}</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--fs-12, 12px)', marginBottom: '4px' }}>{t('common.search_by_date')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="form-input floating-label" style={{ borderRadius: '4px', flex: 1 }}>
                <CustomDatePicker 
                   
                  name="from_date"
                  value={filters.from_date}
                  onChange={handleFilterChange}
                  style={{ color: '#334155', padding: '10px', width: '100%' }} 
                />
              </div>
              <div className="form-input floating-label" style={{ borderRadius: '4px', flex: 1 }}>
                <CustomDatePicker 
                   
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
            style={{ background: 'var(--text-muted)', color: 'white', padding: '12px 48px', borderRadius: '4px', fontSize: 'var(--fs-16, 16px)', width: '40%', cursor: 'pointer' }}
          >
            {t("Clear Filter")}
          </button>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Showing")} {products.length} {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              {t("📊 Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              {t("Print")}
            </button>
            <button className="btn" onClick={fetchProducts} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <RotateCcw size={14} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("ID NO ↕")}</th>
                <th style={{ textAlign: 'left', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("PRODUCT DETAILS ↕")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("BARCODE NUMBER")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("STOCK WARNING")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("OPENING STOCK")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("CREATED AT ↕")}</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>{t("Loading products...")}</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>{t("No products found.")}</td>
                </tr>
              ) : (
                products.map((prod, index) => {
                  const globalIndex = (currentPage - 1) * limit + index + 1;
                  return (
                    <tr key={prod.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{globalIndex}</td>
                      <td style={{ textAlign: 'left', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 'bold' }}>{prod.name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {t("Buy Price: ৳")}{prod.purchase_price || prod.buy || '0.00'} {t("| Sell Price: ৳")}{prod.sales_price || prod.sell || '0.00'} {t("| Unit:")} {prod.unit_name || prod.unit || t("PEACE")}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.code || prod.barcode || '-'}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.stockWarning || '1'}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.stock || prod.openingStock || '0.00'}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{prod.created_at ? new Date(prod.created_at).toLocaleDateString() : (prod.createdAt || '-')}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button onClick={() => navigate('/product/create', { state: { product: prod } })} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title={t("Edit Product")}>
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteProduct(prod.id)} className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }} title={t("Delete Product")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalItems={totalCount}
          pageSize={limit}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ProductList;
