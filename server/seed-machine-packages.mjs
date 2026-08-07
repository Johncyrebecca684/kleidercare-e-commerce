import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const machinePackages = [
  {
    id: "119",
    name: "Giant Electric 10kg Stacker",
    category: "Stacker",
    price: 180000,
    originalPrice: 185000,
    rating: 5.0,
    reviews: 32,
    image: "/10kglggiantwasher.png",
    description: "Complete 10kg Giant Electric Commercial Laundry Stacker featuring LG 10 Kg Giant C Washer (CWG27MD0HS.ASSPEIL) and LG 10 KG Giant C Dryer Electric (RV1329C7T.ASSQEEU).",
    badge: "Best Seller",
    sku: "STK-LG-GIANT-ELEC-10KG",
    stock: 50,
    stockStatus: "In Stock",
    specifications: {
      "Washer Model": "CWG27MD0HS.ASSPEIL (LG 10 Kg Giant C Washer)",
      "Dryer Model": "RV1329C7T.ASSQEEU (LG 10 KG Giant C Dryer Electric)",
      "Capacity": "10 Kg",
      "Heating Type": "Electric",
      "Brand": "LG Commercial",
      "Stacker Includes": "1 x LG 10kg Giant Washer + 1 x LG 10kg Giant Electric Dryer"
    }
  },
  {
    id: "120",
    name: "Giant GAS 10kg Stacker",
    category: "Stacker",
    price: 180000,
    originalPrice: 185000,
    rating: 5.0,
    reviews: 28,
    image: "/10kglggiantwasher.png",
    description: "High-efficiency Commercial Laundry Stacker featuring LG 10 Kg Giant C Washer (CWG27MD0HS.ASSPEIL) and LG 10 KG Giant Dryer GAS (RN1329AN7S.ASSQEEU).",
    badge: "Stacker",
    sku: "STK-LG-GIANT-GAS-10KG",
    stock: 50,
    stockStatus: "In Stock",
    specifications: {
      "Washer Model": "CWG27MD0HS.ASSPEIL (LG 10 Kg Giant C Washer)",
      "Dryer Model": "RN1329AN7S.ASSQEEU (LG 10 KG Giant Dryer GAS)",
      "Capacity": "10 Kg",
      "Heating Type": "GAS",
      "Brand": "LG Commercial",
      "Stacker Includes": "1 x LG 10kg Giant Washer + 1 x LG 10kg Giant Gas Dryer"
    }
  },
  {
    id: "121",
    name: "Titan ELECTRIC 15kg Stacker",
    category: "Stacker",
    price: 275000,
    originalPrice: 280000,
    rating: 5.0,
    reviews: 45,
    image: "/titanwasher.png",
    description: "Heavy-duty 15kg Titan Commercial Laundry Stacker featuring LG 15 Kg Titan C Washer (CWT29MD0HS.ASSPEIL) and LG Titan Dryer 15KG ELECTRIC (RV1840CD7.ASSQEEU).",
    badge: "Premium",
    sku: "STK-LG-TITAN-ELEC-15KG",
    stock: 50,
    stockStatus: "In Stock",
    specifications: {
      "Washer Model": "CWT29MD0HS.ASSPEIL (LG 15 Kg Titan C Washer)",
      "Dryer Model": "RV1840CD7.ASSQEEU (LG Titan Dryer 15KG ELECTRIC)",
      "Capacity": "15 Kg",
      "Heating Type": "Electric",
      "Brand": "LG Commercial",
      "Stacker Includes": "1 x LG 15kg Titan Washer + 1 x LG 15kg Titan Electric Dryer"
    }
  },
  {
    id: "122",
    name: "Titan GAS 15kg Stacker",
    category: "Stacker",
    price: 275000,
    originalPrice: 280000,
    rating: 5.0,
    reviews: 40,
    image: "/titanwasher.png",
    description: "Heavy-duty 15kg Titan Commercial Gas Laundry Stacker featuring LG 15 Kg Titan C Washer (CWT29MD0HS.ASSPEIL) and LG 15KG Dryer GAS (RN1840CD7.ASSQEEU).",
    badge: "Heavy Duty",
    sku: "STK-LG-TITAN-GAS-15KG",
    stock: 50,
    stockStatus: "In Stock",
    specifications: {
      "Washer Model": "CWT29MD0HS.ASSPEIL (LG 15 Kg Titan C Washer)",
      "Dryer Model": "RN1840CD7.ASSQEEU (LG 15KG Dryer GAS)",
      "Capacity": "15 Kg",
      "Heating Type": "GAS",
      "Brand": "LG Commercial",
      "Stacker Includes": "1 x LG 15kg Titan Washer + 1 x LG 15kg Titan Gas Dryer"
    }
  },
  {
    id: "123",
    name: "Wet PRO ELECTRIC 15kg Stacker",
    category: "Stacker",
    price: 300000,
    originalPrice: 310000,
    rating: 5.0,
    reviews: 52,
    image: "/titanwasher.png",
    description: "Premium Professional Wet Cleaning Stacker featuring LG 15 Kg Wet Cleaning Washer (CWT29CDOHS.ASSQEIL) and LG Wet Cleaning Dryer 15KG ELECTRIC (CDT29CUOES.ASSQEIL).",
    badge: "Wet Care",
    sku: "STK-LG-WETPRO-ELEC-15KG",
    stock: 50,
    stockStatus: "In Stock",
    specifications: {
      "Washer Model": "CWT29CDOHS.ASSQEIL (LG 15 Kg Wet Cleaning Washer)",
      "Dryer Model": "CDT29CUOES.ASSQEIL (LG Wet Cleaning Dryer 15KG ELECTRIC)",
      "Capacity": "15 Kg",
      "Application": "Professional Wet Cleaning & Garment Care",
      "Heating Type": "Electric",
      "Brand": "LG Commercial",
      "Stacker Includes": "1 x LG 15kg Wet Cleaning Washer + 1 x LG 15kg Wet Cleaning Electric Dryer"
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
    console.log('✅ Connected to MongoDB Atlas');

    // Clean up old package product names if present by ID or name
    await Product.deleteMany({
      name: {
        $in: [
          'Giant Electric 10kg Package',
          'Giant GAS 15kg Package',
          'Giant GAS 10kg Package',
          'Titan ELECTRIC 15kg Package',
          'Titan GAS 15kg Package',
          'Wet PRO ELECTRIC 15kg Package'
        ]
      }
    });

    for (const item of machinePackages) {
      await Product.findOneAndUpdate(
        { id: item.id },
        { $set: item },
        { upsert: true, new: true }
      );
      console.log(`Synced stacker: ${item.name}`);
    }

    console.log('✅ All 5 stackers successfully seeded into DB!');
  } catch (err) {
    console.error('❌ Error seeding DB:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
