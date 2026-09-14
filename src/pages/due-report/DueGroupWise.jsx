import React from 'react';
import ClientDueReport from '../../components/ClientDueReport';
import { useTranslation } from 'react-i18next';

const DueGroupWise = () => {
  const { t } = useTranslation();
  return <ClientDueReport mode="group" title={t("Group Wise Due Report")} />;
};

export default DueGroupWise;
