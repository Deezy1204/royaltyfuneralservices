const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Administrator', 'Desktop', 'Phone Backup', 'Royalty', 'royalty-funeral-admin', 'WEB SAMPLE EXCELL FORM(1771836195585) (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
data.slice(0, 50).forEach((row, index) => {
    const cleanRow = row.filter(cell => cell !== null && cell !== undefined);
    if (cleanRow.length > 0) {
        console.log(`Row ${index}:`, JSON.stringify(cleanRow));
    }
});
