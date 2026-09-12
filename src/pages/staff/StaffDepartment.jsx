import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import staffApi from '../../api/staffApi';

const service = {
  list: staffApi.getDepartments,
  create: staffApi.createDepartment,
  update: staffApi.updateDepartment,
  remove: staffApi.deleteDepartment,
};

const StaffDepartment = () => (
  <SimpleCrudPage title="Staff Department List" itemLabel="Department" service={service} excelName="Staff_Departments" />
);

export default StaffDepartment;
