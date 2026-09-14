import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const ExpenseCategoryWise = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="expense" groupBy="category" title={t("Category Wise Expense Report")} />;
};

export default ExpenseCategoryWise;
