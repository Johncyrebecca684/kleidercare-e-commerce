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
      isMock: true,
      keyId: process.env.RAZORPAY_KEY_ID
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
    res.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('❌ Razorpay order creation failed:', JSON.stringify(error?.error || error, null, 2));
    const errorMsg = error?.error?.description || error?.message || 'Razorpay order creation failed. Check Key ID and Secret.';
    return res.status(400).json({
      message: `Razorpay Error: ${errorMsg}`,
      error: error?.error || error
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

  // Simulate 120 seconds (2 minutes) bank verification delay
  if (elapsedSeconds >= 120) {
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
    message: `Waiting for payment confirmation (${Math.round(120 - elapsedSeconds)}s remaining)...`
  });
});

// Calculate standard amortized EMI
const calculateEmiSchedule = (principal, annualRate, tenureMonths, isNoCost = false) => {
  if (isNoCost || annualRate === 0) {
    const monthlyEmi = Math.round(principal / tenureMonths);
    const totalCost = monthlyEmi * tenureMonths;
    return {
      tenure: tenureMonths,
      monthlyEmi,
      interestRate: 0,
      totalInterest: 0,
      totalCost,
      isNoCost: true,
      interestDiscount: Math.round(principal * (0.14 / 12) * tenureMonths) // Saved interest
    };
  }

  const r = (annualRate / 100) / 12; // Monthly rate
  const factor = Math.pow(1 + r, tenureMonths);
  const monthlyEmi = Math.round((principal * r * factor) / (factor - 1));
  const totalCost = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalCost - principal);

  return {
    tenure: tenureMonths,
    monthlyEmi,
    interestRate: annualRate,
    totalInterest,
    totalCost,
    isNoCost: false
  };
};

// Comprehensive metadata mappings for Razorpay bank codes
const BANK_METADATA = {
  HDFC: { name: 'HDFC Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'hdfc', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.5, 24: 15.5 } },
  ICIC: { name: 'ICICI Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  ICICI: { name: 'ICICI Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  SBIN: { name: 'SBI Credit Card', feeText: 'Processing Fee of ₹169 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  SBI: { name: 'SBI Credit Card', feeText: 'Processing Fee of ₹169 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  UTIB: { name: 'Axis Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'axis', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 15.5, 24: 15.5 } },
  AXIS: { name: 'Axis Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'axis', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 15.5, 24: 15.5 } },
  KKBK: { name: 'Kotak Mahindra Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 16.0, 24: 16.0 } },
  KOTAK: { name: 'Kotak Mahindra Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 16.0, 24: 16.0 } },
  RATN: { name: 'RBL Bank Credit Card', feeText: 'Processing Fee of ₹150 by Bank', iconType: 'rbl', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  RBL: { name: 'RBL Bank Credit Card', feeText: 'Processing Fee of ₹150 by Bank', iconType: 'rbl', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  BARB_R: { name: 'Bank of Baroda Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'bob', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  BOB: { name: 'Bank of Baroda Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'bob', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  INDB: { name: 'IndusInd Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'indusind', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } },
  INDUSIND: { name: 'IndusInd Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'indusind', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } },
  FDRL: { name: 'Federal Bank Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'federal', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  FEDERAL: { name: 'Federal Bank Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'federal', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  SCBL: { name: 'Standard Chartered Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'generic', noCostTenures: [3], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } },
  HSBC: { name: 'HSBC Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'generic', noCostTenures: [3], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } }
};

const DEBIT_BANK_METADATA = {
  HDFC: { name: 'HDFC Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'hdfc', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0 } },
  ICIC: { name: 'ICICI Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0 } },
  ICICI: { name: 'ICICI Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0 } },
  UTIB: { name: 'Axis Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'axis', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.5, 12: 15.5 } },
  AXIS: { name: 'Axis Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'axis', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.5, 12: 15.5 } },
  SBIN: { name: 'SBI Debit Card EMI', feeText: 'Processing Fee of ₹149 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5 } },
  SBI: { name: 'SBI Debit Card EMI', feeText: 'Processing Fee of ₹149 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5 } },
  KKBK: { name: 'Kotak Mahindra Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.0, 12: 15.0 } },
  KOTAK: { name: 'Kotak Mahindra Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.0, 12: 15.0 } }
};

const CARDLESS_METADATA = {
  BAJAJ: { name: 'Bajaj Finance Card (No Cost)', feeText: 'Convenience Fee of ₹149 by Bajaj Finserv', iconType: 'bajaj', noCostTenures: [3, 6, 9, 12], defaultRates: { 3: 0, 6: 0, 9: 0, 12: 0 } },
  ZEST: { name: 'ZestMoney / InstaPay EMI', feeText: 'Processing Fee of ₹99', iconType: 'zest', noCostTenures: [3], defaultRates: { 3: 12.0, 6: 13.0, 9: 14.0 } }
};

// GET /api/payment/emi-plans?amount=107300
router.get('/emi-plans', async (req, res) => {
  try {
    const rawAmount = parseFloat(req.query.amount);
    if (!rawAmount || isNaN(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required' });
    }

    const principal = Math.round(rawAmount);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Live Razorpay API Fetch
    let rzpLiveCreditRates = {};
    let rzpLiveDebitRates = {};
    let isLiveFromRazorpay = false;

    if (keyId && keySecret && !keyId.startsWith('rzp_test_placeholder')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const amountPaise = principal * 100;
        const rzpResponse = await fetch(`https://api.razorpay.com/v1/methods?amount=${amountPaise}`, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          isLiveFromRazorpay = true;
          console.log('✅ Successfully retrieved live Razorpay EMI methods for amount:', principal);

          // Extract Razorpay EMI banks & rate mapping
          if (rzpData.emi) {
            rzpLiveCreditRates = rzpData.emi.credit_cards || rzpData.emi.credit_card || {};
            rzpLiveDebitRates = rzpData.emi.debit_cards || rzpData.emi.debit_card || {};
          } else if (rzpData.emi_plans) {
            rzpLiveCreditRates = rzpData.emi_plans.credit_cards || rzpData.emi_plans.credit_card || {};
            rzpLiveDebitRates = rzpData.emi_plans.debit_cards || rzpData.emi_plans.debit_card || {};
          }
        } else {
          console.warn(`⚠️ Razorpay Methods API returned status ${rzpResponse.status}: ${rzpResponse.statusText}`);
        }
      } catch (fetchErr) {
        console.error('❌ Error fetching from Razorpay API:', fetchErr.message);
      }
    }

    // Process Credit Cards Plans
    const creditCardCodes = ['HDFC', 'ICICI', 'SBIN', 'UTIB', 'KKBK', 'RATN', 'BARB_R', 'INDB', 'FDRL', 'SCBL', 'HSBC'];
    const creditCardPlans = creditCardCodes.map(code => {
      const meta = BANK_METADATA[code] || { name: `${code} Credit Card`, feeText: 'Standard Bank Processing Fee', iconType: 'generic', noCostTenures: [3], defaultRates: { 3: 14, 6: 14, 12: 15 } };
      
      const liveBankRates = rzpLiveCreditRates[code] || meta.defaultRates;
      const tenures = Object.keys(liveBankRates).map(Number).sort((a, b) => a - b);
      const plans = tenures.map(tenure => {
        const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
        const rate = isNoCost ? 0 : (liveBankRates[tenure] !== undefined ? Number(liveBankRates[tenure]) : 14.0);
        return calculateEmiSchedule(principal, rate, tenure, isNoCost);
      });

      return {
        code,
        name: meta.name,
        feeText: meta.feeText,
        iconType: meta.iconType,
        hasNoCost: Boolean(meta.noCostTenures && meta.noCostTenures.length > 0),
        plans,
        isLiveRate: Boolean(rzpLiveCreditRates[code])
      };
    });

    // Process Debit Cards Plans
    const debitCardCodes = ['HDFC', 'ICICI', 'UTIB', 'SBIN', 'KKBK'];
    const debitCardPlans = debitCardCodes.map(code => {
      const meta = DEBIT_BANK_METADATA[code] || { name: `${code} Debit Card EMI`, feeText: 'Standard Processing Fee', iconType: 'generic', noCostTenures: [3], defaultRates: { 3: 14, 6: 14, 12: 15 } };
      const liveBankRates = rzpLiveDebitRates[code] || meta.defaultRates;
      const tenures = Object.keys(liveBankRates).map(Number).sort((a, b) => a - b);
      const plans = tenures.map(tenure => {
        const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
        const rate = isNoCost ? 0 : (liveBankRates[tenure] !== undefined ? Number(liveBankRates[tenure]) : 14.0);
        return calculateEmiSchedule(principal, rate, tenure, isNoCost);
      });

      return {
        code: `${code}_DC`,
        name: meta.name,
        feeText: meta.feeText,
        iconType: meta.iconType,
        hasNoCost: Boolean(meta.noCostTenures && meta.noCostTenures.length > 0),
        plans,
        isLiveRate: Boolean(rzpLiveDebitRates[code])
      };
    });

    // Process Cardless / Other Plans
    const cardlessCodes = ['BAJAJ', 'ZEST'];
    const cardlessPlans = cardlessCodes.map(code => {
      const meta = CARDLESS_METADATA[code];
      const tenures = Object.keys(meta.defaultRates).map(Number).sort((a, b) => a - b);
      const plans = tenures.map(tenure => {
        const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
        const rate = isNoCost ? 0 : Number(meta.defaultRates[tenure]);
        return calculateEmiSchedule(principal, rate, tenure, isNoCost);
      });

      return {
        code,
        name: meta.name,
        feeText: meta.feeText,
        iconType: meta.iconType,
        hasNoCost: Boolean(meta.noCostTenures && meta.noCostTenures.length > 0),
        plans,
        isLiveRate: false
      };
    });

    // Determine lowest monthly starting EMI
    let lowestMonthlyEmi = Infinity;
    [...creditCardPlans, ...debitCardPlans, ...cardlessPlans].forEach(b => {
      b.plans.forEach(p => {
        if (p.monthlyEmi < lowestMonthlyEmi && p.monthlyEmi > 0) {
          lowestMonthlyEmi = p.monthlyEmi;
        }
      });
    });

    if (lowestMonthlyEmi === Infinity) {
      lowestMonthlyEmi = Math.round(principal / 24);
    }

    return res.json({
      success: true,
      amount: principal,
      currency: 'INR',
      lowestMonthlyEmi,
      formattedLowestEmi: `₹${lowestMonthlyEmi.toLocaleString('en-IN')}`,
      isNoCostAvailable: true,
      creditCardPlans,
      debitCardPlans,
      cardlessPlans,
      isLiveFromRazorpay
    });
  } catch (error) {
    console.error('❌ Error generating EMI plans:', error);
    return res.status(500).json({
      message: 'Failed to retrieve EMI plans from Razorpay',
      error: error.message
    });
  }
});

export default router;

