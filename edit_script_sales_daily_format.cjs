const fs = require('fs');

const filePath = 'c:/Users/SoftZen It/rajdhane_garments/src/pages/sales-report/SalesDaily.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Date formatting
const oldDateBlock = `                      <td style={{ padding: '8px 4px' }}>{(() => {
        let d = row.date || row.issued_date || row.created_at;
        if (!d) return '-';
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
        } catch(e) { return d; }
      })()}</td>`;

const newDateBlock = `                      <td style={{ padding: '8px 4px' }}>{(() => {
        let d = row.date || row.issued_date || row.created_at;
        if (!d) return '-';
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return d;
          const pad = n => n < 10 ? '0' + n : n;
          const datePart = pad(dt.getDate()) + '-' + pad(dt.getMonth() + 1) + '-' + dt.getFullYear();
          let h = dt.getHours();
          const m = pad(dt.getMinutes());
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          h = h ? h : 12;
          return (
            <div>
              <div>{datePart}</div>
              <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{pad(h)}:{m} {ampm}</div>
            </div>
          );
        } catch(e) { return d; }
      })()}</td>`;

code = code.replace(oldDateBlock, newDateBlock);

// 2. Client details formatting
const oldClientBlock = `<td style={{ padding: '8px 4px' }}>{row.client_name || row.client || '-'}</td>`;
const newClientBlock = `<td style={{ padding: '8px 4px' }}>
                        <div>{row.client_name || row.client || '-'}</div>
                        <div style={{ fontSize: 'var(--fs-9, 9px)', color: '#64748b' }}>{row.client_phone || row.phone || ''}</div>
                      </td>`;

code = code.replace(oldClientBlock, newClientBlock);

fs.writeFileSync(filePath, code);
console.log("Updated date format and client details in SalesDaily.jsx");
