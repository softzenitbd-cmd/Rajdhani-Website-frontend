import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Layers, Plus, Package, Scale } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { productService } from '../../services/productService';
import { useToast } from '../../context/ToastContext';

const ProductCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product || null;
  const isEditMode = !!editingProduct;

  // Fields of POST/PATCH /api/product/list/
  const EMPTY = {
    name: '',
    custom_barcode_no: '',
    buying_price: '',
    selling_price: '',
    wholesale_price: '',
    opening_stock: '',
    stock_warning: '',
    unit: '',
    group: '',
    brand: '',
    color: '',
    size: '',
    warehouse: '',
    status: 1,
  };
  const [formData, setFormData] = useState(EMPTY);

  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);



  useEffect(() => {
    if (editingProduct) {
      const idOf = (v) => (v && typeof v === 'object' ? v.id ?? v.uuid ?? '' : v ?? '');
      setFormData({
        name: editingProduct.name || '',
        custom_barcode_no: editingProduct.custom_barcode_no || editingProduct.barcode || '',
        buying_price: editingProduct.buying_price ?? editingProduct.purchase_price ?? '',
        selling_price: editingProduct.selling_price ?? editingProduct.sales_price ?? '',
        wholesale_price: editingProduct.wholesale_price ?? '',
        opening_stock: editingProduct.opening_stock ?? editingProduct.stock ?? '',
        stock_warning: editingProduct.stock_warning ?? '',
        unit: idOf(editingProduct.unit),
        group: idOf(editingProduct.group),
        brand: idOf(editingProduct.brand),
        color: idOf(editingProduct.color),
        size: idOf(editingProduct.size),
        warehouse: idOf(editingProduct.warehouse),
        status: editingProduct.status ?? 1,
      });
    }
  }, [editingProduct]);

  const fetchPrerequisites = async () => {
    try {
      const list = (r) => (Array.isArray(r) ? r : (r?.results || []));
      const [unitsRes, groupsRes, brandsRes, colorsRes, sizesRes, whRes] = await Promise.all([
        productService.units.getAll(),
        productService.groups.getAll(),
        productService.brands.getAll().catch(() => []),
        productService.colors.getAll().catch(() => []),
        productService.sizes.getAll().catch(() => []),
        productService.warehouses.getAll().catch(() => []),
      ]);
      setUnits(list(unitsRes));
      setGroups(list(groupsRes));
      setBrands(list(brandsRes));
      setColors(list(colorsRes));
      setSizes(list(sizesRes));
      setWarehouses(list(whRes));
    } catch (err) {
      toast.error(err?.message || t("Failed to load units / groups"));
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.name?.trim()) {
      toast.error(t("Please enter a product name"));
      return;
    }
    try {
      setSubmitting(true);
      const money = (v) => Number(v || 0).toFixed(2);
      const payload = {
        name: formData.name.trim(),
        buying_price: money(formData.buying_price),
        selling_price: money(formData.selling_price),
        wholesale_price: money(formData.wholesale_price),
        stock_warning: formData.stock_warning === '' ? 0 : Number(formData.stock_warning),
        unit: formData.unit || null,
        group: formData.group || null,
        brand: formData.brand || null,
        color: formData.color || null,
        size: formData.size || null,
        warehouse: formData.warehouse || null,
        status: Number(formData.status ?? 1),
      };
      if (formData.custom_barcode_no) {
        payload.custom_barcode_no = String(formData.custom_barcode_no).trim();
      } else if (!isEditMode) {
        // Auto generate 8 digit barcode for new products if not provided
        payload.custom_barcode_no = Math.floor(10000000 + Math.random() * 90000000).toString();
      }
      
      if (!isEditMode) {
        // opening stock is only meaningful on create – purchases / sales move stock afterwards
        payload.opening_stock = money(formData.opening_stock);
        payload.stock = money(formData.opening_stock);
      }

      try {
        if (isEditMode && editingProduct?.id) {
          await productService.updateProduct(editingProduct.id, payload);
          toast.success(t("Product updated successfully via API!"));
        } else {
          await productService.createProduct(payload);
          toast.success(t("Product created successfully via API!"));
        }
      } catch (apiErr) {
        console.error("Error saving product:", apiErr);
        toast.error(apiErr?.message || t("Failed to save product. Please check the form and try again."));
        return;
      }

      if (!isEditMode) {
        setFormData({
          name: '',
          custom_barcode_no: '',
          buying_price: '',
          selling_price: '',
          wholesale_price: '',
          stock_warning: '',
          opening_stock: '',
          unit: '',
          group: '',
          brand: '',
          color: '',
          size: '',
          warehouse: '',
          status: 1,
        });
      } else {
        navigate('/product/list');
      }
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(t("An unexpected error occurred while saving product."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUnit = async (name) => {
    if (!name?.trim()) return;
    const unitName = name.trim();
    const res = await productService.units.create({ name: unitName });
    const newUnit = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || unitName };
      setUnits(prev => [...prev, newUnit]);
      setFormData(prev => ({ ...prev, unit: newUnit.id }));
      setIsUnitModalOpen(false);
  };

  const handleAddGroup = async (name) => {
    if (!name?.trim()) return;
    const groupName = name.trim();
    const res = await productService.groups.create({ name: groupName });
    const newGroup = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || groupName };
      setGroups(prev => [...prev, newGroup]);
      setFormData(prev => ({ ...prev, group: newGroup.id }));
      setIsGroupModalOpen(false);
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {isEditMode ? t("Product Edit") : t("Product Create")}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => navigate('/product/list')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)' }}>
              <List size={16} /> {t("Product List")}
            </button>
            <button className="btn" onClick={() => navigate('/product/group')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-13, 13px)' }}>
              <Layers size={16} /> {t("Product Group")}
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              
              {/* Product Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Product Name")} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t("e.g. Denim Jeans")} style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }} required />
              </div>

              {/* Buying Price */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Buying Price")} (৳)
                </label>
                <input type="number" step="0.01" name="buying_price" value={formData.buying_price} onChange={handleChange} placeholder="0.00" style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }} />
              </div>

              {/* Selling Price */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Selling Price")} (৳)
                </label>
                <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="0.00" style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }} />
              </div>

              {/* Select a Unit */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Unit")}
                </label>
                <div style={{ display: 'flex' }}>
                  <select name="unit" value={formData.unit} onChange={handleChange} style={{ flex: 1, padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px 0 0 6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }}>
                    <option value="">{t("Select Unit")}</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsUnitModalOpen(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 6px 6px 0', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Opening Stock */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Opening Stock")}
                </label>
                <input type="number" step="0.01" name="opening_stock" value={formData.opening_stock} onChange={handleChange} placeholder="0" disabled={isEditMode} style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: isEditMode ? '#e2e8f0' : '#f8fafc', cursor: isEditMode ? 'not-allowed' : 'text' }} />
              </div>

              {/* Select Product Group */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: '600', color: '#334155' }}>
                  {t("Product Group")}
                </label>
                <div style={{ display: 'flex' }}>
                  <select name="group" value={formData.group} onChange={handleChange} style={{ flex: 1, padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '6px 0 0 6px', outline: 'none', fontSize: 'var(--fs-14, 14px)', background: '#f8fafc' }}>
                    <option value="">{t("Select Group")}</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsGroupModalOpen(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 6px 6px 0', cursor: 'pointer' }}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '12px 32px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {submitting ? (isEditMode ? t("Updating...") : t("Adding...")) : (isEditMode ? t("Update Product") : t("Save Product"))}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddOptionModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleAddUnit}
        title={t("Add Unit")}
        label={t("Unit Name")}
      />

      <AddOptionModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t("Add Product Group")}
        label={t("Group Name")}
      />
    </div>
  );
};

export default ProductCreate;
