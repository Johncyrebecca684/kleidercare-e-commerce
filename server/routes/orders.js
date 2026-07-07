import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Helper middleware to make auth optional for order creation (supporting guest checkouts)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

// Create a new order
// POST /api/orders
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      userEmail,
      phone,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId
    } = req.body;

    const isRazorpayRequired = paymentMethod !== 'Cash' && paymentMethod !== 'UPI';
    if (!customerName || !userEmail || !phone || !shippingAddress || !items || !totalAmount || !paymentMethod || (isRazorpayRequired && !razorpayOrderId)) {
      return res.status(400).json({ message: 'Missing required order details' });
    }

    const orderData = {
      customerName,
      userEmail,
      phone,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentStatus || (paymentMethod === 'Cash' || paymentMethod === 'UPI' ? 'Pending' : 'Paid'),
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      status: 'Processing'
    };

    if (req.userId) {
      orderData.user = req.userId;
    }

    const order = new Order(orderData);
    await order.save();

    console.log(`📦 Order ${order._id} successfully saved to MongoDB`);
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('❌ Failed to save order:', error);
    res.status(500).json({ message: 'Failed to create order in database', error: error.message });
  }
});

// Get logged-in user's orders
// GET /api/orders/my-orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('❌ Failed to fetch user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders', error: error.message });
  }
});

// Get all orders (Admin Dashboard)
// GET /api/orders/admin-all
router.get('/admin-all', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('❌ Failed to fetch all orders for admin:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

export default router;
