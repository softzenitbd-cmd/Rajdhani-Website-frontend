import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DueList from '../pages/due-report/DueList';
import DueClientWise from '../pages/due-report/DueClientWise';
import DueGroupWise from '../pages/due-report/DueGroupWise';
import DueSupplierWise from '../pages/due-report/DueSupplierWise';

const DueReportRoutes = () => {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Routes>
        <Route path="list" element={<DueList />} />
        <Route path="client-wise" element={<DueClientWise />} />
        <Route path="group-wise" element={<DueGroupWise />} />
        <Route path="supplier-wise" element={<DueSupplierWise />} />
      </Routes>
    </div>
  );
};

export default DueReportRoutes;
