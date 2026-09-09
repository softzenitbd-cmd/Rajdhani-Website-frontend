import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoanClientCreate from '../pages/loan/LoanClientCreate';
import LoanClientList from '../pages/loan/LoanClientList';
import LoanReceiveList from '../pages/loan/LoanReceiveList';
import LoanReceiveCreate from '../pages/loan/LoanReceiveCreate';
import LoanPaymentList from '../pages/loan/LoanPaymentList';
import LoanPaymentCreate from '../pages/loan/LoanPaymentCreate';
import LoanStatement from '../pages/loan/LoanStatement';

const LoanRoutes = () => {
  return (
    <div className="dashboard-content">
      <Routes>
        <Route path="/" element={<Navigate to="client-create" replace />} />
        <Route path="client-create" element={<LoanClientCreate />} />
        <Route path="client-list" element={<LoanClientList />} />
        <Route path="receive" element={<LoanReceiveList />} />
        <Route path="receive-create" element={<LoanReceiveCreate />} />
        <Route path="payment" element={<LoanPaymentList />} />
        <Route path="payment-create" element={<LoanPaymentCreate />} />
        <Route path="statement" element={<LoanStatement />} />
      </Routes>
    </div>
  );
};

export default LoanRoutes;
