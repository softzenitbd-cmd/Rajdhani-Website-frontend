import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const DepositCategoryWise = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="deposit" groupBy="category" title={t("Category Wise Deposit Report")} />;
};

export default DepositCategoryWise;
