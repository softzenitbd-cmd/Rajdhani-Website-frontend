import React, { useEffect, useState } from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { accountingService } from '../../services/accountingService';
import { useToast } from '../../context/ToastContext';
import { toList, nameOf } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

// Backend: /api/accounting/income-subcategories/ (fields: name, category)
// Parent category comes from /api/accounting/income-categories/
const IncomeSubcategory = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    accountingService.getIncomeCategories()
      .then((r) => setCategories(toList(r)))
      .catch((e) => toast.error(e.message || t("Failed to load categories")));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const options = [{ value: '', label: t("Select category") }, ...categories.map((c) => ({ value: c.id || c.uuid, label: c.name }))];
  const nameOfCat = (v) => {
    if (v && typeof v === 'object') return nameOf(v);
    return categories.find((c) => String(c.id || c.uuid) === String(v))?.name || '-';
  };

  return (
    <SimpleCrudPage
      title={t("Receive Subcategory List")}
      itemLabel={t("Subcategory")}
      service={accountingService.incomeSubcategories}
      excelName="Receive_Subcategories"
      extraFields={[{ name: 'category', label: t("Parent Category"), type: 'select', options }]}
      columns={[{ key: 'category', label: t("CATEGORY"), render: (r) => r.category_name || nameOfCat(r.category) }]}
    />
  );
};

export default IncomeSubcategory;
