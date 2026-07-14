import { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { updateProfile, updateAddresses, addWalletBalance } from '../services/authService';
import Header from './Header';
import Footer from './Footer';
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
  onLoginOpen
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // default tab is orders like zepto
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Profile Form State
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
    setProfileMsg({ type: '', text: '' });
    setProfileLoading(true);
    try {
      const response = await updateProfile({ firstName, lastName, mobileNumber });
      setProfileMsg({ type: 'success', text: response.message || 'Profile updated successfully!' });
      if (onUpdateUser) onUpdateUser(response.user);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddOrEditAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.addressLine || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      alert('Please fill out all address fields');
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
    } catch (err) {
      alert('Failed to save address: ' + err.message);
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
    } catch (err) {
      alert('Failed to delete address: ' + err.message);
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
      setWalletMsg(`Successfully added ₹${amount} to your wallet!`);
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
                {orders.length === 0 ? (
                  <div className="empty-state-view">
                    <ShoppingBag size={48} className="empty-icon" />
                    <h4>No Orders Yet</h4>
                    <p>When you buy commercial laundry machines or spare parts, your orders will appear here.</p>
                  </div>
                ) : (
                  <div className="profile-orders-list">
                    {orders.map((order) => (
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
                            <div key={idx} className="order-item-row">
                              <span>{item.name} <strong style={{color: '#64748b'}}>x{item.quantity}</strong></span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-card-footer">
                          <span className="pay-method">Payment: {order.paymentMethod}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                              className="view-invoice-btn" 
                              onClick={() => setSelectedInvoice(order)}
                              style={{ padding: '6px 12px', border: '1px solid #0f2b5c', color: '#0f2b5c', background: 'none', borderRadius: '6px', fontWeight: '750', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              View Invoice
                            </button>
                            <span className="order-total">Total Paid: <strong>₹{order.total}</strong></span>
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
                    <Info size={16} /> Need further technical help with industrial washers?
                  </div>
                  <p>Our ticketing system is open for support. Click below to file a ticket.</p>
                  <button onClick={() => navigate('/track-order')} className="support-ticket-link-btn" style={{ border: 'none', cursor: 'pointer' }}>Open Support Center</button>
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
                      onClick={() => setAddressForm({...addressForm, type: lbl})}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input required type="text" value={addressForm.addressLine} onChange={e => setAddressForm({...addressForm, addressLine: e.target.value})} placeholder="Flat, House no., Building, Company, Street" />
              </div>
              <div className="form-row-three">
                <div className="form-group">
                  <label>City</label>
                  <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input required type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input required type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} />
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
              <button className="print-btn" onClick={() => window.print()}>Print Invoice</button>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>Close</button>
            </div>
            
            {/* Printable Invoice Sheet */}
            <div className="invoice-sheet" id="invoice-print-area">
              <div className="invoice-header-section">
                <div className="invoice-logo-container">
                  <div className="logo-box">
                    <span className="logo-text-bold">KC</span>
                    <span className="logo-subtext">KLEIDER CARE</span>
                  </div>
                </div>
                <div className="invoice-company-details">
                  <h4>KLEIDER CARE PVT LTD</h4>
                  <p>NO 1, 1/91, First Floor,</p>
                  <p>ECR Road, Palavakkam,</p>
                  <p>Chennai - 600041, Tamil Nadu.</p>
                  <p>Mobile no: +91 8148814205, Phone no: 04448606351,</p>
                  <p>Email: support@kleidercare.com</p>
                  <p>Company's CIN: U96010TN2024PTC173997</p>
                  <p>Company's GSTIN: 33AALCK3365Q1ZX</p>
                </div>
              </div>
              
              <div className="invoice-title-banner">
                Tax Invoice
              </div>
              
              <div className="invoice-meta-grid">
                <div className="meta-cell"><span className="label">Tax Invoice No:</span> <span className="value">KC {selectedInvoice.orderId?.substring(3) || '203075'}</span></div>
                <div className="meta-cell"><span className="label">Supplier's Ref:</span> <span className="value"></span></div>
                <div className="meta-cell"><span className="label">Tax Invoice Date:</span> <span className="value">{selectedInvoice.date}</span></div>
                <div className="meta-cell"><span className="label">Delivery Note:</span> <span className="value"></span></div>
                <div className="meta-cell"><span className="label">Reverse Charge (Y/N):</span> <span className="value">N</span></div>
                <div className="meta-cell"><span className="label">Other Reference:</span> <span className="value"></span></div>
                <div className="meta-cell"><span className="label">State:</span> <span className="value">Tamil Nadu (Code: 33)</span></div>
                <div className="meta-cell"><span className="label">Place of Supply:</span> <span className="value">{selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29-Karnataka' : '33-Tamil Nadu'}</span></div>
              </div>
              
              <div className="invoice-parties-grid">
                <div className="party-column">
                  <div className="party-header">Bill to Party</div>
                  <p className="party-name"><strong>Name:</strong> {selectedInvoice.customerName}</p>
                  <p className="party-address"><strong>Address:</strong> {selectedInvoice.shippingAddress?.address || 'N/A'}</p>
                  <p className="party-city-pincode">{selectedInvoice.shippingAddress?.city || ''} - {selectedInvoice.shippingAddress?.pincode || ''}</p>
                  <p className="party-state"><strong>State:</strong> {selectedInvoice.shippingAddress?.state || 'N/A'} (Code: {selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</p>
                  <p className="party-phone"><strong>Mobile:</strong> {selectedInvoice.phone || userData.mobileNumber}</p>
                  <p className="party-gstin"><strong>GSTIN:</strong> </p>
                </div>
                <div className="party-column">
                  <div className="party-header">Ship to Party</div>
                  <p className="party-name"><strong>Name:</strong> {selectedInvoice.customerName}</p>
                  <p className="party-address"><strong>Address:</strong> {selectedInvoice.shippingAddress?.address || 'N/A'}</p>
                  <p className="party-city-pincode">{selectedInvoice.shippingAddress?.city || ''} - {selectedInvoice.shippingAddress?.pincode || ''}</p>
                  <p className="party-state"><strong>State:</strong> {selectedInvoice.shippingAddress?.state || 'N/A'} (Code: {selectedInvoice.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</p>
                  <p className="party-phone"><strong>Mobile:</strong> {selectedInvoice.phone || userData.mobileNumber}</p>
                  <p className="party-gstin"><strong>GSTIN:</strong> </p>
                </div>
              </div>
              
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Description of Goods</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th colSpan="2">IGST</th>
                    <th>Total</th>
                  </tr>
                  <tr className="sub-headers">
                    <th colSpan="7"></th>
                    <th>%</th>
                    <th>Amt</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => {
                    const hsnCode = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? '34029019' : '84502000';
                    const unitLabel = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? 'Ltr' : 'Nos';
                    
                    // Tax calculation
                    const itemTotal = item.price * item.quantity;
                    const beforeTax = Math.round((itemTotal / 1.18) * 100) / 100;
                    const igstAmt = Math.round((itemTotal - beforeTax) * 100) / 100;
                    const rateBeforeTax = Math.round((item.price / 1.18) * 100) / 100;
                    
                    return (
                      <tr key={idx} className="item-row">
                        <td>{idx + 1}</td>
                        <td className="desc-cell"><strong>{item.name}</strong></td>
                        <td>{hsnCode}</td>
                        <td>{item.quantity}</td>
                        <td>{unitLabel}</td>
                        <td>{rateBeforeTax.toFixed(2)}</td>
                        <td>{beforeTax.toFixed(2)}</td>
                        <td>18</td>
                        <td>{igstAmt.toFixed(2)}</td>
                        <td>{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Totals Row */}
                  {(() => {
                    const totalQty = selectedInvoice.items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalBeforeTax = Math.round((selectedInvoice.total / 1.18) * 100) / 100;
                    const totalIgst = Math.round((selectedInvoice.total - totalBeforeTax) * 100) / 100;
                    const roundedTotal = Math.round(selectedInvoice.total);
                    const roundOff = Math.round((roundedTotal - selectedInvoice.total) * 100) / 100;
                    
                    return (
                      <>
                        <tr className="totals-row">
                          <td colSpan="3"><strong>Total</strong></td>
                          <td><strong>{totalQty}</strong></td>
                          <td colSpan="2"></td>
                          <td><strong>{totalBeforeTax.toFixed(2)}</strong></td>
                          <td></td>
                          <td><strong>{totalIgst.toFixed(2)}</strong></td>
                          <td><strong>{selectedInvoice.total.toFixed(2)}</strong></td>
                        </tr>
                        
                        <tr className="summary-bottom-row">
                          <td colSpan="6" className="words-cell">
                            <strong>Total Amount in Words:</strong><br />
                            {numberToWords(roundedTotal)}
                          </td>
                          <td colSpan="3" className="breakdown-labels">
                            <p>Total Amount before Tax (Rs)</p>
                            <p>OUTPUT IGST - 18 (18%)</p>
                            <p>Add: Round Off (Rs)</p>
                            <p className="final-label">Total Amount After Tax (Rs)</p>
                          </td>
                          <td className="breakdown-values">
                            <p>{totalBeforeTax.toFixed(2)}</p>
                            <p>{totalIgst.toFixed(2)}</p>
                            <p>{roundOff.toFixed(2)}</p>
                            <p className="final-value"><strong>{roundedTotal.toFixed(2)}</strong></p>
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
              
              <div className="invoice-footer-section">
                <div className="bank-notes-column">
                  <h5>Notes</h5>
                  <p>Account Name: M/s Kleider Care Private Limited</p>
                  <p>Account Number: 50200105053612</p>
                  <p>IFSC Code: HDFC0007018</p>
                  <p>Bank Branch: HDFC Bank, Palavakkam Branch,</p>
                  <p>ECR, Chennai, Tamil Nadu</p>
                </div>
                <div className="seal-column">
                  <div className="seal-box">Common Seal</div>
                </div>
                <div className="signature-column">
                  <p>* Computer Generated Invoice. No signature is required.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
