const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/components/ClientDueReport.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const normalizedRegex = /const normalized = useMemo\(\(\) => rows\.map\(\(r\) => \{[\s\S]*?\}\), \[rows\]\);/;

const newNormalized = `const normalized = useMemo(() => rows.map((r) => {
    const prevDue = num(r, 'previous_due', 'opening_due', 'opening_balance');
    const sales = num(r, 'sales', 'sales_amount', 'total_sales', 'bill');
    const totalBill = num(r, 'total_bill') || (prevDue + sales);
    const salesReturn = num(r, 'sales_return', 'return_amount');
    const collection = num(r, 'collection', 'receive', 'payment', 'paid', 'total_receive', 'amount_received');
    const moneyReturn = num(r, 'money_return', 'return');
    
    // We MUST use the exact due returned by the API. 
    // Calculating it manually causes discrepancies because of hidden discounts or backend-specific logic.
    // If the API due is completely missing, we fallback to a safe calculation.
    const apiDue = num(r, 'due', 'current_due', 'balance', 'total_due', 'due_amount');
    
    // Check if the API explicitly provided a due field (even if it's 0)
    let finalDue = apiDue;
    if (r.due === undefined && r.current_due === undefined && r.balance === undefined) {
       finalDue = totalBill - salesReturn - collection + moneyReturn;
    }

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
      due: finalDue,
    };
  }), [rows]);`;

code = code.replace(normalizedRegex, newNormalized);

fs.writeFileSync(filePath, code);
console.log("Reverted ClientDueReport due mapping to use exact API response");
