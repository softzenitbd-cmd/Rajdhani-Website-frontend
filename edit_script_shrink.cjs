const fs = require('fs');
let code = fs.readFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', 'utf8');

const old_totals = `              {/* Right Column totals */}
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
              </div>`;

const new_totals = `              {/* Right Column totals */}
              <div
                style={{
                  flex: "1 1 300px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-12, 12px)",
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
                      fontSize: "var(--fs-14, 14px)",
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
                    borderRadius: "6px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-12, 12px)",
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
                      fontSize: "var(--fs-15, 15px)",
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
                    borderRadius: "6px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "var(--fs-12, 12px)",
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
                      fontSize: "var(--fs-15, 15px)",
                      color: "#991b1b"
                    }}
                  >
                    ৳ {totalDue.toFixed(2)}
                  </div>
                </div>
              </div>`;

code = code.replace(old_totals, new_totals);
if (code.indexOf(new_totals) === -1) {
    code = code.replace(old_totals.replace(/\n/g, '\r\n'), new_totals.replace(/\n/g, '\r\n'));
}

fs.writeFileSync('c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseCreate.jsx', code);
console.log('Done');
