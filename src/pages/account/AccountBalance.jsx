import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrintHeader from '../../components/PrintHeader';
import { ArrowLeft, Printer, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { exportVisibleTable } from '../../utils/tableExport';
import { printPage } from '../../utils/printUtils';

const AccountBalance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountingService.getAccounts().catch(() => []);
      const data = Array.isArray(res) ? res : (res?.results || []);
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = (accounts || []).reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);

  return (
    <div className="premium-card">
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>{t("Account Balance List")}</h2>
        <div className="header-actions">
          <button className="btn-gray-outline" onClick={() => navigate(-1)}><ArrowLeft size={16} /> {t("Go Back")}</button>
          <Link to="/account/account-create" style={{ textDecoration: 'none' }}>
            <button className="btn-green">{t("Add New")}</button>
          </Link>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '24px' }}>
        <PrintHeader />
        
        {/* Table Section */}
        <div className="table-header-controls" style={{ marginBottom: '16px' }}>
          <div className="show-entries">
            {t("Show")} 
            <select defaultValue="100">
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select> 
            {t("entries")}
          </div>
          <div className="table-controls-right" style={{ gap: '4px' }}>
            <button onClick={() => exportVisibleTable('xlsx')} className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("Excel")}</button>
            <button onClick={() => exportVisibleTable('csv')} className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("CSV")}</button>
            <button onClick={() => printPage()} className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }}>{t("PDF")}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }} onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.print')}</button>
            <button className="btn-blue" style={{ padding: '6px 12px', fontSize: 'var(--fs-12, 12px)', fontWeight: 'bold' }} onClick={fetchAccounts}><RotateCcw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {t('common.reset')}</button>
          </div>
        </div>

        <table className="custom-table" style={{ border: '1px solid #d1d5db' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'left', paddingLeft: '12px' }}>{t("ID NO")}<span style={{ fontSize: 'var(--fs-10, 10px)', verticalAlign: 'super', marginLeft: '4px' }}>↑↓</span></th>
              <th style={{ textAlign: 'left' }}>{t("TITLE")}<span style={{ fontSize: 'var(--fs-10, 10px)', verticalAlign: 'super', marginLeft: '4px' }}>↑↓</span></th>
              <th style={{ textAlign: 'left' }}>{t("ACCOUNT")}<span style={{ fontSize: 'var(--fs-10, 10px)', verticalAlign: 'super', marginLeft: '4px' }}>↑↓</span></th>
              <th style={{ textAlign: 'left' }}>{t("BALANCE")}<span style={{ fontSize: 'var(--fs-10, 10px)', verticalAlign: 'super', marginLeft: '4px' }}>↑↓</span></th>
            </tr>
          </thead>
          <tbody>
            {(accounts || []).map((acc, idx) => (
              <tr key={acc.id || idx}>
                <td style={{ textAlign: 'left', paddingLeft: '12px' }}>{idx + 1}</td>
                <td style={{ textAlign: 'left' }}>{acc.name}</td>
                <td style={{ textAlign: 'left' }}>{acc.account_number || acc.accountNumber || t("N/A")}</td>
                <td style={{ textAlign: 'left' }}>৳ {Number(acc.balance || 0).toLocaleString()}</td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("Loading account balances...")}</td>
              </tr>
            )}
            {!loading && (accounts || []).length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>{t("No accounts found.")}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 'bold', background: '#f9fafb' }}>
              <td colSpan="3" style={{ textAlign: 'center', padding: '12px' }}>{t('common.total')}</td>
              <td style={{ textAlign: 'left', padding: '12px' }}>৳ {totalBalance.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

      </div>
    </div>
  );
};

export default AccountBalance;
