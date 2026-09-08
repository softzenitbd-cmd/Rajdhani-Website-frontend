import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../../components/PrintHeader';
import { List, Plus, FileSpreadsheet, FileText, Printer, RotateCcw, RefreshCw, Edit, Trash2, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddOptionModal from '../../../components/AddOptionModal';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';

const ClientGroup = () => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  
  const { get, post, put, loading } = useApi();
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (groupName) => {
    if (!groupName || !groupName.trim()) return;
    try {
      await post(ENDPOINTS.CRM_CLIENT_GROUPS, { name: groupName.toUpperCase() }, "Client Group Added");
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (newName) => {
    if (!newName || !newName.trim()) return;
    try {
      await put(`${ENDPOINTS.CRM_CLIENT_GROUPS}${editingGroup.id}/`, { name: newName.toUpperCase() }, "Client Group Updated");
      setIsEditModalOpen(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-content" style={{ position: 'relative' }}>
        <PrintHeader />
      <div className="chart-card">
        {/* Header */}
        <div className="card-header">
          <h2 className="card-title" style={{ textTransform: 'none', fontSize: '20px' }}>Client Group</h2>
          <div className="card-actions">
            <button className="btn btn-outline" style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }} onClick={() => navigate('/crm/client-list')}>
              <List size={14} /> Client List
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', background: 'var(--success)' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={14} /> Group Add
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
            Show 
            <select style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}>
              <option>50</option>
            </select>
            entries
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>Excel</button>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>CSV</button>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>PDF</button>
            <button className="btn" onClick={window.print} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}><Printer size={14} style={{ marginRight: '4px' }} /> {t('common.print')}</button>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}><RotateCcw size={14} style={{ marginRight: '4px' }} /> {t('common.reset')}</button>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>Reload</button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table">
            <thead style={{ background: 'var(--table-header-bg)', color: 'white' }}>
              <tr>
                <th width="80" style={{ textAlign: 'center' }}>ID NO <span style={{ opacity: 0.5, fontSize: '8px', verticalAlign: 'middle' }}>▼</span></th>
                <th>NAME <span style={{ opacity: 0.5, fontSize: '8px', verticalAlign: 'middle' }}>▼</span></th>
                <th>CREATED AT <span style={{ opacity: 0.5, fontSize: '8px', verticalAlign: 'middle' }}>▼</span></th>
                <th width="100" style={{ textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} style={{ background: group.id % 2 === 0 ? 'var(--card-header-bg)' : 'white' }}>
                  <td style={{ textAlign: 'center', padding: '8px' }}>{group.id}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{group.name}</td>
                  <td style={{ padding: '8px' }}>{group.createdAt}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }} onClick={() => handleEditClick(group)}>
                      <Edit size={14} />
                    </button>
                    <button style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} onClick={() => alert("Delete group feature coming soon!")}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No client groups found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddGroup}
        title="Add New Client Group"
        label="Group Name"
      />

      <AddOptionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        title="Edit Client Group"
        label="Group Name"
        initialValue={editingGroup ? editingGroup.name : ''}
      />
    </div>
  );
};

export default ClientGroup;
