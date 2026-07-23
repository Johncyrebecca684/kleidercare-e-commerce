const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/products.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /name: "10kg LG Giant Washer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "10kg LG Giant Washer",\n    category: "LG Commercial Laundry Machines",\n    price: 107300,'
);

content = content.replace(
  /name: "10kg LG Giant Electric Dryer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "10kg LG Giant Electric Dryer",\n    category: "LG Commercial Laundry Machines",\n    price: 77700,'
);

content = content.replace(
  /name: "10kg LG Giant Gas Dryer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "10kg LG Giant Gas Dryer",\n    category: "LG Commercial Laundry Machines",\n    price: 77700,'
);

content = content.replace(
  /name: "15kg LG Titan Washer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "15kg LG Titan Washer",\n    category: "LG Commercial Laundry Machines",\n    price: 162400,'
);

content = content.replace(
  /name: "LG 15 Kg Wet Cleaning Washer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "LG 15 Kg Wet Cleaning Washer",\n    category: "LG Commercial Laundry Machines",\n    price: 188500,'
);

content = content.replace(
  /name: "15kg LG Titan Electric Dryer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
  'name: "15kg LG Titan Electric Dryer",\n    category: "LG Commercial Laundry Machines",\n    price: 117600,'
);

if (!content.includes('"15kg LG Titan Gas Dryer"')) {
  content = content.replace(
    /name: "LG Wet Cleaning Dryer 15KG \(ELECTRIC\)",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,/g,
    'id: 150,\n    name: "15kg LG Titan Gas Dryer",\n    category: "LG Commercial Laundry Machines",\n    price: 117600,\n    rating: 5.0,\n    reviews: 112,\n    image: "/titan-electric-dryer.png",\n    description: "Built for high performance, the LG Titan Gas Dryer offers fast drying with exceptional energy efficiency for your laundry needs.",\n    badge: "New",\n    specifications: {\n      "Capacity": "15 Kg",\n      "Loading Type": "Front Loading",\n      "Automation Grade": "Automatic",\n      "Drum Volume": "300 L",\n      "Voltage": "220 V"\n    }\n  },\n  {\n    id: 43,\n    name: "LG Wet Cleaning Dryer 15KG (ELECTRIC)",\n    category: "LG Commercial Laundry Machines",\n    price: 136500,'
  );
}

// Now handle the Stack Washer/Dryer (ID 19)
content = content.replace(
  /name: "10kg LG Giant Stack Washer\/Dryer",\s*category: "LG Commercial Laundry Machines",\s*price: \d+,\s*originalPrice: \d+,/g,
  'name: "10kg LG Giant Stack Washer/Dryer",\n    category: "LG Commercial Laundry Machines",\n    price: 185000,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
