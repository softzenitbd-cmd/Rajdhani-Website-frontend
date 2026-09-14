import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import staffApi from '../../api/staffApi';
import { useTranslation } from 'react-i18next';

const service = {
  list: staffApi.getDesignations,
  create: staffApi.createDesignation,
  update: staffApi.updateDesignation,
  remove: staffApi.deleteDesignation,
};

const StaffDesignation = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage title={t("Staff Designation List")} itemLabel={t("Designation")} service={service} excelName="Staff_Designations" />
);
};

export default StaffDesignation;
