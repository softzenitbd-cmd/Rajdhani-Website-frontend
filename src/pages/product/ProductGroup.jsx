import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { RotateCcw, Edit, Trash2, RefreshCw, Plus } from 'lucide-react';
import { productService } from '../../services/productService';
import AddOptionModal from '../../components/AddOptionModal';

const ProductGroup = () => {
  const { t } = useTranslation();

  const defaultGroups = [
    { id: 1, name: 'LADIS GERMENTS 2', createdAt: '15 Jun 2026' },
    { id: 2, name: 'GENTS GERMENTS 2', createdAt: '15 Jun 2026' },
    { id: 3, name: 'BAG ALL', createdAt: '15 Sep 2025' },
    { id: 4, name: 'KIDS LADIS SHOE', createdAt: '12 Sep 2025' },
    { id: 5, name: 'KIDS GENTS SHOE', createdAt: '12 Sep 2025' },
    { id: 6, name: 'LADIES SHOE', createdAt: '12 Sep 2025' },
    { id: 7, name: 'GANTS SHOE', createdAt: '12 Sep 2025' },
    { id: 8, name: 'GROM KAPOR ALL', createdAt: '14 May 2024' },
    { id: 9, name: 'ORNA', createdAt: '23 Apr 2024' },
    { id: 10, name: 'SAREE', createdAt: '23 Apr 2024' },
    { id: 11, name: 'LADIS GERMENTS', createdAt: '23 Apr 2024' },
    { id: 12, name: 'THREE PIECE', createdAt: '23 Apr 2024' },
    { id: 13, name: 'GENTS GERMENTS', createdAt: '23 Apr 2024' },
    { id: 14, name: 'SIT KAPOR', createdAt: '17 Feb 2024' }
  ];

  const [groups, setGroups] = useState(defaultGroups);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await productService.groups.getAll();
      const list = Array.isArray(res) ? res : (res?.results || []);
      const localGroups = JSON.parse(localStorage.getItem('rajdhani_custom_groups') || '[]');
      
      const rawList = list.length > 0 ? list : defaultGroups;
      const combined = [...localGroups, ...rawList];

      // Remove duplicates by name
      const uniqueGroups = [];
      const map = new Map();
      for (const item of combined) {
        const itemObj = {
          id: item.id || `grp-${Date.now()}`,
          name: item.name || item.group_name || 'Group',
          createdAt: item.created_at || item.createdAt ? new Date(item.created_at || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Jun 2026'
        };
        if (!map.has(itemObj.name.toLowerCase())) {
          map.set(itemObj.name.toLowerCase(), true);
          uniqueGroups.push(itemObj);
        }
      }

      setGroups(uniqueGroups);
    } catch (err) {
      console.error("Error fetching product groups:", err);
      const localGroups = JSON.parse(localStorage.getItem('rajdhani_custom_groups') || '[]');
      setGroups([...localGroups, ...defaultGroups]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSaveGroup = async (name) => {
    if (!name?.trim()) return;
    const groupName = name.trim();
    try {
      let created = null;
      if (editingGroup) {
        await productService.groups.update(editingGroup.id, { name: groupName }).catch(() => null);
      } else {
        created = await productService.groups.create({ name: groupName }).catch(() => null);
      }

      const localGroups = JSON.parse(localStorage.getItem('rajdhani_custom_groups') || '[]');
      if (editingGroup) {
        const updatedLocal = localGroups.map(g => g.id === editingGroup.id ? { ...g, name: groupName } : g);
        localStorage.setItem('rajdhani_custom_groups', JSON.stringify(updatedLocal));
      } else {
        localGroups.unshift({
          id: created?.id || Date.now(),
          name: groupName,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('rajdhani_custom_groups', JSON.stringify(localGroups));
      }

      alert(editingGroup ? "Product group updated successfully!" : "Product group created successfully!");
      setIsModalOpen(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (err) {
      console.error("Error saving group:", err);
      setIsModalOpen(false);
      setEditingGroup(null);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await productService.groups.delete(id).catch(() => null);
      const localGroups = JSON.parse(localStorage.getItem('rajdhani_custom_groups') || '[]');
      const updatedLocal = localGroups.filter(g => g.id !== id);
      localStorage.setItem('rajdhani_custom_groups', JSON.stringify(updatedLocal));
      
      setGroups(prev => prev.filter(g => g.id !== id));
      alert("Product group deleted!");
    } catch (err) {
      console.error("Error deleting group:", err);
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
          <h2 className="premium-title" style={{ fontSize: '18px', fontWeight: 'normal' }}>
            Product Group
          </h2>
          <button onClick={() => { setEditingGroup(null); setIsModalOpen(true); }} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Group
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
                placeholder="Search group..." 
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
              <button onClick={fetchGroups} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                  <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>NAME</th>
                  <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: '11px' }}>CREATED AT ↕</th>
                  <th style={{ textAlign: 'center', padding: '12px', fontSize: '11px', width: '100px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No groups found</td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <tr key={group.id} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{group.id}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{group.name}</td>
                      <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{group.createdAt}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button onClick={() => { setEditingGroup(group); setIsModalOpen(true); }} className="action-btn-sm edit" style={{ background: 'var(--info)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}>
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="action-btn-sm delete" style={{ background: 'var(--danger)', border: 'none', borderRadius: '4px', padding: '6px', color: 'white', cursor: 'pointer' }}>
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
            <div>Showing 1 to {filteredGroups.length} of {groups.length} entries</div>
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
        onClose={() => { setIsModalOpen(false); setEditingGroup(null); }}
        onSave={handleSaveGroup}
        title={editingGroup ? "Edit Product Group" : "Add Product Group"}
        label="Group Name"
        initialValue={editingGroup ? editingGroup.name : ''}
      />
    </div>
  );
};

export default ProductGroup;

