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
      if (formData.custom_barcode_no) payload.custom_barcode_no = String(formData.custom_barcode_no).trim();
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

      navigate('/product/list');
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
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {isEditMode ? t("Product Edit") : t("Product Create")}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => navigate('/product/list')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <List size={16} /> {t("Product List")}
            </button>
            <button className="btn" onClick={() => navigate('/product/group')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Layers size={16} /> {t("Product Group")}
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

              {/* Product Name */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    <Package size={18} />
                  </div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t("Product Name")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} required />
                </div>
              </div>

              {/* Buying Price */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    ৳
                  </div>
                  <input type="number" step="0.01" name="buying_price" value={formData.buying_price} onChange={handleChange} placeholder={t("Buying Price")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Selling Price */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    ৳
                  </div>
                  <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder={t("Selling Price")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Select a Unit */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="unit" value={formData.unit} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">{t("Select a Unit")}</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsUnitModalOpen(true)} className="append-btn" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0' }}><Plus size={20} /></button>
                </div>
              </div>

              {/* Opening Stock */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    <Scale size={18} />
                  </div>
                  <input type="number" step="0.01" name="opening_stock" value={formData.opening_stock} onChange={handleChange} placeholder={t("Opening Stock")} disabled={isEditMode} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Select Product Group */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="group" value={formData.group} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">{t("Select Product Group")}</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsGroupModalOpen(true)} className="append-btn" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0' }}><Plus size={20} /></button>
                </div>
              </div>

              {/* Barcode */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>{t("BC")}</div>
                  <input type="text" name="custom_barcode_no" value={formData.custom_barcode_no} onChange={handleChange} placeholder={t("Custom Barcode No (optional – auto generated when empty)")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Wholesale Price */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>৳</div>
                  <input type="number" step="0.01" name="wholesale_price" value={formData.wholesale_price} onChange={handleChange} placeholder={t("Wholesale Price")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Stock warning */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)' }}><Scale size={18} /></div>
                  <input type="number" name="stock_warning" value={formData.stock_warning} onChange={handleChange} placeholder={t("Stock Warning Qty")} style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Brand / Color / Size / Warehouse / Status */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="brand" value={formData.brand} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
                  <option value="">{t("Select Brand (optional)")}</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="color" value={formData.color} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
                  <option value="">{t("Select Color (optional)")}</option>
                  {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="size" value={formData.size} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
                  <option value="">{t("Select Size (optional)")}</option>
                  {sizes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="warehouse" value={formData.warehouse} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
                  <option value="">{t("Select Warehouse (optional)")}</option>
                  {warehouses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <select name="status" value={String(formData.status)} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white' }}>
                  <option value="1">{t("Active")}</option>
                  <option value="0">{t("Inactive")}</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '16px', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
              {submitting ? (isEditMode ? t("Updating...") : t("Adding...")) : (isEditMode ? t("Update Product") : t("Add Product"))}
            </button>
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
