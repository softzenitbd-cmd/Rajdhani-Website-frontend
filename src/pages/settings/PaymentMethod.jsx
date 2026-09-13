import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { settingService } from '../../services/settingService';

// Backend: GET/POST/PATCH/DELETE /api/erpsetting/payment-methods/  (fields: name)
const PaymentMethod = () => (
  <SimpleCrudPage title="Payment Method List" itemLabel="Payment Method" service={settingService.paymentMethods} excelName="Payment_Methods" />
);

export default PaymentMethod;
