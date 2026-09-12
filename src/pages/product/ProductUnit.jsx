import React from 'react';
import SimpleCrudPage from '../../components/SimpleCrudPage';
import { productService } from '../../services/productService';

const service = {
  list: productService.units.getAll,
  create: productService.units.create,
  update: productService.units.update,
  remove: productService.units.delete,
};

const ProductUnit = () => (
  <SimpleCrudPage title="Product Unit List" itemLabel="Unit" service={service} excelName="Product_Units" />
);

export default ProductUnit;
