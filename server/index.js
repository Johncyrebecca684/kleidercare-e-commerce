import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import crypto from 'crypto';
import tls from 'tls';
import serverless from 'serverless-http'; // <-- 1. Import serverless-http
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import Product from './models/Product.js';
import { products as defaultProducts } from '../src/data/products.js';

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const app = express();
// PORT is no longer strictly needed for Lambda, but kept for local testing if needed
const PORT = process.env.PORT || 5000; 

// Create a secure context with legacy renegotiation enabled for Node v24+ OpenSSL 3.x compatibility
const secureContext = tls.createSecureContext({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
});

// Private Network Access (PNA) preflight support
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

// CORS Configuration (supports Bluehost domain, local dev, and Vercel)
const allowedOrigins = [
  'https://www.laundryecommerce.com',
  'https://laundryecommerce.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://kleidercare-e-commerce.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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

// Connect to MongoDB
const connectDB = async () => {
  // Lambda connection caching strategy: Check if already connected to prevent exhausting pool
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4
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
          specifications: p.specifications || {},
          stock: p.stock !== undefined ? Number(p.stock) : 50,
          lowStockThreshold: p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 10,
          stockStatus: p.stockStatus || 'In Stock'
        }));
        await Product.insertMany(formattedProducts);
        console.log(`✅ Seeded ${formattedProducts.length} default products into database.`);
      }

      // Cleanup 'Paper' product if present in database
      await Product.deleteMany({ $or: [{ name: 'Paper' }, { id: '9999' }, { id: 'PROD-PAPER-1' }] });
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

// 2. Initialize DB connection outside the request handler for "cold start" optimization
connectDB();

if (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`🚀 Kleider Care Server running on http://localhost:${PORT}`);
  });
}

// 3. Export the serverless handler
export const handler = serverless(app);