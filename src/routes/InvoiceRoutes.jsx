import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import InvoiceCreate from '../pages/invoice/InvoiceCreate';
import InvoiceList from '../pages/invoice/InvoiceList';
import DraftInvoiceList from '../pages/invoice/DraftInvoiceList';
import SalesReturnCreate from '../pages/invoice/SalesReturnCreate';
import SalesReturnList from '../pages/invoice/SalesReturnList';

const InvoiceRoutes = () => {
  return (
    <div className="dashboard-content">
      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="add-new" element={<InvoiceCreate />} />
        <Route path="edit/:id" element={<InvoiceCreate />} />
        <Route path="list" element={<InvoiceList />} />
        <Route path="draft" element={<DraftInvoiceList />} />
        
        {/* Sales Return Group */}
        <Route path="sales-return/add-new" element={<SalesReturnCreate />} />
        <Route path="sales-return/list" element={<SalesReturnList />} />
      </Routes>
    </div>
  );
};

export default InvoiceRoutes;
