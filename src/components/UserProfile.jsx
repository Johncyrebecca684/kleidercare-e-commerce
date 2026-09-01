import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import {
  User,
  ShoppingBag,
  MapPin,
  Headset,
  LogOut,
  Trash2,
  Plus,
  Edit2,
  CreditCard,
  ChevronDown,
  Info,
  ArrowLeft,
  Bot,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateProfile, updateAddresses, addWalletBalance } from '../services/authService';
import { useToast } from '../context/ToastContext';
import Header from './Header';
import Footer from './Footer';
import { printInvoiceElement } from '../utils/invoicePrint';
import Chatbot from './Chatbot';
import './UserProfile.css';

// Helper to convert number to Indian currency words
function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function g(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  function h(n) {
    if (n < 100) return g(n);
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + g(n % 100) : '');
  }

  function c(n) {
    if (n < 1000) return h(n);
    if (n < 100000) {
      return h(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + h(n % 1000) : '');
    }
    if (n < 10000000) {
      return h(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + c(n % 100000) : '');
    }
    return h(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + c(n % 10000000) : '');
  }

  const integerPart = Math.floor(num);
  const words = c(integerPart);
  return words ? words + ' Rupees Only' : 'Zero Rupees Only';
}

export default function UserProfile({
  userData,
  onLogout,
  orders = [],
  cartCount,
  wishlistCount,
  onUpdateUser,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  onLoginOpen,
  products = []
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // default tab is orders like zepto
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handlePrint = (invoice = selectedInvoice) => {
    if (!invoice) return;
    const invId = invoice.orderId || invoice.id || '203075';
    const docTitle = `Invoice_KC_${invId.toString().replace(/#/g, '')}`;
    printInvoiceElement('invoice-print-area', docTitle);
  };

  const downloadAsPdf = (invoice = selectedInvoice) => {
    if (!invoice) return;
    const invId = invoice.orderId || invoice.id || '203075';
    const cleanId = invId.toString().replace(/#/g, '');
    const filename = `Invoice_KC_${cleanId}.pdf`;
    const element = document.getElementById('invoice-print-area');

    if (!element) {
      handlePrint(invoice);
      return;
    }

    const opt = {
      margin: [6, 6, 6, 6],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const triggerDownload = () => {
      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).save();
      } else {
        handlePrint(invoice);
      }
    };

    if (window.html2pdf) {
      triggerDownload();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => triggerDownload();
      script.onerror = () => triggerDownload();
      document.body.appendChild(script);
    }
  };

  const handleDownloadInvoice = (order) => {
    setSelectedInvoice(order);
    setTimeout(() => {
      downloadAsPdf(order);
    }, 300);
  };

  // Profile Form State
  const { showSuccess, showError, showWarning } = useToast();
  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(userData?.mobileNumber || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Address Form State
  const [addresses, setAddresses] = useState(userData?.addresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({
    type: 'Home', // Home, Work, Other
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [addressLoading, setAddressLoading] = useState(false);

  // Wallet State
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');

  // Support FAQs state
  const [activeFaq, setActiveFaq] = useState(null);

  // Order list & Online Payment State
  const [orderList, setOrderList] = useState(orders);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [paymentMsg, setPaymentMsg] = useState('');

  useEffect(() => {
    setOrderList(orders);
  }, [orders]);

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

  const handlePayOnlineForOrder = async (targetOrder) => {
    try {
      setPayingOrderId(targetOrder.id);
      setPaymentMsg('');

      // 1. Create payment order via backend API
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(targetOrder.total * 100) })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to initiate online payment session.');
      }

      const paymentOrderData = await orderResponse.json();

      // 2. Load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.');
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: paymentOrderData.keyId,
        amount: paymentOrderData.amount,
        currency: paymentOrderData.currency || 'INR',
        name: 'Kleider Care',
        description: `Online Payment for Order #${targetOrder.id}`,
        order_id: paymentOrderData.id,
        handler: async function (response) {
          try {
            // Verify payment signature
            const verifyRes = await fetch(`${API_URL}/api/payment/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              throw new Error('Payment verification failed.');
            }

            // Update order payment status in backend database
            const dbId = targetOrder.mongoId || targetOrder.id;
            await fetch(`${API_URL}/api/orders/pay-online/${dbId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentMethod: 'Online Payment (Razorpay)',
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id
              })
            });

            // Update local order state immediately
            setOrderList(prevOrders =>
              prevOrders.map(o =>
                (o.id === targetOrder.id || o.mongoId === targetOrder.mongoId)
                  ? { ...o, paymentMethod: 'Online Payment (Razorpay)', paymentStatus: 'Paid', paymentId: response.razorpay_payment_id }
                  : o
              )
            );

            setPaymentMsg(`🎉 Online payment of ₹${targetOrder.total.toLocaleString('en-IN')} for Order #${targetOrder.id} completed successfully via Razorpay!`);
            showSuccess(`Payment of ₹${targetOrder.total.toLocaleString('en-IN')} for Order #${targetOrder.id} completed successfully!`);
          } catch (err) {
            console.error(err);
            showError('Payment completed, but order status update failed: ' + err.message);
          } finally {
            setPayingOrderId(null);
          }
        },
        prefill: {
          name: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (targetOrder.customerName || ''),
          email: userData?.email || targetOrder.userEmail || '',
          contact: userData?.mobileNumber || targetOrder.phone || ''
        },
        theme: {
          color: '#0f2b5c'
        },
        modal: {
          ondismiss: function () {
            setPayingOrderId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      showError(err.message || 'Error launching Razorpay payment window.');
      setPayingOrderId(null);
    }
  };

  // Sync props to state if userData updates
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setMobileNumber(userData.mobileNumber || '');
      setAddresses(userData.addresses || []);
    }
  }, [userData]);

  if (!userData) return null;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const response = await updateProfile({ firstName, lastName, mobileNumber });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      showSuccess('Profile updated successfully!');
      if (onUpdateUser) {
        onUpdateUser(response.user);
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
      showError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddOrEditAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.addressLine || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      showWarning('Please fill out all required address fields.');
      return;
    }

    setAddressLoading(true);
    let updatedAddresses = [...addresses];
    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = addressForm;
    } else {
      updatedAddresses.push(addressForm);
    }

    try {
      const response = await updateAddresses(updatedAddresses);
      setAddresses(response.addresses);
      // Sync state back to app
      if (onUpdateUser) {
        onUpdateUser({ ...userData, addresses: response.addresses });
      }
      setShowAddressModal(false);
      setAddressForm({ type: 'Home', addressLine: '', city: '', state: '', pincode: '' });
      setEditingAddressIndex(null);
      showSuccess('Address saved successfully!');
    } catch (err) {
      showError('Failed to save address: ' + err.message);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (indexToDelete) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    const updatedAddresses = addresses.filter((_, idx) => idx !== indexToDelete);
    try {
      const response = await updateAddresses(updatedAddresses);
      setAddresses(response.addresses);
      if (onUpdateUser) {
        onUpdateUser({ ...userData, addresses: response.addresses });
      }
      showSuccess('Address deleted successfully.');
    } catch (err) {
      showError('Failed to delete address: ' + err.message);
    }
  };

  const handleWalletAdd = async (e) => {
    e.preventDefault();
    const amount = Number(walletAmount);
    if (!amount || amount <= 0) {
      setWalletMsg('Please enter a valid amount');
      return;
    }

    setWalletLoading(true);
    setWalletMsg('');
    try {
      const response = await addWalletBalance(amount);
      setWalletMsg(`Successfully added ₹${Number(amount).toLocaleString('en-IN')} to your wallet!`);
      setWalletAmount('');
      if (onUpdateUser) {
        onUpdateUser({ ...userData, walletBalance: response.walletBalance });
      }
    } catch (err) {
      setWalletMsg('Failed to add money: ' + err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  const faqs = [
    { q: 'How long does shipping take?', a: 'Standard delivery takes 3-5 business days. Commercial washers/dryers might require scheduled freight shipping.' },
    { q: 'What is Kleider Care Cash?', a: 'It is a digital prepaid wallet. You can use it at checkout for instant payments and faster refunds.' },
    { q: 'How do I request warranty services?', a: 'Go to the Support tab or raise a ticket on our Ticketing system with your Order ID.' },
    { q: 'Can I change my delivery address after placing an order?', a: 'Please contact support within 1 hour of placing the order to request an address update.' }
  ];

  return (
    <div className="profile-page-wrapper">
      <Header
        cartCount={cartCount}
        onSigninClick={onLoginOpen}
        onProfileClick={() => setActiveTab('profile')}
        loggedInUser={userData}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        wishlistCount={wishlistCount}
        products={products}
      />

      <div className="profile-page-content-wrapper">
        <button
          onClick={() => navigate('/')}
          className="profile-back-btn-main"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#0f2b5c', cursor: 'pointer', fontWeight: '700', marginBottom: '20px', fontSize: '15px', padding: '0' }}
        >
          <ArrowLeft size={18} /> Back to Home
        </button>
        <div className="profile-dashboard-layout">
          {/* LEFT SIDEBAR PANEL */}
          <div className="profile-left-sidebar">
            <div className="user-profile-header-card">
              <div className="user-avatar-circle">
                {userData.firstName.charAt(0).toUpperCase()}{userData.lastName ? userData.lastName.charAt(0).toUpperCase() : ''}
              </div>
              <div className="user-name-phone-details">
                <h3>{userData.firstName} {userData.lastName}</h3>
                <p>{userData.mobileNumber}</p>
                <span>{userData.email}</span>
              </div>
            </div>



            {/* Nav Menu */}
            <nav className="profile-nav-menu-list">
              <button
                className={`menu-item-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag size={18} />
                <span>Orders History</span>
              </button>
              <button
                className={`menu-item-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin size={18} />
                <span>Saved Addresses</span>
              </button>
              <button
                className={`menu-item-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                <span>Profile Details</span>
              </button>
              <button
                className={`menu-item-btn ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => setActiveTab('support')}
              >
                <Headset size={18} />
                <span>Customer Support</span>
              </button>
              <button
                className="menu-item-btn logout-menu-btn"
                onClick={onLogout}
              >
                <LogOut size={18} />
                <span>Logout Account</span>
              </button>
            </nav>
          </div>

          {/* RIGHT CONTENT WORKSPACE CARD */}
          <div className="profile-right-content-card">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="tab-view-content animate-fade-in">
                <h3 className="tab-title">Your Order History</h3>
                {paymentMsg && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: '600', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{paymentMsg}</span>
                    <button onClick={() => setPaymentMsg('')} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>×</button>
                  </div>
                )}
                {orderList.length === 0 ? (
                  <div className="empty-state-view">
                    <ShoppingBag size={48} className="empty-icon" />
                    <h4>No Orders Yet</h4>
                    <p>When you buy commercial laundry machines or spare parts, your orders will appear here.</p>
                  </div>
                ) : (
                  <div className="profile-orders-list">
                    {orderList.map((order) => (
                      <div key={order.id} className="premium-order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">Order ID: #{order.id}</span>
                            <p className="order-date">Placed on {order.date}</p>
                          </div>
                          <span className={`order-status-pill ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-card-items">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="order-item-block" style={{ marginBottom: '8px' }}>
                              <div className="order-item-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                <span>{item.name} <strong style={{ color: '#64748b' }}>x{item.quantity}</strong></span>
                                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                              </div>
                              {item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo && (
                                <div style={{ fontSize: '11px', color: '#0f2b5c', fontWeight: '600', paddingLeft: '10px', marginTop: '2px' }}>
                                  🛡️ Includes {item.amcWarrantyInfo.type} (+₹{item.amcWarrantyInfo.price.toLocaleString('en-IN')})
                                </div>
                              )}
                              {item.includeProgramSetup && (
                                <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600', paddingLeft: '10px', marginTop: '2px' }}>
                                  ⚙️ Includes Machine Program Setup (+₹18,000)
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="order-card-footer">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="pay-method">Payment: {order.paymentMethod}</span>
                            {order.companyName && <span className="order-company" style={{ fontSize: '12px', color: '#475569' }}>🏢 {order.companyName}</span>}
                            {order.gstNumber && <span className="order-gst" style={{ fontSize: '12px', color: '#475569' }}>📄 GST: {order.gstNumber}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {(() => {
                              const isCOD = order.paymentMethod && (
                                order.paymentMethod.toLowerCase().includes('cash') ||
                                order.paymentMethod.toLowerCase().includes('cod') ||
                                order.paymentMethod.toLowerCase().includes('delivery')
                              );
                              const isPaid = order.paymentStatus === 'Paid' || (!isCOD && order.paymentStatus !== 'Pending');

                              return (
                                <>
                                  {isPaid ? (
                                    <button
                                      className="view-invoice-btn"
                                      onClick={() => setSelectedInvoice(order)}
                                      style={{ padding: '6px 14px', border: '1px solid #0f2b5c', color: '#0f2b5c', background: '#ffffff', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                      <FileText size={14} /> View Invoice
                                    </button>
                                  ) : (
                                    <button
                                      className="view-invoice-btn disabled"
                                      disabled
                                      title="Invoice will be available after payment completion"
                                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', color: '#94a3b8', background: '#f8fafc', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      🔒 Invoice Available After Payment
                                    </button>
                                  )}

                                  {isCOD && order.paymentStatus !== 'Paid' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                      <span className="order-total" style={{ color: '#d97706' }}>
                                        Pay to Delivery Partner: <strong>₹{order.total.toLocaleString('en-IN')}</strong>
                                      </span>
                                      <button
                                        className="pay-online-btn"
                                        onClick={() => handlePayOnlineForOrder(order)}
                                        disabled={payingOrderId === order.id}
                                        style={{
                                          padding: '6px 14px',
                                          background: 'linear-gradient(135deg, #0284c7 0%, #0f2b5c 100%)',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: '6px',
                                          fontWeight: '700',
                                          fontSize: '12px',
                                          cursor: payingOrderId === order.id ? 'not-allowed' : 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                                          transition: 'all 0.2s',
                                          opacity: payingOrderId === order.id ? 0.7 : 1
                                        }}
                                      >
                                        💳 {payingOrderId === order.id ? 'Processing...' : 'Pay via Online'}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="order-total">
                                      Total Paid: <strong>₹{order.total.toLocaleString('en-IN')}</strong>
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="tab-view-content animate-fade-in">
                <div className="tab-header-row">
                  <h3 className="tab-title">Saved Addresses</h3>
                  <button className="add-address-btn" onClick={() => {
                    setEditingAddressIndex(null);
                    setAddressForm({ type: 'Home', addressLine: '', city: '', state: '', pincode: '' });
                    setShowAddressModal(true);
                  }}>
                    <Plus size={16} /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="empty-state-view">
                    <MapPin size={48} className="empty-icon" />
                    <h4>No Saved Addresses</h4>
                    <p>Add shipping addresses to speed up checkout.</p>
                  </div>
                ) : (
                  <div className="saved-addresses-grid">
                    {addresses.map((addr, idx) => (
                      <div key={idx} className="address-card">
                        <div className="address-card-header">
                          <span className="address-badge">{addr.type}</span>
                          <div className="address-actions">
                            <button className="icon-btn edit" onClick={() => {
                              setEditingAddressIndex(idx);
                              setAddressForm(addr);
                              setShowAddressModal(true);
                            }} title="Edit"><Edit2 size={14} /></button>
                            <button className="icon-btn delete" onClick={() => handleDeleteAddress(idx)} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="address-text">{addr.addressLine}</p>
                        <p className="address-city-state">{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE DETAILS TAB */}
            {activeTab === 'profile' && (
              <div className="tab-view-content animate-fade-in">
                <h3 className="tab-title">Update Profile Details</h3>
                <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                  <div className="form-row-two">
                    <div className="input-group">
                      <label>First Name</label>
                      <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Last Name</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row-two">
                    <div className="input-group">
                      <label>Email Address</label>
                      <input disabled type="email" value={userData.email} style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                    <div className="input-group">
                      <label>Mobile Number</label>
                      <input required type="text" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
                    </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`form-alert-message ${profileMsg.type}`}>
                      {profileMsg.text}
                    </div>
                  )}

                  <button type="submit" className="save-profile-btn" disabled={profileLoading}>
                    {profileLoading ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>
            )}

            {/* CUSTOMER SUPPORT TAB */}
            {activeTab === 'support' && (
              <div className="tab-view-content animate-fade-in">
                <h3 className="tab-title">Frequently Asked Questions</h3>
                <div className="faqs-accordion-list">
                  {faqs.map((faq, index) => (
                    <div key={index} className="faq-item-box">
                      <button
                        className="faq-question-trigger"
                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0)' }} />
                      </button>
                      {activeFaq === index && (
                        <div className="faq-answer-pane">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="support-cta-box">
                  <div className="support-info-badge">
                    <Info size={16} /> Need further technical help with industrial washers or commercial equipment?
                  </div>
                  <p style={{ marginTop: '8px', color: '#475569' }}>
                    Launch our full-screen AI & certified engineer technical support portal for instant equipment diagnostics and live assistance.
                  </p>
                  <button
                    onClick={() => navigate('/chatbot')}
                    className="support-technical-chat-btn"
                    style={{
                      marginTop: '12px',
                      padding: '10px 18px',
                      background: 'linear-gradient(135deg, #0f2b5c 0%, #0284c7 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Bot size={18} /> Technical Support Chatbot
                  </button>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                    📞 Direct Hotline: <strong>+91 93848 14933 / +91 97890 20311</strong> | ✉️ Email: <strong>support@kleidercare.com</strong>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ADDRESS FORM MODAL OVERLAY */}
      {showAddressModal && (
        <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal-card" onClick={e => e.stopPropagation()}>
            <h3>{editingAddressIndex !== null ? 'Edit Address' : 'Add New Address'}</h3>
            <form onSubmit={handleAddOrEditAddress}>
              <div className="form-group-radio">
                <label>Address Label</label>
                <div className="label-radio-options">
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      className={`radio-chip ${addressForm.type === lbl ? 'active' : ''}`}
                      onClick={() => setAddressForm({ ...addressForm, type: lbl })}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input required type="text" value={addressForm.addressLine} onChange={e => setAddressForm({ ...addressForm, addressLine: e.target.value })} placeholder="Flat, House no., Building, Company, Street" />
              </div>
              <div className="form-row-three">
                <div className="form-group">
                  <label>City</label>
                  <input required type="text" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input required type="text" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input required type="text" value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                </div>
              </div>
              <div className="address-modal-actions">
                <button type="button" className="cancel" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="save" disabled={addressLoading}>
                  {addressLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL OVERLAY */}
      {selectedInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="invoice-modal-card" onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-actions-bar">
              <button className="download-btn" onClick={() => downloadAsPdf(selectedInvoice)}>
                <Download size={15} /> Download Invoice (PDF)
              </button>
              <button className="print-btn" onClick={() => handlePrint(selectedInvoice)}>
                <Printer size={15} /> Print
              </button>
              <button className="invoice-close-btn" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="invoice-sheet" id="invoice-print-area">
              <div className="top-strip"></div>

              {/* HEADER */}
              <div className="header">
                <div className="company-section">
                  <img src="/kc-logo.png" className="logo" alt="Kleider Care Logo" />
                  <div className="company-info">
                    <h1>KLEIDER CARE PVT LTD</h1>
                    <div className="tagline">Garment Cleaning Expert</div>
                    <div className="company-details">
                      📍 No 1, 181, First Floor,<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;ECR Road, Palavakkam,<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;Chennai - 600041, Tamil Nadu.<br />
                      ☎ +91 81488 14205 | 044 4860 6351<br />
                      ✉ info@kleidercare.com<br />
                      <strong>CIN:</strong> U96010TN2024PTC173997<br />
                      <strong>GSTIN:</strong> 33AALCK336501ZX
                    </div>
                  </div>
                </div>

                {/* INVOICE INFORMATION */}
                <div className="invoice-info">
                  <div className="invoice-title">TAX INVOICE</div>
                  <div className="invoice-meta">
                    <span className="label">TAX INVOICE NO.</span>
                    <span>:</span>
                    <span>KC {selectedInvoice.orderId?.substring(3) || selectedInvoice.id || '759724'}</span>

                    <span className="label">TAX INVOICE DATE</span>
                    <span>:</span>
                    <span>{selectedInvoice.date || new Date().toLocaleDateString('en-IN')}</span>

                    <span className="label">SUPPLIERS REF.</span>
                    <span>:</span>
                    <span>-</span>

                    <span className="label">DELIVERY NOTE</span>
                    <span>:</span>
                    <span>-</span>

                    <span className="label">OTHER REFERENCE</span>
                    <span>:</span>
                    <span>-</span>

                    <span className="label">REVERSE CHARGE (Y/N)</span>
                    <span>:</span>
                    <span>N</span>

                    <span className="label">PLACE OF SUPPLY</span>
                    <span>:</span>
                    <span>{selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29 - Karnataka' : '33 - Tamil Nadu'}</span>

                    <span className="label">STATE</span>
                    <span>:</span>
                    <span>{selectedInvoice.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>
                  </div>
                </div>
              </div>

              {/* BILL / SHIP */}
              <div className="customer-grid">
                <div className="customer-box">
                  <div className="box-title">BILL TO PARTY</div>
                  <div className="customer-box-inner">
                    <div className="customer-icon-wrap"></div>
                    <div className="customer-content">
                      <span className="label">Name</span>
                      <span>:</span>
                      <span>{selectedInvoice.customerName || `${userData.firstName} ${userData.lastName || ''}`.trim() || 'Martin David M'}</span>

                      <span className="label">Address</span>
                      <span>:</span>
                      <span>
                        {selectedInvoice.shippingAddress?.address || 'CMWSSB Division 109, ward 109.'}<br />
                        {selectedInvoice.shippingAddress?.city || 'Chennai'} - {selectedInvoice.shippingAddress?.pincode || '600094'}
                      </span>

                      <span className="label">State</span>
                      <span>:</span>
                      <span>{selectedInvoice.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                      <span className="label">Mobile</span>
                      <span>:</span>
                      <span>{selectedInvoice.phone || userData.mobileNumber || '7904309363'}</span>

                      <span className="label">GSTIN</span>
                      <span>:</span>
                      <span>{selectedInvoice.gstNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="customer-box">
                  <div className="box-title">SHIP TO PARTY</div>
                  <div className="customer-box-inner">
                    <div className="customer-icon-wrap"></div>
                    <div className="customer-content">
                      <span className="label">Name</span>
                      <span>:</span>
                      <span>{selectedInvoice.customerName || `${userData.firstName} ${userData.lastName || ''}`.trim() || 'Martin David M'}</span>

                      <span className="label">Address</span>
                      <span>:</span>
                      <span>
                        {selectedInvoice.shippingAddress?.address || 'CMWSSB Division 109, ward 109.'}<br />
                        {selectedInvoice.shippingAddress?.city || 'Chennai'} - {selectedInvoice.shippingAddress?.pincode || '600094'}
                      </span>

                      <span className="label">State</span>
                      <span>:</span>
                      <span>{selectedInvoice.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                      <span className="label">Mobile</span>
                      <span>:</span>
                      <span>{selectedInvoice.phone || userData.mobileNumber || '7904309363'}</span>

                      <span className="label">GSTIN</span>
                      <span>:</span>
                      <span>{selectedInvoice.gstNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCT TABLE */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '7%' }}>S.NO.</th>
                    <th style={{ width: '29%' }}>DESCRIPTION OF GOODS</th>
                    <th style={{ width: '14%' }}>HSN/SAC</th>
                    <th style={{ width: '9%' }}>QTY</th>
                    <th style={{ width: '11%' }}>UNIT</th>
                    <th style={{ width: '15%' }}>RATE (₹)</th>
                    <th style={{ width: '15%' }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.flatMap((item, idx) => {
                      const hsnCode = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? '34029019' : '84502000';
                      const unitLabel = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? 'Ltr' : 'Nos';

                      const rows = [];
                      const amcPrice = (item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo?.price) ? item.amcWarrantyInfo.price : 0;
                      const progPrice = item.includeProgramSetup ? 18000 : 0;
                      const baseItemPrice = item.basePrice || Math.max(0, item.price - amcPrice - progPrice);

                      const baseItemTotal = baseItemPrice * item.quantity;
                      const baseBeforeTax = Math.round((baseItemTotal / 1.18) * 100) / 100;
                      const baseRateBeforeTax = Math.round((baseItemPrice / 1.18) * 100) / 100;

                      rows.push(
                        <tr key={`main-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="description">
                              {item.name}
                              {item.amcWarrantyInfo && (
                                <div style={{ fontSize: '10px', color: '#073b78', marginTop: '2px', fontWeight: 'bold' }}>
                                  [Covered under {item.amcWarrantyInfo.type}]
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{hsnCode}</td>
                          <td>{item.quantity}</td>
                          <td>{unitLabel}</td>
                          <td>{baseRateBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td>{baseBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );

                      if (item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo) {
                        const amcTotal = amcPrice * item.quantity;
                        const amcBeforeTax = Math.round((amcTotal / 1.18) * 100) / 100;
                        const amcRateBeforeTax = Math.round((amcPrice / 1.18) * 100) / 100;

                        rows.push(
                          <tr key={`amc-${idx}`}>
                            <td></td>
                            <td>
                              <div className="description" style={{ color: '#073b78' }}>
                                🛡️ Kleider Care AMC - {item.amcWarrantyInfo.type}<br />
                                <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#555' }}>1 Year Maintenance Contract</span>
                              </div>
                            </td>
                            <td>998721</td>
                            <td>{item.quantity}</td>
                            <td>Yr</td>
                            <td>{amcRateBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td>{amcBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      }

                      if (item.includeProgramSetup) {
                        const setupTotal = progPrice * item.quantity;
                        const setupBeforeTax = Math.round((setupTotal / 1.18) * 100) / 100;
                        const setupRateBeforeTax = Math.round((progPrice / 1.18) * 100) / 100;

                        rows.push(
                          <tr key={`prog-${idx}`}>
                            <td></td>
                            <td>
                              <div className="description" style={{ color: '#0284c7' }}>
                                ⚙️ Machine Program Setup Add-on<br />
                                <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#555' }}>Custom parameter configuration</span>
                              </div>
                            </td>
                            <td>998313</td>
                            <td>{item.quantity}</td>
                            <td>Job</td>
                            <td>{setupRateBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td>{setupBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      }

                      return rows;
                    })
                  ) : (
                    <tr>
                      <td>1</td>
                      <td>
                        <div className="description">
                          Speed Queen<br />
                          Quantum Touch<br />
                          Washer Extractor<br />
                          18kg
                        </div>
                      </td>
                      <td>84502000</td>
                      <td>1</td>
                      <td>Nos</td>
                      <td>406,779.66</td>
                      <td>406,779.66</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* TOTALS */}
              {(() => {
                const totalAmount = selectedInvoice.total || 480000;
                const totalBeforeTax = Math.round((totalAmount / 1.18) * 100) / 100;
                const totalTaxAmount = Math.round((totalAmount - totalBeforeTax) * 100) / 100;
                const roundedTotal = Math.round(totalAmount);

                return (
                  <div className="total-section">
                    <div className="amount-words">
                      <h4>Total Amount in Words:</h4>
                      <p>{numberToWords(roundedTotal)}</p>
                    </div>

                    <div className="totals">
                      <div className="total-row">
                        <span>TOTAL AMOUNT</span>
                        <span>₹ {totalBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="total-row">
                        <span>OUTPUT IGST @18%</span>
                        <span>₹ {totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="total-row highlight">
                        <span>TOTAL TAX AMOUNT</span>
                        <span>₹ {totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="total-row">
                        <span className="grand-total">TOTAL AMOUNT AFTER TAX (₹)</span>
                        <span className="grand-total">₹ {roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* BANK + NOTES */}
              <div className="lower-grid">
                <div className="info-box">
                  <h3>BANK DETAILS</h3>
                  <div className="bank-row">
                    <strong>Account Name</strong>
                    <span>:</span>
                    <span>M/s Kleider Care Private Limited</span>

                    <strong>Account Number</strong>
                    <span>:</span>
                    <span>50200105053612</span>

                    <strong>IFSC Code</strong>
                    <span>:</span>
                    <span>HDFC0007018</span>

                    <strong>Bank Branch</strong>
                    <span>:</span>
                    <span>
                      HDFC Bank, Palavakkam Branch,<br />
                      Chennai, Tamil Nadu
                    </span>
                  </div>
                </div>

                <div className="info-box">
                  <h3>PLEASE NOTE</h3>
                  <ul className="notes">
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>Interest @ 24% p.a. will be charged on overdue payments.</li>
                    <li>All disputes are subject to Chennai jurisdiction only.</li>
                  </ul>
                </div>
              </div>

              {/* BLANK SEAL & SIGNATURE */}
              <div className="approval-section">
                <div className="approval-box">
                  <div className="approval-title">COMPANY SEAL</div>
                  <div className="blank-box"></div>
                </div>

                <div className="divider"></div>

                <div className="approval-box">
                  <div className="approval-title">AUTHORISED SIGNATURE</div>
                  <div className="blank-box"></div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="footer">
                • &nbsp; This is a computer generated invoice. No signature required. &nbsp; •
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
