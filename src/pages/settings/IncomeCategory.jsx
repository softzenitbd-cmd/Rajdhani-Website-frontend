import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RefreshCcw, Trash2, Plus, Search, X } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { exportVisibleTable } from '../../utils/tableExport';
import { printPage } from '../../utils/printUtils';

const IncomeCategory = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async (query = '') => {
    try {
      setLoading(true);
      const res = await accountingService.getIncomeCategories(query);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setCategories(data);
    } catch (error) {
      toast.error(error?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCategories(searchTerm);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      setSubmitting(true);
      await accountingService.createIncomeCategory({ name: categoryName.trim() });
      setCategoryName('');
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating income category:', error);
      toast.error(error?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await accountingService.deleteIncomeCategory(id);
      fetchCategories();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card" style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <PrintHeader />
        
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text-main)' }}>Receive Category List</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Manage your deposit & income categories</span>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            style={{ background: 'var(--success)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Add Receive Category
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Controls & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  placeholder="Search by category name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
              <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => exportVisibleTable('xlsx')} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Excel</button>
              <button onClick={() => exportVisibleTable('csv')} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>CSV</button>
              <button onClick={() => printPage()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>PDF</button>
              <button onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                <Printer size={14} /> Print
              </button>
              <button onClick={() => { setSearchTerm(''); fetchCategories(''); }} style={{ background: '#64748b', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                <RefreshCcw size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '13px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#718096', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '80px', padding: '12px', textAlign: 'center' }}>ID NO</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>CATEGORY NAME</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>CREATED AT</th>
                  <th style={{ width: '120px', padding: '12px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No categories found.</td>
                  </tr>
                ) : (
                  categories.map((row, index) => (
                    <tr key={row.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#64748b' }}>#{row.id || index + 1}</td>
                      <td style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-main)' }}>{row.name}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button onClick={() => handleDelete(row.id)} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }} title="Delete">
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div>Total Categories: {categories.length}</div>
          </div>
        </div>
      </div>

      {/* Modal for Add Category */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Add Receive Category</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CASH SELL, TAGADA"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeCategory;
