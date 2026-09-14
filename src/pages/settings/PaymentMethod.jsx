import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { settingService } from '../../services/settingService';
import { useTranslation } from 'react-i18next';

// Backend: GET/POST/PATCH/DELETE /api/erpsetting/payment-methods/  (fields: name)
const PaymentMethod = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage title={t("Payment Method List")} itemLabel={t("Payment Method")} service={settingService.paymentMethods} excelName="Payment_Methods" />
);
};

export default PaymentMethod;
