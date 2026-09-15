import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../../components/PrintHeader';
import { List, Plus, FileSpreadsheet, Printer, RotateCcw, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddOptionModal from '../../../components/AddOptionModal';
import { useApi } from '../../../hooks/useApi';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportVisibleTable } from '../../../utils/tableExport';
import { useConfirm } from '../../../context/ConfirmContext';

const SupplierGroup = () => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groups, setGroups] = useState([]);

  const { get, post, put, del, loading } = useApi();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_SUPPLIER_GROUPS);
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
      await post(ENDPOINTS.CRM_SUPPLIER_GROUPS, { name: groupName.toUpperCase() }, t("Supplier Group Added"));
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
      await put(`${ENDPOINTS.CRM_SUPPLIER_GROUPS}${editingGroup.id || editingGroup.uuid}/`, { name: newName.toUpperCase() }, t("Supplier Group Updated"));
      setIsEditModalOpen(false);
      setEditingGroup(null);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (group) => {
    confirm({
      title: t("Delete Supplier Group"),
      description: t("Are you sure you want to delete this group?"),
      onConfirm: async () => {
        try {
          await del(`${ENDPOINTS.CRM_SUPPLIER_GROUPS}${group.id || group.uuid}/`, t("Supplier Group Deleted"));
          fetchGroups();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
        <PrintHeader />
      <div className="chart-card">
        <div className="card-header">
          <h2 className="card-title" style={{ textTransform: 'none', fontSize: '20px' }}>{t("Supplier Group")}</h2>
          <div className="card-actions">
            <button className="btn btn-outline" style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }} onClick={() => navigate('/crm/supplier-list')}>
              <List size={14} /> {t("Supplier List")}
            </button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', background: 'var(--success)' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={14} /> {t("Group Add")}
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Table Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-main)' }}>
              {t("Show")} 
              <select style={{ margin: '0 8px', padding: '4px', border: '1px solid var(--secondary)', borderRadius: '4px' }}>
                <option>50</option>
              </select>
              {t("entries")}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => exportVisibleTable('xlsx')} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
                <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> {t("Excel")}
              </button>
              <button className="btn" onClick={() => window.print()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
                <Printer size={14} style={{ marginRight: '6px' }} /> {t("Print")}
              </button>
              <button onClick={() => window.location.reload()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
                <RotateCcw size={14} style={{ marginRight: '6px' }} /> {t("Reset")}
              </button>
              <button onClick={() => window.location.reload()} className="btn" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> {t("Reload")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--table-header-bg)', color: 'white' }}>
                <tr>
                  <th width="80" style={{ textAlign: 'center', padding: '12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("ID NO ↕")}</th>
                  <th style={{ padding: '12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("NAME ↕")}</th>
                  <th style={{ padding: '12px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>{t("CREATED AT ↕")}</th>
                  <th width="120" style={{ textAlign: 'center', padding: '12px' }}>{t("ACTION")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("No supplier groups found.")}</td>
                  </tr>
                ) : (
                  groups.map((group, index) => (
                    <tr key={group.id || group.uuid} style={{ background: index % 2 === 0 ? 'white' : 'var(--card-header-bg)' }}>
                      <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>{group.name}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                        {(group.created_at || group.date) 
                          ? new Date(group.created_at || group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                          : '-'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEditClick(group)}>
                            <Edit size={14} />
                          </button>
                          <button style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDeleteClick(group)}>
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

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <div>{t("Showing {{from}} to {{to}} of {{total}} entries", { from: groups.length ? 1 : 0, to: groups.length, total: groups.length })}</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>{t("Previous")}</button>
              <button style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>1</button>
              <button style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>{t("Next")}</button>
            </div>
          </div>
        </div>
      </div>

      <AddOptionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddGroup}
        title={t("Add New Supplier Group")}
        label={t("Group Name")}
      />

      {isEditModalOpen && editingGroup && (
        <AddOptionModal 
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingGroup(null); }}
          onSave={handleEditSave}
          title={t("Edit Supplier Group")}
          label={t("Group Name")}
          initialValue={editingGroup.name}
        />
      )}
    </div>
  );
};

export default SupplierGroup;
