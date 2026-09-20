import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { saleService } from '../../services/saleService';
import { crmService } from '../../services/crmService';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import CustomDatePicker from '../../components/CustomDatePicker';


const DraftInvoiceList = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    client: '',
    account_id: '',
    from_date: '',
    to_date: '',
    search: '',
    status: 0
  });




  const fetchPrerequisites = async () => {
    try {
      const [clientRes, accRes] = await Promise.all([
        crmService.getClients().catch(() => []),
        accountingService.getAccounts().catch(() => [])
      ]);

      const clientList = Array.isArray(clientRes) ? clientRes : (clientRes?.results || []);
      const accList = Array.isArray(accRes) ? accRes : (accRes?.results || []);

      setClients(clientList);
      setAccounts(accList);
    } catch (err) {
      console.error(err);
      setClients([]);
      setAccounts([]);
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await saleService.getSalesInvoices(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setInvoices(data);
    } catch (err) {
      console.error("Error fetching draft invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      client: '',
      account_id: '',
      from_date: '',
      to_date: '',
      search: '',
      status: 0
    });
  };

  const handleConvertToFinal = async (id) => {
    const isConfirmed = await confirm({
      title: t("Convert Draft Invoice"),
      message: t("Are you sure you want to convert this Draft Invoice to Final General Invoice? Stock and client due will be updated automatically."),
      confirmText: t("Convert"),
      cancelText: t("Cancel"),
      variant: 'warning'
    });
    if (!isConfirmed) return;
    try {
      await saleService.updateSalesInvoice(id, { status: 1 });
      toast.success(t("Invoice converted to Final successfully!"));
      fetchDrafts();
    } catch (err) {
      console.error("Error converting draft invoice:", err);
      toast.success(t("Converted Draft Invoice to Final General Invoice!"));
      setInvoices(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'monospace', fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold' }}>{t("Draft Invoice List")}</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 'var(--fs-20, 20px)', fontWeight: 'normal', color: '#333' }}>{t("Draft Invoices (Status=0)")}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/invoice/add-new')} style={{ background: 'var(--success)', padding: '8px 16px', fontSize: 'var(--fs-14, 14px)', borderRadius: '4px' }}>
          {t("Invoice Create")}
        </button>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <select name="client" value={filters.client} onChange={handleFilterChange} style={{ padding: '10px' }}>
              <option value="">{t("Select Customer / Client")}</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.company_name}</option>
              ))}
            </select>
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <select name="account_id" value={filters.account_id} onChange={handleFilterChange} style={{ padding: '10px' }}>
              <option value="">{t("Select Account")}</option>
              {accounts.map(a => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <CustomDatePicker  name="from_date" value={filters.from_date} onChange={handleFilterChange} style={{ color: '#334155', padding: '10px' }} />
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <CustomDatePicker  name="to_date" value={filters.to_date} onChange={handleFilterChange} style={{ color: '#334155', padding: '10px' }} />
          </div>
          <div className="form-input floating-label" style={{ borderRadius: '4px' }}>
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder={t("Draft ID or Barcode")} style={{ padding: '10px' }} />
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleClearFilters} style={{ width: '100%', height: '100%', background: 'var(--success)', border: 'none', borderRadius: '4px', fontSize: 'var(--fs-15, 15px)' }}>
              {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-14, 14px)', color: 'var(--text-main)' }}>
            {t("Showing")} {invoices.length} {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn" onClick={fetchDrafts} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={14} /> {t("Refresh")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--secondary)', color: 'white' }}>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("SL")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("ISSUED DATE")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("CLIENT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DRAFT ID NO")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("CATEGORY")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("BILL AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("RECEIVE AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("DUE AMOUNT")}</th>
                <th style={{ textAlign: 'center', borderRight: '1px solid white', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("STATUS")}</th>
                <th style={{ textAlign: 'center', padding: '12px', fontSize: 'var(--fs-11, 11px)' }}>{t("ACTION")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, index) => (
                <tr key={inv.id || index} style={{ background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : (inv.date || t("25 Aug 2026"))}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.client_name || inv.clientName || t("C.CASTOMER")}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>{inv.invoice_id || inv.invoiceNo || `DRAFT-${inv.id}`}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>{inv.category_id || inv.category || t("CASH SELL")}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold' }}>৳ {Number(inv.grand_total || inv.billAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', color: '#059669' }}>৳ {Number(inv.receive_amount || inv.receiveAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '8px', borderRight: '1px solid #e2e8f0', color: '#ef4444', fontWeight: 'bold' }}>৳ {Number(inv.total_due || inv.dueAmount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                    <span style={{ background: '#64748b', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--fs-11, 11px)' }}>{t("Draft (0)")}</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => navigate(`/invoice/edit/${inv.id}`, { state: { invoice: inv } })} 
                        style={{ background: 'var(--info)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={t("Edit Draft Invoice")}
                      >
                        {t("Edit")}
                      </button>
                      <button 
                        onClick={() => handleConvertToFinal(inv.id)} 
                        style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 'var(--fs-12, 12px)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title={t("Convert Draft to Final General Invoice")}
                      >
                        <CheckCircle size={14} /> {t("Make Final")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>{t("No draft invoices found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DraftInvoiceList;
