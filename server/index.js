import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import crypto from 'crypto';
import tls from 'tls';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import Product from './models/Product.js';
import { products as defaultProducts } from '../src/data/products.js';

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create a secure context with legacy renegotiation enabled for Node v24+ OpenSSL 3.x compatibility
const secureContext = tls.createSecureContext({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://kleidercare-e-commerce.vercel.app', 'https://laundryecommerce.com', 'https://www.laundryecommerce.com'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      secureContext: secureContext
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    // Seed initial products if collection is empty
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('📦 Product collection is empty. Seeding initial products...');
        const formattedProducts = defaultProducts.map(p => ({
          id: String(p.id),
          name: p.name,
          category: p.category,
          price: p.price,
          originalPrice: p.originalPrice || p.price,
          rating: p.rating || 4.5,
          reviews: p.reviews || 0,
          image: p.image,
          description: p.description || '',
          badge: p.badge || null,
          specifications: p.specifications || {}
        }));
        await Product.insertMany(formattedProducts);
        console.log(`✅ Seeded ${formattedProducts.length} default products into database.`);
      }
    } catch (seedErr) {
      console.error('❌ Error auto-seeding products:', seedErr.message);
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will start anyway. MongoDB will auto-reconnect when available.');
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('📦 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('📦 Mongoose disconnected');
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
