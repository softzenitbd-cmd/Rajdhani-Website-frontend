import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { accountingService } from '../../services/accountingService';
import { toList, money } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

// Bank list = accounts that carry an account number (from /api/accounting/accounts/)
const service = {
  list: async (params) => {
    const rows = toList(await accountingService.getAccounts(params?.search || ''));
    return rows.filter((a) => a.account_number || /bank|bkash|nagad|rocket|card/i.test(a.name || ''));
  },
  create: (data) => accountingService.createAccount({ ...data, balance: data.balance || '0' }),
  update: accountingService.updateAccount,
  remove: accountingService.deleteAccount,
};

const BankList = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage
    title={t("Bank List")}
    itemLabel={t("Bank")}
    service={service}
    excelName="Bank_List"
    extraFields={[
      { name: 'account_number', label: t("Account Number"), placeholder: t("Bank account number") },
      { name: 'contact_person', label: t("Contact Person") },
      { name: 'phone', label: t("Phone") },
      { name: 'balance', label: t("Opening Balance"), type: 'number', default: '0' },
    ]}
    columns={[
      { key: 'account_number', label: t("ACCOUNT NO") },
      { key: 'balance', label: t("BALANCE"), render: (r) => `৳ ${money(r.balance ?? r.current_balance)}` },
    ]}
  />
);
};

export default BankList;
