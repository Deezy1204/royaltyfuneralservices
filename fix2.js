const fs = require('fs');
const path = require('path');

const filePath = path.join(
  'c:\\', 'Users', 'Administrator', 'Desktop', 'Phone Backup', 
  'Royalty', 'royalty-funeral-admin', 'src', 'app', 
  '(dashboard)', 'commissions', 'page.tsx'
);

let content = fs.readFileSync(filePath, 'utf8');
console.log('File loaded, length:', content.length);

// Check what we have
const hasOldPattern = content.includes("agent.status === \"PAID\"");
console.log('Has PAID status check:', hasOldPattern);

if (hasOldPattern) {
  // Use a regex that handles CRLF or LF line endings
  const newContent = content.replace(
    /\{agent\.status === "PAID" \? \(\s+<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-\[10px\] font-bold">Paid<\/Badge>\s+\) : agent\.totalCommission > 0 \? \(/,
    '{agent.totalCommission === 0 ? (\n                                 <span className="text-xs text-gray-400 italic">No Activity</span>\n                               ) : agent.status === "PAID" ? (\n                                 <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold">Paid</Badge>\n                               ) : ('
  );
  
  const hasNoActivity = content.includes(') : (\n                                 <span className="text-xs text-gray-400 italic">No Activity</span>');
  
  if (newContent !== content) {
    // Also remove the old "No Activity" at the end since we moved it to the top
    const finalContent = newContent.replace(
      /\) : \(\r?\n\s+<span className="text-xs text-gray-400 italic">No Activity<\/span>\r?\n\s+\)\}/,
      ')}'
    );
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('SUCCESS: Commission PAID badge fix applied!');
  } else {
    console.log('Regex pattern did not match. Showing current content around PAID check...');
    const idx = content.indexOf('agent.status === "PAID"');
    console.log(JSON.stringify(content.slice(Math.max(0, idx-5), idx+400)));
  }
}
