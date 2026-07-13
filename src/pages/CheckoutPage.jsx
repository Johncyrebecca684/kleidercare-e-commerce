import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Smartphone, QrCode } from 'lucide-react';
import './CheckoutPage.css';

// Merchant UPI details – change to your actual VPA in production
const MERCHANT_UPI_ID = 'hariharasudhan81-3@okhdfcbank';
const MERCHANT_NAME  = 'Kleider Care';

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

function buildUpiLink(recipientVpa, name, amount, transactionNote) {
  const params = new URLSearchParams({
    pa: recipientVpa,
    pn: name,
    am: String(amount),
    cu: 'INR',
    tn: transactionNote,
  });
  return `upi://pay?${params.toString()}`;
}

function buildQrUrl(upiLink) {
  // QRServer API – fast, reliable, open-source and free
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
}

export default function CheckoutPage({ items, total, onPlaceOrder, loggedInUser }) {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiSessionId, setUpiSessionId] = useState('');
  const [upiStatusText, setUpiStatusText] = useState('');
  const [currentOrderData, setCurrentOrderData] = useState(null);
  // Manual UPI entry state
  const [upiId, setUpiId] = useState('');
  const [upiLaunched, setUpiLaunched] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Inject spinner keyframes if not exists
  useEffect(() => {
    if (!document.getElementById('upi-spin-style')) {
      const style = document.createElement('style');
      style.id = 'upi-spin-style';
      style.innerHTML = `
        @keyframes upi-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Handle UPI verification polling
  useEffect(() => {
    let intervalId;
    if (showUpiModal && upiSessionId) {
      setUpiStatusText('Waiting for payment scan/receipt...');
      
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/payment/check-upi-status?sessionId=${upiSessionId}`);
          if (!res.ok) return;
          const data = await res.json();
          
          if (data.status === 'Paid') {
            clearInterval(intervalId);
            setUpiStatusText('✅ Payment detected successfully!');
            
            // Automatically complete order and save to database
            setIsProcessing(true);
            const token = localStorage.getItem('kc_auth_token');
            const orderPayload = {
              customerName: formData.name,
              userEmail: formData.email,
              phone: formData.phone,
              shippingAddress: {
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode
              },
              items: items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              totalAmount: finalTotal,
              paymentMethod: 'UPI',
              paymentStatus: 'Paid',
              razorpayPaymentId: data.transactionId
            };

            const orderSaveResponse = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              },
              body: JSON.stringify(orderPayload)
            });

            if (!orderSaveResponse.ok) {
              const saveErr = await orderSaveResponse.json();
              throw new Error(saveErr.message || 'Failed to save order details in database');
            }

            const savedOrderData = await orderSaveResponse.json();
            const savedOrder = savedOrderData.order;

            setShowUpiModal(false);
            setIsSuccess(true);
            
            const newOrder = {
              id: savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
              orderId: savedOrder._id,
              date: new Date(savedOrder.createdAt).toLocaleDateString(),
              items: savedOrder.items,
              total: savedOrder.totalAmount,
              status: savedOrder.status,
              paymentMethod: savedOrder.paymentMethod
            };

            setTimeout(() => {
              onPlaceOrder(newOrder);
              navigate('/');
            }, 4000);
          } else {
            setUpiStatusText(data.message || 'Waiting for payment scan/receipt...');
          }
        } catch (err) {
          console.error('Error polling UPI status:', err);
        }
      };

      // Poll every 2 seconds
      intervalId = setInterval(checkStatus, 2000);
      // Run once immediately
      checkStatus();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showUpiModal, upiSessionId]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Calculate breakdown if not provided directly
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;

  const sparePartsSubtotal = Math.round(items
    .filter(item => item.category?.toLowerCase() === 'genuine spare parts')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;

  const chemicalsSubtotal = Math.round(items
    .filter(item => item.category?.toLowerCase() === 'chemicals')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;

  const discountAmount = 
    (appliedCoupons.includes('KCSPARE') ? Math.round(sparePartsSubtotal * 0.20) : 0) +
    (appliedCoupons.includes('KCCHM') ? Math.round(chemicalsSubtotal * 0.25) : 0);

  const shipping = subtotal > 500 ? 0 : 50;
  const tax = Math.round((subtotal - discountAmount) * 0.05);
  const finalTotal = Math.round((subtotal - discountAmount + shipping + tax) * 100) / 100;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const trimmedCode = couponCode.trim().toUpperCase();

    if (!trimmedCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (trimmedCode === 'RESELLER5') {
      setCouponError('The RESELLER5 coupon code has been discontinued.');
      return;
    }

    if (trimmedCode === 'KCSPARE') {
      if (loggedInUser?.role !== 'reseller') {
        setCouponError('Coupon codes are only available for authorized reseller accounts.');
        return;
      }

      if (appliedCoupons.includes('KCSPARE')) {
        setCouponError('Coupon code KCSPARE has already been applied.');
        return;
      }

      if (sparePartsSubtotal === 0) {
        setCouponError('This coupon code is only applicable to KCSPARE Genuine Spare Parts.');
        return;
      }

      setAppliedCoupons(prev => [...prev, 'KCSPARE']);
      setCouponSuccess('Coupon code applied successfully! 20% discount on Genuine Spare Parts has been applied.');
      setCouponCode('');
    } else if (trimmedCode === 'KCCHM') {
      if (loggedInUser?.role !== 'reseller') {
        setCouponError('Coupon codes are only available for authorized reseller accounts.');
        return;
      }

      if (appliedCoupons.includes('KCCHM')) {
        setCouponError('Coupon code KCCHM has already been applied.');
        return;
      }

      if (chemicalsSubtotal === 0) {
        setCouponError('This coupon code is only applicable to Chemicals.');
        return;
      }

      setAppliedCoupons(prev => [...prev, 'KCCHM']);
      setCouponSuccess('Coupon code applied successfully! 25% discount on Chemicals has been applied.');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = (couponToRemove) => {
    setAppliedCoupons(prev => prev.filter(c => c !== couponToRemove));
    setCouponSuccess(`Coupon code ${couponToRemove} removed.`);
    setCouponError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentVerification = async (paymentResponse) => {
    try {
      setIsProcessing(true);
      
      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature
        })
      });

      if (!verifyResponse.ok) {
        const verifyErr = await verifyResponse.json();
        throw new Error(verifyErr.message || 'Payment signature verification failed');
      }

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // Save order to MongoDB database
        const token = localStorage.getItem('kc_auth_token');
        const orderPayload = {
          customerName: formData.name,
          userEmail: formData.email,
          phone: formData.phone,
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: finalTotal,
          paymentMethod: paymentMethod,
          paymentStatus: 'Paid',
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id
        };

        const orderSaveResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(orderPayload)
        });

        if (!orderSaveResponse.ok) {
          const saveErr = await orderSaveResponse.json();
          throw new Error(saveErr.message || 'Failed to save order details in database');
        }

        const savedOrderData = await orderSaveResponse.json();
        const savedOrder = savedOrderData.order;

        setIsSuccess(true);
        
        const newOrder = {
          id: savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
          orderId: savedOrder._id,
          paymentId: savedOrder.razorpayPaymentId,
          date: new Date(savedOrder.createdAt).toLocaleDateString(),
          items: savedOrder.items,
          total: savedOrder.totalAmount,
          status: savedOrder.status,
          paymentMethod: savedOrder.paymentMethod
        };

        // Clear cart and redirect after 4 seconds
        setTimeout(() => {
          onPlaceOrder(newOrder);
          navigate('/');
        }, 4000);
      } else {
        throw new Error('Payment verification was not successful.');
      }
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || 'Verification failed. Please contact support.');
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Field verification
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      setPaymentError('Please fill in all shipping details first.');
      return;
    }

    setPaymentError('');
    setIsProcessing(true);

    if (paymentMethod === 'Cash') {
      try {
        const token = localStorage.getItem('kc_auth_token');
        const orderPayload = {
          customerName: formData.name,
          userEmail: formData.email,
          phone: formData.phone,
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          items: items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: finalTotal,
          paymentMethod: 'Cash',
          paymentStatus: 'Pending',
        };

        const orderSaveResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(orderPayload)
        });

        if (!orderSaveResponse.ok) {
          const saveErr = await orderSaveResponse.json();
          throw new Error(saveErr.message || 'Failed to save order details in database');
        }

        const savedOrderData = await orderSaveResponse.json();
        const savedOrder = savedOrderData.order;

        setIsSuccess(true);
        
        const newOrder = {
          id: savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
          orderId: savedOrder._id,
          date: new Date(savedOrder.createdAt).toLocaleDateString(),
          items: savedOrder.items,
          total: savedOrder.totalAmount,
          status: savedOrder.status,
          paymentMethod: savedOrder.paymentMethod
        };

        setTimeout(() => {
          onPlaceOrder(newOrder);
          navigate('/');
        }, 4000);
      } catch (err) {
        console.error(err);
        setPaymentError(err.message || 'An error occurred while placing the order.');
        setIsProcessing(false);
      }
      return;
    }

    if (paymentMethod === 'UPI') {
      const newSessionId = 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      setUpiSessionId(newSessionId);
      setShowUpiModal(true);
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create order on backend (Amount in paise)
      const amountInPaise = Math.round(finalTotal * 100);
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: amountInPaise })
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.message || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      setCurrentOrderData(orderData);

      const isPlaceholderKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_eCommerceKeyId12') === 'rzp_test_eCommerceKeyId12';

      // 2. If it's a mock order or placeholder keys, show the custom simulated payment modal
      if (orderData.isMock || isPlaceholderKey) {
        setShowSimulatedModal(true);
        return;
      }

      // 3. Load script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // 4. Trigger Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Kleider Care',
        description: 'E-commerce Order Payment',
        order_id: orderData.id,
        handler: handlePaymentVerification,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#1a4a8d'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentError('Payment cancelled by user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      setPaymentError(err.message || 'An error occurred during payment processing.');
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="checkout-page-wrapper animate-fade-in">
        <div className="checkout-page-container">
          <div className="checkout-success-page">
            <CheckCircle size={80} className="success-icon-page" />
            <h2>Order Placed Successfully!</h2>
            <p>Thank you for your purchase, {formData.name}. We've sent a confirmation email to {formData.email}.</p>
            <p>You will be redirected to the homepage shortly...</p>
            <Link to="/" className="back-to-home-btn" style={{marginTop: '20px'}}>
              Return to Homepage Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If items is empty and not success, redirect to cart or show empty state
  if (items.length === 0) {
    return (
      <div className="checkout-page-wrapper animate-fade-in">
        <div className="checkout-page-container">
           <div className="checkout-success-page">
            <h2>No items to checkout</h2>
            <p>Your cart is empty.</p>
            <Link to="/" className="back-to-home-btn" style={{marginTop: '20px'}}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page-wrapper animate-fade-in">
      <div className="checkout-page-container">
        <div className="checkout-page-header">
          <Link to="/cart" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1a4a8d', textDecoration: 'none', marginBottom: '15px', fontWeight: '600' }}>
            <ArrowLeft size={18} /> Back to Cart
          </Link>
          <h1>Secure Checkout</h1>
        </div>

        <div className="checkout-page-content">
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-page-form">
              <div className="checkout-page-section">
                <h3>Contact Information</h3>
                <div className="form-group-page">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-row-page">
                  <div className="form-group-page">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="checkout-page-section">
                <h3>Shipping Address</h3>
                <div className="form-group-page">
                  <label htmlFor="address">Address</label>
                  <textarea id="address" name="address" required value={formData.address} onChange={handleChange} rows="3"></textarea>
                </div>
                <div className="form-row-page">
                  <div className="form-group-page">
                    <label htmlFor="city">City</label>
                    <input type="text" id="city" name="city" required value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="state">State</label>
                    <input type="text" id="state" name="state" required value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="form-group-page">
                    <label htmlFor="pincode">Pincode</label>
                    <input type="text" id="pincode" name="pincode" required value={formData.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="checkout-page-section" style={{ marginTop: '25px' }}>
                <h3>Select Payment Method</h3>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                  <label style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px',
                    border: paymentMethod === 'Cash' ? '2px solid #1a4a8d' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: paymentMethod === 'Cash' ? '#f0f4ff' : '#ffffff',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="Cash" 
                      checked={paymentMethod === 'Cash'} 
                      onChange={() => setPaymentMethod('Cash')}
                      style={{ cursor: 'pointer' }}
                    />
                    💵 Cash on Delivery
                  </label>

                  <label style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px',
                    border: paymentMethod === 'Card' ? '2px solid #1a4a8d' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: paymentMethod === 'Card' ? '#f0f4ff' : '#ffffff',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="Card" 
                      checked={paymentMethod === 'Card'} 
                      onChange={() => setPaymentMethod('Card')}
                      style={{ cursor: 'pointer' }}
                    />
                    💳 Credit Card
                  </label>
                  
                  <label style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px',
                    border: paymentMethod === 'UPI' ? '2px solid #1a4a8d' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: paymentMethod === 'UPI' ? '#f0f4ff' : '#ffffff',
                    fontWeight: '700',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="UPI" 
                      checked={paymentMethod === 'UPI'} 
                      onChange={() => setPaymentMethod('UPI')}
                      style={{ cursor: 'pointer' }}
                    />
                    📱 UPI (Paytm/GPay)
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="checkout-summary-section">
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#001a4d', margin: '0 0 20px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px'}}>Order Summary</h3>
            
            <div className="summary-items-page">
              {items.map(item => (
                <div key={item.id} className="summary-item-page">
                  <span className="summary-item-page-name">{item.name} <span style={{color: '#888'}}>x {item.quantity}</span></span>
                  <span className="summary-item-page-price">₹{Math.round((item.price * item.quantity) * 100) / 100}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-totals-page">
              <div className="summary-row-page">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="summary-row-page">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="summary-row-page">
                <span>Tax (5%)</span>
                <span>₹{tax}</span>
              </div>
              {appliedCoupons.includes('KCSPARE') && (
                <div className="summary-row-page" style={{ color: '#22c55e', fontWeight: '700' }}>
                  <span>Reseller Genuine Spare Parts Discount (KCSPARE 20%)</span>
                  <span>-₹{Math.round(sparePartsSubtotal * 0.20)}</span>
                </div>
              )}
              {appliedCoupons.includes('KCCHM') && (
                <div className="summary-row-page" style={{ color: '#22c55e', fontWeight: '700' }}>
                  <span>Reseller Chemicals Discount (KCCHM 25%)</span>
                  <span>-₹{Math.round(chemicalsSubtotal * 0.25)}</span>
                </div>
              )}
              <div className="summary-row-page total">
                <span>Total Amount</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            {loggedInUser?.role === 'reseller' && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px',
                fontSize: '13px',
                fontWeight: '500',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div>
                  💡 <strong>Reseller Discounts Available! (Multiple codes can be applied)</strong>
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  • Use code <strong style={{ textDecoration: 'underline' }}>KCSPARE</strong> to get a 20% discount on Genuine Spare Parts.
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  • Use code <strong style={{ textDecoration: 'underline' }}>KCCHM</strong> to get a 25% discount on Chemicals.
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#001a4d' }}>Promo Code</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)} 
                  placeholder="Enter coupon code" 
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={handleApplyCoupon}
                  style={{
                    backgroundColor: '#1a4a8d',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Apply
                </button>
              </div>
              {appliedCoupons.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {appliedCoupons.map(coupon => (
                    <span key={coupon} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#166534',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      gap: '6px'
                    }}>
                      🏷️ {coupon}
                      <button 
                        type="button"
                        onClick={() => handleRemoveCoupon(coupon)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#166534',
                          cursor: 'pointer',
                          fontSize: '14px',
                          lineHeight: 1,
                          padding: 0,
                          marginLeft: '4px',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {couponError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0 0', fontWeight: '600' }}>{couponError}</p>}
              {couponSuccess && <p style={{ color: '#22c55e', fontSize: '12px', margin: '6px 0 0 0', fontWeight: '600' }}>{couponSuccess}</p>}
            </div>

            {paymentError && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '15px', fontWeight: '600', border: '1px solid #fee2e2', textAlign: 'left' }}>
                ⚠️ {paymentError}
              </div>
            )}

            <button 
              type="submit" 
              className="place-order-btn-page" 
              onClick={handleSubmit}
              disabled={isProcessing}
              style={isProcessing ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#64748b' } : {}}
            >
              {isProcessing ? 'Processing...' : 
               paymentMethod === 'Cash' ? `Confirm Order (₹${finalTotal})` : 
               paymentMethod === 'UPI' ? `Pay via UPI & Place Order (₹${finalTotal})` : 
               `Pay & Place Order (₹${finalTotal})`}
            </button>
          </div>
      {showSimulatedModal && currentOrderData && (
        <div className="simulated-payment-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div className="simulated-payment-modal" style={{
            background: 'white',
            borderRadius: '12px',
            width: '400px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1a4a8d', fontSize: '18px', fontWeight: '800' }}>Razorpay Test Checkout</h3>
              <span style={{ fontSize: '12px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Demo Mode</span>
            </div>
            
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' }}>Merchant: <strong>Kleider Care</strong></p>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '10px 0 20px 0' }}>₹{finalTotal}</p>
            
            <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 6px 0' }}><strong>Order ID:</strong> {currentOrderData.id}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>User:</strong> {formData.email}</p>
              <p style={{ margin: 0 }}><strong>Method:</strong> {paymentMethod}</p>
            </div>

            {/* Dynamic Simulated Payment Form */}
            {paymentMethod === 'Card' ? (
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Card Number</label>
                <input 
                  type="text" 
                  placeholder="4242 4242 4242 4242" 
                  value="4242 4242 4242 4242"
                  disabled
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', marginTop: '4px', marginBottom: '12px', backgroundColor: '#f1f5f9', color: '#475569', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Expiry</label>
                    <input 
                      type="text" 
                      placeholder="12/29" 
                      value="12/29"
                      disabled
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', marginTop: '4px', backgroundColor: '#f1f5f9', color: '#475569', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>CVV</label>
                    <input 
                      type="password" 
                      placeholder="***" 
                      value="123"
                      disabled
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', marginTop: '4px', backgroundColor: '#f1f5f9', color: '#475569', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📱 Enter Your UPI ID
                </label>
                <div style={{ position: 'relative', marginTop: '6px' }}>
                  <input
                    id="upi-id-input"
                    type="text"
                    placeholder="yourname@paytm / @gpay / @upi"
                    value={upiId}
                    onChange={e => { setUpiId(e.target.value); setUpiError(''); setUpiLaunched(false); }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: upiError ? '2px solid #ef4444' : '1.5px solid #94a3b8',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                {upiError && (
                  <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>⚠️ {upiError}</p>
                )}

                {/* UPI redirect button */}
                <button
                  id="pay-via-upi-btn"
                  onClick={() => {
                    const trimmed = upiId.trim();
                    if (!trimmed || !trimmed.includes('@')) {
                      setUpiError('Please enter a valid UPI ID (e.g. name@paytm)');
                      return;
                    }
                    const link = buildUpiLink(trimmed, MERCHANT_NAME, finalTotal, `Payment to ${MERCHANT_NAME}`);
                    setUpiLaunched(true);
                    setUpiError('');
                    if (isMobileDevice()) {
                      // On mobile – redirect to UPI app directly
                      window.location.href = link;
                    } else {
                      // On desktop – do nothing extra; QR code shown below
                    }
                  }}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Smartphone size={16} />
                  {isMobileDevice() ? 'Open UPI App to Pay' : 'Generate QR & Pay via App'}
                </button>

                {/* QR code section – shown on desktop after button click */}
                {upiLaunched && !isMobileDevice() && upiId.trim().includes('@') && (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px', color: '#4f46e5', fontWeight: '700', fontSize: '13px' }}>
                      <QrCode size={16} /> Scan with any UPI App
                    </div>
                    <img
                      src={buildQrUrl(buildUpiLink(upiId.trim(), MERCHANT_NAME, finalTotal, `Payment to ${MERCHANT_NAME}`))}
                      alt="UPI QR Code"
                      style={{ width: '160px', height: '160px', borderRadius: '6px', border: '2px solid #e0e7ff' }}
                    />
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0 0' }}>
                      Paying <strong>₹{finalTotal}</strong> to <strong style={{ color: '#4f46e5' }}>{MERCHANT_NAME}</strong>
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      UPI: <code style={{ fontSize: '11px' }}>{upiId.trim()}</code>
                    </p>
                    <p style={{ fontSize: '12px', color: '#059669', fontWeight: '600', margin: '8px 0 0 0' }}>
                      ✅ After scanning & paying in your UPI app, click "Confirm Payment" below.
                    </p>
                  </div>
                )}

                {/* Info pills */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <span key={app} style={{ fontSize: '11px', background: '#f0f4ff', color: '#4f46e5', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', border: '1px solid #c7d2fe' }}>{app}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                id="confirm-payment-btn"
                onClick={async () => {
                  // Validate UPI input before confirming
                  if (paymentMethod === 'UPI') {
                    const trimmed = upiId.trim();
                    if (!trimmed || !trimmed.includes('@')) {
                      setUpiError('Please enter your UPI ID before confirming payment.');
                      return;
                    }
                  }
                  setShowSimulatedModal(false);
                  await handlePaymentVerification({
                    razorpay_order_id: currentOrderData.id,
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_signature: 'mock_signature_success'
                  });
                }}
                style={{
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
              >
                {paymentMethod === 'UPI' ? '✅ Confirm Payment (After UPI App)' : 'Simulate Successful Payment'}
              </button>
              
              <button 
                onClick={() => {
                  setShowSimulatedModal(false);
                  setIsProcessing(false);
                  setPaymentError('Payment cancelled by user (Simulated).');
                }}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
              >
                Simulate Failure / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpiModal && (
        <div className="simulated-payment-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div className="simulated-payment-modal" style={{
            background: 'white',
            borderRadius: '12px',
            width: '420px',
            padding: '24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            textAlign: 'center',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#1a4a8d', fontSize: '18px', fontWeight: '800' }}>UPI Payment</h3>
              <button 
                onClick={() => { setShowUpiModal(false); setUpiSessionId(''); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 6px 0' }}>Payee: <strong>HARI HARA SUDHAN S</strong></p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>UPI ID: <code>{MERCHANT_UPI_ID}</code></p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '10px 0 20px 0' }}>₹{finalTotal}</p>
            
            {isMobileDevice() ? (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
                  Click below to open your UPI app to pay the locked amount of <strong>₹{finalTotal}</strong>.
                </p>
                <a
                  href={buildUpiLink(MERCHANT_UPI_ID, 'HARI HARA SUDHAN S', finalTotal, 'Order Payment')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '15px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Smartphone size={18} /> Open UPI App to Pay
                </a>
              </div>
            ) : (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                  Scan this QR code with GPay/PhonePe/Paytm.
                </p>
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '10px'
                }}>
                  <img
                    src={buildQrUrl(buildUpiLink(MERCHANT_UPI_ID, 'HARI HARA SUDHAN S', finalTotal, 'Order Payment'))}
                    alt="UPI QR Code"
                    style={{ width: '200px', height: '200px', display: 'block' }}
                  />
                </div>
              </div>
            )}

            <div style={{ 
              backgroundColor: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              padding: '14px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <div className="upi-loading-spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid #1a4a8d',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'upi-spin 1s linear infinite'
              }}></div>
              <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
                {upiStatusText}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <button 
                onClick={() => {
                  setShowUpiModal(false);
                  setUpiSessionId('');
                  setIsProcessing(false);
                }}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                Cancel / Go Back
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
