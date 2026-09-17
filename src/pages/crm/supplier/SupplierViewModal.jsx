import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const SupplierViewModal = ({ supplier, onClose }) => {
  const { t } = useTranslation();

  if (!supplier) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: 'white', borderRadius: '8px', width: '500px', maxWidth: '90%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--fs-18, 18px)', color: '#4a5568', fontWeight: 'bold' }}>
            Supplier View | {supplier.name?.toUpperCase() || supplier.company_name?.toUpperCase() || '-'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#a0aec0" /></button>
        </div>
        <div className="modal-body" style={{ padding: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', width: '120px' }}>Name</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.name || supplier.company_name || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Email</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.email || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Mobile</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.phone || supplier.mobile || '0'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Address</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.address || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Company</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.company_name || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Group</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.group || supplier.group_name || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>ZIP Code</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.zip_code || '-'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>Country</td>
                <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>: {supplier.country || 'Bangladesh (বাংলাদেশ)'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#718096', color: 'white', padding: '8px 24px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SupplierViewModal;
