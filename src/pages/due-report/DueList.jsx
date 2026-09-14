import React from 'react';
import ClientDueReport from '../../components/ClientDueReport';
import { useTranslation } from 'react-i18next';

const DueList = () => {
  const { t } = useTranslation();
  return <ClientDueReport mode="all" title={t("All Due Report")} />;
};

export default DueList;
