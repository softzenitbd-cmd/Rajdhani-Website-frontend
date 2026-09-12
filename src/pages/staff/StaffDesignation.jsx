import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import staffApi from '../../api/staffApi';

const service = {
  list: staffApi.getDesignations,
  create: staffApi.createDesignation,
  update: staffApi.updateDesignation,
  remove: staffApi.deleteDesignation,
};

const StaffDesignation = () => (
  <SimpleCrudPage title="Staff Designation List" itemLabel="Designation" service={service} excelName="Staff_Designations" />
);

export default StaffDesignation;
