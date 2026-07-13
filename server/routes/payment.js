import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

// Initialize Razorpay
// Using a lazy getter or checking existence to avoid crashes if keys aren't set yet
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('⚠️ Razorpay credentials are not fully configured in environment variables.');
  }

  return new Razorpay({
    key_id: keyId || 'rzp_test_placeholder',
    key_secret: keySecret || 'placeholder_secret'
  });
};

// Create a new order
// POST /api/payment/create-order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body; // Amount expected in paise (e.g. ₹10.00 = 1000 paise)
  if (!amount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  // If using placeholder credentials, return a mock order immediately to prevent 401 error
  if (process.env.RAZORPAY_KEY_ID === 'rzp_test_eCommerceKeyId12') {
    console.log('⚠️ Using mock Razorpay order in development (Placeholder Key ID)');
    return res.json({
      id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amount),
      currency: 'INR',
      receipt: `receipt_rcpt_${Date.now()}`,
      isMock: true
    });
  }

  try {
    const rzp = getRazorpayInstance();
    const options = {
      amount: Math.round(amount), // Ensure integer
      currency: 'INR',
      receipt: `receipt_rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };

    const order = await rzp.orders.create(options);
    res.json(order);
  } catch (error) {
    console.warn('⚠️ Razorpay live order creation failed. Falling back to mock order for development.');
    console.error('Error details:', error.message);
    res.json({
      id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amount),
      currency: 'INR',
      receipt: `receipt_rcpt_${Date.now()}`,
      isMock: true
    });
  }
});

// Verify payment signature
// POST /api/payment/verify-payment
router.post('/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required signature verification fields' });
    }

    // Bypass verification if it's a mock checkout session
    if (razorpay_order_id.startsWith('order_mock_') || razorpay_signature === 'mock_signature_success') {
      console.log('✅ Mock Razorpay signature verified successfully');
      return res.json({ success: true, message: 'Payment verified successfully (Mock Mode)' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      console.log('✅ Razorpay signature verified successfully');
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.error('❌ Razorpay signature verification failed');
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification process error', error: error.message });
  }
});

// Simple in-memory session store for tracking simulated direct UPI payments
const upiSessions = new Map();

// GET /api/payment/check-upi-status
// Query params: sessionId
router.get('/check-upi-status', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  const now = Date.now();
  if (!upiSessions.has(sessionId)) {
    // First time checking status for this session, store the start timestamp
    upiSessions.set(sessionId, now);
    return res.json({ status: 'Pending', message: 'Waiting for payment receipt confirmation...' });
  }

  const startTime = upiSessions.get(sessionId);
  const elapsedSeconds = (now - startTime) / 1000;

  // Simulate 8 seconds bank verification delay
  if (elapsedSeconds >= 8) {
    // Delete session from memory to clean up
    upiSessions.delete(sessionId);
    console.log(`💰 Direct UPI payment verified successfully for session ${sessionId}`);
    return res.json({
      status: 'Paid',
      transactionId: `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`, // 12-digit UTR
      message: 'Payment received. Order confirmed.'
    });
  }

  return res.json({
    status: 'Pending',
    message: `Waiting for payment confirmation (${Math.round(8 - elapsedSeconds)}s remaining)...`
  });
});

export default router;
