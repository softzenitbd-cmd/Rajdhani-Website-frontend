import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { accountingService } from '../../services/accountingService';
import { toList, money } from '../../utils/apiHelpers';

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

const BankList = () => (
  <SimpleCrudPage
    title="Bank List"
    itemLabel="Bank"
    service={service}
    excelName="Bank_List"
    extraFields={[
      { name: 'account_number', label: 'Account Number', placeholder: 'Bank account number' },
      { name: 'contact_person', label: 'Contact Person' },
      { name: 'phone', label: 'Phone' },
      { name: 'balance', label: 'Opening Balance', type: 'number', default: '0' },
    ]}
    columns={[
      { key: 'account_number', label: 'ACCOUNT NO' },
      { key: 'balance', label: 'BALANCE', render: (r) => `৳ ${money(r.balance ?? r.current_balance)}` },
    ]}
  />
);

export default BankList;
