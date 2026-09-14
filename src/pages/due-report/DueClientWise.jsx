import React from 'react';
import ClientDueReport from '../../components/ClientDueReport';
import { useTranslation } from 'react-i18next';

const DueClientWise = () => {
  const { t } = useTranslation();
  return <ClientDueReport mode="client" title={t("Client Due Report")} />;
};

export default DueClientWise;
