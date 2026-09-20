import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Printer, RotateCcw, Edit, FileText, Play, X, Trash2 } from 'lucide-react';
import { accountingService } from '../../services/accountingService';
import { crmService } from '../../services/crmService';
import SearchableSelect from '../../components/SearchableSelect';
import PrintHeader from '../../components/PrintHeader';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import ReceiveEditModal from './ReceiveEditModal';
import CustomDatePicker from '../../components/CustomDatePicker';


const ReceiveList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [receives, setReceives] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptModal, setReceiptModal] = useState(null);
  const [editing, setEditing] = useState(null);
  
  // Filters
  const [clientId, setClientId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchClients = async () => {
    try {
      const res = await crmService.getClients({ page_size: 1000 });
      setClients(res?.results || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReceives = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (clientId) filters.client = clientId;
      if (invoiceNo) filters.invoice_no = invoiceNo;
      if (receiptNo) filters.receipt_no = receiptNo;
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const res = await accountingService.getReceives(filters);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setReceives(data);
    } catch (error) {
      console.error('Error fetching receives:', error);
      setReceives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchReceives();
  }, []);

  const handleClearFilter = () => {
    setClientId('');
    setInvoiceNo('');
    setReceiptNo('');
    setFromDate('');
    setToDate('');
    setTimeout(() => fetchReceives(), 50);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceives();
    }, 500);
    return () => clearTimeout(timer);
  }, [clientId, invoiceNo, receiptNo, fromDate, toDate, limit]);

  const handleDelete = (id) => {
    confirm({
      title: t("Delete Receive?"),
      description: t("Are you sure you want to delete this record?"),
      onConfirm: async () => {
        try {
          if (accountingService.deleteReceive) {
            await accountingService.deleteReceive(id);
          } else {
            // Fallback if not specifically implemented
            await accountingService.delete('/api/accounting/receives/' + id + '/');
          }
          toast.success(t("Deleted successfully"));
          fetchReceives();
        } catch (error) {
          toast.error(t("Failed to delete"));
        }
      }
    });
  };

  const handlePrintReceipt = () => {
    const printContents = document.getElementById('print-receipt-section').innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); 
  };


  const getInvoiceNo = (row) => {
    if (row.invoice_no) return row.invoice_no;
    if (row.invoice_number) return row.invoice_number;
    if (row.invoice_id) return row.invoice_id;
    if (row.invoice) {
      if (typeof row.invoice === 'string') return row.invoice;
      if (row.invoice.invoice_number) return row.invoice.invoice_number;
      if (row.invoice.invoice_id) return row.invoice.invoice_id;
      if (row.invoice.id) return String(row.invoice.id).slice(0, 8);
    }
    if (row.sale_invoice) return row.sale_invoice;
    if (row.transaction_type === 'Invoice' || row.type === 'Invoice') {
      if (row.reference && (String(row.reference).startsWith('INV') || String(row.reference).startsWith('Invoice') || String(row.reference).includes('Payment for'))) {
        return String(row.reference).replace('Payment for ', '');
      }
      if (row.id) return `INV-${String(row.id).slice(0, 8)}`;
    }
    return '-';
  };

  const getReceiptNo = (row) => {
    if (row.receipt_no) return row.receipt_no;
    if (row.receipt_number) return row.receipt_number;
    if (row.voucher_no) return row.voucher_no;
    if (row.id) return `RCP-${String(row.id).slice(0, 8)}`;
    return '-';
  };

  const getDescription = (row) => {
    if (row.description) return row.description;
    if (row.reference && !String(row.reference).startsWith('INV') && !String(row.reference).startsWith('RCP') && !String(row.reference).includes('Payment for')) {
      return row.reference;
    }
    return '-';
  };

  const filteredReceives = receives.filter((row) => {
    if (invoiceNo) {
      const q = invoiceNo.trim().toLowerCase();
      const invNo = getInvoiceNo(row).toLowerCase();
      const ref = String(row.reference || '').toLowerCase();
      const id = String(row.id || '').toLowerCase();
      if (!invNo.includes(q) && !ref.includes(q) && !id.includes(q)) return false;
    }
    if (receiptNo) {
      const q = receiptNo.trim().toLowerCase();
      const rcpNo = getReceiptNo(row).toLowerCase();
      const ref = String(row.reference || '').toLowerCase();
      const id = String(row.id || '').toLowerCase();
      if (!rcpNo.includes(q) && !ref.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ background: 'white', minHeight: '100vh', padding: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ width: '150px' }}></div>
        <h2 style={{ fontSize: 'var(--fs-24, 24px)', fontWeight: 'bold', margin: 0 }}>{t("Receive List")}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/account/receive-create')} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> {t("Add New Receive")}
          </button>
          <button style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Play size={16} /> {t("YouTube")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Client")}</label>
          <SearchableSelect
            options={clients.map(c => ({
              value: c.id,
              label: c.name || c.company_name,
              searchValue: c.name || c.phone
            }))}
            value={clientId}
            onChange={(val) => setClientId(val)}
            placeholder={t("Select Client")}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Invoice No")}</label>
          <input
            type="text"
            placeholder={t("Invoice No")}
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Receipt No")}</label>
          <input
            type="text"
            placeholder={t("Receipt No")}
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold' }}>{t("Search By Date")}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CustomDatePicker  value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
            <CustomDatePicker  value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button onClick={handleClearFilter} style={{ background: '#64748b', color: 'white', border: 'none', padding: '12px 0', width: '400px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: 'var(--fs-15, 15px)' }}>
          {t("Clear Filter")}
        </button>
      </div>

      {/* Table Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: 'var(--fs-14, 14px)' }}>
          {t("Show")} 
          <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ width: '60px', margin: '0 8px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }} /> 
          {t("entries")}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Printer size={16} /> {t("Print")}
          </button>
          <button onClick={() => fetchReceives()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <RotateCcw size={16} /> {t("Reset")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-13, 13px)' }}>
          <thead>
            <tr style={{ background: '#94a3b8', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("SL. ↑")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("DATE")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("RECEIPT NO")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("INVOICE NO")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("CLIENT")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("TYPE")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("DESCRIPTION")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("AMOUNT")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("MONEY RECEIPT")}</th>
              <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{t("ACTION")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : filteredReceives.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>No records found.</td></tr>
            ) : (
              filteredReceives.slice(0, limit).map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{row.date ? String(row.date).split('T')[0] : ''}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{getReceiptNo(row)}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: '500' }}>{getInvoiceNo(row)}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <div>Name: {row.client_name || row.client?.name || 'Walk-in'}</div>
                    {(row.client_phone || row.client?.phone) && <div>Number: {row.client_phone || row.client?.phone}</div>}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{row.transaction_type || row.type || t("Invoice")}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{getDescription(row)}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{Number(row.amount || 0).toFixed(2)}</td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    <button onClick={() => setReceiptModal(row)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                      <FileText size={16} />
                    </button>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => setEditing(row)} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(row.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ReceiveEditModal
          isOpen={!!editing}
          receive={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            fetchReceives();
          }}
        />
      )}

      {/* Money Receipt Modal */}
      {receiptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', width: '800px', maxWidth: '95%', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', fontWeight: 'bold', color: '#1e293b' }}>{t("Money Receipt")}</h3>
              <button onClick={() => setReceiptModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'white' }} id="print-receipt-section">
              <PrintHeader showOnScreen={true} />
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--fs-16, 16px)', margin: '16px 0', borderBottom: '1px solid black', paddingBottom: '4px' }}>
                জমা রশিদ
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: 'var(--fs-14, 14px)' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black', width: '40%' }}>Receipt No</td>
                    <td style={{ padding: '8px', border: '1px solid black', width: '60%' }}>#{getReceiptNo(receiptModal)}</td>
                  </tr>
                  {getInvoiceNo(receiptModal) !== '-' && (
                    <tr>
                      <td style={{ padding: '8px', border: '1px solid black' }}>Invoice No</td>
                      <td style={{ padding: '8px', border: '1px solid black' }}>{getInvoiceNo(receiptModal)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>তারিখ</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.date ? String(receiptModal.date).split('T')[0] : ''}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>নাম</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{receiptModal.client_name || receiptModal.client?.name || 'Walk-in'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>বিবরণ</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{getDescription(receiptModal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>জমা টাকা</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{Number(receiptModal.amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid black' }}>বাকি</td>
                    <td style={{ padding: '8px', border: '1px solid black' }}>{Number(receiptModal.client?.due || receiptModal.client?.due_amount || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button onClick={handlePrintReceipt} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <Printer size={16} /> Print
              </button>
              <button onClick={() => setReceiptModal(null)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveList;
