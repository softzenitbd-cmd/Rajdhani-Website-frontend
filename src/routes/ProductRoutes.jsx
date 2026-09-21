import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProductCreate from '../pages/product/ProductCreate';
import ProductList from '../pages/product/ProductList';
import ProductGroup from '../pages/product/ProductGroup';
import ProductUnit from '../pages/product/ProductUnit';
import ProductBarcode from '../pages/product/ProductBarcode';
import PurchaseCreate from '../pages/product/PurchaseCreate';
import PurchaseList from '../pages/product/PurchaseList';
import PurchaseInvoiceList from '../pages/product/PurchaseInvoiceList';
import PurchaseReport from '../pages/product/PurchaseReport';
import PurchaseReturnCreate from '../pages/product/PurchaseReturnCreate';
import PurchaseReturnList from '../pages/product/PurchaseReturnList';
import PurchaseReturnReport from '../pages/product/PurchaseReturnReport';
import ProductStockList from '../pages/product/ProductStockList';

const ProductRoutes = () => {
  return (
    <div className="dashboard-content">
      <Routes>
        <Route path="/" element={<Navigate to="list" replace />} />
        <Route path="create" element={<ProductCreate />} />
        <Route path="list" element={<ProductList />} />
        <Route path="group" element={<ProductGroup />} />
        <Route path="unit" element={<ProductUnit />} />
        <Route path="barcode" element={<ProductBarcode />} />
        
        {/* Placeholder for nested menus */}
        {/* Purchase Routes */}
        <Route path="purchase/add-new" element={<PurchaseCreate />} />
        <Route path="purchase/list" element={<PurchaseList />} />
        <Route path="purchase/invoice-list" element={<PurchaseInvoiceList />} />
        <Route path="purchase/report" element={<PurchaseReport />} />
        {/* Purchase Return Routes */}
        <Route path="purchase-return/add-new" element={<PurchaseReturnCreate />} />
        <Route path="purchase-return/edit/:id" element={<PurchaseReturnCreate />} />
        <Route path="purchase-return/list" element={<PurchaseReturnList />} />
        <Route path="purchase-return/report" element={<PurchaseReturnReport />} />
        <Route path="stock" element={<ProductStockList />} />
      </Routes>
    </div>
  );
};

export default ProductRoutes;
