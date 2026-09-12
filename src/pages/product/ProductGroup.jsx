import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { productService } from '../../services/productService';

const service = {
  list: productService.groups.getAll,
  create: productService.groups.create,
  update: productService.groups.update,
  remove: productService.groups.delete,
};

const ProductGroup = () => (
  <SimpleCrudPage title="Product Group List" itemLabel="Group" service={service} excelName="Product_Groups" />
);

export default ProductGroup;
