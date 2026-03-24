const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('policy.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('policy_text.txt', data.text);
    console.log('Saved to policy_text.txt');
}).catch(function(error) {
    console.error('Error parsing PDF:', error);
});
