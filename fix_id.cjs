const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/data/products.js');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(
  'name: "15kg LG Titan Gas Dryer",\n    category: "LG Commercial Laundry Machines",',
  'id: 150,\n    name: "15kg LG Titan Gas Dryer",\n    category: "LG Commercial Laundry Machines",'
);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ID');
