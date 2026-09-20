import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { Printer, RotateCcw, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import { loanService } from '../../services/loanService';
import SearchableSelect from '../../components/SearchableSelect';
import CustomDatePicker from '../../components/CustomDatePicker';
import { exportVisibleTable } from '../../utils/tableExport';

const num = (v) => {
  if (v === undefined || v === null || v === '' || v === '--') return 0;
  const cleaned = String(v).replace(/,/g, '').trim();
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};

const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseDateValue = (d) => {
  if (!d) return 0;
  const ts = new Date(d).getTime();
  return isNaN(ts) ? 0 : ts;
};

const formatDisplayDate = (d) => {
  if (!d) return '-';
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, day] = s.slice(0, 10).split('-');
    return `${day}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) return s.replace(/\//g, '-');
  const dateObj = new Date(s);
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${day}-${m}-${y}`;
  }
  return s;
};

const LoanStatement = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [rawStatements, setRawStatements] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(location.state?.clientId ? String(location.state.clientId) : '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState(100);
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Loan Accounts (Clients)
  const fetchClients = async () => {
    try {
      const res = await loanService.getLoanAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      setClients(data);
    } catch (error) {
      console.error("Error fetching loan clients:", error);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // 2. Fetch Statements with fallback to receives + payments
  const fetchStatements = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedClient) filters.loan_account = selectedClient;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      let statementRows = [];

      try {
        const res = await loanService.getLoanStatement(filters);
        const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (Array.isArray(data) && data.length > 0) {
          statementRows = data;
        }
      } catch (e) {
        console.warn("Primary loan statement fetch failed, trying fallback:", e);
      }

      // Fallback: If statement API returns empty or failed, fetch receives and payments
      if (statementRows.length === 0) {
        const [recRes, payRes] = await Promise.allSettled([
          loanService.getLoanReceives(filters),
          loanService.getLoanPayments(filters)
        ]);

        const receives = recRes.status === 'fulfilled' ? (Array.isArray(recRes.value) ? recRes.value : (recRes.value?.results || recRes.value?.data || [])) : [];
        const payments = payRes.status === 'fulfilled' ? (Array.isArray(payRes.value) ? payRes.value : (payRes.value?.results || payRes.value?.data || [])) : [];

        const assembled = [];
        receives.forEach((r) => {
          assembled.push({
            id: r.id || r.uuid,
            date: r.date || r.created_at,
            receipt_no: r.receipt_no || r.voucher || r.invoice_no || '',
            loan_account: r.loan_account?.id || r.loan_account?.uuid || r.loan_account || r.account_id,
            loan_account_name: r.loan_account?.name || r.loan_account_name || r.client_name || '',
            loan_account_phone: r.loan_account?.phone || r.phone || '',
            source: r.loan_account?.name ? `Loan Account: ${r.loan_account.name}` : (r.source || ''),
            description: r.description || r.note || '',
            type: 'RECEIVE',
            transaction_type: 'Loan Receive',
            credit: r.amount || 0,
            debit: 0,
            created_at: r.created_at || r.date
          });
        });

        payments.forEach((p) => {
          assembled.push({
            id: p.id || p.uuid,
            date: p.date || p.created_at,
            receipt_no: p.receipt_no || p.voucher || p.invoice_no || '',
            loan_account: p.loan_account?.id || p.loan_account?.uuid || p.loan_account || p.account_id,
            loan_account_name: p.loan_account?.name || p.loan_account_name || p.client_name || '',
            loan_account_phone: p.loan_account?.phone || p.phone || '',
            source: p.loan_account?.name ? `Loan Account: ${p.loan_account.name}` : (p.source || ''),
            description: p.description || p.note || '',
            type: 'PAYMENT',
            transaction_type: 'Loan Payment',
            credit: 0,
            debit: p.amount || 0,
            created_at: p.created_at || p.date
          });
        });

        statementRows = assembled;
      }

      setRawStatements(statementRows);
    } catch (err) {
      console.error("Error fetching loan statement:", err);
      setRawStatements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [selectedClient, fromDate, toDate]);

  const handleClearFilter = () => {
    setSelectedClient('');
    setFromDate('');
    setToDate('');
  };

  const selectedClientObj = useMemo(() => {
    if (!selectedClient) return null;
    return clients.find(c => String(c.id || c.uuid) === String(selectedClient)) || null;
  }, [clients, selectedClient]);

  // 3. Compute running balances and totals
  const { processedRows, totalCredit, totalDebit, finalBalance } = useMemo(() => {
    if (!Array.isArray(rawStatements) || rawStatements.length === 0) {
      return { processedRows: [], totalCredit: 0, totalDebit: 0, finalBalance: num(selectedClientObj?.previous_due || 0) };
    }

    // Step A: Client-side filtering if selectedClient is set
    let filtered = rawStatements;
    if (selectedClient) {
      filtered = rawStatements.filter(row => {
        const rowAccId = String(row.loan_account?.id || row.loan_account?.uuid || row.loan_account || row.loan_account_id || row.client_id || '');
        if (rowAccId && rowAccId === String(selectedClient)) return true;
        if (selectedClientObj?.name && row.source && row.source.toLowerCase().includes(selectedClientObj.name.toLowerCase())) return true;
        if (selectedClientObj?.name && row.clientName && row.clientName.toLowerCase() === selectedClientObj.name.toLowerCase()) return true;
        if (selectedClientObj?.name && row.loan_account_name && row.loan_account_name.toLowerCase() === selectedClientObj.name.toLowerCase()) return true;
        return false;
      });
    }

    // Step B: Sort chronologically (oldest to newest) to calculate running balance accurately
    const sortedOldestFirst = [...filtered].sort((a, b) => {
      const timeA = parseDateValue(a.date || a.created_at);
      const timeB = parseDateValue(b.date || b.created_at);
      return timeA - timeB;
    });

    // Step C: Running balance calculation
    // If a specific client is selected, start from client's previous_due
    // If multiple clients, maintain running balance map per client
    const perClientBalanceMap = {};
    clients.forEach(c => {
      perClientBalanceMap[String(c.id || c.uuid)] = num(c.previous_due || 0);
    });

    let singleClientBalance = num(selectedClientObj?.previous_due || 0);

    const withBalances = sortedOldestFirst.map((row) => {
      const isReceive = String(row.type || row.transaction_type || '').toUpperCase().includes('RECEIVE') || num(row.credit) > 0 || num(row.loanReceive) > 0;
      const creditVal = num(row.credit || row.loanReceive || (isReceive ? row.amount : 0));
      const debitVal = num(row.debit || row.loanPayment || (!isReceive ? row.amount : 0));

      let rowBalance = 0;
      if (selectedClient) {
        singleClientBalance = singleClientBalance + creditVal - debitVal;
        rowBalance = singleClientBalance;
      } else {
        const accKey = String(row.loan_account?.id || row.loan_account?.uuid || row.loan_account || row.loan_account_id || row.client_id || row.source || 'default');
        const prevBal = perClientBalanceMap[accKey] !== undefined ? perClientBalanceMap[accKey] : 0;
        const newBal = prevBal + creditVal - debitVal;
        perClientBalanceMap[accKey] = newBal;
        rowBalance = newBal;
      }

      // Extract clean client display
      let clientName = row.clientName || row.loan_account?.name || row.loan_account_name || '';
      let clientPhone = row.clientNumber || row.loan_account?.phone || row.loan_account_phone || '';
      if (!clientName && row.source) {
        clientName = row.source.replace(/^Loan Account:\s*/i, '');
      }

      return {
        ...row,
        credit: creditVal,
        debit: debitVal,
        balance: rowBalance,
        clientName: clientName || '-',
        clientPhone: clientPhone || '-',
        displayDate: formatDisplayDate(row.date || row.created_at)
      };
    });

    // Step D: Calculate grand totals
    const sumCredit = withBalances.reduce((acc, r) => acc + r.credit, 0);
    const sumDebit = withBalances.reduce((acc, r) => acc + r.debit, 0);
    const netBal = selectedClient ? singleClientBalance : sumCredit - sumDebit;

    // Step E: Order for display (newest first by default)
    const displayList = sortDesc ? [...withBalances].reverse() : withBalances;

    return {
      processedRows: displayList.slice(0, entries),
      totalCredit: sumCredit,
      totalDebit: sumDebit,
      finalBalance: netBal
    };
  }, [rawStatements, selectedClient, selectedClientObj, clients, entries, sortDesc]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px', background: 'white' }}>
      <PrintHeader />
      
      {/* Center Title */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: 'var(--fs-22, 22px)', fontWeight: 'bold', color: '#1e293b', letterSpacing: '0.5px' }}>{t("Loan Statement")}</h2>
      </div>

      {/* Header Info Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 'var(--fs-14, 14px)' }}>
        <div>
          <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold', color: '#334155' }}>{t("Name")} :</span> <span style={{ fontWeight: '600' }}>{selectedClientObj?.name || t("All Clients")}</span></div>
          <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold', color: '#334155' }}>{t("Address")} :</span> {selectedClientObj?.address || '-'}</div>
          <div><span style={{ fontWeight: 'bold', color: '#334155' }}>{t("Contact No")} :</span> {selectedClientObj?.phone || '-'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: '4px' }}><span style={{ fontWeight: 'bold', color: '#334155' }}>{t("Date")} :</span> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          {selectedClientObj && (
            <div><span style={{ fontWeight: 'bold', color: '#334155' }}>{t("Opening Balance")} :</span> <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{fmt(selectedClientObj.previous_due)} ৳</span></div>
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', marginBottom: '24px', alignItems: 'flex-end', gap: '16px', maxWidth: '880px', margin: '0 auto 24px auto' }}>
          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '6px', color: '#334155', display: 'block' }}>{t("Search By Client")}</label>
            <div style={{ height: '42px' }}>
              <SearchableSelect
                options={[
                  { value: '', label: `-- ${t("All Clients")} --`, searchValue: 'all' },
                  ...(clients || []).map(c => ({ value: String(c.id || c.uuid), label: `${c.name} (${c.phone || '-'})`, searchValue: `${c.name} ${c.phone}` }))
                ]}
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                placeholder={t("Select Client")}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', marginBottom: '6px', color: '#334155', display: 'block' }}>{t("Search By Date")}</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: 'white', height: '42px', alignItems: 'center' }}>
              <CustomDatePicker style={{ width: '50%', border: 'none', borderRight: '1px solid #cbd5e1', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <CustomDatePicker style={{ width: '50%', border: 'none', padding: '0 10px', fontSize: 'var(--fs-13, 13px)', color: '#1e293b', outline: 'none', height: '100%' }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <button className="btn btn-outline" onClick={handleClearFilter} style={{ height: '42px', width: '100%', background: '#64748b', color: 'white', justifyContent: 'center', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: 'var(--fs-14, 14px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={15} /> {t("Clear Filter")}
            </button>
          </div>
        </div>

        {/* Table Controls */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#334155', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t("Show")} 
            <select value={entries} onChange={(e) => setEntries(Number(e.target.value))} style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
            {t("entries")}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-blue" onClick={() => exportVisibleTable('xlsx', 'Loan_Statement')} style={{ background: '#059669', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <FileSpreadsheet size={15} /> {t("Excel")}
            </button>
            <button className="btn" onClick={() => window.print()} style={{ background: '#4F46E5', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Printer size={15} /> {t("Print")}
            </button>
            <button className="btn" onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', padding: '6px 14px', fontSize: 'var(--fs-13, 13px)', borderRadius: '4px', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              <RotateCcw size={15} /> {t("Reset")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#718096', color: 'white' }}>
                <th width="50" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setSortDesc(!sortDesc)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>{t("SL")}</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th width="110" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DATE")}</th>
                <th width="100" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("RECEIPT NO")}</th>
                <th width="220" style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("CLIENT")}</th>
                <th width="180" style={{ textAlign: 'left', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("DESCRIPTION")}</th>
                <th width="120" style={{ textAlign: 'center', borderRight: '1px solid #a0aec0', padding: '12px 8px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("TYPE")}</th>
                <th width="130" style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("LOAN RECEIVE")}</th>
                <th width="130" style={{ textAlign: 'right', borderRight: '1px solid #a0aec0', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("LOAN PAYMENT")}</th>
                <th width="140" style={{ textAlign: 'right', padding: '12px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("BALANCE")}</th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((statement, index) => (
                <tr key={statement.id || index} style={{ background: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: 'var(--fs-12, 12px)' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>{statement.displayDate}</td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)', fontFamily: 'monospace' }}>{statement.receipt_no || statement.receiptNo || (index + 1).toString().padStart(4, '0')}</td>
                  <td style={{ textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)' }}>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{statement.clientName}</div>
                    {statement.clientPhone && statement.clientPhone !== '-' && (
                      <div style={{ fontSize: 'var(--fs-11, 11px)', color: '#64748b' }}>{statement.clientPhone}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'left', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-13, 13px)', color: '#334155' }}>{statement.description || statement.note || '-'}</td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid #e2e8f0', fontSize: 'var(--fs-12, 12px)' }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: 'var(--fs-11, 11px)', 
                      fontWeight: 'bold',
                      background: String(statement.transaction_type || statement.type || '').toUpperCase().includes('RECEIVE') ? '#dcfce7' : '#fee2e2',
                      color: String(statement.transaction_type || statement.type || '').toUpperCase().includes('RECEIVE') ? '#166534' : '#991b1b'
                    }}>
                      {statement.transaction_type || statement.type || '-'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontWeight: '600', color: statement.credit > 0 ? '#15803d' : '#94a3b8' }}>
                    {statement.credit > 0 ? fmt(statement.credit) : '--'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', borderRight: '1px solid #e2e8f0', fontWeight: '600', color: statement.debit > 0 ? '#b91c1c' : '#94a3b8' }}>
                    {statement.debit > 0 ? fmt(statement.debit) : '--'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: '700', color: '#0f172a', background: index % 2 === 0 ? '#f1f5f9' : '#e2e8f0' }}>
                    {fmt(statement.balance)} ৳
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("Loading statements...")}</td>
                </tr>
              )}
              {!loading && processedRows.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>{t("No statements found.")}</td>
                </tr>
              )}
            </tbody>
            {processedRows.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan="6" style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', fontSize: 'var(--fs-13, 13px)', textTransform: 'uppercase' }}>
                    {t("Total")} :
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', color: '#15803d', fontSize: 'var(--fs-13, 13px)' }}>
                    {fmt(totalCredit)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', borderRight: '1px solid #cbd5e1', color: '#b91c1c', fontSize: 'var(--fs-13, 13px)' }}>
                    {fmt(totalDebit)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#0f172a', fontSize: 'var(--fs-14, 14px)', background: '#e2e8f0' }}>
                    {fmt(finalBalance)} ৳
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanStatement;
