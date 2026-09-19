import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Package, DollarSign, Scale } from 'lucide-react';
import { productService } from '../services/productService';
import { useToast } from '../context/ToastContext';

/**
 * Centered Nested Popup Modal (Modal on top of Modal) matching Image 2 for Unit & Group creation.
 */
const CenteredNestedPopup = ({ isOpen, onClose, onSave, title, label }) => {
  const { t } = useTranslation();
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) setVal('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!val.trim()) {
      toast.error(t("Please enter {{v0}}", { v0: label ? label.toLowerCase() : t("a value") }));
      return;
    }
    try {
      setSaving(true);
      await onSave(val.trim());
    } catch (err) {
      toast.error(err?.message || t("Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10050,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '460px',
        maxWidth: '92vw',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h4 style={{ margin: 0, fontSize: 'var(--fs-15, 15px)', fontWeight: 'bold', color: '#1e293b' }}>
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} style={{ padding: '24px 20px' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <label style={{
              position: 'absolute',
              top: '-11px',
              left: '12px',
              background: '#0ea5e9',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: 'var(--fs-11, 11px)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 1
            }}>
              🎓 {label}
            </label>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={`${label}...`}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px 10px 16px',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                outline: 'none',
                fontSize: 'var(--fs-13, 13px)',
                background: 'white'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'var(--fs-13, 13px)',
                cursor: 'pointer'
              }}
            >
              {saving ? '...' : t('product_modal.save', 'যুক্ত')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 'var(--fs-13, 13px)',
                cursor: 'pointer'
              }}
            >
              {t('product_modal.close', 'বাতিল')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Dedicated Add New Product modal component with bilingual support (EN/BN).
 */
const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    buying_price: '',
    selling_price: '',
    opening_stock: '',
    unit: '',
    group: ''
  });

  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const list = (r) => (Array.isArray(r) ? r : r?.results || []);
      const [unitsRes, groupsRes] = await Promise.all([
        productService.units.getAll().catch(() => []),
        productService.groups.getAll().catch(() => [])
      ]);
      setUnits(list(unitsRes));
      setGroups(list(groupsRes));
    } catch (err) {
      console.error("Failed to load units/groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPrerequisites();
      setFormData({
        name: '',
        buying_price: '',
        selling_price: '',
        opening_stock: '',
        unit: '',
        group: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUnit = async (name) => {
    if (!name?.trim()) return;
    try {
      const res = await productService.units.create({ name: name.trim() });
      const newUnit = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || name.trim() };
      setUnits((prev) => [...prev, newUnit]);
      setFormData((prev) => ({ ...prev, unit: newUnit.id }));
      toast.success(t("Unit created successfully!"));
    } catch (err) {
      toast.error(err?.message || t("Failed to create unit"));
    } finally {
      setIsUnitModalOpen(false);
    }
  };

  const handleAddGroup = async (name) => {
    if (!name?.trim()) return;
    try {
      const res = await productService.groups.create({ name: name.trim() });
      const newGroup = { ...(res && typeof res === 'object' ? res : {}), id: res?.id || res?.uuid, name: res?.name || name.trim() };
      setGroups((prev) => [...prev, newGroup]);
      setFormData((prev) => ({ ...prev, group: newGroup.id }));
      toast.success(t("Product Group created successfully!"));
    } catch (err) {
      toast.error(err?.message || t("Failed to create product group"));
    } finally {
      setIsGroupModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error(t("Please enter a product name"));
      return;
    }

    try {
      setSaving(true);
      const money = (v) => Number(v || 0).toFixed(2);
      const payload = {
        name: formData.name.trim(),
        buying_price: money(formData.buying_price),
        selling_price: money(formData.selling_price),
        opening_stock: money(formData.opening_stock),
        stock: money(formData.opening_stock),
        unit: formData.unit || null,
        group: formData.group || null,
        status: 1
      };

      const created = await productService.createProduct(payload);
      toast.success(t("Product added successfully!"));

      const unitObj = units.find((u) => String(u.id) === String(formData.unit));
      const newProd = {
        ...created,
        id: created.id || created.uuid,
        name: created.name || formData.name.trim(),
        sales_price: Number(created.selling_price || formData.selling_price || 0),
        price: Number(created.selling_price || formData.selling_price || 0),
        stock: Number(created.opening_stock || formData.opening_stock || 0),
        unit_name: unitObj?.name || 'Pcs'
      };

      if (onSuccess) onSuccess(newProd);
      onClose();
    } catch (err) {
      console.error("Error creating product:", err);
      toast.error(err?.message || t("Failed to create product via API."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          width: '720px',
          maxWidth: '95vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', color: '#1e293b' }}>
              {t('product_modal.add_new_product', 'Add New Product')}
            </h3>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Product Name */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '12px',
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: 'var(--fs-11, 11px)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 1
                  }}>
                    <Package size={11} /> {t('product_modal.product_name', 'Product Name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('product_modal.product_name_placeholder', 'পণ্য নাম')}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px 10px 16px',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white'
                    }}
                  />
                </div>

                {/* Selling Price */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '12px',
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: 'var(--fs-11, 11px)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 1
                  }}>
                    <DollarSign size={11} /> {t('product_modal.selling_price', 'বিক্রয় মূল্য')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleChange}
                    placeholder={t('product_modal.selling_price_placeholder', 'বিক্রয় মূল্য')}
                    style={{
                      width: '100%',
                      padding: '14px 16px 10px 16px',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white'
                    }}
                  />
                </div>

                {/* Opening Stock */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '12px',
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: 'var(--fs-11, 11px)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 1
                  }}>
                    <Scale size={11} /> {t('product_modal.opening_stock', 'শুরুর স্টক')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="opening_stock"
                    value={formData.opening_stock}
                    onChange={handleChange}
                    placeholder={t('product_modal.opening_stock_placeholder', 'শুরুর স্টক')}
                    style={{
                      width: '100%',
                      padding: '14px 16px 10px 16px',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white'
                    }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Buying Price */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '12px',
                    background: '#0ea5e9',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: 'var(--fs-11, 11px)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 1
                  }}>
                    <DollarSign size={11} /> {t('product_modal.buying_price', 'ক্রয় মূল্য')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="buying_price"
                    value={formData.buying_price}
                    onChange={handleChange}
                    placeholder={t('product_modal.buying_price_placeholder', 'ক্রয় মূল্য')}
                    style={{
                      width: '100%',
                      padding: '14px 16px 10px 16px',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white'
                    }}
                  />
                </div>

                {/* Select a Unit */}
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">{t('product_modal.select_unit', 'Select a Unit')}</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsUnitModalOpen(true)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={t("Add Unit")}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Select Product Group */}
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      outline: 'none',
                      fontSize: 'var(--fs-13, 13px)',
                      background: 'white',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">{t('product_modal.select_group', 'Select Product Group')}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(true)}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={t("Add Group")}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: 'var(--fs-13, 13px)',
                  cursor: 'pointer'
                }}
              >
                {saving ? '...' : t('product_modal.add', 'Add')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: 'var(--fs-13, 13px)',
                  cursor: 'pointer'
                }}
              >
                {t('product_modal.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Centered Nested Popups matching Image 2 (Popup on top of Popup) */}
      <CenteredNestedPopup
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        onSave={handleAddUnit}
        title={t('product_modal.create_unit_title', 'পণ্য ইউনিট তৈরি')}
        label={t('product_modal.unit_name', 'ইউনিট নাম')}
      />

      <CenteredNestedPopup
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleAddGroup}
        title={t('product_modal.create_group_title', 'পণ্য গ্রুপ তৈরি')}
        label={t('product_modal.group_name', 'গ্রুপ নাম')}
      />
    </>
  );
};

export default AddProductModal;
