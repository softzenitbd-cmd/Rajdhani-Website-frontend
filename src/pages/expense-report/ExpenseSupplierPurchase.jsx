import React from 'react';
import TransactionReport from '../../components/TransactionReport';
import { useTranslation } from 'react-i18next';

const ExpenseSupplierPurchase = () => {
  const { t } = useTranslation();
  return <TransactionReport kind="expense" groupBy="supplier" title={t("Supplier Payment Report")} />;
};

export default ExpenseSupplierPurchase;
