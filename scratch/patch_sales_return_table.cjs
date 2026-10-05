const fs = require('fs');

const filePath = 'c:\\Users\\SoftZen It\\rajdhane_garments\\src\\pages\\invoice\\SalesReturnCreate.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// I will just use regex to replace the whole <tbody> block up to </tbody>
const tbodyStart = content.indexOf('<tbody>');
const tbodyEnd = content.indexOf('</tbody>', tbodyStart) + 8;

if (tbodyStart !== -1 && tbodyEnd > tbodyStart) {
    const newTbody = `<tbody>
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
                          "No return items added yet. Select a product from dropdown or scan barcode.",
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
                        style={{ borderBottom: "1px solid #e2e8f0", background: "#e2e8f0" }}
                      >
                        <td style={{ padding: "4px" }}>
                          <div style={ashBox}>{idx + 1}</div>
                        </td>
                        <td style={{ padding: "4px" }}>
                          <div style={{ ...ashBox }}>
                            {item.name} {item.barcode && \`| \${item.barcode}\`}
                          </div>
                        </td>
                        <td style={{ padding: "4px" }}>
                          <div style={ashBox}>{item.stock}</div>
                        </td>
                        <td style={{ padding: "4px" }}>
                          <input
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
                                  \`input[data-qty-idx="\${idx + 1}"]\`,
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
                            style={ashInput}
                          />
                        </td>
                        <td style={{ padding: "4px" }}>
                          <div style={ashBox}>{item.unit}</div>
                        </td>
                        <td style={{ padding: "4px" }}>
                          <div style={ashBox}>
                            ৳ {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </td>
                        <td style={{ padding: "4px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <import_lucide_x />
                          </button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>`;
    // Wait, <import_lucide_x /> needs to be <X size={18} />
    const finalNewTbody = newTbody.replace('<import_lucide_x />', '<X size={18} />');
    
    content = content.substring(0, tbodyStart) + finalNewTbody + content.substring(tbodyEnd);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Done');
} else {
    console.log('Failed');
}
