import React, { useEffect, useState } from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { createLocalService } from '../../utils/localStore';
import { accountingService } from '../../services/accountingService';
import { toList } from '../../utils/apiHelpers';

// NOTE: no backend endpoint for expense sub-categories – stored locally, parent
// category comes from /api/accounting/expense-categories/. See docs/missing-api-screens/README.md
const service = createLocalService('rajdhane_expense_subcategories');

const ExpenseSubcategory = () => {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    accountingService.getExpenseCategories().then((r) => setCategories(toList(r))).catch(() => {});
  }, []);
  const options = [{ value: '', label: 'Select category' }, ...categories.map((c) => ({ value: c.id || c.uuid, label: c.name }))];
  const nameOfCat = (id) => categories.find((c) => String(c.id || c.uuid) === String(id))?.name || '-';

  return (
    <SimpleCrudPage
      title="Expense Subcategory List"
      itemLabel="Subcategory"
      service={service}
      excelName="Expense_Subcategories"
      extraFields={[{ name: 'category', label: 'Parent Category', type: 'select', options }]}
      columns={[{ key: 'category', label: 'CATEGORY', render: (r) => nameOfCat(r.category) }]}
    />
  );
};

export default ExpenseSubcategory;
