import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Search, Calendar, FileSpreadsheet, Printer, RotateCcw, ChevronDown, Eye, Edit, Trash2, ArrowDownCircle, FileText, Ban, CheckCircle2, X, User } from 'lucide-react';
import PrintHeader from '../../../components/PrintHeader';
import { useApi } from '../../../hooks/useApi';
import { useConfirm } from '../../../context/ConfirmContext';
import { useToast } from '../../../context/ToastContext';
import { ENDPOINTS } from '../../../api/endpoints';
import { exportToExcel } from '../../../utils/excelExporter';
import { useTranslation } from 'react-i18next';
import crmService from '../../../services/crmService';
import { accountingService } from '../../../services/accountingService';
import { saleService } from '../../../services/saleService';
import { toList } from '../../../utils/apiHelpers';
import CustomDatePicker from '../../../components/CustomDatePicker';
import Pagination from '../../../components/Pagination';


const ClientImageUploader = ({ client, onUploadSuccess }) => {
  const { patch } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(client.image || client.details?.image || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    try {
      await patch(`${ENDPOINTS.CRM_CLIENTS}${client.id || client.uuid}/`, formData, t("Image saved"), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onUploadSuccess) onUploadSuccess();
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to save image"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc' }}>
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(45deg, transparent 48%, #cbd5e1 48%, #cbd5e1 52%, transparent 52%)' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(-45deg, transparent 48%, #cbd5e1 48%, #cbd5e1 52%, transparent 52%)', borderRadius: '50%', border: '2px solid #cbd5e1' }}></div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <label style={{ 
          background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', 
          padding: '4px 8px', fontSize: 'var(--fs-10, 10px)', cursor: 'pointer', display: 'inline-block', fontWeight: 'bold' 
        }}>
          {t("Choose a file")}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </label>
        <button 
          onClick={handleSave} 
          disabled={!selectedFile || uploading}
          style={{ 
            background: (!selectedFile || uploading) ? '#94a3b8' : '#64748b', 
            color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', 
            fontSize: 'var(--fs-10, 10px)', cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer', fontWeight: 'bold' 
          }}
        >
          {uploading ? t("Saving") : t("Save")}
        </button>
      </div>
    </div>
  );
};

const CollectionDateModal = ({ isOpen, onClose, client, onUpdate }) => {
  const { patch } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client && isOpen) {
      const d = client.due_date ? String(client.due_date).split('T')[0] : '';
      setDate(d);
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await patch(`${ENDPOINTS.CRM_CLIENTS}${client.id || client.uuid}/`, { due_date: date || null }, t("Collection date updated"));
      onUpdate({ due_date: date || null });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to update date"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'modalFadeIn 0.3s ease' }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90vw', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <div className="form-group" style={{ marginBottom: '20px', position: 'relative', marginTop: '10px' }}>
          <div className="form-input floating-label" style={{ position: 'relative' }}>
            <label style={{ 
              position: 'absolute', top: '-12px', left: '12px', background: '#258b88', color: 'white', 
              padding: '2px 10px', borderRadius: '4px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', zIndex: 10
            }}>
              {t("Due Collection Date", "বাকি গ্রহণের তারিখ")}
            </label>
            <CustomDatePicker 
               
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '16px 12px', border: '1px solid #93c5fd', borderRadius: '8px', fontSize: 'var(--fs-14, 14px)', outline: 'none' }}
            />
          </div>
        </div>
        
        <button 
          onClick={handleUpdate}
          disabled={loading}
          style={{ width: '100%', background: '#059669', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? t("Updating...") : t("Update")}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ background: '#64748b', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

const numOrNull = (obj, ...keys) => {
  for (const k of keys) {
    const statsValue = obj.stats?.[k];
    if (statsValue !== undefined && statsValue !== null && statsValue !== '') {
      const value = Number(statsValue);
      if (Number.isFinite(value)) return value;
    }
    const value = obj[k];
    if (value !== undefined && value !== null && value !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const ClientList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  
  const [activeAction, setActiveAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewClient, setViewClient] = useState(null);
  const [dateModalClient, setDateModalClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(50);
  
  const { get, del, patch, loading } = useApi();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        setActiveAction(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: t("Delete Client"),
      message: t("Are you sure you want to delete this client?"),
      confirmText: t("Delete"),
      variant: 'danger'
    });
    if (isConfirmed) {
      try {
        await del(`${ENDPOINTS.CRM_CLIENTS}${id}/`, t("Client deleted successfully"));
        fetchClients();
        setActiveAction(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeactivate = async (id, currentStatus) => {
    const isCurrentlyActive = currentStatus === true || currentStatus === 'Active' || currentStatus === 'Activated';
    const newStatusBool = !isCurrentlyActive;
    const actionLabel = newStatusBool ? t('activate') : t('deactivate');

    const isConfirmed = await confirm({
      title: t("{{v0}} Client", { v0: newStatusBool ? t("Activate") : t("Deactivate") }),
      message: t("Are you sure you want to {{v0}} this client?", { v0: actionLabel }),
      confirmText: newStatusBool ? t("Activate") : t("Deactivate"),
      variant: newStatusBool ? 'warning' : 'danger'
    });

    if (isConfirmed) {
      try {
        await patch(`${ENDPOINTS.CRM_CLIENTS}${id}/`, { status: newStatusBool }, t("Client {{v0}} successfully", { v0: newStatusBool ? t("activated") : t("deactivated") }));
        fetchClients();
        setActiveAction(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await get(ENDPOINTS.CRM_CLIENT_GROUPS);
      setGroups(res.results || res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      let url = ENDPOINTS.CRM_CLIENTS;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGroup) params.append('group', selectedGroup);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      
      params.append('page', currentPage);
      params.append('page_size', limit);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await get(url);
      const fetchedClients = res.results || res.data || res || [];
      setTotalCount(res.count || fetchedClients.length);
      
      try {
        const [statsRes, receivesRes, returnsRes, expensesRes] = await Promise.allSettled([
          crmService.getClientDueReport({ page_size: 5000 }),
          accountingService.getReceives({ page_size: 5000 }),
          saleService.getSalesReturns({ page_size: 5000 }),
          accountingService.getExpenses({ page_size: 5000 })
        ]);
        
        const statsData = statsRes.status === 'fulfilled' ? toList(statsRes.value) : [];
        const rawReceives = receivesRes.status === 'fulfilled' ? toList(receivesRes.value) : [];
        const rawReturns = returnsRes.status === 'fulfilled' ? toList(returnsRes.value) : [];
        const rawExpenses = expensesRes.status === 'fulfilled' ? toList(expensesRes.value) : [];

        const relationKeys = (ref) => {
          const ids = new Set();
          const names = new Set();
          const phones = new Set();
          const addId = (value) => {
            if (value !== undefined && value !== null && value !== '') ids.add(`id:${String(value).trim()}`);
          };
          const addName = (value) => {
            if (!value) return;
            const text = String(value).trim();
            if (!text) return;
            names.add(`name:${text.toLocaleLowerCase()}`);
            const labeledName = text.match(/(?:name|client)\s*:\s*([^|,]+)/i)?.[1];
            if (labeledName) names.add(`name:${labeledName.trim().toLocaleLowerCase()}`);
            if (text.includes('|')) names.add(`name:${text.split('|')[0].trim().toLocaleLowerCase()}`);
            const phone = text.match(/(?:\+?\d[\d\s()-]{7,}\d)/)?.[0].replace(/\D/g, '');
            if (phone) phones.add(`phone:${phone}`);
          };
          const addPhone = (value) => {
            const phone = String(value || '').replace(/\D/g, '');
            if (phone.length >= 8) phones.add(`phone:${phone}`);
          };

          if (ref && typeof ref === 'object') {
            ['id', 'uuid', 'pk', 'client_id', 'clientId'].forEach((key) => addId(ref[key]));
            ['name', 'full_name', 'company_name', 'client_name'].forEach((key) => addName(ref[key]));
            ['phone', 'mobile', 'phone_number', 'mobile_number', 'number'].forEach((key) => addPhone(ref[key]));
            if (ref.details && typeof ref.details === 'object') {
              addId(ref.details.id);
              addName(ref.details.name);
              addPhone(ref.details.phone);
            }
          } else if (ref !== undefined && ref !== null && ref !== '') {
            addId(ref);
            addName(ref);
          }
          return { ids, names, phones };
        };

        const clientIdentity = (client) => {
          const { ids, names, phones } = relationKeys(client);
          return ids.size
            ? `client:${ids.values().next().value.slice(3)}`
            : phones.size
              ? `client:${phones.values().next().value}`
            : names.size
              ? `client:${names.values().next().value}`
              : null;
        };

        const clientAliases = new Map();
        const ambiguousAliases = new Set();
        fetchedClients.forEach((client) => {
          const identity = clientIdentity(client);
          if (!identity) return;
          const { ids, names, phones } = relationKeys(client);
          [...ids, ...names, ...phones].forEach((alias) => {
            if (ambiguousAliases.has(alias)) return;
            const existing = clientAliases.get(alias);
            if (existing && existing !== identity) {
              clientAliases.delete(alias);
              ambiguousAliases.add(alias);
            } else {
              clientAliases.set(alias, identity);
            }
          });
        });

        const identityForRefs = (refs) => {
          const relatedRefs = Array.isArray(refs) ? refs : [refs];
          const relations = relatedRefs.map(relationKeys);
          const idMatches = relations.flatMap(({ ids }) => [...ids])
            .map((alias) => clientAliases.get(alias))
            .filter(Boolean);
          if (idMatches.length) return idMatches[0];

          const phoneMatches = relations.flatMap(({ phones }) => [...phones])
            .map((alias) => clientAliases.get(alias))
            .filter(Boolean);
          if (phoneMatches.length) return phoneMatches[0];

          const nameMatches = new Set(relations.flatMap(({ names }) => [...names])
            .map((alias) => clientAliases.get(alias))
            .filter(Boolean));
          return nameMatches.size === 1 ? nameMatches.values().next().value : null;
        };

        const recordAmt = (map, refs, value) => {
          const amt = Number(value);
          if (!Number.isFinite(amt) || amt === 0) return;
          const identity = identityForRefs(refs);
          if (identity) map.set(identity, (map.get(identity) || 0) + amt);
        };

        const amountOf = (record, ...fields) => {
          for (const field of fields) {
            const value = Number(record[field]);
            if (Number.isFinite(value) && value !== 0) return value;
          }
          return 0;
        };

        const amountForClient = (map, client) => {
          const identity = identityForRefs(client);
          return identity ? map.get(identity) || 0 : 0;
        };

        const statsForClient = (client) => {
          const clientId = String(client.id || client.uuid || '');
          const clientUuid = client.uuid ? String(client.uuid) : '';
          const exactMatch = statsData.find((stats) => {
            const statsId = String(
              stats.client_id ||
              (typeof stats.client === 'object' ? (stats.client?.id || stats.client?.uuid) : stats.client) ||
              stats.id ||
              stats.uuid ||
              ''
            );
            return statsId && (statsId === clientId || (clientUuid && statsId === clientUuid));
          });
          if (exactMatch) return exactMatch;

          const clientIdentityKey = clientIdentity(client);
          if (!clientIdentityKey) return null;
          return statsData.find((stats) => identityForRefs([
            stats.client_id,
            stats.client,
            stats.client_name,
            stats.name,
            stats.phone,
          ]) === clientIdentityKey);
        };

        // Map receives by client ID
        const clientReceivesMap = new Map();
        rawReceives.forEach(rec => {
          const amt = Number(rec.amount || rec.total || 0);
          recordAmt(clientReceivesMap, rec.client || rec.client_id, amt);
        });

        // Use the same client ledger as Client Statement; the invoice list omits these invoice totals.
        const clientLedgerMap = new Map();
        for (let i = 0; i < fetchedClients.length; i += 5) {
          const batch = fetchedClients.slice(i, i + 5);
          const summaryAmountFrom = (summary, ...fields) => {
            for (const field of fields) {
              const value = Number(summary[field]);
              if (summary[field] !== undefined && summary[field] !== null && summary[field] !== '' && Number.isFinite(value)) {
                return value;
              }
            }
            return null;
          };

          const ledgerResults = await Promise.allSettled(batch.map(async (client) => {
            const clientId = client.id || client.uuid;
            if (!clientId) return { client, rows: [], summary: {} };
            const response = await accountingService.getClientLedger(clientId, { page_size: 5000 });
            const rows = toList(response);
            const ledgerRows = rows.length ? rows : toList(response?.ledger);
            const summary = response?.summary || response?.data?.summary || {};
            return { client, rows: ledgerRows, summary };
          }));

          ledgerResults.forEach((result, index) => {
            if (result.status !== 'fulfilled') {
              console.warn('Failed to load client ledger:', batch[index]?.id || batch[index]?.uuid, result.reason);
              return;
            }

            const { client, rows, summary } = result.value;
            const rowTotals = rows.reduce((sum, row) => {
              const type = String(row.type || row.transaction_type || '').toLowerCase();
              const isMoneyReturn = /money|refund/.test(type);
              const isSalesReturn = /return/.test(type) && !isMoneyReturn;
              if (type.includes('sale invoice')) {
                sum.bill += amountOf(row, 'bill', 'grand_total', 'total', 'debit');
              } else if (isMoneyReturn) {
                sum.moneyReturn += amountOf(row, 'money_return', 'debit', 'amount', 'total');
              } else if (isSalesReturn) {
                sum.salesReturn += amountOf(row, 'sales_return', 'return_amount', 'credit', 'total');
              } else {
                sum.receive += amountOf(row, 'receive', 'payment', 'amount_received', 'credit');
              }
              return sum;
            }, { bill: 0, receive: 0, salesReturn: 0, moneyReturn: 0 });
            const totals = {
              previousDue: summaryAmountFrom(summary, 'previous_due'),
              bill: summaryAmountFrom(summary, 'sales_amount') ?? rowTotals.bill,
              totalBill: summaryAmountFrom(summary, 'total_bill'),
              receive: summaryAmountFrom(summary, 'collection') ?? rowTotals.receive,
              salesReturn: summaryAmountFrom(summary, 'return_amount') ?? rowTotals.salesReturn,
              moneyReturn: summaryAmountFrom(summary, 'money_return') ?? rowTotals.moneyReturn,
              due: summaryAmountFrom(summary, 'due'),
            };

            const clientKey = String(client.id || client.uuid || '');
            if (clientKey && (rows.length || Object.keys(summary).length)) {
              clientLedgerMap.set(clientKey, totals);
            }
          });
        }

        // Map sales returns by client ID
        const clientReturnsMap = new Map();
        rawReturns.forEach(ret => {
          const retAmt = Number(ret.grand_total || ret.total_amount || ret.return_amount || ret.total || 0);
          recordAmt(clientReturnsMap, ret.client || ret.client_id, retAmt);
        });

        // Map money returns (expenses with type Money Return) by client ID
        const clientMoneyReturnsMap = new Map();
        rawExpenses.forEach(exp => {
          const isMr = /money|refund/i.test(exp.transaction_type || exp.category_name || exp.description || '');
          if (isMr) {
            const mrAmt = Number(exp.amount || exp.total || 0);
            recordAmt(clientMoneyReturnsMap, exp.client || exp.client_id, mrAmt);
          }
        });

        const updatedClients = fetchedClients.map(client => {
          const clientStats = statsForClient(client);
          const clientKey = String(client.id || client.uuid || '');
          const ledgerTotals = clientLedgerMap.get(clientKey);

          const accReceive = amountForClient(clientReceivesMap, client);
          const salesBill = ledgerTotals?.bill || 0;
          const salesReturn = amountForClient(clientReturnsMap, client);
          const moneyReturn = amountForClient(clientMoneyReturnsMap, client);

          return { 
            ...client, 
            stats: clientStats || client.stats || {},
            _accounting_receive: accReceive,
            _ledger_financials: ledgerTotals,
            _sales_bill: salesBill,
            _sales_bill_loaded: clientLedgerMap.has(clientKey),
            _sales_return: salesReturn,
            _money_return: moneyReturn
          };
        });
        setClients(updatedClients);
      } catch (statsErr) {
        console.error("Failed to fetch client stats", statsErr);
        setClients(fetchedClients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300); // 300ms debounce for search
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedGroup, fromDate, toDate, currentPage, limit]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroup, fromDate, toDate, limit]);

  // Use the fetched clients directly
  const filteredClients = clients;

  const handleExportExcel = () => {
    const dataToExport = filteredClients.map((c, i) => ({
      'SL': (currentPage - 1) * limit + i + 1,
      'Client Code': c.client_code || c.code || '-',
      'Company Name': c.company_name || c.name || '-',
      'Owner Name': c.owner_name || c.name || '-',
      'Group': c.group || c.group_name || '-',
      'Phone': c.phone || c.mobile || '-',
      'Email': c.email || '-',
      'Opening Balance': c.opening_balance || 0,
      'Current Balance': c.current_balance || c.balance || 0,
      'Status': c.status ? 'Active' : 'Inactive'
    }));
    exportToExcel(dataToExport, 'Customer_List');
  };

  return (
    <div className="dashboard-content">
      <div className="chart-card">
        {/* Header */}
        <div className="card-header">
          <h2 className="card-title">{t("CUSTOMER LIST")}</h2>
          <div className="card-actions">
            <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '6px 12px', background: '#718096', color: 'white' }}>
              <ArrowLeft size={14} /> {t("Go Back")}
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/crm/client-group')} style={{ padding: '6px 12px', background: 'var(--table-header-bg)', color: 'white' }}>
              <Users size={14} /> {t("Client Group")}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/crm/client-create')} style={{ padding: '6px 12px', background: 'var(--success)' }}>
              <Plus size={14} /> {t("Add Client")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1.5fr 1.5fr 1fr', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div className="form-group">
            <div className="form-input floating-label">
              <Search size={16} className="input-icon" />
              <input 
                type="text" 
                placeholder=" " 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label>{t("Search All")}</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="form-input floating-label">
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                <option value="">{t("All Groups")}</option>
                {groups.map(g => (
                  <option key={g.id || g.uuid} value={g.id || g.uuid}>{g.name}</option>
                ))}
              </select>
              <label>{t("Search By Client Group")}</label>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
              <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            </div>
          </div>

          <div className="form-group">
            <button
              className="btn btn-outline"
              style={{ height: '48px', width: '100%', background: '#718096', color: 'white', justifyContent: 'center' }}
              onClick={() => { setSearchTerm(''); setSelectedGroup(''); setFromDate(''); setToDate(''); }}
            >
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Showing")} {filteredClients.length} {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={handleExportExcel} style={{ background: '#059669', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', cursor: 'pointer' }}>
              <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> {t("Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px' }}>
              <Printer size={14} style={{ marginRight: '6px' }} /> {t("Print")}
            </button>
            <button onClick={() => window.location.reload()} className="btn" style={{ background: '#4318ff', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px' }}>
              <RotateCcw size={14} style={{ marginRight: '6px' }} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Collection Date Modal */}
        <CollectionDateModal 
          isOpen={!!dateModalClient} 
          onClose={() => setDateModalClient(null)} 
          client={dateModalClient} 
          onUpdate={(updatedFields) => {
            setClients(prev => prev.map(c => {
              // Try to match by id, uuid, or object reference
              const isMatch = c === dateModalClient ||
                              (c.id && c.id === dateModalClient.id) || 
                              (c.uuid && c.uuid === dateModalClient.uuid);
              return isMatch ? { ...c, ...updatedFields } : c;
            }));
          }} 
        />

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--secondary)', borderRadius: '8px' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th width="50" style={{ textAlign: 'center' }}>{t("ID ↕")}</th>
                <th>{t("CUSTOMER DETAILS")}</th>
                <th>{t("DETAILS")}</th>
                <th width="120" style={{ textAlign: 'center' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading...")}</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("No clients found.")}</td></tr>
              ) : (
                filteredClients.map((client, index) => {
                  const globalIndex = (currentPage - 1) * limit + index + 1;
                  
                  // Calculate amounts for the Details table
                  const apiBill = numOrNull(client, 'sales_amount');
                  const legacyApiBill = numOrNull(client, 'sales', 'total_sales', 'bill');
                  const directBill = Number(client._sales_bill || 0);
                  const ledgerTotals = client._ledger_financials;
                  const bill = apiBill
                    ?? ledgerTotals?.bill
                    ?? (client._sales_bill_loaded ? directBill : null)
                    ?? legacyApiBill
                    ?? directBill;

                  const apiReceive = numOrNull(client, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');
                  const directReceive = Number(client._accounting_receive || 0) + Number(client._invoice_receive || 0);
                  const receive = apiReceive ?? ledgerTotals?.receive ?? directReceive;

                  const apiSalesReturn = numOrNull(client, 'return_amount', 'sales_return');
                  const directSalesReturn = Number(client._sales_return || 0);
                  const salesReturn = apiSalesReturn ?? ledgerTotals?.salesReturn ?? directSalesReturn;

                  const apiMoneyReturn = numOrNull(client, 'money_return', 'return');
                  const directMoneyReturn = Number(client._money_return || 0);
                  const moneyReturn = apiMoneyReturn ?? ledgerTotals?.moneyReturn ?? directMoneyReturn;

                  // True Opening Balance (Previous Due):
                  // Reads directly from the client's registered previous due / opening balance
                  const apiPreviousDue = numOrNull(client, 'previous_due');
                  const prevDue = apiPreviousDue ?? ledgerTotals?.previousDue ?? Number(
                    client.opening_balance ??
                    client.opening_due ??
                    client.stats?.previous_due ??
                    client.stats?.opening_due ??
                    client.stats?.opening_balance ??
                    0
                  );

                  const totalBill = numOrNull(client, 'total_bill') ?? ledgerTotals?.totalBill ?? prevDue + bill;

                  const calculatedDue = totalBill - receive - salesReturn + moneyReturn;

                  // Use the backend's canonical due when present, including an explicit zero.
                  const apiStatsDue = numOrNull(client, 'due', 'current_due', 'balance', 'total_due', 'due_amount');
                  const finalDue = apiStatsDue ?? ledgerTotals?.due ?? calculatedDue;

                  return (
                  <tr key={client.id || client.uuid || index}>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', textAlign: 'center' }}>{globalIndex}</td>
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', fontSize: 'var(--fs-13, 13px)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '4px', marginBottom: '4px', textAlign: 'left' }}>
                        <div style={{ fontWeight: '600' }}>{t("Name")}</div><div>:</div><div>{client.name || (client.details && client.details.name)}</div>
                        <div style={{ fontWeight: '600' }}>{t("Phone")}</div><div>:</div><div>{client.phone || (client.details && client.details.phone)}</div>
                        {(client.group || (client.details && client.details.group)) && (
                          <>
                            <div style={{ fontWeight: '600' }}>{t("Client Group")}</div>
                            <div>:</div>
                            <div>
                              {typeof client.group === 'object' && client.group !== null 
                                ? client.group.name 
                                : (groups.find(g => (g.id || g.uuid) === (client.group || (client.details && client.details.group)))?.name || client.group || (client.details && client.details.group))}
                            </div>
                          </>
                        )}
                        <div style={{ fontWeight: '600' }}>{t("Address")}</div><div>:</div><div>{client.address || (client.details && client.details.address)}</div>
                        <div style={{ fontWeight: '600' }}>{t("Status")}</div><div>:</div><div>{(client.status === true || client.status === 'Active' || client.status === 'Activated') ? t("Active") : t("Deactivated")}</div>
                        <div style={{ fontWeight: '600' }}>{t("Created At")}</div><div>:</div><div>{client.created_at || (client.details && client.details.createdAt) ? new Date(client.created_at || (client.details && client.details.createdAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
                      </div>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', padding: '0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-12, 12px)', border: '1px solid #94a3b8', textAlign: 'left' }}>
                        <tbody>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left', width: '50%' }}>{t("Previous Due")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{prevDue.toFixed(2)}</td></tr>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Bill")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{bill.toFixed(2)}</td></tr>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Total Bill")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{totalBill.toFixed(2)}</td></tr>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Receive")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{receive.toFixed(2)}</td></tr>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Sales Return")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{salesReturn.toFixed(2)}</td></tr>
                          <tr><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Money Return")}</td><td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{moneyReturn.toFixed(2)}</td></tr>
                          <tr>
                            <td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>
                              <span style={{ 
                                background: finalDue > 0 ? '#ef4444' : finalDue < 0 ? '#10b981' : '#64748b', 
                                color: 'white', padding: '1px 6px', borderRadius: '4px' 
                              }}>
                                {finalDue < 0 ? t("Advance") : t("Due")}
                              </span>
                            </td>
                            <td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>
                              {Math.abs(finalDue).toFixed(2)}
                            </td>
                          </tr>
                          <tr 
                            style={{ cursor: 'pointer', transition: 'background 0.2s' }} 
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setDateModalClient(client)}
                          >
                            <td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>{t("Collection Date")}</td>
                            <td style={{ border: '1px solid #94a3b8', padding: '2px 8px', textAlign: 'left' }}>
                              <Calendar size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle', color: '#1e293b' }}/> 
                              <span style={{ color: '#1e293b', fontWeight: '600' }}>
                                {client.due_date ? new Date(client.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : t('Set Date')}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    
                    <td style={{ verticalAlign: 'top', paddingTop: '16px', position: 'relative' }} className="action-dropdown-container">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          className="btn"
                          style={{
                            background: '#94a3b8',
                            color: 'white',
                            padding: '4px 8px',
                            fontSize: 'var(--fs-12, 12px)',
                            fontWeight: '600',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                          onClick={() => toast.info(t("Wallet Update Coming Soon!"))}
                        >
                          <div style={{ width: '12px', height: '12px', border: '2px solid white', borderRadius: '2px' }}></div> {t("Update Wallet")}
                        </button>
                        <button 
                          onClick={() => toggleAction(client.id || client.uuid)}
                          className="btn" 
                          style={{ 
                            background: '#05cd99', 
                            color: 'white', 
                            padding: '6px 10px', 
                            fontSize: 'var(--fs-12, 12px)', 
                            fontWeight: '600',
                            borderRadius: '4px', 
                            width: '100%', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          {t("Action")} <ChevronDown size={14} />
                        </button>
                      </div>
                    
                      {activeAction === (client.id || client.uuid) && (
                        <div 
                          style={{ 
                            position: 'absolute', 
                            top: '52px', 
                            right: '8px', 
                            background: 'white', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                            borderRadius: '8px', 
                            zIndex: 100, 
                            minWidth: '185px', 
                            padding: '6px', 
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {/* Deactivate / Activate */}
                          <div 
                            onClick={() => handleDeactivate(client.id || client.uuid, client.status)} 
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: (client.status === false || client.status === 'Deactivated') ? '#059669' : '#e11d48',
                              fontWeight: '500'
                            }}
                            className="action-item"
                          >
                            {(client.status === false || client.status === 'Deactivated') ? (
                              <>
                                <CheckCircle2 size={16} color="#059669" />
                                <span>{t("Activate")}</span>
                              </>
                            ) : (
                              <>
                                <Ban size={16} color="#e11d48" />
                                <span>{t("Deactivate")}</span>
                              </>
                            )}
                          </div>

                          {/* View */}
                          <div 
                            onClick={() => { setViewClient({ ...client, _finalDue: finalDue, _prevDue: prevDue, _totalBill: totalBill, _receive: receive }); setActiveAction(null); }}
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: '#334155',
                              fontWeight: '500'
                            }} 
                            className="action-item"
                          >
                            <Eye size={16} color="#0284c7" />
                            <span>{t("View")}</span>
                          </div>

                          {/* Receive */}
                          <div 
                            onClick={() => { navigate('/account/receive-create', { state: { clientId: client.id || client.uuid } }); setActiveAction(null); }} 
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: '#334155',
                              fontWeight: '500'
                            }} 
                            className="action-item"
                          >
                            <ArrowDownCircle size={16} color="#059669" />
                            <span>{t("Receive")}</span>
                          </div>

                          {/* Edit */}
                          <div 
                            onClick={() => navigate(`/crm/client-edit/${client.id || client.uuid}`)} 
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: '#334155',
                              fontWeight: '500'
                            }} 
                            className="action-item"
                          >
                            <Edit size={16} color="#4f46e5" />
                            <span>{t("Edit")}</span>
                          </div>

                          {/* Delete */}
                          <div 
                            onClick={() => handleDelete(client.id || client.uuid)} 
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: '#dc2626',
                              fontWeight: '500'
                            }} 
                            className="action-item"
                          >
                            <Trash2 size={16} color="#dc2626" />
                            <span>{t("Delete")}</span>
                          </div>

                          <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                          {/* View Statement */}
                          <div 
                            onClick={() => navigate('/crm/client-statement', { state: { clientId: client.id || client.uuid } })} 
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: 'var(--fs-13, 13px)', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              borderRadius: '6px',
                              color: '#334155',
                              fontWeight: '500',
                              whiteSpace: 'nowrap'
                            }} 
                            className="action-item"
                          >
                            <FileText size={16} color="#64748b" />
                            <span>{t("View Statement")}</span>
                          </div>
                        </div>
                      )}
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

      {/* View Modal */}
      {viewClient && (
        <div 
          className="printable-modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(4px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setViewClient(null)}
        >
          <div 
            className="printable-modal-content" 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              width: '560px', 
              maxWidth: '95vw', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'none' }} className="print-only">
              <PrintHeader />
            </div>
            
            {/* Header */}
            <div 
              style={{ 
                padding: '16px 20px', 
                background: '#f8fafc', 
                borderBottom: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
              className="no-print"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    background: '#e0f2fe', 
                    color: '#0284c7', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--fs-16, 16px)', fontWeight: '700', color: '#1e293b' }}>
                    {t("Customer Profile / Ledger Info")}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--fs-12, 12px)', color: '#64748b' }}>
                    {viewClient.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewClient(null)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '6px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b' 
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Info Box */}
            <div style={{ padding: '20px' }}>
              <div 
                style={{ 
                  background: '#f8fafc', 
                  padding: '18px 20px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: 'var(--fs-13, 13px)'
                }}
              >
                {/* ID */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{t("Customer ID")}</span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500', fontFamily: 'monospace', fontSize: 'var(--fs-12, 12px)', wordBreak: 'break-all' }}>
                    {viewClient.id || viewClient.uuid}
                  </span>
                </div>

                {/* Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{t("Name")}</span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <span style={{ color: '#0f172a', fontWeight: '700', fontSize: 'var(--fs-14, 14px)' }}>
                    {viewClient.name || '-'}
                  </span>
                </div>

                {/* Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{t("Phone")}</span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>
                    {viewClient.phone || '-'}
                  </span>
                </div>

                {/* Group */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{t("Client Group")}</span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>
                    {typeof viewClient.group === 'object' && viewClient.group !== null
                      ? viewClient.group.name
                      : (groups.find(g => String(g.id || g.uuid) === String(viewClient.group))?.name || viewClient.group_name || viewClient.group || '-')}
                  </span>
                </div>

                {/* Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>{t("Address")}</span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500', lineHeight: '1.4' }}>
                    {viewClient.address || '-'}
                  </span>
                </div>

                {/* Total Due */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 15px 1fr', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>
                    {Number(viewClient._finalDue ?? viewClient.due ?? viewClient.previous_due ?? 0) < 0 ? t("Total Advance") : t("Total Due")}
                  </span>
                  <span style={{ color: '#94a3b8' }}>:</span>
                  <div>
                    <span 
                      style={{ 
                        background: Number(viewClient._finalDue ?? viewClient.due ?? viewClient.previous_due ?? 0) > 0 ? '#ef4444' : Number(viewClient._finalDue ?? viewClient.due ?? viewClient.previous_due ?? 0) < 0 ? '#10b981' : '#64748b',
                        color: 'white',
                        fontWeight: '700', 
                        fontSize: 'var(--fs-14, 14px)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}
                    >
                      ৳ {Math.abs(Number(viewClient._finalDue ?? viewClient.due ?? viewClient.previous_due ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Print Signatures */}
              <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '60px', paddingTop: '20px' }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Customer Signature")}
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px', fontSize: 'var(--fs-12, 12px)' }}>
                  {t("Authorized Signature")}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => window.print()} 
                  className="btn" 
                  style={{ 
                    background: '#059669', 
                    color: 'white', 
                    padding: '8px 20px', 
                    borderRadius: '6px', 
                    fontWeight: '600',
                    fontSize: 'var(--fs-13, 13px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  <Printer size={16} /> {t("Print Memo")}
                </button>
                <button 
                  onClick={() => setViewClient(null)} 
                  className="btn" 
                  style={{ 
                    background: '#64748b', 
                    color: 'white', 
                    padding: '8px 20px', 
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: 'var(--fs-13, 13px)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;
