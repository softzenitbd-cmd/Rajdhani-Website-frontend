import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReceiveCreate from '../pages/account/ReceiveCreate';
import ReceiveList from '../pages/account/ReceiveList';
import ExpenseList from '../pages/account/ExpenseList';
import ExpenseCreate from '../pages/account/ExpenseCreate';
import SupplierPayment from '../pages/account/SupplierPayment';
import MoneyReturn from '../pages/account/MoneyReturn';
import MoneyReturnList from '../pages/account/MoneyReturnList';
import AccountCreate from '../pages/account/AccountCreate';
import AccountList from '../pages/account/AccountList';
import AccountBalance from '../pages/account/AccountBalance';
import Statement from '../pages/account/Statement';
import TransferCreate from '../pages/account/TransferCreate';
import TransferList from '../pages/account/TransferList';
import Profit from '../pages/account/Profit';

const AccountRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="receive-create" replace />} />
      <Route path="receive-create" element={<ReceiveCreate />} />
      <Route path="receive-list" element={<ReceiveList />} />
      <Route path="expense-list" element={<ExpenseList />} />
      <Route path="expense-create" element={<ExpenseCreate />} />
      <Route path="supplier-payment" element={<SupplierPayment />} />
      <Route path="money-return" element={<MoneyReturn />} />
      <Route path="money-return-list" element={<MoneyReturnList />} />
      <Route path="account-create" element={<AccountCreate />} />
      <Route path="account-list" element={<AccountList />} />
      <Route path="account-balance" element={<AccountBalance />} />
      <Route path="statement" element={<Statement />} />
      <Route path="transfer-create" element={<TransferCreate />} />
      <Route path="transfer-list" element={<TransferList />} />
      <Route path="profit" element={<Profit />} />
    </Routes>
  );
};

export default AccountRoutes;
