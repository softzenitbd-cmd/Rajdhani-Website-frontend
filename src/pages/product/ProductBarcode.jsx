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

export const BARCODE_SIZES = {
  compact: {
    id: 'compact',
    labelKey: 'Compact (38x25mm)',
    label: 'Compact (38×25mm)',
    stickerWidth: 190,
    headerFontSize: '10px',
    nameFontSize: '11px',
    priceFontSize: '13px',
    barcodeWidth: 1.4,
    barcodeHeight: 38,
    barcodeFontSize: 11,
    bannerMaxHeight: '22px',
    padding: '4px'
  },
  medium: {
    id: 'medium',
    labelKey: 'Medium (50x30mm)',
    label: 'Medium (50×30mm)',
    stickerWidth: 240,
    headerFontSize: '12px',
    nameFontSize: '13px',
    priceFontSize: '16px',
    barcodeWidth: 1.8,
    barcodeHeight: 48,
    barcodeFontSize: 13,
    bannerMaxHeight: '28px',
    padding: '6px'
  },
  large: {
    id: 'large',
    labelKey: 'Large (50x40mm)',
    label: 'Large (50×40mm)',
    stickerWidth: 280,
    headerFontSize: '14px',
    nameFontSize: '15px',
    priceFontSize: '18px',
    barcodeWidth: 2.0,
    barcodeHeight: 56,
    barcodeFontSize: 14,
    bannerMaxHeight: '34px',
    padding: '8px'
  },
  xlarge: {
    id: 'xlarge',
    labelKey: 'Extra Large (75x50mm)',
    label: 'Extra Large (75×50mm)',
    stickerWidth: 340,
    headerFontSize: '16px',
    nameFontSize: '17px',
    priceFontSize: '22px',
    barcodeWidth: 2.3,
    barcodeHeight: 68,
    barcodeFontSize: 16,
    bannerMaxHeight: '42px',
    padding: '10px'
  }
};

export const BarcodeSticker = ({
  barcodeValue,
  name,
  price,
  size = 'medium',
  scale = 1,
  isPrint = false
}) => {
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const { settings } = useAppSettings();
  const barcodeBanner = settings?.barcode_header_custom_url;
  const config = BARCODE_SIZES[size] || BARCODE_SIZES.medium;

  useEffect(() => {
    if (svgRef.current && barcodeValue) {
      try {
        const calculatedWidth = Math.max(1, Number((config.barcodeWidth * scale).toFixed(2)));
        const calculatedHeight = Math.max(25, Math.round(config.barcodeHeight * scale));
        const calculatedFontSize = Math.max(9, Math.round(config.barcodeFontSize * scale));

        JsBarcode(svgRef.current, String(barcodeValue), {
          format: "CODE128",
          width: calculatedWidth,
          height: calculatedHeight,
          displayValue: true,
          fontSize: calculatedFontSize,
          font: "monospace",
          textMargin: 2,
          margin: 3
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [barcodeValue, size, scale, config]);

  const numPrice = Number(price) || 0;
  const formattedPrice = numPrice % 1 === 0 ? Math.round(numPrice) : numPrice.toFixed(2);

  return (
    <div
      className="barcode-sticker-wrapper"
      style={{
        padding: isPrint ? '2px' : config.padding,
        textAlign: 'center',
        background: '#ffffff',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header Banner / Company Name */}
      {barcodeBanner ? (
        <div style={{ marginBottom: '3px', display: 'flex', justifyContent: 'center' }}>
          <img
            src={barcodeBanner}
            alt="Barcode Header"
            style={{
              maxHeight: `${Math.round(parseInt(config.bannerMaxHeight) * scale)}px`,
              maxWidth: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            fontSize: `calc(${config.headerFontSize} * ${scale})`,
            fontWeight: '800',
            textTransform: 'uppercase',
            color: '#1e293b',
            marginBottom: '3px',
            letterSpacing: '0.4px',
            lineHeight: 1.2
          }}
        >
          {settings?.company_name || t("RAJDHANI GARMENTS")}
        </div>
      )}

      {/* 2. Product Name */}
      <div
        style={{
          fontSize: `calc(${config.nameFontSize} * ${scale})`,
          fontWeight: '700',
          color: '#0f172a',
          marginBottom: '3px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.25
        }}
        title={name}
      >
        {name}
      </div>

      {/* 3. Price */}
      <div
        style={{
          fontSize: `calc(${config.priceFontSize} * ${scale})`,
          fontWeight: '800',
          color: '#000000',
          marginBottom: '3px',
          lineHeight: 1.2
        }}
      >
        {t("Price: ")}৳ {formattedPrice}
      </div>

      {/* 4. Real Scannable SVG Barcode */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
        <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto', display: 'block' }}></svg>
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
  const [stickerSize, setStickerSize] = useState('medium');
  const [printMode, setPrintMode] = useState('thermal');
  const [scale, setScale] = useState(1);

  const currentConfig = BARCODE_SIZES[stickerSize] || BARCODE_SIZES.medium;

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

  const handlePrint = () => {
    if (generatedStickers.length === 0) {
      toast.error(t("Please select a product first"));
      return;
    }

    const printClass = printMode === 'sheet' ? 'barcode-print-active-sheet' : 'barcode-print-active-thermal';
    document.body.classList.add(printClass);

    const cleanUp = () => {
      document.body.classList.remove('barcode-print-active-thermal');
      document.body.classList.remove('barcode-print-active-sheet');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);

    setTimeout(() => {
      window.print();
      // Safety timeout for browsers that skip afterprint event
      setTimeout(cleanUp, 1500);
    }, 150);
  };

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
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            {/* Top row: Product Selection & Quantity */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '780px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  options={products.map(p => {
                    const shortId = String(p.id).substring(0, 8).toUpperCase();
                    const barcode = p.custom_barcode_no || p.code || p.barcode || shortId || '';
                    return {
                      value: p.id,
                      label: `${p.name} (${barcode}) - ৳${p.selling_price || p.sales_price || p.sale_price || p.price || 0}`,
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>
                  {t("Qty")}:
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t("Qty")}
                  style={{ width: '85px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', textAlign: 'center', fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold' }}
                />
              </div>
            </div>

            {/* Bottom row: Sticker Size Selector & Printer Mode */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '780px', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              
              {/* Size preset buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: '700', color: '#334155' }}>
                  {t("Sticker Size")}:
                </span>
                {Object.values(BARCODE_SIZES).map((s) => {
                  const isActive = stickerSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStickerSize(s.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isActive ? '#eff6ff' : 'white',
                        color: isActive ? '#1d4ed8' : '#475569',
                        fontWeight: isActive ? '700' : '500',
                        fontSize: 'var(--fs-12, 12px)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isActive && <span>✓</span>}
                      {t(s.labelKey, s.label)}
                    </button>
                  );
                })}
              </div>

              {/* Printer mode selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--fs-13, 13px)', fontWeight: '700', color: '#334155' }}>
                  {t("Printer Mode")}:
                </span>
                <select
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    fontSize: 'var(--fs-12, 12px)',
                    fontWeight: '600',
                    color: '#1e293b',
                    cursor: 'pointer'
                  }}
                >
                  <option value="thermal">🖨️ {t("Thermal Barcode Printer (Roll)", "থার্মাল বারকোড প্রিন্টার (রোল)")}</option>
                  <option value="sheet">📄 {t("A4 Sheet Paper (Grid)", "A4 শিট পেপার (গ্রিড)")}</option>
                </select>
              </div>

              {/* Scale / Fine tuning slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--fs-12, 12px)', fontWeight: '600', color: '#64748b' }}>
                  {t("Zoom / Scale")}:
                </span>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  style={{ width: '85px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 'var(--fs-11, 11px)', fontWeight: '700', color: '#2563eb', minWidth: '36px' }}>
                  {Math.round(scale * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Barcode Stickers Preview */}
          {generatedStickers.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div className="no-print" style={{ fontSize: 'var(--fs-14, 14px)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-muted)' }}>
                {t("Barcode Preview (")}{generatedStickers.length} {t("Printable Stickers)")}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {generatedStickers.map((stk, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${Math.round(currentConfig.stickerWidth * scale)}px`,
                      border: '1.5px dashed #cbd5e1',
                      borderRadius: '8px',
                      background: 'white',
                      padding: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <BarcodeSticker 
                      barcodeValue={stk.custom_barcode_no || stk.code || stk.barcode || String(stk.id).substring(0, 8).toUpperCase()} 
                      name={stk.name} 
                      price={stk.salePrice || stk.selling_price || stk.sales_price || stk.sale_price || stk.sellingPrice || stk.mrp || stk.price || stk.buyingPrice || 0} 
                      size={stickerSize}
                      scale={scale}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button
              className="btn"
              onClick={handlePrint}
              disabled={generatedStickers.length === 0}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: 'var(--fs-15, 15px)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: generatedStickers.length === 0 ? 'not-allowed' : 'pointer',
                opacity: generatedStickers.length === 0 ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                border: 'none'
              }}
            >
              <Printer size={18} /> {t("Print Barcodes")} {generatedStickers.length > 0 ? `(${generatedStickers.length})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Thermal Print Container (1 sticker per page/label for Gainscha GS-2406T Plus) */}
      <div className="barcode-print-thermal-container">
        {generatedStickers.map((stk, idx) => (
          <div key={`thermal-${idx}`} className="barcode-single-page">
            <BarcodeSticker 
              barcodeValue={stk.custom_barcode_no || stk.code || stk.barcode || String(stk.id).substring(0, 8).toUpperCase()} 
              name={stk.name} 
              price={stk.salePrice || stk.selling_price || stk.sales_price || stk.sale_price || stk.sellingPrice || stk.mrp || stk.price || stk.buyingPrice || 0} 
              size={stickerSize}
              scale={scale}
              isPrint={true}
            />
          </div>
        ))}
      </div>

      {/* Dedicated Sheet Print Container (Grid layout for A4 sticker paper) */}
      <div className="barcode-print-sheet-container">
        {generatedStickers.map((stk, idx) => (
          <div
            key={`sheet-${idx}`}
            className="barcode-sheet-item"
            style={{ width: `${Math.round(currentConfig.stickerWidth * scale)}px` }}
          >
            <BarcodeSticker 
              barcodeValue={stk.custom_barcode_no || stk.code || stk.barcode || String(stk.id).substring(0, 8).toUpperCase()} 
              name={stk.name} 
              price={stk.salePrice || stk.selling_price || stk.sales_price || stk.sale_price || stk.sellingPrice || stk.mrp || stk.price || stk.buyingPrice || 0} 
              size={stickerSize}
              scale={scale}
              isPrint={true}
            />
          </div>
        ))}
      </div>

      <style>{`
        .barcode-print-thermal-container,
        .barcode-print-sheet-container {
          display: none;
        }

        @media print {
          @page {
            margin: 0 !important;
            size: auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* 1. THERMAL PRINTER MODE (Gainscha GS-2406T Plus) */
          body.barcode-print-active-thermal * {
            visibility: hidden !important;
          }
          body.barcode-print-active-thermal .barcode-print-thermal-container,
          body.barcode-print-active-thermal .barcode-print-thermal-container * {
            visibility: visible !important;
          }
          body.barcode-print-active-thermal .barcode-print-thermal-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body.barcode-print-active-thermal .barcode-single-page {
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            page-break-after: always !important;
            break-after: page !important;
            box-sizing: border-box !important;
            padding: 2mm !important;
          }
          body.barcode-print-active-thermal .barcode-sticker-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          body.barcode-print-active-thermal svg {
            max-width: 95% !important;
            height: auto !important;
          }

          /* 2. SHEET PAPER MODE (A4 multi-sticker) */
          body.barcode-print-active-sheet * {
            visibility: hidden !important;
          }
          body.barcode-print-active-sheet .barcode-print-sheet-container,
          body.barcode-print-active-sheet .barcode-print-sheet-container * {
            visibility: visible !important;
          }
          body.barcode-print-active-sheet .barcode-print-sheet-container {
            display: flex !important;
            flex-wrap: wrap !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 8mm !important;
            gap: 4mm !important;
            box-sizing: border-box !important;
          }
          body.barcode-print-active-sheet .barcode-sheet-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px dashed #94a3b8 !important;
            box-sizing: border-box !important;
            padding: 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductBarcode;
