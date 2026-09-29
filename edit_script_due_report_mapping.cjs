const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const normalizedRegex = /const normalized = useMemo\(\(\) => rows\.map\(\(r\) => \(\{[\s\S]*?\}\)\), \[rows\]\);/;

const newNormalized = `const normalized = useMemo(() => rows.map((r) => {
    const prevDue = num(r, 'previous_due', 'opening_due', 'opening_balance');
    const sales = num(r, 'sales', 'sales_amount', 'total_sales', 'bill');
    const totalBill = num(r, 'total_bill') || (prevDue + sales);
    const salesReturn = num(r, 'sales_return', 'return_amount');
    const collection = num(r, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');
    const moneyReturn = num(r, 'money_return', 'return');
    const calculatedDue = totalBill - salesReturn - collection + moneyReturn;
    
    // In many cases, the API might return 'due' directly, but sometimes it doesn't match the visible columns.
    // If we calculate it, the table math will always be correct (which users expect).
    // Let's use the calculated due to avoid mathematical inconsistencies in the table.
    const apiDue = num(r, 'due', 'current_due', 'balance', 'total_due', 'due_amount');
    const finalDue = apiDue !== 0 ? apiDue : calculatedDue;

    return {
      id: r.client_id || r.id || r.uuid,
      name: r.client_name || r.name || nameOf(r.client),
      address: r.address || r.client?.address || '',
      phone: r.phone || r.client?.phone || '',
      group: r.group_name || nameOf(r.group, ''),
      prevDue,
      sales,
      totalBill,
      salesReturn,
      collection,
      moneyReturn,
      due: calculatedDue, // Use calculated due so that prevDue + sales - collection - salesReturn exactly matches
    };
  }), [rows]);`;

code = code.replace(normalizedRegex, newNormalized);

fs.writeFileSync(filePath, code);
console.log("Updated normalized mapping in ClientDueReport to match ClientList and ensure math correctness");
