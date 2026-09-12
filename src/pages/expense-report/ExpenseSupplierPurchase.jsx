import React from 'react';
import TransactionReport from '../../components/TransactionReport';

const ExpenseSupplierPurchase = () => <TransactionReport kind="expense" groupBy="supplier" title="Supplier Payment Report" />;

export default ExpenseSupplierPurchase;
