import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { createLocalService } from '../../utils/localStore';

// NOTE: no backend endpoint exists for payment methods yet – stored locally.
// See docs/missing-api-screens/README.md
const service = createLocalService('rajdhane_payment_methods', [
  { name: 'Cash' }, { name: 'Bank' }, { name: 'bKash' }, { name: 'Nagad' }, { name: 'Cheque' },
]);

const PaymentMethod = () => (
  <SimpleCrudPage title="Payment Method List" itemLabel="Payment Method" service={service} excelName="Payment_Methods" />
);

export default PaymentMethod;
