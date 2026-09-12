import React from 'react';
import TransactionReport from '../../components/TransactionReport';

const DepositCustomerWise = () => <TransactionReport kind="deposit" groupBy="client" title="Customer Wise Deposit Report" />;

export default DepositCustomerWise;
