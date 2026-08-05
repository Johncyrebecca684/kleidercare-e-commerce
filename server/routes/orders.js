import express from 'express';
import mongoose from 'mongoose';
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
      companyName,
      gstNumber,
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      installationAddon,
      summaryBreakdown,
      warranty
    } = req.body;

    const isRazorpayRequired = paymentMethod !== 'Cash' && paymentMethod !== 'UPI';
    if (!customerName || !userEmail || !phone || !shippingAddress || !items || !totalAmount || !paymentMethod || (isRazorpayRequired && !razorpayOrderId)) {
      return res.status(400).json({ message: 'Missing required order details' });
    }

    const orderData = {
      customerName,
      userEmail,
      phone,
      companyName: companyName || '',
      gstNumber: gstNumber || '',
      shippingAddress,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentStatus || (paymentMethod === 'Cash' || paymentMethod === 'UPI' ? 'Pending' : 'Paid'),
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      status: 'Processing',
      installationAddon: installationAddon || { selected: false, fee: 0 },
      summaryBreakdown: summaryBreakdown || {},
      warranty: warranty || 'Active (1 Year)'
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

// Update order status, setup, or paymentStatus (Admin only)
// PUT /api/orders/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { status, setup, paymentStatus } = req.body;
    const orderId = req.params.id;

    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }] };
    } else {
      query = { orderId: orderId };
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status !== undefined) order.status = status;
    if (setup !== undefined) order.setup = setup;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Failed to update order:', error);
// Update order payment status when user pays COD order online via Razorpay
// PUT /api/orders/pay-online/:id
router.put('/pay-online/:id', optionalAuth, async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, paymentMethod } = req.body;
    const orderId = req.params.id;

    let query;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ _id: orderId }, { orderId: orderId }] };
    } else {
      query = { orderId: orderId };
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentMethod = paymentMethod || 'Online (Razorpay)';
    order.paymentStatus = 'Paid';
    if (razorpayPaymentId) order.razorpayPaymentId = razorpayPaymentId;
    if (razorpayOrderId) order.razorpayOrderId = razorpayOrderId;

    await order.save();
    console.log(`✅ Order ${order._id} updated to Paid via Online Razorpay payment`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Failed to update order payment:', error);
    res.status(500).json({ message: 'Failed to update order payment', error: error.message });
  }
});

export default router;
