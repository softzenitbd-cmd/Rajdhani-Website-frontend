import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Layers, Plus, Package, Scale } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrintHeader from '../../components/PrintHeader';
import AddOptionModal from '../../components/AddOptionModal';
import { productService } from '../../services/productService';

const ProductCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product || null;
  const isEditMode = !!editingProduct;

  const [formData, setFormData] = useState({
    name: '',
    purchase_price: '',
    sales_price: '',
    unit: '',
    stock: '',
    group: ''
  });
  
  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);



  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        purchase_price: editingProduct.purchase_price || editingProduct.buy || '',
        sales_price: editingProduct.sales_price || editingProduct.sell || '',
        unit: editingProduct.unit || editingProduct.unit_id || '',
        stock: editingProduct.stock || editingProduct.openingStock || '',
        group: editingProduct.group || editingProduct.group_id || ''
      });
    }
  }, [editingProduct]);

  const fetchPrerequisites = async () => {
    try {
      const [unitsRes, groupsRes] = await Promise.all([
        productService.units.getAll().catch(() => []),
        productService.groups.getAll().catch(() => [])
      ]);

      const unitList = Array.isArray(unitsRes) ? unitsRes : (unitsRes?.results || []);
      const groupList = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.results || []);

      setUnits(unitList);
      setGroups(groupList);
    } catch (err) {
      console.error("Error fetching units/groups:", err);
      setUnits([]);
      setGroups([]);
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
      alert("Please enter a product name");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : 0,
        sales_price: formData.sales_price ? Number(formData.sales_price) : 0,
        stock: formData.stock ? Number(formData.stock) : 0,
        unit: formData.unit || null,
        group: formData.group || null
      };

      try {
        if (isEditMode && editingProduct?.id) {
          await productService.updateProduct(editingProduct.id, payload);
          alert("Product updated successfully via API!");
        } else {
          await productService.createProduct(payload);
          alert("Product created successfully via API!");
        }
      } catch (apiErr) {
        console.error("Error saving product:", apiErr);
        alert(apiErr?.message || "Failed to save product. Please check the form and try again.");
        return;
      }

      navigate('/product/list');
    } catch (err) {
      console.error("Error saving product:", err);
      alert("An unexpected error occurred while saving product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUnit = async (name) => {
    if (!name?.trim()) return;
    const unitName = name.trim();
    try {
      const res = await productService.units.create({ name: unitName }).catch(() => null);
      const newUnit = { id: res?.id || `unit-${Date.now()}`, name: unitName };
      setUnits(prev => [...prev, newUnit]);
      setFormData(prev => ({ ...prev, unit: newUnit.id }));
      setIsUnitModalOpen(false);
    } catch (err) {
      console.error("Error adding unit:", err);
      const fallbackUnit = { id: `unit-${Date.now()}`, name: unitName };
      setUnits(prev => [...prev, fallbackUnit]);
      setFormData(prev => ({ ...prev, unit: fallbackUnit.id }));
      setIsUnitModalOpen(false);
    }
  };
  
  const handleAddGroup = async (name) => {
    if (!name?.trim()) return;
    const groupName = name.trim();
    try {
      const res = await productService.groups.create({ name: groupName }).catch(() => null);
      const newGroup = { id: res?.id || `group-${Date.now()}`, name: groupName };
      setGroups(prev => [...prev, newGroup]);
      setFormData(prev => ({ ...prev, group: newGroup.id }));
      setIsGroupModalOpen(false);
    } catch (err) {
      console.error("Error adding group:", err);
      const fallbackGroup = { id: `group-${Date.now()}`, name: groupName };
      setGroups(prev => [...prev, fallbackGroup]);
      setFormData(prev => ({ ...prev, group: fallbackGroup.id }));
      setIsGroupModalOpen(false);
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="premium-title" style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {isEditMode ? 'Product Edit' : 'Product Create'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => navigate('/product/list')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <List size={16} /> Product List
            </button>
            <button className="btn" onClick={() => navigate('/product/group')} style={{ background: 'var(--text-muted)', color: 'white', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Layers size={16} /> Product Group
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
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} required />
                </div>
              </div>

              {/* Buying Price */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    ৳
                  </div>
                  <input type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleChange} placeholder="Buying Price" style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Selling Price */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    ৳
                  </div>
                  <input type="number" step="0.01" name="sales_price" value={formData.sales_price} onChange={handleChange} placeholder="Selling Price" style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Select a Unit */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="unit" value={formData.unit} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">Select a Unit</option>
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
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Opening Stock" style={{ flex: 1, padding: '12px', border: 'none', outline: 'none' }} />
                </div>
              </div>

              {/* Select Product Group */}
              <div className="form-group" style={{ marginBottom: '0' }}>
                <div className="input-with-append">
                  <select name="group" value={formData.group} onChange={handleChange} style={{ padding: '14px', flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px 0 0 4px', outline: 'none', background: 'white' }}>
                    <option value="">Select Product Group</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setIsGroupModalOpen(true)} className="append-btn" style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '0 4px 4px 0' }}><Plus size={20} /></button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', padding: '16px', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
              {submitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Product' : 'Add Product')}
            </button>
          </form>
        </div>
      </div>
      
      <AddOptionModal 
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleAddUnit}
        title="Add Unit"
        label="Unit Name"
      />
      
      <AddOptionModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title="Add Product Group"
        label="Group Name"
      />
    </div>
  );
};

export default ProductCreate;
