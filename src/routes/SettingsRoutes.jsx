import React from 'react';
import { Routes, Route } from 'react-router-dom';
import IncomeCategory from '../pages/settings/IncomeCategory';
import IncomeSubcategory from '../pages/settings/IncomeSubcategory';
import ExpenseCategory from '../pages/settings/ExpenseCategory';
import ExpenseSubcategory from '../pages/settings/ExpenseSubcategory';
import ShortcutMenu from '../pages/settings/ShortcutMenu';
import PaymentMethod from '../pages/settings/PaymentMethod';
import CompanyInformation from '../pages/settings/CompanyInformation';
import BankList from '../pages/settings/BankList';
import GeneralSettings from '../pages/settings/GeneralSettings';
import UserManagement from '../pages/settings/UserManagement';

const SettingsRoutes = () => {
  return (
    <Routes>
      <Route path="income-category" element={<IncomeCategory />} />
      <Route path="income-subcategory" element={<IncomeSubcategory />} />
      <Route path="expense-category" element={<ExpenseCategory />} />
      <Route path="expense-subcategory" element={<ExpenseSubcategory />} />
      <Route path="shortcut-menu" element={<ShortcutMenu />} />
      <Route path="payment-method" element={<PaymentMethod />} />
      <Route path="company-information" element={<CompanyInformation />} />
      <Route path="bank" element={<BankList />} />
      <Route path="settings" element={<GeneralSettings />} />
      <Route path="users" element={<UserManagement />} />
    </Routes>
  );
};

export default SettingsRoutes;
