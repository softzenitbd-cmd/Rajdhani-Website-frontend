import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { productService } from '../../services/productService';
import JsBarcode from 'jsbarcode';
import { useToast } from '../../context/ToastContext';

const BarcodeSticker = ({ barcodeValue, name, price }) => {
  const { t } = useTranslation();
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && barcodeValue) {
      try {
        JsBarcode(svgRef.current, String(barcodeValue), {
          format: "CODE128",
          width: 1.8,
          height: 45,
          displayValue: true,
          fontSize: 13,
          font: "monospace",
          margin: 6
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [barcodeValue]);

  return (
    <div style={{ border: '1px dashed #94a3b8', padding: '12px', borderRadius: '6px', textAlign: 'center', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginBottom: '2px' }}>
        {t("RAJDHANI GARMENTS")}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      
      {/* Real Scannable SVG Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>
        {t("Price: ৳")}{price}
      </div>
    </div>
  );
};

const ProductBarcode = () => {
  const toast = useToast();
  const { t } = useTranslation();


  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [generatedStickers, setGeneratedStickers] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts().catch(() => null);
        const list = Array.isArray(res) ? res : (res?.results || []);
        const combined = list;

        // Deduplicate items by ID / Name
        const unique = [];
        const map = new Map();
        for (const item of combined) {
          const key = String(item.id || item.code || item.barcode || item.name).toLowerCase();
          if (!map.has(key)) {
            map.set(key, true);
            unique.push(item);
          }
        }

        setProducts(unique);
      } catch (err) {
        console.error("Error fetching products for barcode:", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const handleCreate = () => {
    const p = products.find(prod => String(prod.id) === String(selectedProductId));
    if (!p) {
      toast.error(t("Please select a product first."));
      return;
    }
    const count = parseInt(quantity) || 1;
    const stickers = Array.from({ length: count }, (_, i) => ({
      ...p,
      stickerId: `${p.id}-${i}`
    }));
    setGeneratedStickers(stickers);
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: '100px' }}>
      <PrintHeader />
      <div className="premium-card">
        <div className="premium-header" style={{ padding: '16px 24px', background: 'white', borderBottom: 'none' }}>
          <h2 className="premium-title" style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
            {t("Product Barcode Generator")}
          </h2>
        </div>

        <div className="premium-body" style={{ background: 'white', padding: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Controls Form */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '700px' }}>
              <select 
                value={selectedProductId} 
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ flex: 2, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', outline: 'none', background: 'white', fontSize: '14px' }}
              >
                <option value="">{t("Select Product")}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || p.barcode || '18647'}) - ৳{p.sales_price || p.price || 0}
                  </option>
                ))}
              </select>

              <input 
                type="number" 
                min="1" 
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={t("Qty")}
                style={{ width: '80px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }}
              />

              <button onClick={handleCreate} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0 24px', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t("Create Barcodes")}
              </button>
            </div>
          </div>

          {/* Barcode Stickers Preview */}
          {generatedStickers.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-muted)' }}>
                {t("Barcode Preview (")}{generatedStickers.length} {t("Printable Stickers)")}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
                {generatedStickers.map((stk, idx) => (
                  <BarcodeSticker 
                    key={idx} 
                    barcodeValue={stk.code || stk.barcode || `1864${idx}`} 
                    name={stk.name} 
                    price={stk.sales_price || stk.price || 0} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div>
            <button className="btn" onClick={() => window.print()} style={{ background: 'var(--info)', color: 'white', padding: '10px 20px', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Printer size={16} /> {t("Print Barcodes")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBarcode;


