import React, { useEffect, useState } from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { toList, nameOf } from '../../utils/apiHelpers';

// Backend: /api/accounting/expense-subcategories/ (fields: name, category)
// Parent category comes from /api/accounting/expense-categories/
const ExpenseSubcategory = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    accountingService.getExpenseCategories()
      .then((r) => setCategories(toList(r)))
      .catch((e) => toast.error(e.message || 'Failed to load categories'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const options = [{ value: '', label: 'Select category' }, ...categories.map((c) => ({ value: c.id || c.uuid, label: c.name }))];
  const nameOfCat = (v) => {
    if (v && typeof v === 'object') return nameOf(v);
    return categories.find((c) => String(c.id || c.uuid) === String(v))?.name || '-';
  };

  return (
    <SimpleCrudPage
      title="Expense Subcategory List"
      itemLabel="Subcategory"
      service={accountingService.expenseSubcategories}
      excelName="Expense_Subcategories"
      extraFields={[{ name: 'category', label: 'Parent Category', type: 'select', options }]}
      columns={[{ key: 'category', label: 'CATEGORY', render: (r) => r.category_name || nameOfCat(r.category) }]}
    />
  );
};

export default ExpenseSubcategory;
