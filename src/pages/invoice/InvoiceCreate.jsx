import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PrintHeader from "../../components/PrintHeader";
import {
  Plus,
  X,
  Calendar,
  Clock,
  Barcode,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AddOptionModal from "../../components/AddOptionModal";
import AddClientModal from "../../components/AddClientModal";
import AddProductModal from "../../components/AddProductModal";
import AddAccountModal from "../../components/AddAccountModal";
import AddIncomeCategoryModal from "../../components/AddIncomeCategoryModal";
import SearchableSelect from "../../components/SearchableSelect";
import { crmService } from "../../services/crmService";
import { productService } from "../../services/productService";
import { accountingService } from "../../services/accountingService";
import { saleService } from "../../services/saleService";
import { useToast } from "../../context/ToastContext";

const InvoiceCreate = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(id);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);

  const [formData, setFormData] = useState({
    clientId: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    barcode: "",
    productId: "",
    totalBalanceAcc: "TOTAL BALENCE",
    cashSellAcc: "CASH SELL",
    discountAmount: "0",
    receiveAmount: "0",
    sms: false,
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTotalBalanceAccModalOpen, setIsTotalBalanceAccModalOpen] =
    useState(false);
  const [isCashSellAccModalOpen, setIsCashSellAccModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  useEffect(() => {
    if (printInvoiceData) {
      const handleAfterPrint = () => {
        setPrintInvoiceData(null);
        setItems([]);
        setFormData({
          clientId: "",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          barcode: "",
          productId: "",
          totalBalanceAcc: "TOTAL BALENCE",
          cashSellAcc: "CASH SELL",
          discountAmount: "0",
          receiveAmount: "0",
          sms: false,
        });
      };
      window.addEventListener("afterprint", handleAfterPrint);

      const timer = setTimeout(() => {
        window.print();
      }, 600);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printInvoiceData]);

  // Ensure barcode is always focused when the component mounts
  useEffect(() => {
    const barcodeInput = document.getElementById("barcodeInput");
    if (barcodeInput) {
      setTimeout(() => barcodeInput.focus(), 100);
    }
  }, []);

  const populateInvoiceData = (invData, currentProducts = products) => {
    if (!invData) return;
    setIsReceiveAmountManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      clientId:
        invData.client ||
        invData.client_id ||
        invData.clientName ||
        prev.clientId,
      date:
        invData.date ||
        (invData.created_at ? invData.created_at.split("T")[0] : prev.date),
      totalBalanceAcc:
        invData.account_id || invData.account || prev.totalBalanceAcc,
      cashSellAcc: invData.category_id || invData.category || prev.cashSellAcc,
      discountAmount: String(invData.discount || invData.total_discount || "0"),
      receiveAmount: String(
        invData.receive_amount || invData.receiveAmount || invData.paid || "0",
      ),
    }));

    const rawItems =
      invData.items || invData.invoice_items || invData.sale_items || [];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const mappedItems = rawItems.map((item) => {
        const prodId =
          typeof item.product === "object"
            ? item.product?.id
            : item.product || item.product_id || item.id;
        const matchingProd = (currentProducts || []).find(
          (p) => String(p.id) === String(prodId),
        );

        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(
          item.selling_price ||
            item.price ||
            item.sales_price ||
            item.rate ||
            matchingProd?.sales_price ||
            matchingProd?.price ||
            (item.total_selling_price
              ? Number(item.total_selling_price) / qty
              : 0) ||
            0,
        );

        const name =
          item.name ||
          item.product_name ||
          (typeof item.product === "object"
            ? item.product?.name || item.product?.title
            : null) ||
          matchingProd?.name ||
          matchingProd?.title ||
          `Product #${prodId}`;

        const stock = Number(item.stock ?? matchingProd?.stock ?? 0);
        const unit =
          item.unit || matchingProd?.unit_name || matchingProd?.unit || "Pcs";

        return {
          id: prodId || `item-${Date.now()}-${Math.random()}`,
          name: name,
          stock: stock,
          price: price,
          quantity: qty,
          unit: unit,
        };
      });
      setItems(mappedItems);
    }
  };

  const fetchPrerequisites = async () => {
    try {
      setLoadingPrereqs(true);
      const [clientRes, prodRes, accRes, incCatRes] = await Promise.all([
        crmService.getClients({ page_size: 5000 }).catch(() => []),
        productService.getProducts({ page_size: 500 }).catch(() => []),
        accountingService.getAccounts().catch(() => []),
        accountingService.getIncomeCategories().catch(() => []),
      ]);

      const clientData = Array.isArray(clientRes)
        ? clientRes
        : clientRes?.results || [];
      const prodData = Array.isArray(prodRes)
        ? prodRes
        : prodRes?.results || [];
      const accData = Array.isArray(accRes) ? accRes : accRes?.results || [];
      const incCatData = Array.isArray(incCatRes)
        ? incCatRes
        : incCatRes?.results || [];

      setClients(clientData);
      setProducts(prodData);
      setAccounts(accData);
      setIncomeCategories(incCatData);

      // Silent background load of all products to ensure local barcode search works
      productService
        .getProducts({ page_size: 5000 })
        .then((res) => {
          const allProds = Array.isArray(res) ? res : res?.results || [];
          if (allProds.length > prodData.length) {
            setProducts(allProds);
          }
        })
        .catch((err) => console.error("Background product load failed", err));

      if (isEditMode) {
        if (
          location.state?.invoice &&
          (location.state.invoice.items ||
            location.state.invoice.invoice_items ||
            location.state.invoice.sale_items)
        ) {
          populateInvoiceData(location.state.invoice, prodData);
        } else {
          try {
            const invRes = await saleService.getSalesInvoiceById(id);
            if (invRes) {
              populateInvoiceData(invRes, prodData);
            } else if (location.state?.invoice) {
              populateInvoiceData(location.state.invoice, prodData);
            }
          } catch (err) {
            console.error("Error fetching invoice for edit:", err);
            if (location.state?.invoice) {
              populateInvoiceData(location.state.invoice, prodData);
            }
          }
        }
      } else if (clientData && clientData.length > 0) {
        const defaultClient =
          clientData.find((c) => {
            const name = String(c.name || c.company_name || "").toLowerCase();
            return (
              name.includes("c.customer") ||
              name.includes("c.castomer") ||
              name.includes("c.coustomer") ||
              name.includes("c. customer") ||
              name === "default" ||
              name.startsWith("c.")
            );
          }) || clientData[0];

        if (defaultClient) {
          setFormData((prev) => ({ ...prev, clientId: defaultClient.id }));
        }
      }
    } catch (err) {
      console.error("Error loading prerequisites for invoice:", err);
      setClients([]);
      setProducts([]);
      setAccounts([]);
      setIncomeCategories([]);
    } finally {
      setLoadingPrereqs(false);
    }
  };

  useEffect(() => {
    fetchPrerequisites();
  }, [id]);

  useEffect(() => {
    if (!loadingPrereqs) {
      const timer = setTimeout(() => {
        const barcodeInput = document.getElementById("barcodeInput");
        if (barcodeInput) {
          barcodeInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loadingPrereqs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in a text field
      const isTextInput =
        (e.target.tagName === "INPUT" &&
          !["number", "radio", "checkbox", "button", "submit"].includes(
            e.target.type,
          )) ||
        e.target.tagName === "TEXTAREA";

      // Single key shortcuts (only if not typing text)
      if (
        !isTextInput &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleSaveInvoice(1, false);
          return;
        }
        if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          handleSaveInvoice(1, true);
          return;
        }
      }

      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveInvoice(1, false);
      } else if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveInvoice(1, true);
      } else if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleSaveInvoice(0, false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, items, clients, products, accounts]);

  const [isReceiveAmountManuallyEdited, setIsReceiveAmountManuallyEdited] =
    useState(false);

  useEffect(() => {
    if (!isReceiveAmountManuallyEdited) {
      const calculatedInvoiceBill = items.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      );
      const calculatedDiscount = Math.max(
        0,
        Number(formData.discountAmount || 0),
      );
      const calculatedNet = Math.max(
        0,
        calculatedInvoiceBill - calculatedDiscount,
      );
      setFormData((prev) => ({
        ...prev,
        receiveAmount: String(calculatedNet),
      }));
    }
  }, [items, formData.discountAmount, isReceiveAmountManuallyEdited]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "productId") {
      if (value) {
        handleSelectProduct(value);
      }
    } else {
      if (name === "receiveAmount") {
        setIsReceiveAmountManuallyEdited(true);
      }
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSelectProduct = (selectedId, productObj = null) => {
    if (!selectedId) return;
    const prod =
      productObj || products.find((p) => String(p.id) === String(selectedId));
    if (!prod) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => String(i.id) === String(prod.id),
      );
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            id: prod.id,
            name: prod.name || prod.title || "Product",
            barcode:
              prod._scannedBarcode ||
              prod.barcode ||
              prod.custom_barcode_no ||
              prod.code ||
              (String(prod.id).length === 36
                ? String(prod.id).substring(0, 8).toUpperCase()
                : prod.id),
            stock: Number(prod.stock ?? 0),
            price: Number(prod.sales_price || prod.price || 0),
            quantity: 1,
            unit: prod.unit_name || prod.unit || "Pcs",
          },
        ];
      }
    });

    setFormData((prev) => ({ ...prev, productId: "" }));
  };

  const handleBarcodeKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const rawCode = e.target.value;
      if (!rawCode || !rawCode.trim()) return;
      const code = rawCode.trim().toLowerCase();
      let prod = products.find(
        (p) =>
          String(p.code || "")
            .trim()
            .toLowerCase() === code ||
          String(p.barcode || "")
            .trim()
            .toLowerCase() === code ||
          String(p.custom_barcode_no || "")
            .trim()
            .toLowerCase() === code ||
          String(p.id).trim().toLowerCase() === code ||
          (code.length >= 8 &&
            String(p.id).trim().toLowerCase().startsWith(code)) ||
          String(p.product_code || "")
            .trim()
            .toLowerCase() === code,
      );

      if (!prod) {
        // Not in the loaded page of products — ask the server. findByBarcode
        // also covers older products that only the stock report can resolve.
        prod = await productService.findByBarcode(rawCode);
        if (prod) {
          setProducts((prev) =>
            prev.find((p) => String(p.id) === String(prod.id))
              ? prev
              : [...prev, prod],
          );
        }
      }

      if (prod) {
        handleSelectProduct(prod.id, {
          ...prod,
          _scannedBarcode: rawCode.trim(),
        });
      } else {
        toast.error(
          t('Product with barcode "{{v0}}" not found.', { v0: rawCode.trim() }),
        );
      }
      setFormData((prev) => ({ ...prev, barcode: "" }));
    }
  };
  const updateItemField = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = Math.max(0, Number(value));
      return updated;
    });
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
  };

  const selectedClientObj = (clients || []).find(
    (c) => String(c.id) === String(formData.clientId),
  );
  const isDefaultClient = selectedClientObj
    ? /c\.?\s*customer|c\.?\s*castomer|c\.?\s*coustomer|^c\.|default/i.test(
        String(selectedClientObj.name || selectedClientObj.company_name || ""),
      )
    : false;
  const dueAmount =
    selectedClientObj && !isDefaultClient
      ? Number(selectedClientObj.due || selectedClientObj.previous_due || 0)
      : 0;

  // Calculations
  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const invoiceBill = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const discountAmt = Math.max(0, Number(formData.discountAmount || 0));
  const netInvoiceBill = Math.max(0, invoiceBill - discountAmt);
  const totalBill = netInvoiceBill + dueAmount;
  const paymentAmt = Number(formData.receiveAmount || 0);
  const totalDue = Math.max(0, totalBill - paymentAmt);

  const handleSaveInvoice = async (status = 1, shouldPrint = false) => {
    if (!formData.clientId) {
      toast.error(t("Please select a customer / client."));
      return;
    }
    if (items.length === 0) {
      toast.error(t("Please add at least one product item."));
      return;
    }
    if (isDefaultClient && totalDue > 0 && status !== 0) {
      toast.error(t("Default customer cannot have a due balance."));
      return;
    }

    // POST /api/sale/invoices/ (see sale-api-instructions.md)
    const payload = {
      client: formData.clientId,
      date: formData.date,
      discount: discountAmt.toFixed(2),
      discount_type: "flat",
      transport_fare: "0.00",
      labour_cost: "0.00",
      vat: "0.00",
      vat_type: "percentage",
      invoice_bill: invoiceBill.toFixed(2),
      total_vat: "0.00",
      total_discount: discountAmt.toFixed(2),
      grand_total: netInvoiceBill.toFixed(2),
      previous_due: dueAmount.toFixed(2),
      total_bill: totalBill.toFixed(2),
      receive_amount: paymentAmt.toFixed(2),
      total_due: totalDue.toFixed(2),
      account_id: formData.totalBalanceAcc || "TOTAL BALENCE",
      category_id: formData.cashSellAcc || "CASH SELL",
      status: status,
      items: items.map((item) => ({
        product: item.id,
        product_id: item.id,
        name: item.name,
        product_name: item.name,
        quantity: String(item.quantity),
        selling_price: Number(item.price).toFixed(2),
        total_selling_price: (
          Number(item.price) * Number(item.quantity)
        ).toFixed(2),
      })),
    };

    try {
      let result;
      if (isEditMode) {
        result = await saleService.updateSalesInvoice(id, payload);
      } else {
        result = await saleService.createSalesInvoice(payload);
      }

      const clientObj = (clients || []).find(
        (c) => String(c.id) === String(formData.clientId),
      );
      const accObj = (accounts || []).find(
        (a) => String(a.id) === String(formData.cashSellAcc),
      );

      const savedInvoiceObj = {
        ...payload,
        id: result?.id || result?.data?.id || id || `INV-${Date.now()}`,
        invoice_id:
          result?.invoice_id ||
          result?.data?.invoice_id ||
          `INV-${id || Date.now()}`,
        client_name: clientObj
          ? clientObj.name || clientObj.company_name
          : formData.clientId === "C.CASTOMER"
            ? "C.CUSTOMER"
            : formData.clientId,
        category_name: accObj
          ? accObj.name
          : formData.cashSellAcc || "CASH SELL",
        date: formData.date,
      };

      if (status === 0) {
        toast.success(
          isEditMode
            ? t("Draft Invoice Updated Successfully!")
            : t("Draft Invoice Saved Successfully!"),
        );
        navigate("/invoice/draft");
      } else {
        toast.success(
          isEditMode
            ? t("Sales Invoice Updated Successfully!")
            : t("Sales Invoice Created Successfully!"),
        );
        if (shouldPrint) {
          setPrintInvoiceData(savedInvoiceObj);
        } else {
          if (isEditMode) {
            navigate("/invoice/list");
          } else {
            // Reset form for the next invoice without leaving the page
            setItems([]);
            const baseForm = {
              clientId: "",
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              barcode: "",
              productId: "",
              totalBalanceAcc: "TOTAL BALENCE",
              cashSellAcc: "CASH SELL",
              discountAmount: "0",
              receiveAmount: "0",
              sms: false,
            };

            // Re-apply default customer
            if (clients && clients.length > 0) {
              const defaultClient =
                clients.find((c) => {
                  const name = String(
                    c.name || c.company_name || "",
                  ).toLowerCase();
                  return (
                    name.includes("c.customer") ||
                    name.includes("c.castomer") ||
                    name.includes("c.coustomer") ||
                    name.includes("c. customer") ||
                    name === "default" ||
                    name.startsWith("c.")
                  );
                }) || clients[0];
              if (defaultClient) {
                baseForm.clientId = defaultClient.id;
              }
            }

            setFormData(baseForm);
            setTimeout(() => {
              const barcodeInput = document.getElementById("barcodeInput");
              if (barcodeInput) barcodeInput.focus();
            }, 100);
          }
        }
      }
    } catch (err) {
      console.error("Error saving sales invoice:", err);
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save invoice via API.";
      toast.error(t("API Error: {{v0}}", { v0: errMsg }));
    }
  };

  return (
    <div className="dashboard-content" style={{ paddingBottom: "100px" }}>
      <div className="premium-card" style={{ overflow: "visible" }}>
        <style>
          {`
            .invoice-fixed-footer {
              position: fixed;
              bottom: 0;
              right: 0;
              width: calc(100% - 280px); /* 280px is sidebar width */
              background: white;
              z-index: 999;
              padding: 16px 32px;
              box-shadow: 0 -4px 15px rgba(0,0,0,0.05);
              display: flex;
              justify-content: space-between;
              border-top: 1px solid #e2e8f0;
              align-items: center;
              gap: 16px;
              flex-wrap: wrap;
            }
            @media (max-width: 900px) {
              .invoice-fixed-footer {
                width: 100%;
              }
            }
          `}
        </style>

        <div className="premium-body" style={{ background: "white" }}>
          <PrintHeader />
          <form onSubmit={(e) => e.preventDefault()}>
            <div
              style={{
                position: "sticky",
                top: "58px" /* 58px is the height of the main app header */,
                zIndex: 40,
                background: "white",
                padding: "16px 24px 8px",
                borderBottom: "1px solid #e2e8f0",
                margin: "0 -24px 0 -24px",
              }}
            >
              <div
                className="premium-header"
                style={{ padding: "0 0 16px 0", background: "white" }}
              >
                <h2
                  className="premium-title"
                  style={{ fontSize: "var(--fs-14, 14px)", fontWeight: "bold" }}
                >
                  <span>{t("invoice.page_title", "ADD INVOICE")}</span>
                  <span className="desktop-shortcut-guide">
                    {t(
                      "invoice.shortcut_hint",
                      " | S = SAVE | P = SAVE & PRINT | CTRL + D = SAVE AS DRAFT",
                    )}
                  </span>
                </h2>
              </div>

              {/* Top Row: Customer Selection, Date & Time */}
              <div
                className="form-grid invoice-top-grid"
                style={{
                  gap: "16px",
                  marginBottom: "18px",
                  alignItems: "start",
                }}
              >
                {/* Customer */}
                <div style={{ position: "relative", width: "100%" }}>
                  <SearchableSelect
                    options={(clients || []).map((c) => {
                      const nameStr = c.name || c.company_name || "";
                      const isDefault =
                        /c\.?\s*customer|c\.?\s*castomer|c\.?\s*coustomer|^c\.|default/i.test(
                          nameStr,
                        );
                      return {
                        value: c.id,
                        label: `${nameStr}${isDefault ? " (Default)" : ""} ${c.phone ? `(${c.phone})` : ""}`,
                        searchValue: `${nameStr} ${c.phone || ""}`,
                      };
                    })}
                    value={formData.clientId}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, clientId: val }))
                    }
                    placeholder={t(
                      "invoice.select_customer",
                      "Select Customer / Client",
                    )}
                    onAddClick={() => setIsClientModalOpen(true)}
                  />
                  {/* Kept in flow: as an absolutely positioned overhang it used
                    to collide with the "Barcode Number" badge of the next row. */}
                  <div
                    style={{
                      fontSize: "var(--fs-11, 11px)",
                      fontWeight: "bold",
                      marginTop: "3px",
                      color: "#0f172a",
                      paddingLeft: "4px",
                    }}
                  >
                    {t("common.due", "Due")}: {dueAmount.toFixed(0)}
                  </div>
                </div>

                {/* Date */}
                <div style={{ position: "relative" }}>
                  <div
                    className="badge-date"
                    style={{ background: "var(--info)" }}
                  >
                    <Calendar size={12} />{" "}
                    {t("invoice.issued_date", "Issued Date")}
                  </div>
                  <input
                    type="date"
                    name="date"
                    className="input-date"
                    value={formData.date}
                    onChange={handleChange}
                    onClick={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {}
                    }}
                    onFocus={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {}
                    }}
                    style={{ cursor: "pointer", width: "100%" }}
                  />
                </div>

                {/* Time */}
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px",
                      paddingRight: "40px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      outline: "none",
                      height: "48px",
                      boxSizing: "border-box",
                    }}
                  />
                  <Clock
                    size={16}
                    style={{
                      position: "absolute",
                      right: "12px",
                      color: "#94a3b8",
                    }}
                  />
                </div>
              </div>

              {/* Second Row: Barcode & Product Selection */}
              <div
                className="form-grid invoice-mid-grid"
                style={{
                  gap: "16px",
                  marginBottom: "16px",
                  position: "relative",
                }}
              >
                <div
                  className="form-group"
                  style={{
                    marginBottom: "0",
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "20px",
                      background: "var(--primary)",
                      color: "white",
                      padding: "2px 8px",
                      fontSize: "var(--fs-10, 10px)",
                      borderRadius: "4px",
                      zIndex: 2,
                    }}
                  >
                    {t("invoice.barcode_header", "Barcode Number")}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderRight: "1px solid #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Barcode
                        size={24}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                    <input
                      id="barcodeInput"
                      autoFocus
                      type="text"
                      name="barcode"
                      placeholder={t(
                        "invoice.barcode_placeholder",
                        "Scan Barcode & Press Enter",
                      )}
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
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                      }}
                    />
                  </div>
                </div>

                <div
                  className="form-group"
                  style={{ marginBottom: "0", position: "relative" }}
                  onKeyDownCapture={(e) => {
                    if (e.key === "Tab" && !e.shiftKey) {
                      e.preventDefault();
                      // When leaving Product Search via Tab, focus the first (or last) quantity field
                      setTimeout(() => {
                        const inputs =
                          document.querySelectorAll(`input[data-qty-idx]`);
                        // They want to start editing from the first item
                        const targetQty = inputs.length > 0 ? inputs[0] : null;
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
                  <SearchableSelect
                    id="productSearchDropdown"
                    options={(products || []).map((p) => {
                      const barcode =
                        p.custom_barcode_no || p.code || p.barcode || "";
                      return {
                        value: p.id,
                        label: `${barcode ? `${barcode}: ` : ""}${p.name || p.title}`,
                        searchValue: `${p.name || p.title} ${barcode} ${p.sales_price || p.price || 0}`,
                      };
                    })}
                    value={formData.productId}
                    onChange={(val) => {
                      if (val) handleSelectProduct(val);
                    }}
                    onSearchChange={(val) => {
                      const term = (val || "").trim();
                      if (term.length >= 2) {
                        if (window.productSearchTimeout)
                          clearTimeout(window.productSearchTimeout);
                        window.productSearchTimeout = setTimeout(async () => {
                          try {
                            const res = await productService.getProducts({
                              search: term,
                            });
                            let list = Array.isArray(res)
                              ? res
                              : res?.results || [];

                            const exactMatch = list.find(
                              (p) =>
                                String(
                                  p.custom_barcode_no ||
                                    p.code ||
                                    p.barcode ||
                                    "",
                                )
                                  .trim()
                                  .toLowerCase() === term.toLowerCase(),
                            );
                            if (exactMatch) {
                              list = [exactMatch];
                            } else {
                              const byBarcode =
                                await productService.findByBarcode(term);
                              if (
                                byBarcode &&
                                String(
                                  byBarcode.custom_barcode_no ||
                                    byBarcode.code ||
                                    byBarcode.barcode ||
                                    "",
                                )
                                  .trim()
                                  .toLowerCase() === term.toLowerCase()
                              ) {
                                list = [byBarcode];
                              } else if (byBarcode && list.length === 0) {
                                list = [byBarcode];
                              }
                            }

                            if (list.length > 0) {
                              setProducts((prev) => {
                                const updated = [...prev];
                                list.forEach((item) => {
                                  if (
                                    !updated.find(
                                      (p) => String(p.id) === String(item.id),
                                    )
                                  ) {
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
                    clearOnSelect={true}
                    hideOptionsUntilSearch={true}
                    pushContentBelow={false}
                    placeholder={t("invoice.select_product", "Select Product")}
                    onAddClick={() => setIsProductModalOpen(true)}
                  />
                </div>
              </div>
            </div>

            {/* Product Table with Responsive Scroll Wrapper */}
            <div
              className="table-responsive-wrapper"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                marginBottom: "12px",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "580px",
                  borderCollapse: "collapse",
                  fontSize: "var(--fs-12, 12px)",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#888888",
                      color: "#111827",
                      fontWeight: "bold",
                    }}
                  >
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.sl", "SL")}
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.product", "PRODUCT")}
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.stock", "STOCK")}
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        width: "120px",
                      }}
                    >
                      {t("invoice.price", "PRICE")}
                    </th>
                    <th
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        width: "100px",
                      }}
                    >
                      {t("invoice.quantity", "QUANTITY")}
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.unit", "UNIT")}
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.total", "TOTAL")}
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      {t("invoice.action", "ACTION")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          textAlign: "center",
                          padding: "24px",
                          color: "#94a3b8",
                        }}
                      >
                        {t(
                          "invoice.no_items",
                          "No items added yet. Select a product from dropdown or scan barcode.",
                        )}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const ashBox = {
                        border: "1px solid #cbd5e1",
                        borderRadius: "2px",
                        padding: "4px 8px",
                        textAlign: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        background: "white",
                        color: "#0f172a",
                        minHeight: "30px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: "500",
                        fontSize: "12px",
                      };
                      const ashInput = {
                        border: "1px solid #cbd5e1",
                        borderRadius: "2px",
                        padding: "4px 8px",
                        textAlign: "center",
                        width: "100%",
                        boxSizing: "border-box",
                        background: "white",
                        color: "#0f172a",
                        minHeight: "30px",
                        outline: "none",
                        fontWeight: "500",
                        fontSize: "12px",
                      };

                      return (
                        <tr
                          key={idx}
                          style={{
                            background: "#e2e8f0",
                            borderBottom: "1px solid #cbd5e1",
                          }}
                        >
                          <td style={{ padding: "4px" }}>
                            <div style={ashBox}>{idx + 1}</div>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <div style={{ ...ashBox }}>
                              {item.name} {item.barcode && `| ${item.barcode}`}
                            </div>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <div style={ashBox}>{item.stock}</div>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <input
                              tabIndex="-1"
                              type="number"
                              value={item.price}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateItemField(idx, "price", e.target.value)
                              }
                              style={ashInput}
                            />
                          </td>
                          <td style={{ padding: "4px" }}>
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
                                      setTimeout(
                                        () =>
                                          setTimeout(
                                            () => receiveInput.select(),
                                            10,
                                          ),
                                        10,
                                      );
                                    }
                                  }
                                }
                              }}
                              onChange={(e) =>
                                updateItemField(idx, "quantity", e.target.value)
                              }
                              style={ashInput}
                            />
                          </td>
                          <td style={{ padding: "4px" }}>
                            <div style={ashBox}>{item.unit}</div>
                          </td>
                          <td style={{ padding: "4px" }}>
                            <div style={ashBox}>
                              {(item.price * item.quantity).toFixed(2)}
                            </div>
                          </td>
                          <td style={{ padding: "4px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              style={{
                                border: "none",
                                background: "#ef4444",
                                color: "white",
                                cursor: "pointer",
                                padding: "6px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: "var(--fs-13, 13px)",
                marginBottom: "12px",
                fontWeight: "bold",
              }}
            >
              {t("invoice.total_quantity", "Total Quantity")}:{" "}
              <span style={{ color: "var(--primary)" }}>{totalQuantity}</span>
            </div>

            {/* Bottom Section */}
            <div
              className="form-grid invoice-bottom-grid"
              style={{
                gap: "24px",
                marginBottom: "14px",
              }}
            >
              {/* Left Column - Accounts */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <SearchableSelect
                  options={[
                    { value: "TOTAL BALENCE", label: t("TOTAL BALENCE") },
                    ...(accounts || []).map((a) => ({
                      value: a.id,
                      label: a.name,
                    })),
                  ]}
                  value={formData.totalBalanceAcc}
                  disableClear={true}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, totalBalanceAcc: val }))
                  }
                  placeholder={t(
                    "invoice.total_balance_acc",
                    "Select Account (Total Balance)",
                  )}
                  onAddClick={() => setIsTotalBalanceAccModalOpen(true)}
                />

                <SearchableSelect
                  options={[
                    { value: "CASH SELL", label: t("CASH SELL") },
                    ...(incomeCategories || []).map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                  value={formData.cashSellAcc}
                  disableClear={true}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, cashSellAcc: val }))
                  }
                  placeholder={t(
                    "invoice.cash_sell_acc",
                    "Select Sales / Cash Account",
                  )}
                  onAddClick={() => setIsCashSellAccModalOpen(true)}
                />

                <div style={{ position: "relative", display: "none" }}>
                  <div className="badge-date" style={{ background: "#dc2626" }}>
                    {t("invoice.discount_amount", "Discount Amount")}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    name="discountAmount"
                    className="input-date"
                    value={formData.discountAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    style={{
                      fontWeight: "bold",
                      fontSize: "var(--fs-15, 15px)",
                      color: "#dc2626",
                    }}
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <div
                    className="badge-date"
                    style={{ background: "var(--info)" }}
                  >
                    {t("invoice.receive_amount", "Receive Amount")}
                  </div>
                  <input
                    id="receiveAmountInput"
                    type="number"
                    step="0.01"
                    name="receiveAmount"
                    className="input-date"
                    value={formData.receiveAmount}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    style={{
                      fontWeight: "bold",
                      fontSize: "var(--fs-15, 15px)",
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Summary */}
              <div>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "var(--fs-14, 14px)",
                    }}
                  >
                    <span>{t("invoice.invoice_bill", "Invoice Bill")}</span>
                    <span style={{ fontWeight: "bold" }}>
                      : ৳ {invoiceBill.toFixed(2)}
                    </span>
                  </div>
                  {discountAmt > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "7px 14px",
                        borderBottom: "1px solid #e2e8f0",
                        fontSize: "var(--fs-14, 14px)",
                        color: "#dc2626",
                        fontWeight: "bold",
                      }}
                    >
                      <span>{t("invoice.discount_minus", "Discount (-)")}</span>
                      <span>: ৳ {discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "var(--fs-14, 14px)",
                    }}
                  >
                    <span>{t("invoice.previous_due", "Previous Due")}</span>
                    <span>: ৳ {dueAmount.toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "var(--fs-14, 14px)",
                      fontWeight: "bold",
                    }}
                  >
                    <span>{t("invoice.total_bill", "Total Bill")}</span>
                    <span style={{ color: "#2563eb" }}>
                      : ৳ {totalBill.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 14px",
                      borderBottom: "1px solid #e2e8f0",
                      fontSize: "var(--fs-14, 14px)",
                    }}
                  >
                    <span>{t("invoice.payment", "Payment")}</span>
                    <span style={{ fontWeight: "bold", color: "#059669" }}>
                      : ৳ {paymentAmt.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 14px",
                      fontSize: "var(--fs-14, 14px)",
                      fontWeight: "bold",
                      color: "#ef4444",
                    }}
                  >
                    <span>{t("invoice.total_due", "Total Due")}</span>
                    <span>: ৳ {totalDue.toFixed(2)}</span>
                  </div>
                </div>

                <div
                  className="toggle-switch"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    background: "white",
                  }}
                >
                  <MessageSquare
                    size={18}
                    style={{ color: "#111827", marginRight: "8px" }}
                  />
                  <div
                    className="toggle-label"
                    style={{ flex: 1, fontWeight: "bold" }}
                  >
                    {t("invoice.sms", "SMS")}
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="sms"
                      checked={formData.sms}
                      onChange={handleChange}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="invoice-fixed-footer">
              <button
                type="button"
                className="btn-danger"
                onClick={() => navigate("/invoice/list")}
                style={{
                  background: "var(--danger)",
                  padding: "10px 24px",
                  fontSize: "var(--fs-14, 14px)",
                  borderRadius: "4px",
                }}
              >
                {t("invoice.cancel", "Cancel")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSaveInvoice(0)}
                style={{
                  background: "#64748b",
                  padding: "10px 24px",
                  fontSize: "var(--fs-14, 14px)",
                  borderRadius: "4px",
                }}
              >
                {t("invoice.save_draft", "Save As Draft")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSaveInvoice(1, true)}
                style={{
                  background: "#3b82f6",
                  padding: "10px 24px",
                  fontSize: "var(--fs-14, 14px)",
                  borderRadius: "4px",
                }}
              >
                {t("invoice.save_print", "Save & Print")}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSaveInvoice(1)}
                style={{
                  background: "var(--success)",
                  padding: "10px 24px",
                  fontSize: "var(--fs-14, 14px)",
                  borderRadius: "4px",
                  fontWeight: "bold",
                }}
              >
                {t("invoice.add_invoice", "Add Invoice")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={(newClient) => {
          if (newClient) {
            setClients((prev) => [...prev, newClient]);
            setFormData((prev) => ({ ...prev, clientId: newClient.id }));
          }
          setIsClientModalOpen(false);
        }}
      />
      <AddProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={(newProd) => {
          if (newProd) {
            setProducts((prev) => [...prev, newProd]);
            handleSelectProduct(newProd.id);
          }
          setIsProductModalOpen(false);
        }}
      />
      <AddAccountModal
        isOpen={isTotalBalanceAccModalOpen}
        onClose={() => setIsTotalBalanceAccModalOpen(false)}
        onSuccess={(newAcc) => {
          if (newAcc) {
            setAccounts((prev) => [...prev, newAcc]);
            setFormData((prev) => ({ ...prev, totalBalanceAcc: newAcc.id }));
          }
          setIsTotalBalanceAccModalOpen(false);
        }}
      />
      <AddIncomeCategoryModal
        isOpen={isCashSellAccModalOpen}
        onClose={() => setIsCashSellAccModalOpen(false)}
        onSuccess={(newCat) => {
          if (newCat) {
            setIncomeCategories((prev) => [...prev, newCat]);
            setFormData((prev) => ({ ...prev, cashSellAcc: newCat.id }));
          }
          setIsCashSellAccModalOpen(false);
        }}
      />

      {/* INLINE PRINT MODAL */}
      {printInvoiceData && (
        <div
          className="printable-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "white",
            zIndex: 999999,
          }}
        >
          <div
            id="pos-receipt-print-area"
            className="pos-receipt-wrapper"
            style={{
              margin: "0 auto",
              width: "100%",
              maxWidth: "300px",
              background: "white",
              padding: "8px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ padding: "8px" }}>
              <PrintHeader showOnScreen={true} isPos={true} />
              {(() => {
                const selectedInvoice = printInvoiceData;
                const clientObj = (clients || []).find(
                  (c) =>
                    String(c.id) ===
                    String(
                      selectedInvoice.client ||
                        selectedInvoice.client_id ||
                        selectedInvoice.clientId,
                    ),
                );
                const clientDisplay =
                  selectedInvoice.client_name ||
                  selectedInvoice.clientName ||
                  (clientObj
                    ? clientObj.name || clientObj.company_name
                    : selectedInvoice.clientId &&
                        !String(selectedInvoice.clientId).includes("-")
                      ? selectedInvoice.clientId
                      : "C.CUSTOMER");

                const invoiceBill = Number(
                  selectedInvoice.invoice_bill ||
                    selectedInvoice.invoiceBill ||
                    (selectedInvoice.items || []).reduce((sum, item) => {
                      const qty = Number(item.quantity || item.qty || 1);
                      const rate = Number(
                        item.selling_price || item.price || item.rate || 0,
                      );
                      return (
                        sum +
                        (Number(
                          item.total_selling_price ||
                            item.total_amount ||
                            qty * rate,
                        ) || 0)
                      );
                    }, 0) ||
                    selectedInvoice.grand_total ||
                    0,
                );

                const prevDue = Number(
                  selectedInvoice.previous_due ||
                    selectedInvoice.previousDue ||
                    0,
                );
                const discountAmt = Number(
                  selectedInvoice.discountAmount ||
                    selectedInvoice.discount ||
                    selectedInvoice.total_discount ||
                    0,
                );
                const totalBill = invoiceBill - discountAmt + prevDue;
                const payment = Number(
                  selectedInvoice.receiveAmount ||
                    selectedInvoice.receive_amount ||
                    selectedInvoice.paid ||
                    0,
                );
                const invoiceDue = Math.max(
                  0,
                  invoiceBill - discountAmt - payment,
                );
                const totalDue =
                  selectedInvoice.total_due !== undefined
                    ? Number(selectedInvoice.total_due)
                    : Math.max(0, totalBill - payment);

                let totalQty = 0;
                (selectedInvoice.items || []).forEach((item) => {
                  totalQty += Number(item.quantity || item.qty || 1);
                });

                return (
                  <>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "10px",
                        color: "black",
                        marginBottom: "4px",
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              width: "50%",
                            }}
                          >
                            কাস্টমার আইডি:-{" "}
                            {selectedInvoice.client_id ||
                              selectedInvoice.clientId ||
                              (clientObj ? clientObj.id : "")}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              width: "50%",
                            }}
                          >
                            ইনভয়েস আইডি:-{" "}
                            {selectedInvoice.invoice_id ||
                              selectedInvoice.invoiceNo ||
                              selectedInvoice.id}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                            }}
                          >
                            কাস্টমার: {clientDisplay}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                            }}
                          >
                            তারিখ:-{" "}
                            {selectedInvoice.created_at
                              ? (() => {
                                  const d = new Date(
                                    selectedInvoice.created_at,
                                  );
                                  const day = String(d.getDate()).padStart(
                                    2,
                                    "0",
                                  );
                                  const month = d
                                    .toLocaleString("en-US", { month: "short" })
                                    .toUpperCase();
                                  const year = d.getFullYear();
                                  const time = d.toLocaleString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  });
                                  return `${day} ${month} ${year} AT ${time}`;
                                })()
                              : selectedInvoice.date || "-"}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                            }}
                          >
                            SERVED BY:- {selectedInvoice.served_by || "ADMIN"}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "10px",
                        color: "black",
                        marginBottom: "0",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                              width: "55%",
                            }}
                          >
                            নাম
                          </th>
                          <th
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                            }}
                          >
                            মুল্য
                          </th>
                          <th
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                            }}
                          >
                            পরিমাণ
                          </th>
                          <th
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                            }}
                          >
                            মোট
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items &&
                        selectedInvoice.items.length > 0 ? (
                          selectedInvoice.items.map((item, idx) => {
                            const qty = Number(item.quantity || item.qty || 1);
                            const rate = Number(
                              item.selling_price ||
                                item.price ||
                                item.rate ||
                                0,
                            );
                            const itemTotal = Number(
                              item.total_selling_price ||
                                item.total_amount ||
                                qty * rate ||
                                0,
                            );
                            const displayItemName = `${item.name || item.product_name || item.title || "Item"} ${item.barcode ? `(${item.barcode})` : ""}`;
                            return (
                              <tr key={idx}>
                                <td
                                  style={{
                                    border: "1px solid black",
                                    padding: "2px 4px",
                                    textAlign: "left",
                                  }}
                                >
                                  {displayItemName}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid black",
                                    padding: "2px 4px",
                                    textAlign: "left",
                                  }}
                                >
                                  {rate}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid black",
                                    padding: "2px 4px",
                                    textAlign: "left",
                                  }}
                                >
                                  {qty}
                                </td>
                                <td
                                  style={{
                                    border: "1px solid black",
                                    padding: "2px 4px",
                                    textAlign: "left",
                                  }}
                                >
                                  {itemTotal}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "2px 4px",
                                textAlign: "left",
                              }}
                            >
                              সাধারণ আইটেম
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "2px 4px",
                                textAlign: "left",
                              }}
                            >
                              {invoiceBill}
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "2px 4px",
                                textAlign: "left",
                              }}
                            >
                              1
                            </td>
                            <td
                              style={{
                                border: "1px solid black",
                                padding: "2px 4px",
                                textAlign: "left",
                              }}
                            >
                              {invoiceBill}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                              fontWeight: "bold",
                            }}
                          >
                            মোট পরিমাণ
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                              fontWeight: "bold",
                            }}
                          >
                            {totalQty || 1}
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "left",
                            }}
                          ></td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            ইনভয়েস বিল =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {invoiceBill}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            পূর্বের বাকী =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {prevDue}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            মোট বিল =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {totalBill}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            পেমেন্ট =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {payment}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            ইনভয়েস বাকি =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {invoiceDue}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="3"
                            style={{
                              border: "1px solid black",
                              padding: "2px 8px",
                              textAlign: "right",
                            }}
                          >
                            মোট বাকি =
                          </td>
                          <td
                            style={{
                              border: "1px solid black",
                              padding: "2px 4px",
                              textAlign: "right",
                            }}
                          >
                            {totalDue}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan="4"
                            style={{
                              border: "1px solid black",
                              padding: "4px",
                              textAlign: "center",
                              fontSize: "8px",
                              fontStyle: "italic",
                              fontWeight: "600",
                            }}
                          >
                            SOFTWARE DEVELOPED BY WWW.SOFTZENIT.COM
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceCreate;
