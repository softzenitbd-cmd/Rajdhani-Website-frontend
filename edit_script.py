import sys
with open('c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\product\\PurchaseCreate.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update table wrapper
old_table = r'''            {/* Table */}
            <div
              style={{
                overflowX: "auto",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
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
                <thead>'''

new_table = r'''            {/* Table */}
            <div
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "450px",
                border: "1px solid #e2e8f0",
                marginBottom: "24px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
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
                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>'''

if old_table in content:
    content = content.replace(old_table, new_table)
else:
    content = re.sub(old_table.replace('\n', '\r\n'), new_table.replace('\n', '\r\n'), content)


# 2. Update bottom fields
old_totals = r'''              {/* Right Column totals */}
              <div
                style={{
                  flex: "1 1 300px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-11, 11px)",
                      color: "#64748b",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("Purchase Bill")}
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "var(--fs-15, 15px)",
                    }}
                  >
                    ৳ {totalBuying.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "6px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-11, 11px)",
                      color: "#047857",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("Grand Total")}
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "var(--fs-15, 15px)",
                    }}
                  >
                    ৳ {grandTotal.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-11, 11px)",
                      color: "#b91c1c",
                      textTransform: "uppercase",
                    }}
                  >
                    {t("Due")}
                  </div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "var(--fs-15, 15px)",
                    }}
                  >
                    ৳ {totalDue.toFixed(2)}
                  </div>
                </div>
              </div>'''

new_totals = r'''              {/* Right Column totals */}
              <div
                style={{
                  flex: "1 1 300px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-13, 13px)",
                      color: "#475569",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {t("Purchase Bill")}
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-18, 18px)",
                      color: "#1e293b"
                    }}
                  >
                    ৳ {totalBuying.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                    border: "1px solid #10b981",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 4px 6px rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-13, 13px)",
                      color: "#047857",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {t("Grand Total")}
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-20, 20px)",
                      color: "#065f46"
                    }}
                  >
                    ৳ {grandTotal.toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                    border: "1px solid #ef4444",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 4px 6px rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-13, 13px)",
                      color: "#b91c1c",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    {t("Due")}
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                      fontSize: "var(--fs-20, 20px)",
                      color: "#991b1b"
                    }}
                  >
                    ৳ {totalDue.toFixed(2)}
                  </div>
                </div>
              </div>'''

if old_totals in content:
    content = content.replace(old_totals, new_totals)
else:
    content = re.sub(old_totals.replace('\n', '\r\n'), new_totals.replace('\n', '\r\n'), content)


# 3. Update buy button
old_button = r'''            <div className="invoice-fixed-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSubmitPurchase(1)}
                disabled={submitting}
                style={{
                  background: "var(--success)",
                  padding: "10px 24px",
                  fontSize: "var(--fs-14, 14px)",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                {isEditMode ? t("Update") : t("Buy")}
              </button>
            </div>'''

new_button = r'''            <div className="invoice-fixed-footer" style={{ display: "flex", justifyContent: "center", padding: "16px 0", marginTop: "24px", position: "relative", zIndex: 20 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleSubmitPurchase(1)}
                disabled={submitting}
                style={{
                  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  padding: "14px 48px",
                  fontSize: "var(--fs-16, 16px)",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                  transition: "transform 0.1s ease, box-shadow 0.1s ease",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(34, 197, 94, 0.4)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.3)"; }}
              >
                {isEditMode ? t("Update") : t("Buy")}
              </button>
            </div>'''

if old_button in content:
    content = content.replace(old_button, new_button)
else:
    content = re.sub(old_button.replace('\n', '\r\n'), new_button.replace('\n', '\r\n'), content)

with open('c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\product\\PurchaseCreate.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
