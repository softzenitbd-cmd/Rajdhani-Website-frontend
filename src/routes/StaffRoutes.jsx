import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StaffCreate from '../pages/staff/StaffCreate';
import StaffList from '../pages/staff/StaffList';
import StaffPaymentCreate from '../pages/staff/StaffPaymentCreate';
import StaffPaymentReport from '../pages/staff/StaffPaymentReport';
import StaffSalaryCreate from '../pages/staff/StaffSalaryCreate';
import StaffSalaryReport from '../pages/staff/StaffSalaryReport';
import StaffAttendanceCreate from '../pages/staff/StaffAttendanceCreate';
import StaffAttendanceReport from '../pages/staff/StaffAttendanceReport';
import StaffMonthlyAttendanceReport from '../pages/staff/StaffMonthlyAttendanceReport';
import StaffDepartment from '../pages/staff/StaffDepartment';
import StaffDesignation from '../pages/staff/StaffDesignation';

const StaffRoutes = () => {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Routes>
        <Route path="create" element={<StaffCreate />} />
        <Route path="edit/:id" element={<StaffCreate />} />
        <Route path="list" element={<StaffList />} />
        
        {/* Payment */}
        <Route path="payment/create" element={<StaffPaymentCreate />} />
        <Route path="payment/report" element={<StaffPaymentReport />} />
        
        {/* Salary */}
        <Route path="salary/create" element={<StaffSalaryCreate />} />
        <Route path="salary/report" element={<StaffSalaryReport />} />
        
        {/* Attendance */}
        <Route path="attendance/create" element={<StaffAttendanceCreate />} />
        <Route path="attendance/report" element={<StaffAttendanceReport />} />
        <Route path="attendance/monthly-report" element={<StaffMonthlyAttendanceReport />} />
        
        {/* Others */}
        <Route path="department" element={<StaffDepartment />} />
        <Route path="designation" element={<StaffDesignation />} />
      </Routes>
    </div>
  );
};

export default StaffRoutes;
