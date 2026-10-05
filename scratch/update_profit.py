import sys

file_path = r'c:\Users\SoftZen It\rajdhane_garments\src\pages\account\Profit.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<PrintHeader />', '<PrintHeader showOnScreen={true} />')

table_start = content.find('<table className="custom-table"')
table_end = content.find('</table>', table_start) + len('</table>')

new_table = """<table className="custom-table" style={{ border: '1px solid #000', width: '100%', boxShadow: 'none', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', padding: '6px', background: '#808080', color: '#000', borderRight: '1px solid #000', width: '60%', borderBottom: '1px solid #000', fontWeight: 'bold' }}>{t("টাইটেল", "Title")}</th>
                  <th style={{ textAlign: 'center', padding: '6px', background: '#808080', color: '#000', width: '40%', borderBottom: '1px solid #000', fontWeight: 'bold' }}>{t("টাকা", "Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (!profitData || Object.keys(profitData).length === 0) return null;
                  
                  const layout = [
                    { key: "Total Sales", label: t("মোট বিক্রয়") },
                    { key: "Cost of Sold Goods", label: t("মোট ক্রয় মূল্য") },
                    { key: "Previous Due", label: t("পূর্বের বাকি") },
                    { key: "Total Due", label: t("মোট বাকি") },
                    { key: "Total Receive", label: t("মোট জমা") },
                    { key: "Total Expense", label: t("মোট ব্যয়") },
                    { key: "Opening Balance", label: t("প্রারম্ভিক ব্যালেন্স") },
                    { key: "Total Balance", label: t("মোট ব্যালেন্স") },
                    { key: "Gross Profit", label: t("গ্রস প্রফিট") },
                    { key: "Discount", label: t("ডিসকাউন্ট") },
                    { key: "Product Profit", label: t("পণ্য প্রফিট") },
                    { key: "Net Profit", label: t("নিট প্রফিট") }
                  ];

                  return layout.map((item, idx) => {
                    let val = profitData[item.key];
                    if (val === undefined) val = "৳ 0.00";
                    if (typeof val === 'number') val = `৳ ${val.toFixed(2)}`;
                    
                    if (item.key === "Gross Profit" && (val === "৳ 0.00" || val === undefined)) {
                       val = profitData["Total Sales"] || "৳ 0.00";
                    }

                    return (
                      <tr key={item.key} style={{ background: '#ffffff' }}>
                        <td style={{ textAlign: 'left', padding: '4px 10px', borderRight: '1px solid #000', borderBottom: '1px solid #000', fontWeight: '500', color: '#000', fontSize: '13px' }}>
                          {item.label}
                        </td>
                        <td style={{ 
                          textAlign: 'right', 
                          padding: '4px 10px', 
                          borderBottom: '1px solid #000',
                          fontWeight: '500', 
                          fontSize: '13px',
                          color: '#000' 
                        }}>
                          {val}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {loading && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("Loading profit data...")}</td>
                  </tr>
                )}
                {!loading && Object.keys(profitData || {}).length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t("No profit records found for the selected period.")}</td>
                  </tr>
                )}
              </tbody>
            </table>"""

content = content[:table_start] + new_table + content[table_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
