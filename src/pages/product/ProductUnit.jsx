import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2, RefreshCw, Plus } from 'lucide-react';
import { productService } from '../../services/productService';
import AddOptionModal from '../../components/AddOptionModal';

const ProductUnit = () => {
  const { t } = useTranslation();

  const defaultUnits = [
    { id: 1, name: 'PEACE', createdAt: '17 Feb 2024' },
    { id: 2, name: 'GOZ', createdAt: '17 Feb 2024' },
    { id: 3, name: 'Pcs', createdAt: '18 Feb 2024' },
    { id: 4, name: 'Kg', createdAt: '18 Feb 2024' },
    { id: 5, name: 'Set', createdAt: '19 Feb 2024' }
  ];

  const [units, setUnits] = useState(defaultUnits);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await productService.units.getAll();
      const list = Array.isArray(res) ? res : (res?.results || []);
      if (list.length > 0) {
        setUnits(list.map((item, index) => ({
          id: item.id || index + 1,
          name: item.name || item.unit_name || `Unit ${index + 1}`,
          createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '17 Feb 2024'
        })));
      } else {
        setUnits(defaultUnits);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
      setUnits(defaultUnits);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSaveUnit = async (name) => {
    if (!name?.trim()) return;
    try {
      if (editingUnit) {
        await productService.units.update(editingUnit.id, { name });
      } else {
        await productService.units.create({ name });
      }
      setIsModalOpen(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (err) {
      console.error("Error saving unit:", err);
      if (editingUnit) {
        setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, name } : u));
      } else {
        setUnits(prev => [{ id: Date.now(), name, createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, ...prev]);
      }
      setIsModalOpen(false);
      setEditingUnit(null);
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      await productService.units.delete(id);
      fetchUnits();
    } catch (err) {
      console.error("Error deleting unit:", err);
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredUnits = units.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'normal' }}>
            Product Unit
          </h2>
          <button onClick={() => { setEditingUnit(null); setIsModalOpen(true); }} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Unit
          </button>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px', paddingTop: '0' }}>
          <PrintHeader />
          
          {/* Table Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                Show 
                <select style={{ margin: '0 8px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <option>50</option>
                </select>
                entries
              </div>
              <input 
                type="text" 
                placeholder="Search unit..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => window.print()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Print
              </button>
              <button onClick={() => setSearchTerm('')} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={fetchUnits} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Reload
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                  <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px', width: '80px' }}>ID<br/>NO ↕</th>
                  <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>UNIT ↕</th>
                  <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CREATED AT ↕</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', width: '100px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No units found</td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{unit.id}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{unit.name}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{unit.createdAt}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button onClick={() => { setEditingUnit(unit); setIsModalOpen(true); }} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}>
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteUnit(unit.id)} className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}>
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

          {/* Pagination Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px' }}>
            <div>Showing 1 to {filteredUnits.length} of {units.length} entries</div>
            <div style={{ display: 'flex' }}>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'var(--card-header-bg)', color: 'var(--text-muted)', cursor: 'not-allowed', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>Previous</button>
              <button style={{ padding: '6px 12px', border: '1px solid #3b82f6', background: 'var(--primary)', color: 'white' }}>1</button>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderLeft: 'none', background: 'var(--card-header-bg)', color: 'var(--text-muted)', cursor: 'not-allowed', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUnit(null); }}
        onSave={handleSaveUnit}
        title={editingUnit ? "Edit Product Unit" : "Add Product Unit"}
        label="Unit Name"
        initialValue={editingUnit ? editingUnit.name : ''}
      />
    </div>
  );
};

export default ProductUnit;

