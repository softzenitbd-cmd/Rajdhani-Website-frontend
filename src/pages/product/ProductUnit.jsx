import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { productService } from '../../services/productService';
import { useTranslation } from 'react-i18next';

const service = {
  list: productService.units.getAll,
  create: productService.units.create,
  update: productService.units.update,
  remove: productService.units.delete,
};

const ProductUnit = () => {
  const { t } = useTranslation();
  return (
  <SimpleCrudPage title={t("Product Unit List")} itemLabel={t("Unit")} service={service} excelName="Product_Units" />
);
};

export default ProductUnit;
