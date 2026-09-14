import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const ExpenseAll = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="expense" groupBy={null} title={t("All Expense Report")} />;
};

export default ExpenseAll;
