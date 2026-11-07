import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Plus,
  Trash2,
  Barcode,
  HelpCircle,
  Settings,
  MessageSquare,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PrintHeader from "../../components/PrintHeader";
import SearchableSelect from "../../components/SearchableSelect";
import CustomDatePicker from "../../components/CustomDatePicker";
import AddOptionModal from "../../components/AddOptionModal";
import AddSupplierModal from "../../components/AddSupplierModal";
import AddProductModal from "../../components/AddProductModal";
import FormSettingsModal from "../../components/FormSettingsModal";
import BarcodePrintModal from "../../components/BarcodePrintModal";
import { crmService } from "../../services/crmService";
import { productService } from "../../services/productService";
import { purchaseService } from "../../services/purchaseService";
import settingService from "../../services/settingService";
import { companyStore } from "../../services/companyStore";
import { useToast } from "../../context/ToastContext";
import { useAppSettings } from "../../hooks/useAppSettings";

const ashInput = {
  width: "100%",
  padding: "2px 6px",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  textAlign: "center",
  outline: "none",
  background: "#f8fafc",
  fontSize: "12px",
  height: "26px",
};

const PurchaseCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const { settings } = useAppSettings();

  const [companyInfo, setCompanyInfo] = React.useState(companyStore.getCached());
  React.useEffect(() => {
    const h = () => setCompanyInfo(companyStore.getCached());
    window.addEventListener(companyStore.EVENT, h);
    companyStore.load();
    return () => window.removeEventListener(companyStore.EVENT, h);
  }, []);
    let salePricePercentage = parseFloat(companyInfo?.sale_price_percentage) || parseFloat(settings['sale-price-percentage']) || 0;
    const autoGenSetting = settings['auto-generate-sale-price'];
    const isAutoGenerateEnabled = 
      companyInfo?.sale_price_auto_generate === true || 
      companyInfo?.sale_price_auto_generate === "true" ||
      companyInfo?.sale_price_auto_generate === 1 ||
      companyInfo?.sale_price_auto_generate === "1" ||
      autoGenSetting === true ||
      autoGenSetting === "true" ||
      autoGenSetting === 1 ||
      autoGenSetting === "1";

  const [formData, setFormData] = useState({
    invoice_id: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    barcode: "",
    product: "",
    discount: "",
    discount_type: "Percentage (%)",
    transport_fare: "",
    vat: "",
    vat_type: "Percentage (%)",
    receive_amount: "",
    warehouse: "",
    account: "",
    category: "",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [originalPurchaseDue, setOriginalPurchaseDue] = useState(0);
  const [originalSupplierId, setOriginalSupplierId] = useState("");
  const [invoiceUuid, setInvoiceUuid] = useState(id);

  const fetchPrerequisites = async () => {
    try {
      const [supRes, prodRes, supStatsRes] = await Promise.all([
        crmService.getSuppliers({ page_size: 5000 }).catch(() => null),
        productService.getProducts({ page_size: 500 }).catch(() => null),
        crmService.getSupplierDueReport({ page_size: 5000 }).catch(() => null),
      ]);

      const rawSuppliers = Array.isArray(supRes) ? supRes : supRes?.results || [];
      const prodData = Array.isArray(prodRes)
        ? prodRes
        : prodRes?.results || [];
      const statsData = Array.isArray(supStatsRes) ? supStatsRes : supStatsRes?.results || [];

      const supData = rawSuppliers.map(sup => {
        const stats = statsData.find(s => String(s.supplier_id || s.id || s.uuid) === String(sup.id || sup.uuid));
        return {
          ...sup,
          due: stats?.due !== undefined ? stats.due : (sup.due ?? sup.previous_due ?? 0),
          stats: stats || sup.stats || {}
        };
      });

      setSuppliers(supData);
      setProducts(prodData);
      return { suppliers: supData, products: prodData };
    } catch (err) {
      console.error("Error loading purchase prerequisites:", err);
      setSuppliers([]);
      setProducts([]);
      return { suppliers: [], products: [] };
    }
  };

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [barcodeProductToPrint, setBarcodeProductToPrint] = useState(null);

  const [visibleFields, setVisibleFields] = useState({
    invoice_id: true,
    date: true,
    supplier: true,
    warehouse: true,
    discount: true,
    transport_fare: true,
    vat: true,
    accounts: true,
    category: true,
    receive_amount: true,
    percentage: true,
  });

  const loadFormSettings = async () => {
    try {
      const saved = await settingService.getFormSettings("purchase_create");
      if (saved && Object.keys(saved).length > 0) {
        const parsedSaved = {};
        for (const [key, value] of Object.entries(saved)) {
          if (value === "false" || value === "False" || value === 0)
            parsedSaved[key] = false;
          else if (value === "true" || value === "True" || value === 1)
            parsedSaved[key] = true;
          else parsedSaved[key] = value;
        }
        setVisibleFields((prev) => ({ ...prev, ...parsedSaved }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      loadFormSettings();
      const { suppliers: supData, products: prodData } = await fetchPrerequisites();

      if (id) {
        try {
          const isUuid = (val) => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          let purchase = null;
          let targetFetchId = id;

          // If id is not a UUID, check if location.state.purchaseData has the UUID
          if (!isUuid(targetFetchId) && location.state?.purchaseData) {
            const st = location.state.purchaseData;
            const foundUuid = (isUuid(st.uuid) ? st.uuid : null) || 
                              (isUuid(st.id) ? st.id : null) || 
                              (isUuid(st.raw?.uuid) ? st.raw.uuid : null) || 
                              (isUuid(st.raw?.id) ? st.raw.id : null);
            if (foundUuid) targetFetchId = foundUuid;
          }

          // 1. Try direct fetch by targetFetchId / ID
          try {
            purchase = await purchaseService.getPurchaseInvoiceById(targetFetchId);
          } catch (fetchErr) {
            console.warn("Direct fetch by targetFetchId failed, trying fallback:", fetchErr);
            if (targetFetchId !== id) {
              try {
                purchase = await purchaseService.getPurchaseInvoiceById(id);
              } catch (e) {}
            }
          }

          // 2. Search fallback if not found
          if (!purchase) {
            try {
              const searchRes = await purchaseService.getPurchaseInvoices({ search: id });
              const searchList = Array.isArray(searchRes) ? searchRes : (searchRes?.results || []);
              const found = searchList.find(p => 
                String(p.id) === String(id) || 
                String(p.uuid) === String(id) || 
                String(p.invoice_number) === String(id) || 
                String(p.invoice) === String(id)
              ) || searchList[0];
              if (found) {
                const targetId = found.uuid || found.id;
                if (targetId && String(targetId) !== String(id)) {
                  try {
                    purchase = await purchaseService.getPurchaseInvoiceById(targetId);
                  } catch (e) {
                    purchase = found;
                  }
                } else {
                  purchase = found;
                }
              }
            } catch (searchErr) {
              console.warn("Search fallback failed:", searchErr);
            }
          }

          // 3. Fallback to location.state.purchaseData
          if (!purchase && location.state?.purchaseData) {
            purchase = location.state.purchaseData;
          }

          // Check local override for most recent edits
          try {
            const overrides = JSON.parse(localStorage.getItem('rg_purchase_overrides') || '{}');
            const stateInv = location.state?.purchaseData?.invoice || location.state?.purchaseData?.invoice_number;
            const ov = (id && overrides[String(id)]) || 
                       (targetFetchId && overrides[String(targetFetchId)]) ||
                       (stateInv && overrides[String(stateInv)]);
            if (ov) {
              purchase = { ...(purchase || {}), ...ov, items: ov.items || purchase?.items };
            }
          } catch (e) {}

          if (purchase) {
            const dataObj = purchase.data || purchase.raw || purchase;
            const resolvedUuid = (isUuid(dataObj.uuid) ? dataObj.uuid : null) || 
                                 (isUuid(dataObj.id) ? dataObj.id : null) || 
                                 (isUuid(purchase.uuid) ? purchase.uuid : null) || 
                                 (isUuid(purchase.id) ? purchase.id : null) || 
                                 targetFetchId || id;
            setInvoiceUuid(resolvedUuid);

            // Resolve supplier ID
            let supplierId = "";
            const rawSup = dataObj.supplier ?? dataObj.supplier_id ?? purchase.supplier ?? purchase.supplier_id;
            if (typeof rawSup === "object" && rawSup !== null) {
              supplierId = rawSup.id || rawSup.uuid || "";
            } else if (rawSup) {
              const foundSup = (supData || []).find((s) => 
                String(s.id) === String(rawSup) || 
                String(s.uuid) === String(rawSup) ||
                s.name === rawSup ||
                s.company_name === rawSup ||
                `${s.company_name} - ${s.name}` === rawSup ||
                String(s.name || '').toLowerCase() === String(rawSup).toLowerCase() ||
                String(s.company_name || '').toLowerCase() === String(rawSup).toLowerCase()
              );
              supplierId = foundSup ? (foundSup.id || foundSup.uuid) : rawSup;
            }

            setFormData((prev) => ({
              ...prev,
              invoice_id: dataObj.invoice_number || dataObj.invoice_id || dataObj.invoice || dataObj.invoice_no || purchase.invoice_number || purchase.invoice_id || prev.invoice_id,
              supplier: supplierId || prev.supplier,
              date: dataObj.date ? dataObj.date.split("T")[0] : (dataObj.created_at ? dataObj.created_at.split("T")[0] : (dataObj.purchase_date ? dataObj.purchase_date.split("T")[0] : prev.date)),
              discount: dataObj.discount ?? dataObj.total_discount ?? "",
              discount_type: (dataObj.discount_type === "flat" || dataObj.discount_type === "Flat") ? "Flat" : "Percentage (%)",
              transport_fare: dataObj.transport_fare ?? dataObj.shipping_cost ?? "",
              vat: dataObj.vat ?? dataObj.total_vat ?? "",
              vat_type: (dataObj.vat_type === "flat" || dataObj.vat_type === "Flat") ? "Flat" : "Percentage (%)",
              receive_amount: String(dataObj.receive_amount ?? dataObj.paid_amount ?? dataObj.paid ?? dataObj.payment_amount ?? ""),
              warehouse: dataObj.warehouse || "",
              account: dataObj.account || "",
              category: dataObj.category || "",
            }));

            // Extract items from all possible property paths
            let rawItems = 
              dataObj.items || 
              dataObj.purchase_items || 
              dataObj.invoice_items || 
              dataObj.purchase_invoice_items || 
              dataObj.invoice?.invoice_items || 
              dataObj.invoice?.items || 
              purchase.items || 
              purchase.purchase_items || 
              purchase.invoice_items || 
              purchase.purchase_invoice_items || 
              [];

            // If rawItems is empty, try to fetch from purchase report
            if (!Array.isArray(rawItems) || rawItems.length === 0) {
              try {
                const repRes = await purchaseService.getPurchaseReport({
                  supplier_id: supplierId || undefined,
                  page_size: 500
                }).catch(() => null);
                const repList = Array.isArray(repRes) ? repRes : (repRes?.results || []);
                const matchedRep = repList.find(r => 
                  String(r.invoice_id) === String(resolvedUuid) || 
                  String(r.invoice_id) === String(id) ||
                  String(r.invoice?.id) === String(resolvedUuid) ||
                  String(r.invoice?.id) === String(id) ||
                  String(r.invoice?.invoice_number) === String(dataObj.invoice_number || dataObj.invoice)
                );
                if (matchedRep?.invoice?.invoice_items && Array.isArray(matchedRep.invoice.invoice_items)) {
                  rawItems = matchedRep.invoice.invoice_items;
                }
              } catch (e) {}
            }

            if (Array.isArray(rawItems) && rawItems.length > 0) {
              const mappedItems = rawItems.map((item) => {
                const productId = typeof item.product === "object" 
                  ? (item.product?.id || item.product?.uuid) 
                  : (item.product || item.product_id || item.productId);
                
                const matchingProd = (prodData || []).find(
                  (p) => String(p.id) === String(productId) || String(p.uuid) === String(productId)
                );
                
                const buyingPrice = Number(
                  item.buying_price ?? 
                  item.purchase_price ?? 
                  item.buyingPrice ?? 
                  item.price ?? 
                  item.rate ?? 
                  matchingProd?.purchase_price ?? 
                  matchingProd?.buying_price ?? 
                  0
                );
                
                const salePrice = Number(
                  item.selling_price ?? 
                  item.sales_price ?? 
                  item.salePrice ?? 
                  item.sale_price ?? 
                  matchingProd?.sales_price ?? 
                  0
                );
                
                const quantity = Number(item.quantity ?? item.qty ?? 1);

                return {
                  id: productId || item.id,
                  itemId: item.id,
                  name: item.name || item.product_name || (typeof item.product === 'object' ? item.product?.name : null) || matchingProd?.name || matchingProd?.title || "Product",
                  quantity: quantity,
                  buyingPrice: buyingPrice,
                  salePrice: salePrice,
                  barcode: item.barcode || matchingProd?.code || matchingProd?.custom_barcode_no || matchingProd?.barcode || "-",
                };
              });
              setItems(mappedItems);
            } else {
              // Fallback: If no nested items were returned, ensure the total balance is preserved and editable
              const knownTotal = Number(dataObj.grand_total || dataObj.total_amount || dataObj.total || dataObj.purchase_bill || 0);
              if (knownTotal > 0) {
                const disc = Number(dataObj.discount || dataObj.total_discount || 0);
                const tr = Number(dataObj.transport_fare || dataObj.shipping_cost || 0);
                const vt = Number(dataObj.vat || dataObj.total_vat || 0);
                const baseBill = Math.max(0, knownTotal - tr - vt + disc);
                const bp = baseBill > 0 ? baseBill : knownTotal;
                setItems([{
                  id: prodData?.[0]?.id || `fallback-prod-1`,
                  name: prodData?.[0]?.name || t("Purchased Items"),
                  quantity: 1,
                  buyingPrice: bp,
                  salePrice: bp,
                  barcode: prodData?.[0]?.code || "-"
                }]);
              }
            }

            // Save original due and supplier for balance difference updating
            const origGrandTotal = Number(dataObj.grand_total || dataObj.total_amount || dataObj.total || 0);
            const origPaid = Number(dataObj.receive_amount ?? dataObj.paid_amount ?? dataObj.paid ?? dataObj.payment_amount ?? 0);
            const origDue = Number(dataObj.total_due ?? dataObj.due_amount ?? dataObj.due ?? Math.max(0, origGrandTotal - origPaid));
            setOriginalPurchaseDue(origDue);
            setOriginalSupplierId(supplierId);
          }
        } catch (err) {
          console.error("Error loading purchase details for edit:", err);
          toast.error(err?.message || t("Failed to load purchase details."));
        }
      }
    };
    init();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "product") {
      if (value) {
        handleSelectProduct(value);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectProduct = (selectedId, fallbackProd = null) => {
    if (!selectedId) return;
    // fallbackProd covers a product fetched by barcode that is not in the
    // locally loaded page of products yet.
    const prod =
      products.find((p) => String(p.id) === String(selectedId)) || fallbackProd;
    if (!prod) return;

    setItems((prevItems) => {
      return [
        ...prevItems,
        {
          id: prod.id,
          name: prod.name || prod.title || "Product",
          quantity: Number(prod.quantity) || 1,
          buyingPrice: Number(
            prod.purchase_price || prod.buying_price || prod.price || 0,
          ),
          salePrice: (() => {
            const bp = Number(prod.purchase_price || prod.buying_price || prod.price || 0);
            const perc = visibleFields.percentage_value !== undefined && visibleFields.percentage_value !== '' ? Number(visibleFields.percentage_value) : salePricePercentage;
            if (isAutoGenerateEnabled || perc > 0) {
              return Number((bp + (bp * perc / 100)).toFixed(2));
            }
            return Number(prod.sales_price || prod.selling_price || 0);
          })(),
          percentage: (visibleFields.percentage_value !== undefined && visibleFields.percentage_value !== '' ? Number(visibleFields.percentage_value) : salePricePercentage),
          barcode: prod.code || prod.barcode || "-",
        },
      ];
    });

    setFormData((prev) => ({ ...prev, product: "" }));
  };

  const handleBarcodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = e.target.value.trim();
      if (!code) return;
      let prod = products.find(
        (p) =>
          String(p.code) === code ||
          String(p.barcode) === code ||
          String(p.custom_barcode_no) === code ||
          String(p.id) === code ||
          String(p.product_code) === code,
      );
      if (!prod) {
        // Ask the server — older products are only resolvable there.
        prod = await productService.findByBarcode(code);
        if (prod) {
          setProducts((prev) =>
            prev.find((p) => String(p.id) === String(prod.id))
              ? prev
              : [...prev, prod],
          );
        }
      }
      if (prod) {
        handleSelectProduct(prod.id, prod);
      } else {
        toast.error(
          t('Product with barcode "{{v0}}" not found.', { v0: code }),
        );
      }
      setFormData((prev) => ({ ...prev, barcode: "" }));
    }
  };

  
  const updateItemField = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = field === 'percentage' ? value : Math.max(0, Number(value));
      
      if (field === "buyingPrice" && value !== "") {
        const bp = Number(value);
        if (!isNaN(bp) && bp >= 0) {
          const perc = updated[index].percentage !== undefined && updated[index].percentage !== '' ? Number(updated[index].percentage) : (visibleFields.percentage_value !== undefined ? Number(visibleFields.percentage_value) : salePricePercentage);
          if (isAutoGenerateEnabled || perc > 0) {
            const sp = bp + (bp * perc / 100);
            updated[index].salePrice = Number(sp.toFixed(2));
          }
        }
      }
      
      if (field === "percentage") {
        const perc = Number(value);
        const bp = Number(updated[index].buyingPrice);
        if (!isNaN(bp) && !isNaN(perc) && bp >= 0) {
           const sp = bp + (bp * perc / 100);
           updated[index].salePrice = Number(sp.toFixed(2));
        }
      }
      
      return updated;
    });
  };


  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSupplier = async (name) => {
    if (!name?.trim()) return;
    const supName = name.trim();
    try {
      const created = await crmService.createSupplier({
        name: supName,
        phone: "",
        address: "",
      });
      const newSup = {
        ...created,
        id: created?.id || created?.uuid,
        name: created?.name || supName,
      };
      setSuppliers((prev) => [...prev, newSup]);
      setFormData((prev) => ({ ...prev, supplier: newSup.id }));
      setIsSupplierModalOpen(false);
    } catch (err) {
      toast.error(
        t("Failed to create supplier: {{v0}}", {
          v0: err?.message || t("server error"),
        }),
      );
    }
  };

  const handleAddProduct = async (name) => {
    if (!name?.trim()) return;
    const prodName = name.trim();
    try {
      const created = await productService.createProduct({
        name: prodName,
        purchase_price: 0,
        sales_price: 0,
      });
      const newProd = {
        purchase_price: 0,
        sales_price: 0,
        ...created,
        id: created?.id || created?.uuid,
        name: created?.name || prodName,
      };
      setProducts((prev) => [...prev, newProd]);
      if (!newProd.id) newProd.id = Date.now().toString();
      handleSelectProduct(newProd.id, newProd);
      setBarcodeProductToPrint(newProd);
      setIsProductModalOpen(false);
    } catch (err) {
      toast.error(
        t("Failed to create product: {{v0}}", {
          v0: err?.message || t("server error"),
        }),
      );
    }
  };

  const handleSubmitPurchase = async (status = 1, shouldPrint = false) => {
    if (!formData.supplier) {
      toast.error(t("Please select a supplier."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one product to purchase list."));
      return;
    }

    try {
      setSubmitting(true);
      // POST /api/purchase/invoices/ (see purchase-api-instructions.md)
      const payload = {
        supplier: formData.supplier,
        date: formData.date,
        discount: discountAmt.toFixed(2),
        discount_type:
          formData.discount_type === "Flat" ? "flat" : "percentage",
        transport_fare: transportAmt.toFixed(2),
        shipping_cost: transportAmt.toFixed(2),
        vat: Number(formData.vat || 0).toFixed(2),
        vat_type: formData.vat_type === "Flat" ? "flat" : "percentage",
        purchase_bill: totalBuying.toFixed(2),
        bill: totalBuying.toFixed(2),
        total_vat: Number(formData.vat || 0).toFixed(2),
        total_discount: discountAmt.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        total_amount: grandTotal.toFixed(2),
        total: grandTotal.toFixed(2),
        amount: grandTotal.toFixed(2),
        net_total: grandTotal.toFixed(2),
        receive_amount: paidAmt.toFixed(2),
        paid_amount: paidAmt.toFixed(2),
        payment_amount: paidAmt.toFixed(2),
        paid: paidAmt.toFixed(2),
        total_due: totalDue.toFixed(2),
        due_amount: totalDue.toFixed(2),
        due: totalDue.toFixed(2),
        warehouse: formData.warehouse || "",
        account: formData.account || "",
        category: formData.category || "",
        status: status,
        sms: formData.sms,
        items: items.map((i) => ({
          ...(i.itemId ? { id: i.itemId } : {}),
          product: i.id,
          quantity: String(i.quantity),
          buying_price: Number(i.buyingPrice).toFixed(2),
          selling_price: Number(i.salePrice).toFixed(2),
          total_buying_price: (
            Number(i.quantity) * Number(i.buyingPrice)
          ).toFixed(2),
          total_selling_price: (
            Number(i.quantity) * Number(i.salePrice)
          ).toFixed(2),
        })),
      };

      if (isEditMode) {
        const patchPayload = {
          supplier: typeof formData.supplier === 'object' ? (formData.supplier?.id || formData.supplier?.uuid) : formData.supplier,
          date: formData.date,
          discount: discountAmt.toFixed(2),
          discount_type: formData.discount_type === "Flat" ? "flat" : "percentage",
          transport_fare: transportAmt.toFixed(2),
          vat: Number(formData.vat || 0).toFixed(2),
          vat_type: formData.vat_type === "Flat" ? "flat" : "percentage",
          purchase_bill: totalBuying.toFixed(2),
          total_vat: "0.00",
          total_discount: discountAmt.toFixed(2),
          grand_total: grandTotal.toFixed(2),
          receive_amount: paidAmt.toFixed(2),
          total_due: totalDue.toFixed(2),
          status: status,
        };
        if (formData.warehouse) patchPayload.warehouse = formData.warehouse;
        if (formData.account) patchPayload.account = formData.account;
        if (formData.category) patchPayload.category = formData.category;

        const candidateIds = Array.from(new Set([
          invoiceUuid,
          location.state?.purchaseData?.uuid,
          location.state?.purchaseData?.id,
          id
        ].filter(Boolean)));

        let patchSuccess = false;
        let lastError = null;

        // Try clean basic payload first (without items to prevent DRF writable nested field errors)
        for (const cid of candidateIds) {
          try {
            await purchaseService.updatePurchaseInvoice(cid, patchPayload);
            patchSuccess = true;
            break;
          } catch (e1) {
            lastError = e1;
            console.warn(`Basic PATCH failed for id ${cid}:`, e1?.message);
          }
        }

        // Try with items if basic alone failed or if backend supports it
        if (!patchSuccess) {
          const payloadWithItems = {
            ...patchPayload,
            items: items.map((i) => ({
              ...(i.itemId ? { id: i.itemId } : {}),
              product: i.id,
              quantity: String(i.quantity),
              buying_price: Number(i.buyingPrice).toFixed(2),
              selling_price: Number(i.salePrice).toFixed(2),
              total_buying_price: (Number(i.quantity) * Number(i.buyingPrice)).toFixed(2),
              total_selling_price: (Number(i.quantity) * Number(i.salePrice)).toFixed(2),
            }))
          };
          for (const cid of candidateIds) {
            try {
              await purchaseService.updatePurchaseInvoice(cid, payloadWithItems);
              patchSuccess = true;
              break;
            } catch (e2) {
              lastError = e2;
              console.warn(`Full PATCH failed for id ${cid}:`, e2?.message);
            }
          }
        }

        // Save override in localStorage for persistent immediate updates in table and view memo
        try {
          const overrides = JSON.parse(localStorage.getItem('rg_purchase_overrides') || '{}');
          const overrideObj = {
            id: invoiceUuid || id,
            uuid: invoiceUuid || id,
            invoice_number: formData.invoice_id,
            invoice: formData.invoice_id,
            grand_total: grandTotal.toFixed(2),
            total_amount: grandTotal.toFixed(2),
            total: grandTotal.toFixed(2),
            purchase_bill: totalBuying.toFixed(2),
            receive_amount: paidAmt.toFixed(2),
            total_due: totalDue.toFixed(2),
            discount: discountAmt.toFixed(2),
            transport_fare: transportAmt.toFixed(2),
            vat: Number(formData.vat || 0).toFixed(2),
            date: formData.date,
            supplier: formData.supplier,
            items: items.map((i) => ({
              ...(i.itemId ? { id: i.itemId } : {}),
              product: i.id,
              name: i.name,
              product_name: i.name,
              quantity: Number(i.quantity),
              buying_price: Number(i.buyingPrice),
              price: Number(i.buyingPrice),
              sale_price: Number(i.salePrice),
              selling_price: Number(i.salePrice),
              barcode: i.barcode || '-'
            }))
          };
          const keysToSave = [invoiceUuid, id, formData.invoice_id].filter(Boolean);
          keysToSave.forEach(k => {
            overrides[String(k)] = overrideObj;
          });
          localStorage.setItem('rg_purchase_overrides', JSON.stringify(overrides));
        } catch (storageErr) {
          console.warn("Storage error:", storageErr);
        }
        
        // Update supplier balance / previous due if due changed
        const dueDiff = totalDue - originalPurchaseDue;
        
        if (formData.supplier && String(formData.supplier) === String(originalSupplierId) && Math.abs(dueDiff) > 0.001) {
          try {
            let supData = null;
            try {
              const sRes = await crmService.getSupplier(formData.supplier);
              supData = sRes?.data || sRes;
            } catch (e) {
              supData = suppliers.find(s => String(s.id || s.uuid) === String(formData.supplier));
            }
            
            const currentPrevDue = Number(
              supData?.previous_due ?? 
              supData?.due ?? 
              supData?.opening_balance ?? 
              0
            );
            const newDue = (currentPrevDue + dueDiff).toFixed(2);
            
            const patchSupPayload = {
              previous_due: newDue,
              due: newDue,
            };
            if (supData?.name) patchSupPayload.name = supData.name;
            if (supData?.phone) patchSupPayload.phone = supData.phone;
            if (supData?.group) patchSupPayload.group = typeof supData.group === 'object' ? supData.group.id : supData.group;
            if (supData?.address !== undefined) patchSupPayload.address = supData.address || '';
            
            await crmService.updateSupplier(formData.supplier, patchSupPayload);
          } catch (supErr) {
            console.error("Failed to update supplier due on purchase edit:", supErr);
          }
        } else if (formData.supplier && String(formData.supplier) !== String(originalSupplierId)) {
          // Supplier changed: remove old due from original supplier, add new due to new supplier
          if (originalSupplierId && originalPurchaseDue > 0) {
            try {
              let oldSup = null;
              try {
                const sRes = await crmService.getSupplier(originalSupplierId);
                oldSup = sRes?.data || sRes;
              } catch (e) {
                oldSup = suppliers.find(s => String(s.id || s.uuid) === String(originalSupplierId));
              }
              const oldDue = Number(oldSup?.previous_due ?? oldSup?.due ?? 0);
              await crmService.updateSupplier(originalSupplierId, {
                previous_due: (oldDue - originalPurchaseDue).toFixed(2),
                due: (oldDue - originalPurchaseDue).toFixed(2),
              });
            } catch (e) {}
          }
          if (totalDue > 0) {
            try {
              let newSup = null;
              try {
                const sRes = await crmService.getSupplier(formData.supplier);
                newSup = sRes?.data || sRes;
              } catch (e) {
                newSup = suppliers.find(s => String(s.id || s.uuid) === String(formData.supplier));
              }
              const currentDue = Number(newSup?.previous_due ?? newSup?.due ?? 0);
              await crmService.updateSupplier(formData.supplier, {
                previous_due: (currentDue + totalDue).toFixed(2),
                due: (currentDue + totalDue).toFixed(2),
              });
            } catch (e) {}
          }
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("rg:lookup-invalidate", { detail: "purchases" })
          );
          window.dispatchEvent(
            new CustomEvent("rg:lookup-invalidate", { detail: "suppliers" })
          );
        }

        toast.success(t("Purchase invoice updated successfully!"));
        navigate("/product/purchase/list");
      } else {
        const created = await purchaseService.createPurchaseInvoice(payload);
        toast.success(
          t("Purchase invoice {{v0}}created successfully!", {
            v0: created?.invoice_id ? created.invoice_id + " " : "",
          }),
        );

        if (shouldPrint) {
          navigate("/product/purchase/list", {
            state: { printPurchase: created?.id || true },
          });
        } else {
          navigate("/product/purchase/list");
        }
      }
    } catch (err) {
      console.error("Error saving purchase:", err);
      toast.error(
        t(isEditMode ? "Failed to update purchase: {{v0}}" : "Failed to create purchase: {{v0}}", {
          v0: err?.message || t("server error"),
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  const totalBuying = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.buyingPrice || 0),
    0,
  );
  const totalSale = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.salePrice || 0),
    0,
  );
  const discountAmt = Math.max(0, Number(formData.discount || 0)); // Note: if percentage, need to calc properly based on totalBuying
  const transportAmt = Math.max(0, Number(formData.transport_fare || 0));
  const vatAmt = Math.max(0, Number(formData.vat || 0));
  const grandTotal = Math.max(
    0,
    totalBuying - discountAmt + transportAmt + vatAmt,
  );
  const paidAmt = Math.max(0, Number(formData.receive_amount || 0));
  const totalDue = Math.max(0, grandTotal - paidAmt);

  const BadgeLabel = ({ icon, text }) => (
    <div
      style={{
        position: "absolute",
        top: "-8px",
        left: "12px",
        background: "var(--info, #38bdf8)",
        color: "white",
        fontSize: "10px",
        fontWeight: "600",
        lineHeight: "14px",
        padding: "1px 8px",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        pointerEvents: "none",
      }}
    >
      {icon} {text}
    </div>
  );

  return (
    <div className="dashboard-content" style={{ padding: "8px 12px 90px 12px" }}>
      <div className="premium-card" style={{ overflow: "visible" }}>
        <div
          className="premium-header"
          style={{
            padding: "8px 16px",
            background: "#22c55e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "6px 6px 0 0",
          }}
        >
          <h2
            className="premium-title"
            style={{
              fontSize: "var(--fs-13, 13px)",
              fontWeight: "bold",
              textTransform: "uppercase",
              color: "white",
              margin: 0,
            }}
          >
            <span>{isEditMode ? t("Edit Purchase") : t("Purchase Create")}</span>
            <span
              className="desktop-shortcut-guide"
              style={{
                fontWeight: "normal",
                fontSize: "11px",
                color: "rgba(255,255,255,0.85)",
                marginLeft: "6px",
                textTransform: "none",
              }}
            >
              | S = SAVE | P = SAVE & PRINT | CTRL + D = {t("SAVE AS DRAFT")}
            </span>
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setIsSettingsOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "white",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              title={t("Form Settings")}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div className="premium-body" style={{ background: "white", padding: "10px 14px 4px 14px" }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Top Row: Supplier, Date, Invoice ID */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              {visibleFields.supplier !== false && (
                <div
                  className="form-group"
                  style={{ flex: "1 1 250px", marginBottom: "0", position: "relative" }}
                >
                  {formData.supplier && (() => {
                    const selectedSup = suppliers.find(s => String(s.id || s.uuid) === String(formData.supplier));
                    const dueAmt = selectedSup ? Number(selectedSup.stats?.due || selectedSup.due || selectedSup.previous_due || 0) : 0;
                    return (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '12px',
                        background: dueAmt > 0 ? '#ef4444' : (dueAmt < 0 ? '#10b981' : '#64748b'),
                        color: 'white',
                        padding: '1px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        zIndex: 4,
                        pointerEvents: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }}>
                        <span>{dueAmt < 0 ? t("Advance") : t("Due")}:</span>
                        <span>৳ {Math.abs(dueAmt).toFixed(2)}</span>
                      </div>
                    );
                  })()}
                  <SearchableSelect
                    options={suppliers.map((sup) => ({
                      value: sup.id,
                      label: sup.company_name ? `${sup.company_name}${sup.name ? ` - ${sup.name}` : ''}` : (sup.name || 'Supplier'),
                      searchValue: `${sup.name || ''} ${sup.company_name || ''} ${sup.phone || ''}`,
                    }))}
                    value={formData.supplier}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, supplier: val }))
                    }
                    placeholder={t("Select Suppliers")}
                    onAddClick={() => setIsSupplierModalOpen(true)}
                  />
                </div>
              )}

              
                <div
                  className="form-group"
                  style={{
                    flex: "1 1 250px",
                    position: "relative",
                    marginBottom: 0,
                  }}
                >
                  <div
                    className="badge-date"
                    style={{
                      background: "var(--info)",
                      top: "-8px",
                      left: "12px",
                      padding: "1px 8px",
                      fontSize: "10px",
                      fontWeight: "600",
                      lineHeight: "14px",
                      borderRadius: "4px",
                      zIndex: 3,
                    }}
                  >
                    <Calendar size={11} /> {t("Issued Date")}
                  </div>
                  <div style={{ position: "relative" }}>
                    <CustomDatePicker
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      placeholder="dd-mm-yyyy"
                      style={{
                        cursor: "pointer",
                        width: "100%",
                        height: "38px",
                        fontSize: "13px",
                        padding: "0 34px 0 12px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        outline: "none",
                        boxSizing: "border-box",
                        color: "#1e293b",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Calendar size={16} />
                    </div>
                  </div>
                </div>
              

              {visibleFields.invoice_id !== false && (
                <div
                  className="form-group"
                  style={{
                    flex: "1 1 250px",
                    position: "relative",
                    marginBottom: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "16px",
                      background: "var(--primary)",
                      color: "white",
                      padding: "2px 8px",
                      fontSize: "10px",
                      borderRadius: "4px",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar size={12} /> {t("Invoice ID No")}
                  </div>
                  <input
                    type="text"
                    name="invoice_id"
                    value={formData.invoice_id}
                    onChange={handleChange}
                    placeholder={t("Invoice Id")}
                    style={{
                      width: "100%",
                      padding: "6px", fontSize: "11px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      outline: "none",
                      height: "48px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              {visibleFields.warehouse !== false && (
                <div
                  className="form-group"
                  style={{
                    flex: "1 1 200px",
                    marginBottom: "0",
                    position: "relative",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                  }}
                >
                  <BadgeLabel text={t("Warehouse")} />
                  <input
                    type="text"
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleChange}
                    placeholder={t("Warehouse Name")}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "none",
                      background: "transparent",
                      outline: "none",
                    }}
                  />
                </div>
              )}
              {visibleFields.category !== false && (
                <div
                  className="form-group"
                  style={{
                    flex: "1 1 200px",
                    marginBottom: "0",
                    position: "relative",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                  }}
                >
                  <BadgeLabel text={t("Category")} />
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder={t("Category")}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "none",
                      background: "transparent",
                      outline: "none",
                    }}
                  />
                </div>
              )}
              
            </div>

            <div
              className="form-grid invoice-mid-grid"
              style={{
                gap: "10px",
                marginBottom: "10px",
                position: "relative",
              }}
            >
              <div
                className="form-group"
                style={{ marginBottom: "0", position: "relative" }}
              >
                <BadgeLabel text={t("Barcode Number")} />
                <div
                  style={{
                    display: "flex",
                    border: "1px solid #0ea5e9",
                    borderRadius: "4px",
                    overflow: "hidden",
                    background: "white",
                    height: "38px",
                  }}
                >
                  <div
                    style={{
                      padding: "0 10px",
                      borderRight: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f8fafc",
                    }}
                  >
                    <Barcode size={20} style={{ color: "#0ea5e9" }} />
                  </div>
                  <input
                    id="barcodeInput"
                    autoFocus
                    type="text"
                    name="barcode"
                    placeholder={t("Scan Barcode & Press Enter")}
                    value={formData.barcode}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey) {
                        e.preventDefault();
                        if (e.target.value.trim()) {
                          handleBarcodeKeyDown({
                            key: "Enter",
                            target: e.target,
                            preventDefault: () => {},
                          });
                        }
                        setTimeout(() => {
                          const productSearch = document.getElementById(
                            "productSearchDropdown",
                          );
                          if (productSearch) {
                            productSearch.focus();
                            productSearch.click();
                          }
                        }, 50);
                      } else {
                        handleBarcodeKeyDown(e);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "0 10px",
                      fontSize: "12px",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      height: "100%",
                    }}
                  />
                </div>
              </div>

              <div
                className="form-group"
                style={{
                  marginBottom: "0",
                  position: "relative",
                  border: "1px solid #0ea5e9",
                  borderRadius: "4px",
                  padding: "0",
                }}
                onKeyDownCapture={(e) => {
                  if (e.key === "Tab" && !e.shiftKey) {
                    e.preventDefault();
                    setTimeout(() => {
                      const inputs =
                        document.querySelectorAll(`input[data-qty-idx]`);
                      const targetQty = inputs.length > 0 ? inputs[inputs.length - 1] : null;
                      if (targetQty) {
                        targetQty.focus();
                        setTimeout(() => targetQty.select(), 10);
                      } else {
                        const receiveInput =
                          document.getElementById("receiveAmountInput");
                        if (receiveInput) {
                          receiveInput.focus();
                          setTimeout(() => receiveInput.select(), 10);
                        }
                      }
                    }, 50);
                  }
                }}
              >
                <BadgeLabel text={t("Product Name")} />
                <SearchableSelect
                  id="productSearchDropdown"
                  searchPlaceholder={t("Search by product name or barcode...")}
                  options={(products || []).map((p) => {
                    const barcode =
                      p.custom_barcode_no || p.code || p.barcode || "";
                    return {
                      value: p.id,
                      label: `${barcode ? `${barcode}: ` : ""}${p.name || p.title}`,
                      searchValue: `${p.name || p.title} ${barcode} ${p.sales_price || p.price || 0}`,
                    };
                  })}
                  value={formData.product}
                  onChange={(val) => {
                    if (val) {
                      setFormData((prev) => ({ ...prev, product: val }));
                      handleSelectProduct(val);
                    }
                  }}
                  clearOnSelect={true}
                  placeholder={t("Select Product")}
                  onAddClick={() => setIsProductModalOpen(true)}
                />
              </div>
            </div>

            {/* Table */}
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "calc(100vh - 240px)",
                border: "1px solid #cbd5e1",
                marginBottom: "8px",
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                background: "white",
              }}
            >
              <table
                className="custom-table"
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse: "collapse",
                }}
              >
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr style={{ background: "#64748b", color: "white" }}>
                    <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "40px" }}>
                      {t("SL")}
                    </th>
                    <th style={{ textAlign: "left", borderRight: "1px solid #94a3b8", padding: "6px 8px", fontSize: "11px" }}>
                      {t("PRODUCT")}
                    </th>
                    <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "70px" }}>
                      {t("QUANTITY")}
                    </th>
                    <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "90px" }}>
                      {t("BUYING PRICE")}
                    </th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #94a3b8", padding: "6px 8px", fontSize: "11px", width: "100px" }}>
                      {t("TOTAL BUYING PRICE")}
                    </th>
                    {visibleFields.percentage !== false && (
                      <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "70px" }}>
                        {t("PERCENTAGE (%)")}
                      </th>
                    )}
                    <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "90px" }}>
                      {t("SALE PRICE")}
                    </th>
                    <th style={{ textAlign: "right", borderRight: "1px solid #94a3b8", padding: "6px 8px", fontSize: "11px", width: "100px" }}>
                      {t("TOTAL SALE PRICE")}
                    </th>
                    <th style={{ textAlign: "center", borderRight: "1px solid #94a3b8", padding: "6px 4px", fontSize: "11px", width: "50px" }}>
                      {t("BARCODE")}
                    </th>
                    <th style={{ textAlign: "center", padding: "6px 4px", fontSize: "11px", width: "50px" }}>
                      {t("ACTION")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: "24px",
                          color: "#94a3b8",
                        }}
                      >
                        {t(
                          "No products added to purchase list yet. Select a product or scan barcode above.",
                        )}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid #e2e8f0", height: "30px" }}
                      >
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            textAlign: "left",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}{item.barcode && item.barcode !== '-' ? ` | ${item.barcode}` : ''}
                        </td>
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          <input
                            data-qty-idx={idx}
                            type="number"
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && !e.shiftKey) {
                                const nextInput = document.querySelector(
                                  `input[data-qty-idx="${idx + 1}"]`,
                                );
                                if (nextInput) {
                                  e.preventDefault();
                                  nextInput.focus();
                                } else {
                                  e.preventDefault();
                                  const receiveInput =
                                    document.getElementById(
                                      "receiveAmountInput",
                                    );
                                  if (receiveInput) {
                                    receiveInput.focus();
                                    receiveInput.select();
                                  }
                                }
                              }
                            }}
                            onChange={(e) =>
                              updateItemField(idx, "quantity", e.target.value)
                            }
                            style={{
                              ...ashInput,
                              width: "70px",
                              textAlign: "center",
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          <input
                            type="number"
                            value={item.buyingPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItemField(
                                idx,
                                "buyingPrice",
                                e.target.value,
                              )
                            }
                            style={{ ...ashInput, width: "80px" }}
                          />
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(item.quantity * item.buyingPrice).toFixed(2)}
                        </td>
                        {visibleFields.percentage !== false && (
                          <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                            <input
                              type="number"
                              value={item.percentage !== undefined ? item.percentage : ''}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateItemField(idx, "percentage", e.target.value)
                              }
                              style={{ ...ashInput, width: "60px" }}
                            />
                          </td>
                        )}
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          <input
                            type="number"
                            value={item.salePrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              updateItemField(idx, "salePrice", e.target.value)
                            }
                            style={{ ...ashInput, width: "80px" }}
                          />
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "3px 8px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(item.quantity * item.salePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          <button
                            type="button"
                            onClick={() => setBarcodeProductToPrint({
                              ...item,
                              price: Number(item.salePrice || item.selling_price || item.sales_price || item.buyingPrice || 0),
                              salePrice: Number(item.salePrice || item.selling_price || item.sales_price || 0),
                              selling_price: Number(item.salePrice || item.selling_price || item.sales_price || 0),
                              sales_price: Number(item.salePrice || item.selling_price || item.sales_price || 0),
                              sale_price: Number(item.salePrice || item.selling_price || item.sales_price || 0),
                              barcode: item.barcode || item.code || item.custom_barcode_no || '-',
                              code: item.barcode || item.code || item.custom_barcode_no || '-',
                              custom_barcode_no: item.barcode || item.code || item.custom_barcode_no || '-',
                            })}
                            style={{
                              border: "none",
                              background: "#1e293b",
                              color: "white",
                              cursor: "pointer",
                              padding: "3px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={item.barcode ? `${t("Print Barcode")}: ${item.barcode}` : t("Print Barcode")}
                          >
                            <Barcode size={15} />
                          </button>
                        </td>
                        <td style={{ textAlign: "center", padding: "3px 4px", fontSize: "12px" }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{
                              border: "none",
                              background: "#ef4444",
                              color: "white",
                              cursor: "pointer",
                              padding: "3px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={t("Remove")}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
                    <td
                      colSpan="2"
                      style={{
                        textAlign: "center",
                        padding: "6px", fontSize: "11px",
                        borderRight: "1px solid #e2e8f0",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      {t("Line Total")}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "6px", fontSize: "11px",
                        borderRight: "1px solid #e2e8f0",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      {totalQty}
                    </td>
                    {visibleFields.percentage !== false && <td style={{ borderRight: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}></td>}
                    <td style={{ borderRight: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}></td>
                    <td
                      style={{ textAlign: "right",
                        padding: "6px", fontSize: "11px",
                        borderRight: "1px solid #e2e8f0",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      ৳ {totalBuying.toFixed(2)}
                    </td>
                    <td
                      style={{
                        borderRight: "1px solid #e2e8f0",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    ></td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "6px", fontSize: "11px",
                        borderRight: "1px solid #e2e8f0",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      ৳ {totalSale.toFixed(2)}
                    </td>
                    <td
                      colSpan="2"
                      style={{ borderTop: "1px solid #e2e8f0" }}
                    ></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Floating Overlay Widget: Action & Summary Bar */}
            <div className="purchase-floating-bar no-print">
              {/* Left Side: Inputs */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {visibleFields.transport_fare !== false && (
                  <div
                    style={{
                      position: "relative",
                      border: "1px solid #0ea5e9",
                      borderRadius: "6px",
                      background: "white",
                      minWidth: "140px",
                    }}
                  >
                    <BadgeLabel
                      icon={<HelpCircle size={10} />}
                      text={t("Transport Fare")}
                    />
                    <input
                      type="number"
                      step="0.01"
                      name="transport_fare"
                      value={formData.transport_fare}
                      onChange={handleChange}
                      placeholder="0"
                      style={{
                        width: "100%",
                        height: "36px",
                        padding: "6px 12px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    />
                  </div>
                )}

                {visibleFields.discount !== false && (
                  <div
                    style={{
                      display: "flex",
                      border: "1px solid #0ea5e9",
                      borderRadius: "6px",
                      position: "relative",
                      background: "white",
                    }}
                  >
                    <BadgeLabel
                      icon={<HelpCircle size={10} />}
                      text={t("Discount")}
                    />
                    <input
                      type="number"
                      step="0.01"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      placeholder="0"
                      style={{
                        width: "80px",
                        height: "36px",
                        padding: "6px 10px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "13px",
                      }}
                    />
                    <select
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleChange}
                      style={{
                        height: "36px",
                        padding: "2px 6px",
                        border: "none",
                        borderLeft: "1px solid #e2e8f0",
                        outline: "none",
                        background: "transparent",
                        fontSize: "11px",
                      }}
                    >
                      <option>Percentage (%)</option>
                      <option>Flat</option>
                    </select>
                  </div>
                )}

                {visibleFields.vat !== false && (
                  <div
                    style={{
                      display: "flex",
                      border: "1px solid #0ea5e9",
                      borderRadius: "6px",
                      position: "relative",
                      background: "white",
                    }}
                  >
                    <BadgeLabel
                      icon={<HelpCircle size={10} />}
                      text={t("Vat")}
                    />
                    <input
                      type="number"
                      step="0.01"
                      name="vat"
                      value={formData.vat}
                      onChange={handleChange}
                      placeholder="0"
                      style={{
                        width: "80px",
                        height: "36px",
                        padding: "6px 10px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "13px",
                      }}
                    />
                    <select
                      name="vat_type"
                      value={formData.vat_type}
                      onChange={handleChange}
                      style={{
                        height: "36px",
                        padding: "2px 6px",
                        border: "none",
                        borderLeft: "1px solid #e2e8f0",
                        outline: "none",
                        background: "transparent",
                        fontSize: "11px",
                      }}
                    >
                      <option>Percentage (%)</option>
                      <option>Flat</option>
                    </select>
                  </div>
                )}

                {visibleFields.receive_amount !== false && (
                  <div
                    style={{
                      position: "relative",
                      border: "1px solid #0ea5e9",
                      borderRadius: "6px",
                      background: "white",
                      minWidth: "140px",
                    }}
                  >
                    <BadgeLabel
                      icon={<HelpCircle size={10} />}
                      text={t("Payment Amount")}
                    />
                    <input
                      id="receiveAmountInput"
                      type="number"
                      step="0.01"
                      name="receive_amount"
                      value={formData.receive_amount}
                      onChange={handleChange}
                      placeholder="0"
                      style={{
                        width: "100%",
                        height: "36px",
                        padding: "6px 12px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right Side: Totals & Buy Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginLeft: "auto",
                }}
              >
                {/* Purchase Bill */}
                <div
                  style={{
                    height: "36px",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-12, 12px)",
                      color: "#475569",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Purchase Bill")}
                  </span>
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-14, 14px)",
                      color: "#1e293b",
                    }}
                  >
                    ৳ {totalBuying.toFixed(2)}
                  </span>
                </div>

                {/* Grand Total */}
                <div
                  style={{
                    height: "36px",
                    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                    border: "1px solid #10b981",
                    borderRadius: "6px",
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-12, 12px)",
                      color: "#047857",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Grand Total")}
                  </span>
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-15, 15px)",
                      color: "#065f46",
                    }}
                  >
                    ৳ {grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Due */}
                <div
                  style={{
                    height: "36px",
                    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--fs-12, 12px)",
                      color: "#b91c1c",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("Due")}
                  </span>
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-15, 15px)",
                      color: "#991b1b",
                    }}
                  >
                    ৳ {totalDue.toFixed(2)}
                  </span>
                </div>

                {/* Buy Button */}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSubmitPurchase(1)}
                  disabled={submitting}
                  style={{
                    height: "36px",
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    padding: "0 26px",
                    fontSize: "var(--fs-14, 14px)",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                    whiteSpace: "nowrap",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(34, 197, 94, 0.3)";
                  }}
                >
                  {isEditMode ? t("Update") : t("Buy")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Add Supplier Modal component */}
      <AddSupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={(newSupplier) => {
          if (newSupplier) {
            const formattedSupplier = {
              ...newSupplier,
              id: newSupplier.id || newSupplier.uuid,
            };
            setSuppliers((prev) => [...prev, formattedSupplier]);
            setFormData((prev) => ({
              ...prev,
              supplier: formattedSupplier.id,
            }));
          }
        }}
      />

      <AddProductModal
        isOpen={isProductModalOpen}
        showOpeningStock={visibleFields.opening_stock !== false}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={(newProd) => {
          if (newProd) {
            setProducts((prev) => [...prev, newProd]);
            if (!newProd.id) newProd.id = Date.now().toString();
            handleSelectProduct(newProd.id, newProd);
            setBarcodeProductToPrint(newProd);
          }
          setIsProductModalOpen(false);
        }}
      />

      <BarcodePrintModal
        isOpen={!!barcodeProductToPrint}
        onClose={() => setBarcodeProductToPrint(null)}
        product={barcodeProductToPrint}
      />

      <FormSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t("Receive Form Settings")}
        fields={[
          { key: "invoice_id", label: t("Invoice ID") },
          { key: "date", label: t("Issued Date") },
          { key: "supplier", label: t("Supplier") },
          { key: "warehouse", label: t("Warehouse") },
          { key: "discount", label: t("Discount") },
          { key: "transport_fare", label: t("Transport Fare") },
          { key: "vat", label: t("Vat") },
          { key: "accounts", label: t("Accounts") },
          { key: "category", label: t("Category") },
          { key: "receive_amount", label: t("Receive Amount") },
          { key: "percentage", label: t("Percentage"), hasInput: true, defaultValue: salePricePercentage },
          { key: "sale_price_auto_generate", label: t("Auto Generate Sale Price") },
          { key: "opening_stock", label: t("Opening Stock") },
        ]}
        initialSettings={{
          ...visibleFields, 
          percentage_value: visibleFields.percentage_value !== undefined ? visibleFields.percentage_value : salePricePercentage,
          sale_price_auto_generate: companyInfo?.sale_price_auto_generate === true || companyInfo?.sale_price_auto_generate === "true" || companyInfo?.sale_price_auto_generate === 1
        }}
        onSave={async (newSettings) => {
          setVisibleFields(newSettings);
          setIsSettingsOpen(false);
          toast.success(t("Settings saved successfully!"));
          
          if (newSettings.percentage_value !== undefined) {
            const newPerc = Number(newSettings.percentage_value);
            setItems(prev => prev.map(item => {
               const bp = Number(item.buyingPrice);
               const sp = bp + (bp * newPerc / 100);
               return { ...item, percentage: newPerc, salePrice: Number(sp.toFixed(2)) };
            }));
          }
          
          try {
             // Save company info updates properly stripping read-only fields
             const { memo_header_image, logo, id, created_at, updated_at, ...payload } = companyInfo || {};
             if (payload.stock_warning === '' || payload.stock_warning === null) delete payload.stock_warning;
             
             payload.sale_price_auto_generate = newSettings.sale_price_auto_generate ? true : false;
             payload.sale_price_percentage = newSettings.percentage_value !== undefined ? newSettings.percentage_value : salePricePercentage;
             
             const saved = await companyStore.save(payload);
             if (typeof setCompanyInfo === 'function') setCompanyInfo({ ...companyInfo, ...saved });
          } catch(err) {
             console.error("Failed to update company info", err);
          }

          try {
            await settingService.updateFormSettings(
              "purchase_create",
              newSettings,
            );
          } catch (err) {
            console.error("Failed to save settings to API", err);
          }
        }}
      />
    </div>
  );
};

export default PurchaseCreate;
