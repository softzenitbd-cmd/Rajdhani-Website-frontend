import React, { useEffect, useState } from 'react';
import PrintHeader from '../../components/PrintHeader';
import TableToolbar from '../../components/TableToolbar';
import { crmService } from '../../services/crmService';
import { useToast } from '../../context/ToastContext';
import { toList, money } from '../../utils/apiHelpers';

const DueSupplierWise = () => {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [onlyDue, setOnlyDue] = useState(true);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState(100);

  useEffect(() => {
    crmService.getSuppliers().then((r) => setSuppliers(toList(r))).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (supplierId) filters.supplier_id = supplierId;
      if (onlyDue) filters.has_due = 'true';
      setData(toList(await crmService.getSupplierDueReport(filters)));
    } catch (err) {
      toast.error(err.message || 'Failed to load supplier due report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [supplierId, onlyDue]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data.filter((r) => !onlyDue || Number(r.due || 0) !== 0).slice(0, entries);
  const totalDue = data.reduce((sum, item) => sum + (parseFloat(item.due) || 0), 0);
  const excelData = rows.map((r, i) => ({
    SL: i + 1, Supplier: r.supplier_name, Address: r.address || '', Phone: r.phone || '', Group: r.group_name || '',
    Purchase: Number(r.purchase_amount || 0), Payment: Number(r.payment || 0), Return: Number(r.return_amount || 0), Due: Number(r.due || 0),
  }));

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="premium-card">
        <div style={{ padding: '16px', background: 'white', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Supplier Due Report</h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px' }}>
          <PrintHeader />

          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '24px', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '300px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--label-color)', marginBottom: '8px', textAlign: 'center' }}>Search By Supplier</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none' }}>
                <option value="">All Suppliers</option>
                {suppliers.map((s) => <option key={s.id || s.uuid} value={s.id || s.uuid}>{s.name}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', paddingBottom: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} /> Only with due
            </label>
            <button onClick={() => { setSupplierId(''); setOnlyDue(true); }} style={{ background: '#7e8a9f', color: 'white', padding: '10px 32px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', height: '42px', minWidth: '150px' }}>
              Clear Filter
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px', border: '1px solid #94a3b8' }}>
            <div style={{ background: '#94a3b8', color: 'white', padding: '8px', fontSize: '11px', fontWeight: 'bold' }}>TOTAL DUE</div>
            <div style={{ padding: '12px', fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>৳ {money(totalDue)}</div>
          </div>

          <TableToolbar entries={entries} setEntries={setEntries} total={data.length} excelData={excelData} excelName="Supplier_Due_Report" onReload={fetchData} onReset={() => { setSupplierId(''); setOnlyDue(true); }} />

          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#94a3b8', color: 'white', textTransform: 'uppercase' }}>
                  <th style={{ width: '40px', padding: '12px' }}>SL</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>SUPPLIER INFO</th>
                  <th style={{ padding: '12px' }}>GROUP</th>
                  <th style={{ padding: '12px' }}>PURCHASE</th>
                  <th style={{ padding: '12px' }}>PAYMENT</th>
                  <th style={{ padding: '12px' }}>RETURN</th>
                  <th style={{ padding: '12px' }}>DUE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ padding: '24px' }}>Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '24px', color: '#64748b' }}>No records found</td></tr>
                ) : rows.map((row, index) => (
                  <tr key={row.supplier_id || index}>
                    <td style={{ padding: '10px' }}>{index + 1}</td>
                    <td style={{ padding: '10px', textAlign: 'left' }}>
                      <div><b>Name :</b> {row.supplier_name}</div>
                      <div><b>Address :</b> {row.address || '-'}</div>
                      <div><b>Phone :</b> {row.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '10px' }}>{row.group_name || '-'}</td>
                    <td style={{ padding: '10px' }}>{money(row.purchase_amount)}</td>
                    <td style={{ padding: '10px', color: '#059669' }}>{money(row.payment)}</td>
                    <td style={{ padding: '10px' }}>{money(row.return_amount)}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: Number(row.due) > 0 ? '#dc2626' : '#059669' }}>{money(row.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DueSupplierWise;
