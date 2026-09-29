const fs = require('fs');

function updateShareToPDF(filePath, elementSelector, fileName, title) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');

    // Make sure shareAsPDF is imported
    if (!code.includes('shareAsPDF')) {
        code = code.replace(
            /(import .* from 'lucide-react';)/,
            "$1\nimport { shareAsPDF } from '../../utils/pdfShare';"
        );
    }

    // Replace the old navigator.share code with shareAsPDF
    const oldShareRegex = /onClick=\{async \(\) => \{\s*if \(navigator\.share\) \{[\s\S]*?\} else \{\s*alert[^}]+\}\s*\}\}/;
    
    const newShareCode = `onClick={async () => {
                  const btn = document.activeElement;
                  if(btn) btn.disabled = true;
                  try {
                    await shareAsPDF('${elementSelector}', '${fileName}', '${title}');
                  } finally {
                    if(btn) btn.disabled = false;
                  }
                }}`;
    
    if (code.match(oldShareRegex)) {
        code = code.replace(oldShareRegex, newShareCode);
        fs.writeFileSync(filePath, code);
        console.log('Updated Share button to PDF in ' + filePath);
    } else {
        console.log('Old share code not found in ' + filePath);
    }
}

updateShareToPDF(
    'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/ProductStockList.jsx',
    '.dashboard-content', // This is the wrapper class in ProductStockList
    'Stock_List.pdf',
    'Stock List'
);

updateShareToPDF(
    'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseList.jsx',
    '.modal-content', // The modal in PurchaseList
    'Purchase_Invoice.pdf',
    'Purchase Invoice'
);

updateShareToPDF(
    'c:/Users/SoftZen It/rajdhane_garments/src/pages/product/PurchaseReturnList.jsx',
    '.modal-content', // The modal in PurchaseReturnList
    'Purchase_Return_Voucher.pdf',
    'Purchase Return Voucher'
);

