import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const DepositCustomerWise = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="deposit" groupBy="client" title={t("Customer Wise Deposit Report")} />;
};

export default DepositCustomerWise;
