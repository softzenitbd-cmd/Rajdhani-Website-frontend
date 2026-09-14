import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import staffApi from '../../api/staffApi';
import { useTranslation } from 'react-i18next';

const service = {
  list: staffApi.getDepartments,
  create: staffApi.createDepartment,
  update: staffApi.updateDepartment,
  remove: staffApi.deleteDepartment,
};

const StaffDepartment = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage title={t("Staff Department List")} itemLabel={t("Department")} service={service} excelName="Staff_Departments" />
);
};

export default StaffDepartment;
