import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientCreate from '../pages/crm/client/ClientCreate';
import ClientEdit from '../pages/crm/client/ClientEdit';
import ClientList from '../pages/crm/client/ClientList';
import ClientGroup from '../pages/crm/client/ClientGroup';
import DueCollectionDate from '../pages/crm/client/DueCollectionDate';
import ClientStatement from '../pages/crm/client/ClientStatement';
import SupplierCreate from '../pages/crm/supplier/SupplierCreate';
import SupplierList from '../pages/crm/supplier/SupplierList';
import SupplierGroup from '../pages/crm/supplier/SupplierGroup';
import SupplierStatement from '../pages/crm/supplier/SupplierStatement';
import SupplierChequeSchedule from '../pages/crm/supplier/SupplierChequeSchedule';
import SupplierEdit from '../pages/crm/supplier/SupplierEdit';
import ClientChequeSchedule from '../pages/crm/client/ClientChequeSchedule';

const CrmRoutes = () => {
  return (
    <Routes>
      <Route path="client-create" element={<ClientCreate />} />
      <Route path="client-edit/:id" element={<ClientEdit />} />
      <Route path="client-list" element={<ClientList />} />
      <Route path="client-group" element={<ClientGroup />} />
      <Route path="due-collection-date" element={<DueCollectionDate />} />
      <Route path="client-statement" element={<ClientStatement />} />
      <Route path="supplier-create" element={<SupplierCreate />} />
      <Route path="supplier-list" element={<SupplierList />} />
      <Route path="supplier-group" element={<SupplierGroup />} />
      <Route path="supplier-statement" element={<SupplierStatement />} />
      <Route path="supplier-cheque-schedule" element={<SupplierChequeSchedule />} />
      <Route path="supplier-edit/:id" element={<SupplierEdit />} />
      <Route path="client-cheque-schedule" element={<ClientChequeSchedule />} />
    </Routes>
  );
};

export default CrmRoutes;
