import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import PrintHeader from '../../components/PrintHeader';
import { productService } from '../../services/productService';
import JsBarcode from 'jsbarcode';

const BarcodeSticker = ({ barcodeValue, name, price }) => {
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
        RAJDHANI GARMENTS
      </div>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      
      {/* Real Scannable SVG Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }}></svg>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>
        Price: ৳{price}
      </div>
    </div>
  );
};

const ProductBarcode = () => {
  const { t } = useTranslation();

  const defaultProducts = [
    { id: '1', name: 'BATIK PRINT ORNA 380', barcode: '18647', sales_price: '380' },
    { id: '2', name: 'BR ORNA 380', barcode: '18646', sales_price: '380' },
    { id: '3', name: 'BR ORNA 500', barcode: '18645', sales_price: '500' },
    { id: '4', name: 'SAB INDIA KANI SOFT', barcode: '18644', sales_price: '2580' },
    { id: '5', name: 'SAB INDIA KANI SHAREE', barcode: '18643', sales_price: '2380' },
    { id: '6', name: 'NS INDIA KANI SHAREE', barcode: '18642', sales_price: '2450' },
    { id: '7', name: 'DP HEZAB RIMON', barcode: '18641', sales_price: '550' },
    { id: '8', name: 'FABRIC T-SHIRT 2026', barcode: 'TS-101', sales_price: '450' },
    { id: '9', name: 'PREMIUM DENIM JEANS', barcode: 'DJ-202', sales_price: '1200' },
    { id: '10', name: 'COTTON CASUAL SHIRT', barcode: 'CS-303', sales_price: '850' },
    { id: '11', name: 'LADIES THREE PIECE', barcode: 'TP-404', sales_price: '1650' },
    { id: '12', name: 'GENTS PANJABI', barcode: 'PJ-505', sales_price: '1450' }
  ];

  const [products, setProducts] = useState(defaultProducts);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [generatedStickers, setGeneratedStickers] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getProducts().catch(() => null);
        const list = Array.isArray(res) ? res : (res?.results || []);
        const localProducts = JSON.parse(localStorage.getItem('rajdhani_custom_products') || '[]');
        
        const combined = [...localProducts, ...(list.length > 0 ? list : []), ...defaultProducts];

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
        const localProducts = JSON.parse(localStorage.getItem('rajdhani_custom_products') || '[]');
        setProducts([...localProducts, ...defaultProducts]);
      }
    };
    fetchProducts();
  }, []);

  const handleCreate = () => {
    const p = products.find(prod => String(prod.id) === String(selectedProductId));
    if (!p) {
      alert("Please select a product first.");
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
            Product Barcode Generator
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
                <option value="">Select Product</option>
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
                placeholder="Qty"
                style={{ width: '80px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }}
              />

              <button onClick={handleCreate} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0 24px', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Create Barcodes
              </button>
            </div>
          </div>

          {/* Barcode Stickers Preview */}
          {generatedStickers.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-muted)' }}>
                Barcode Preview ({generatedStickers.length} Printable Stickers)
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
              <Printer size={16} /> Print Barcodes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBarcode;


