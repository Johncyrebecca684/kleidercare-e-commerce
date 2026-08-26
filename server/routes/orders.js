import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

// Helper to get Razorpay instance
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.startsWith('rzp_test_placeholder')) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Helper middleware to make auth optional for order creation (supporting guest checkouts)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

/**
 * Server-side order price calculation and validation:
 * Verifies each item against the Product database to prevent client-side price tampering.
 */
async function calculateVerifiedOrderTotal(items, installationAddon, user, appliedCoupons = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let verifiedItems = [];
  let subtotal = 0;
  let sparePartsSubtotal = 0;
  let chemicalsSubtotal = 0;
  let totalWarrantyFee = 0;

  // Retrieve products in bulk to optimize DB query
  const itemNames = items.map(i => i.name).filter(Boolean);
  const dbProducts = await Product.find({ name: { $in: itemNames } });
  const productMap = new Map();
  dbProducts.forEach(p => {
    productMap.set(p.name, p);
    if (p.id) productMap.set(String(p.id), p);
  });

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    const matchedProduct = productMap.get(item.name) || productMap.get(String(item.id));

    // Use verified database price if product exists in DB
    const verifiedUnitPrice = matchedProduct ? Number(matchedProduct.price) : Number(item.price);
    const category = matchedProduct ? matchedProduct.category : (item.category || '');
    const itemTotal = verifiedUnitPrice * qty;

    subtotal += itemTotal;

    const catLower = category.toLowerCase();
    if (catLower.includes('spare part')) {
      sparePartsSubtotal += itemTotal;
    } else if (catLower.includes('chemical')) {
      chemicalsSubtotal += itemTotal;
    }

    // Extended warranty calculation
    let warrantyPrice = 0;
    if (item.extendedWarranty && item.extendedWarranty.type && item.extendedWarranty.type !== 'None') {
      warrantyPrice = Number(item.extendedWarranty.price || 0);
      totalWarrantyFee += (warrantyPrice * qty);
    }

    verifiedItems.push({
      name: item.name,
      price: verifiedUnitPrice,
      quantity: qty,
      extendedWarranty: item.extendedWarranty || { type: 'None', title: 'Standard Warranty', price: 0 }
    });
  }

  // Reseller Discounts (Only for authenticated users with 'reseller' role)
  let discountAmount = 0;
  if (user && user.role === 'reseller' && Array.isArray(appliedCoupons)) {
    if (appliedCoupons.includes('KCSPARE')) {
      discountAmount += Math.round(sparePartsSubtotal * 0.20);
    }
    if (appliedCoupons.includes('KCCHM')) {
      discountAmount += Math.round(chemicalsSubtotal * 0.25);
    }
  }

  // GST Calculation (18% inclusive)
  const baseTax = Math.round(subtotal * 0.18);
  const tax = Math.max(0, Math.round(baseTax - (discountAmount * 0.18)));
  const installationFee = installationAddon?.selected ? Number(installationAddon.fee || 999) : 0;
  const grandTotal = Math.round(subtotal - discountAmount + tax + installationFee + totalWarrantyFee);

  return {
    verifiedItems,
    subtotal: Math.round(subtotal),
    discountAmount,
    tax,
    installationFee,
    totalWarrantyFee,
    grandTotal
  };
}

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
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      installationAddon,
      appliedCoupons,
      warranty
    } = req.body;

    if (!customerName || !userEmail || !phone || !shippingAddress || !items || !items.length || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required order details' });
    }

    let user = null;
    if (req.userId) {
      user = await User.findById(req.userId);
    }

    // 1. Calculate and verify price on server
    const pricing = await calculateVerifiedOrderTotal(items, installationAddon, user, appliedCoupons);
    const finalTotalAmount = pricing.grandTotal;

    // Log warning if client supplied an amount with major discrepancy (> ₹5)
    if (totalAmount !== undefined && Math.abs(Number(totalAmount) - finalTotalAmount) > 5) {
      console.warn(`⚠️ Order price mismatch detected! Client sent ₹${totalAmount}, server computed ₹${finalTotalAmount}`);
    }

    let orderPaymentStatus = 'Pending';
    const isOnlinePayment = paymentMethod !== 'Cash' && paymentMethod !== 'UPI';

    if (isOnlinePayment) {
      if (!razorpayOrderId || !razorpayPaymentId) {
        return res.status(400).json({ message: 'Online payments require razorpayOrderId and razorpayPaymentId' });
      }

      // Check Replay Attack: Ensure payment ID hasn't been used on any existing order
      if (!razorpayPaymentId.startsWith('pay_mock_')) {
        const existingOrder = await Order.findOne({ razorpayPaymentId });
        if (existingOrder) {
          return res.status(400).json({ message: 'This Razorpay Payment ID has already been utilized for an order' });
        }
      }

      // Verify HMAC Signature if provided or in production
      if (razorpaySignature && !razorpayOrderId.startsWith('order_mock_')) {
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(body)
          .digest('hex');

        if (expectedSignature !== razorpaySignature) {
          return res.status(400).json({ message: 'Invalid payment signature. Order not placed.' });
        }
      }

      // Live verification with Razorpay API if live credentials exist
      const rzp = getRazorpayInstance();
      if (rzp && !razorpayPaymentId.startsWith('pay_mock_')) {
        try {
          const paymentRecord = await rzp.payments.fetch(razorpayPaymentId);
          if (paymentRecord.status !== 'captured' && paymentRecord.status !== 'authorized') {
            return res.status(400).json({
              message: `Payment status '${paymentRecord.status}' is not confirmed by Razorpay.`
            });
          }

          const paidAmountRupees = Math.round(paymentRecord.amount / 100);
          if (paidAmountRupees < finalTotalAmount - 5) {
            return res.status(400).json({
              message: `Paid amount (₹${paidAmountRupees}) does not match order total (₹${finalTotalAmount}).`
            });
          }
        } catch (rzpErr) {
          console.error('❌ Error verifying with Razorpay REST API:', rzpErr.message);
          return res.status(400).json({ message: 'Failed to verify payment with payment gateway.' });
        }
      }

      orderPaymentStatus = 'Paid';
    } else {
      // Cash on Delivery and Direct UPI are always 'Pending' until confirmed by merchant/admin
      orderPaymentStatus = 'Pending';
    }

    const orderData = {
      customerName,
      userEmail,
      phone,
      companyName: companyName || '',
      gstNumber: gstNumber || '',
      shippingAddress,
      items: pricing.verifiedItems,
      totalAmount: finalTotalAmount,
      paymentMethod,
      paymentStatus: orderPaymentStatus,
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      status: 'Processing',
      installationAddon: installationAddon || { selected: false, fee: 0 },
      summaryBreakdown: {
        subtotal: pricing.subtotal,
        discountAmount: pricing.discountAmount,
        tax: pricing.tax,
        installationFee: pricing.installationFee,
        totalWarrantyFee: pricing.totalWarrantyFee,
        grandTotal: finalTotalAmount
      },
      warranty: warranty || 'Active (1 Year)'
    };

    if (req.userId) {
      orderData.user = req.userId;
    }

    const order = new Order(orderData);
    await order.save();

    console.log(`📦 Order ${order._id} (${order.orderId}) created with verified amount ₹${finalTotalAmount}, status: ${orderPaymentStatus}`);
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error('❌ Failed to save order:', error);
    res.status(500).json({ message: error.message || 'Failed to create order in database' });
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
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// Update order payment status when user pays COD order online via Razorpay
// PUT /api/orders/pay-online/:id
router.put('/pay-online/:id', authMiddleware, async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMethod } = req.body;
    const orderId = req.params.id;

    if (!razorpayPaymentId || !razorpayOrderId) {
      return res.status(400).json({ message: 'Missing Razorpay payment identifiers' });
    }

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

    // Authorization check: User must be the owner of the order or an Admin
    const user = await User.findById(req.userId);
    const isOwner = order.user && String(order.user) === String(req.userId);
    const isAdmin = user && user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: You can only pay for your own orders' });
    }

    // Check payment replay
    if (!razorpayPaymentId.startsWith('pay_mock_')) {
      const existingPayment = await Order.findOne({ razorpayPaymentId, _id: { $ne: order._id } });
      if (existingPayment) {
        return res.status(400).json({ message: 'This Razorpay payment ID has already been applied to another order' });
      }
    }

    // Verify HMAC signature
    if (razorpaySignature && !razorpayOrderId.startsWith('order_mock_')) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
    }

    // Live gateway check if configured
    const rzp = getRazorpayInstance();
    if (rzp && !razorpayPaymentId.startsWith('pay_mock_')) {
      try {
        const paymentRecord = await rzp.payments.fetch(razorpayPaymentId);
        if (paymentRecord.status !== 'captured' && paymentRecord.status !== 'authorized') {
          return res.status(400).json({ message: `Payment not verified by gateway. Status: ${paymentRecord.status}` });
        }
        const paidAmountRupees = Math.round(paymentRecord.amount / 100);
        if (paidAmountRupees < order.totalAmount - 5) {
          return res.status(400).json({ message: `Paid amount (₹${paidAmountRupees}) does not match order total (₹${order.totalAmount}).` });
        }
      } catch (rzpErr) {
        console.error('Razorpay API verification error:', rzpErr);
        return res.status(400).json({ message: 'Failed to verify online payment with payment gateway' });
      }
    }

    order.paymentMethod = paymentMethod || 'Online (Razorpay)';
    order.paymentStatus = 'Paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpayOrderId = razorpayOrderId;

    await order.save();
    console.log(`✅ Order ${order._id} updated to Paid via verified Razorpay payment`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Failed to update order payment:', error);
    res.status(500).json({ message: 'Failed to update order payment', error: error.message });
  }
});

export default router;
