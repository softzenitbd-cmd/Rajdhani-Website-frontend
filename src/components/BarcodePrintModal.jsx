import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer } from 'lucide-react';
import { BarcodeSticker } from '../pages/product/ProductBarcode';

const BarcodePrintModal = ({ isOpen, onClose, product }) => {
  console.log('Modal state:', isOpen, product);
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setQuantity(Number(product.stock || product.opening_stock || 1));
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('barcode-print-mode');
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove('barcode-print-mode');
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const stickers = Array(Number(quantity) || 1).fill(product);

  return (
    <div className="modal-overlay no-print-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", zIndex: 99999 }}>
      <div className="modal-content" style={{ display: 'none' }}>
        <div className="modal-header">
          <h3>{t("Print Barcode")} - {product.name}</h3>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{t("Quantity to Print")}</label>
            <input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            />
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#64748b' }}>{t("Preview (Shows 1 sticker)")}</h4>
            <div style={{ width: '160px', margin: '0 auto' }}>
              <BarcodeSticker 
                barcodeValue={product.custom_barcode_no || product.code || product.barcode || String(product.id).substring(0, 8).toUpperCase()} 
                name={product.name} 
                price={product.sales_price || product.price || 0} 
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary">{t("Cancel")}</button>
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: 'white' }}>
            <Printer size={16} /> {t("Print & Close")}
          </button>
        </div>
      </div>

      {/* Actual printable area, hidden on screen, visible only during print */}
      <div className="print-only-container" style={{ display: 'none', flexWrap: 'wrap', gap: '12px' }}>
        {stickers.map((stk, idx) => (
          <div key={idx} className="single-barcode-print-wrapper">
            <BarcodeSticker 
              barcodeValue={stk.custom_barcode_no || stk.code || stk.barcode || String(stk.id).substring(0, 8).toUpperCase()} 
              name={stk.name} 
              price={stk.sales_price || stk.price || 0} 
            />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body.barcode-print-mode * {
            visibility: hidden !important;
          }
          body.barcode-print-mode .print-only-container,
          body.barcode-print-mode .print-only-container * {
            visibility: visible !important;
          }
          body.barcode-print-mode .print-only-container {
            display: block !important;
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          body.barcode-print-mode .single-barcode-print-wrapper {
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            page-break-after: always;
            break-after: page;
          }
          body.barcode-print-mode .barcode-sticker-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2px !important;
          }
          body.barcode-print-mode .barcode-sticker-wrapper {
            border: none !important;
          }
          body.barcode-print-mode svg {
            width: 100% !important;
            height: auto !important;
            max-height: 80%;
          }
          .print-header { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default BarcodePrintModal;
