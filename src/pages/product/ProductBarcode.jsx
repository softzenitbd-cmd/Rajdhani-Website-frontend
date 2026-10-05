import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { productService } from '../../services/productService';
import SearchableSelect from '../../components/SearchableSelect';
import JsBarcode from 'jsbarcode';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAppSettings } from '../../hooks/useAppSettings';

export const BarcodeSticker = ({ barcodeValue, name, price }) => {
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const { settings } = useAppSettings();
  const barcodeBanner = settings?.barcode_header_custom_url;

  useEffect(() => {
    if (svgRef.current && barcodeValue) {
      try {
        JsBarcode(svgRef.current, String(barcodeValue), {
          format: "CODE128",
          width: 1.2,
          height: 35,
          displayValue: true,
          fontSize: 11,
          font: "monospace",
          margin: 2
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [barcodeValue]);

  return (
    <div className="barcode-sticker-wrapper" style={{ padding: '6px', textAlign: 'center', background: '#ffffff' }}>
      {barcodeBanner ? (
        <div style={{ marginBottom: '2px', display: 'flex', justifyContent: 'center' }}>
          <img src={barcodeBanner} alt="Barcode Header" style={{ maxHeight: '25px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        <div style={{ fontSize: 'var(--fs-9, 9px)', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '2px' }}>
          {t("RAJDHANI GARMENTS")}
        </div>
      )}
      <div style={{ fontSize: 'var(--fs-10, 10px)', fontWeight: '600', color: '#1e293b', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>

      <div style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: 'bold', color: '#000000', marginBottom: '2px' }}>
        {t("Price: ")}{Math.round(Number(price))}
      </div>
      
      {/* Real Scannable SVG Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
      </div>
    </div>
  );
};

const ProductBarcode = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(location.state?.product?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [generatedStickers, setGeneratedStickers] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts({ page_size: 500 }).catch(() => null);
        const list = Array.isArray(res) ? res : (res?.results || []);
        
        // Deduplicate
        const unique = [];
        const map = new Map();
        for (const item of list) {
          const key = String(item.id || item.code || item.barcode || item.name).toLowerCase();
          if (!map.has(key)) {
            map.set(key, true);
            unique.push(item);
          }
        }
        setProducts(unique);

        // Silent background load of all products
        productService.getProducts({ page_size: 5000 }).then(bgRes => {
          const allProds = Array.isArray(bgRes) ? bgRes : (bgRes?.results || []);
          if (allProds.length > unique.length) {
            const finalUnique = [];
            const finalMap = new Map();
            for (const item of allProds) {
              const key = String(item.id || item.code || item.barcode || item.name).toLowerCase();
              if (!finalMap.has(key)) {
                finalMap.set(key, true);
                finalUnique.push(item);
              }
            }
            setProducts(finalUnique);
          }
        }).catch(err => console.error("Background load failed", err));

      } catch (err) {
        console.error("Error fetching products for barcode:", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      const p = products.find(prod => String(prod.id) === String(selectedProductId));
      if (p) {
        const count = parseInt(quantity) || 1;
        const stickers = Array.from({ length: count }, (_, i) => ({
          ...p,
          stickerId: `${p.id}-${i}`
        }));
        setGeneratedStickers(stickers);
      } else {
        setGeneratedStickers([]);
      }
    } else {
      setGeneratedStickers([]);
    }
  }, [selectedProductId, quantity, products]);

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <div className="no-print">
        <PrintHeader />
      </div>
      <div className="premium-card" style={{ border: 'none', boxShadow: 'none' }}>
        <div className="premium-header no-print" style={{ padding: '16px 24px', background: 'white', borderBottom: 'none' }}>
          <h2 className="premium-title" style={{ fontSize: 'var(--fs-16, 16px)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
            {t("Product Barcode Generator")}
          </h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Controls Form */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '700px' }}>
              <div style={{ flex: 2 }}>
                <SearchableSelect
                  options={products.map(p => {
                    const shortId = String(p.id).substring(0, 8).toUpperCase();
                    const barcode = p.custom_barcode_no || p.code || p.barcode || shortId || '';
                    return {
                      value: p.id,
                      label: `${p.name} (${barcode}) - ৳${p.sales_price || p.price || 0}`,
                      searchValue: `${p.name} ${barcode}`
                    };
                  })}
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  onSearchChange={(val) => {
                    const term = (val || "").trim();
                    if (term.length >= 2) {
                      if (window.productBarcodeTimeout) clearTimeout(window.productBarcodeTimeout);
                      window.productBarcodeTimeout = setTimeout(async () => {
                        try {
                          const res = await productService.getProducts({ search: term });
                          const list = Array.isArray(res) ? res : (res?.results || []);
                          if (list.length > 0) {
                            setProducts(prev => {
                              const updated = [...prev];
                              list.forEach(item => {
                                if (!updated.find(p => String(p.id) === String(item.id))) {
                                  updated.push(item);
                                }
                              });
                              return updated;
                            });
                          }
                        } catch (e) {}
                      }, 500);
                    }
                  }}
                  placeholder={t("Select Product")}
                  hideOptionsUntilSearch={true}
                />
              </div>

              <input 
                type="number" 
                min="1" 
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t("Qty")}
                style={{ width: '80px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: 'var(--fs-14, 14px)' }}
              />
            </div>
          </div>

          {/* Barcode Stickers Preview */}
          {generatedStickers.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div className="no-print" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-muted)' }}>
                {t("Barcode Preview (")}{generatedStickers.length} {t("Printable Stickers)")}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {generatedStickers.map((stk, idx) => (
                  <div key={idx} style={{ width: '160px' }}>
                    <BarcodeSticker 
                      barcodeValue={stk.custom_barcode_no || stk.code || stk.barcode || String(stk.id).substring(0, 8).toUpperCase()} 
                      name={stk.name} 
                      price={stk.sales_price || stk.price || 0} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="no-print">
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--info)', color: 'white', padding: '10px 20px', borderRadius: '4px', fontSize: 'var(--fs-14, 14px)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Printer size={16} /> {t("Print Barcodes")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBarcode;


