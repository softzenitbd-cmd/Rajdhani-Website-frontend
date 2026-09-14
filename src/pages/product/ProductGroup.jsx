import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { productService } from '../../services/productService';
import { useTranslation } from 'react-i18next';

const service = {
  list: productService.groups.getAll,
  create: productService.groups.create,
  update: productService.groups.update,
  remove: productService.groups.delete,
};

const ProductGroup = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage title={t("Product Group List")} itemLabel={t("Group")} service={service} excelName="Product_Groups" />
);
};

export default ProductGroup;
