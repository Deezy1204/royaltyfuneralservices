const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'commissions', 'page.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Fix: check totalCommission === 0 first (before status === PAID check)
const oldPattern = `{agent.status === "PAID" ? (
                                 <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold">Paid</Badge>
                               ) : agent.totalCommission > 0 ? (
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleMarkAsPaid(agent.id, agent.totalCommission);
                                   }}
                                 >
                                   Mark Paid
                                 </Button>
                               ) : (
                                 <span className="text-xs text-gray-400 italic">No Activity</span>
                               )}`;

const newPattern = `{agent.totalCommission === 0 ? (
                                 <span className="text-xs text-gray-400 italic">No Activity</span>
                               ) : agent.status === "PAID" ? (
                                 <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold">Paid</Badge>
                               ) : (
                                 <Button 
                                   size="sm" 
                                   variant="outline" 
                                   className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleMarkAsPaid(agent.id, agent.totalCommission);
                                   }}
                                 >
                                   Mark Paid
                                 </Button>
                               )}`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Commission PAID badge fix applied.');
} else {
  console.log('PATTERN NOT FOUND. Searching for alternatives...');
  // Show what we have instead
  const idx = content.indexOf('agent.status === "PAID"');
  if (idx !== -1) {
    console.log('Found agent.status check at index:', idx);
    console.log('Content around it:', JSON.stringify(content.slice(idx - 5, idx + 300)));
  }
}
