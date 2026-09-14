import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const DepositAll = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="deposit" groupBy={null} title={t("All Deposit Report")} />;
};

export default DepositAll;
