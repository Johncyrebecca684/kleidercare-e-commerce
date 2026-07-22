import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Smartphone, QrCode } from 'lucide-react';
import './CheckoutPage.css';
import { API_URL } from '../config';

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
  const [paymentMethod, setPaymentMethod] = useState('UPI');
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
  
  // Address Management State
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const savedAddresses = loggedInUser?.addresses || [];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const house = addr.house_number || '';
            const building = addr.building || addr.amenity || '';
            const road = addr.road || addr.pedestrian || addr.street || '';
            const neighbourhood = addr.neighbourhood || addr.residential || addr.suburb || '';
            
            const city = addr.city || addr.town || addr.county || '';
            const state = addr.state || '';
            const pincode = addr.postcode || '';
            
            let addressParts = [house, building, road, neighbourhood].filter(Boolean);
            let fullAddress = addressParts.join(', ');
            
            // Smart fallback if raw parts don't give a substantial address
            if (addressParts.length < 2 && data.display_name) {
               const parts = data.display_name.split(',').map(p => p.trim());
               // Filter out city, state, pincode, country from the full string to avoid duplication in the textarea
               const filteredParts = parts.filter(p => 
                 p !== 'India' && 
                 p !== state && 
                 p !== city && 
                 p !== pincode
               );
               fullAddress = filteredParts.join(', ');
            }
            
            setFormData(prev => ({
              ...prev,
              address: fullAddress,
              city: city,
              state: state,
              pincode: pincode
            }));
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          alert('Could not fetch address from location. Please enter manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert('Could not access your location. Please check your permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

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
          const res = await fetch(`${API_URL}/api/payment/check-upi-status?sessionId=${upiSessionId}`);
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

            const orderSaveResponse = await fetch(`${API_URL}/api/orders`, {
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
              id: savedOrder.orderId || savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
              orderId: savedOrder.orderId || savedOrder._id,
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

  // Automatically apply reseller coupons based on cart contents
  useEffect(() => {
    if (loggedInUser?.role === 'reseller') {
      const hasSpare = items.some(item => item.category?.toLowerCase() === 'genuine spare parts');
      const hasChemicals = items.some(item => item.category?.toLowerCase() === 'chemicals');
      
      setAppliedCoupons(prev => {
        const newCoupons = [...prev];
        let changed = false;
        
        if (hasSpare && !newCoupons.includes('KCSPARE')) {
          newCoupons.push('KCSPARE');
          changed = true;
        }
        if (hasChemicals && !newCoupons.includes('KCCHM')) {
          newCoupons.push('KCCHM');
          changed = true;
        }
        
        // Remove coupons if the items are no longer in cart
        if (!hasSpare && newCoupons.includes('KCSPARE')) {
          const idx = newCoupons.indexOf('KCSPARE');
          newCoupons.splice(idx, 1);
          changed = true;
        }
        if (!hasChemicals && newCoupons.includes('KCCHM')) {
          const idx = newCoupons.indexOf('KCCHM');
          newCoupons.splice(idx, 1);
          changed = true;
        }
        
        return changed ? newCoupons : prev;
      });
    }
  }, [loggedInUser, items]);

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

  const nonChemicalSubtotal = items.filter(item => item.category !== 'Chemicals').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = (subtotal > 500 || (items.length > 0 && nonChemicalSubtotal === 0)) ? 0 : 50;
  const baseTax = items.reduce((sum, item) => {
    const itemGst = item.priceWithGst ? (item.priceWithGst - item.price) : (Math.round(item.price * 1.18) - item.price);
    return sum + (itemGst * item.quantity);
  }, 0);
  const tax = Math.round(baseTax - (discountAmount * 0.18));
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
      const verifyResponse = await fetch(`${API_URL}/api/payment/verify-payment`, {
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

        const orderSaveResponse = await fetch(`${API_URL}/api/orders`, {
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
          id: savedOrder.orderId || savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
          orderId: savedOrder.orderId || savedOrder._id,
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

    // Save address if requested
    if (saveThisAddress && loggedInUser && selectedAddressIndex === -1) {
      try {
        const token = localStorage.getItem('kc_auth_token');
        const newAddress = {
          type: 'Saved Address',
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        };
        const updatedAddresses = [...(loggedInUser.addresses || []), newAddress];
        
        await fetch(`${API_URL}/api/auth/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ addresses: updatedAddresses })
        });
        
        // Optimistically update the local state for this session if they stay on page
        loggedInUser.addresses = updatedAddresses;
      } catch (err) {
        console.error('Failed to save address:', err);
      }
    }

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

        const orderSaveResponse = await fetch(`${API_URL}/api/orders`, {
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
          id: savedOrder.orderId || savedOrder._id || 'ORD' + Math.floor(Math.random() * 1000000),
          orderId: savedOrder.orderId || savedOrder._id,
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



    try {
      // 1. Create order on backend (Amount in paise)
      const amountInPaise = Math.round(finalTotal * 100);
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
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



      // 3. Load script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // 4. Trigger Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Kleider Care',
        description: 'E-commerce Order Payment',
        order_id: orderData.id,
        handler: handlePaymentVerification,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
          ...(paymentMethod === 'UPI' && upiId.trim() !== '' && { vpa: upiId.trim() })
        },
        theme: {
          color: '#1a4a8d'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentError('Payment cancelled by user.');
          }
        },
        config: {
          display: {
            hide: [
              { method: 'card' }
            ],
            preferences: {
              show_default_blocks: true
            }
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
                <h3>Billing Details</h3>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Shipping Address</h3>
                  <button 
                    type="button" 
                    onClick={handleGetLocation} 
                    disabled={isLocating}
                    style={{ 
                      background: 'none', 
                      border: '1px solid #2563eb', 
                      color: '#2563eb', 
                      padding: '6px 12px', 
                      borderRadius: '6px', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isLocating ? 'Locating...' : '📍 Use Current Location'}
                  </button>
                </div>

                {/* Saved Addresses Section */}
                {loggedInUser && savedAddresses.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>Select a saved address:</p>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {savedAddresses.map((addr, index) => (
                        <div 
                          key={index} 
                          onClick={() => {
                            setSelectedAddressIndex(index);
                            setFormData(prev => ({
                              ...prev,
                              address: addr.address || '',
                              city: addr.city || '',
                              state: addr.state || '',
                              pincode: addr.pincode || ''
                            }));
                            setSaveThisAddress(false);
                          }}
                          style={{
                            minWidth: '200px',
                            padding: '12px',
                            border: selectedAddressIndex === index ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            backgroundColor: selectedAddressIndex === index ? '#eff6ff' : '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#334155'
                          }}
                        >
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{addr.type || 'Saved Address'}</p>
                          <p style={{ margin: '0 0 3px 0' }}>{addr.address}</p>
                          <p style={{ margin: '0' }}>{addr.city}, {addr.pincode}</p>
                        </div>
                      ))}
                      <div 
                        onClick={() => {
                          setSelectedAddressIndex(-1);
                          setFormData(prev => ({
                            ...prev,
                            address: '',
                            city: '',
                            state: '',
                            pincode: ''
                          }));
                        }}
                        style={{
                          minWidth: '150px',
                          padding: '12px',
                          border: selectedAddressIndex === -1 ? '2px solid #2563eb' : '1px dashed #cbd5e1',
                          borderRadius: '8px',
                          backgroundColor: selectedAddressIndex === -1 ? '#eff6ff' : '#f8fafc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          color: '#2563eb'
                        }}
                      >
                        ➕ Add New
                      </div>
                    </div>
                  </div>
                )}
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

                {loggedInUser && selectedAddressIndex === -1 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', fontSize: '14px', cursor: 'pointer', color: '#334155' }}>
                    <input 
                      type="checkbox" 
                      checked={saveThisAddress} 
                      onChange={(e) => setSaveThisAddress(e.target.checked)} 
                    />
                    Save this address for future checkouts
                  </label>
                )}
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
                  
                  {paymentMethod === 'UPI' && (
                    <div style={{ width: '100%', marginTop: '5px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>Test UPI ID (For Desktop Testing)</label>
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. success@razorpay" 
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>💡 Enter <strong>success@razorpay</strong> here before clicking Pay to instantly simulate a successful demo payment.</p>
                    </div>
                  )}
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
                  <span className="summary-item-page-price">₹{(Math.round((item.price * item.quantity) * 100) / 100).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-totals-page">
              <div className="summary-row-page">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="summary-row-page">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
              </div>
              <div className="summary-row-page">
                <span>Tax (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              {appliedCoupons.includes('KCSPARE') && (
                <div className="summary-row-page" style={{ color: '#22c55e', fontWeight: '700' }}>
                  <span>Reseller Genuine Spare Parts Discount (KCSPARE 20%)</span>
                  <span>-₹{Math.round(sparePartsSubtotal * 0.20).toLocaleString('en-IN')}</span>
                </div>
              )}
              {appliedCoupons.includes('KCCHM') && (
                <div className="summary-row-page" style={{ color: '#22c55e', fontWeight: '700' }}>
                  <span>Reseller Chemicals Discount (KCCHM 25%)</span>
                  <span>-₹{Math.round(chemicalsSubtotal * 0.25).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="summary-row-page total">
                <span>Total Amount</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
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
                  💡 <strong>Reseller Discounts Automatically Applied!</strong>
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  • 20% discount on Genuine Spare Parts.
                </div>
                <div style={{ paddingLeft: '12px' }}>
                  • 25% discount on Chemicals.
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
               paymentMethod === 'Cash' ? `Confirm Order (₹${finalTotal.toLocaleString('en-IN')})` : 
               paymentMethod === 'UPI' ? `Pay via UPI & Place Order (₹${finalTotal.toLocaleString('en-IN')})` : 
               `Pay & Place Order (₹${finalTotal.toLocaleString('en-IN')})`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
