import * as XLSX from 'xlsx';

/**
 * Export data to a real Excel (.xlsx) file and trigger browser download
 * @param {Array<Object>} data - Array of objects to write as rows
 * @param {string} fileName - Desired filename (without or with extension)
 * @param {string} sheetName - Name of the worksheet tab (default: 'Sheet1')
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Report') => {
  if (!data || data.length === 0) {
    alert("No data available to export to Excel.");
    return;
  }

  try {
    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-fit column widths dynamically
    const colWidths = Object.keys(data[0] || {}).map(key => {
      const maxLen = Math.max(
        key.toString().length,
        ...data.map(row => (row[key] !== null && row[key] !== undefined ? row[key].toString().length : 0))
      );
      return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
    });
    worksheet['!cols'] = colWidths;

    // Ensure filename ends with .xlsx
    const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download .xlsx file directly
    XLSX.writeFile(workbook, cleanFileName);
  } catch (error) {
    console.error("Excel Export Error:", error);
    alert("Failed to export Excel file. Please try again.");
  }
};

export default exportToExcel;
