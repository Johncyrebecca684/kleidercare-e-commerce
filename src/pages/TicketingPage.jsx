import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Phone, Mail, MapPin, Package, Truck, Calendar, Shield, Download, User, FileText, Printer } from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { printInvoiceElement } from '../utils/invoicePrint';
import '../components/UserProfile.css';
import './TicketingPage.css';

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

  const integerPart = Math.floor(num || 0);
  const words = c(integerPart);
  return words ? words + ' Rupees Only' : 'Zero Rupees Only';
}

export default function TicketingPage({ isAdmin = false, loggedInUser, userOrders = [] }) {
  const navigate = useNavigate();
  const [searchPhone, setSearchPhone] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Mock customer database
  const mockCustomers = {
    '9876543210': {
      customerId: 'CUST001',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@email.com',
      address: '123 Main Street, Mumbai, Maharashtra 400001',
      joinDate: '2024-01-15',
      totalOrders: 3,
      totalSpent: '₹115,498',
      orders: [
        {
          orderId: 'ORD123456',
          productId: 'PRD-LG-WASH-101',
          productName: 'LG Front Load Washing Machine',
          productImage: 'https://via.placeholder.com/100x100?text=LG+Machine',
          category: 'LG Commercial Laundry Machines',
          price: '₹35,999',
          quantity: 1,
          orderDate: '2024-05-15',
          deliveryDate: '2024-05-22',
          status: 'Delivered',
          paymentMethod: 'Credit Card',
          warranty: '2 Years (Parts & Labor)',
          warrantyExpiry: '2026-05-22',
          trackingId: 'TRK123456789',
          specifications: 'Front Load, 8kg, Energy Efficient'
        },
        {
          orderId: 'ORD234567',
          productId: 'PRD-ARIEL-DET-05',
          productName: 'Ariel Detergent Powder (2kg)',
          productImage: 'https://via.placeholder.com/100x100?text=Ariel',
          category: 'PONY Finishing Equipments',
          price: '₹449',
          quantity: 5,
          orderDate: '2024-04-20',
          deliveryDate: '2024-04-23',
          status: 'Delivered',
          paymentMethod: 'Debit Card',
          warranty: 'No Warranty',
          warrantyExpiry: 'N/A',
          trackingId: 'TRK234567890',
          specifications: 'Powder, Original Scent, 2kg Pack'
        },
        {
          orderId: 'ORD345678',
          productId: 'PRD-HARPIC-CLN-08',
          productName: 'Harpic Toilet Cleaner (500ml)',
          productImage: 'https://via.placeholder.com/100x100?text=Harpic',
          category: 'Speed Queen Commercial Laundry Machines',
          price: '₹150',
          quantity: 3,
          orderDate: '2024-06-01',
          deliveryDate: null,
          status: 'In Transit',
          paymentMethod: 'UPI',
          warranty: 'No Warranty',
          warrantyExpiry: 'N/A',
          trackingId: 'TRK345678901',
          specifications: 'Disinfectant, 500ml Bottle'
        }
      ]
    },
    '9123456789': {
      customerId: 'CUST002',
      name: 'Priya Sharma',
      phone: '9123456789',
      email: 'priya.sharma@email.com',
      address: '456 Park Avenue, Bangalore, Karnataka 560001',
      joinDate: '2024-02-10',
      totalOrders: 2,
      totalSpent: '₹78,500',
      orders: [
        {
          orderId: 'ORD456789',
          productId: 'PRD-SQ-WASH-201',
          productName: 'Speed Queen Commercial Washer',
          productImage: 'https://via.placeholder.com/100x100?text=Speed+Queen',
          category: 'LG Commercial Laundry Machines',
          price: '₹78,500',
          quantity: 1,
          orderDate: '2024-05-10',
          deliveryDate: '2024-05-18',
          status: 'Delivered',
          paymentMethod: 'Bank Transfer',
          warranty: '3 Years (Parts & Labor)',
          warrantyExpiry: '2027-05-18',
          trackingId: 'TRK456789012',
          specifications: 'Commercial Grade, Heavy Duty, Stainless Steel'
        },
        {
          orderId: 'ORD567890',
          productId: 'PRD-SOFTENER-250',
          productName: 'Fabric Softener Spray (250ml)',
          productImage: 'https://via.placeholder.com/100x100?text=Softener',
          category: 'Speed Queen Commercial Laundry Machines',
          price: '₹199',
          quantity: 2,
          orderDate: '2024-05-25',
          deliveryDate: '2024-05-27',
          status: 'Delivered',
          paymentMethod: 'UPI',
          warranty: 'No Warranty',
          warrantyExpiry: 'N/A',
          trackingId: 'TRK567890123',
          specifications: 'Floral Scent, 250ml Spray'
        }
      ]
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanPhone = searchPhone.replace(/\D/g, '');
    const customer = mockCustomers[cleanPhone];
    
    if (customer) {
      setCustomerData(customer);
      setSearched(true);
    } else {
      setCustomerData(null);
      setSearched(true);
    }
  };

  const isWarrantyActive = (expiry) => {
    if (expiry === 'N/A') return false;
    const expiryDate = new Date(expiry);
    return expiryDate > new Date();
  };

  const renderInvoiceModal = () => {
    if (!selectedInvoiceOrder) return null;
    return (
      <div className="invoice-modal-overlay" onClick={() => setSelectedInvoiceOrder(null)}>
        <div className="invoice-modal-card" onClick={e => e.stopPropagation()}>
          <div className="invoice-modal-actions-bar">
            <button className="print-btn" onClick={() => window.print()}>
              <Printer size={16} /> Print Tax Invoice
            </button>
            <button className="close-btn" onClick={() => setSelectedInvoiceOrder(null)}>Close</button>
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
              <div className="meta-cell"><span className="label">Tax Invoice No:</span> <span className="value">KC-{selectedInvoiceOrder.id?.substring(3) || '203075'}</span></div>
              <div className="meta-cell"><span className="label">Supplier's Ref:</span> <span className="value"></span></div>
              <div className="meta-cell"><span className="label">Tax Invoice Date:</span> <span className="value">{new Date(selectedInvoiceOrder.date || Date.now()).toLocaleDateString('en-IN')}</span></div>
              <div className="meta-cell"><span className="label">Delivery Note:</span> <span className="value"></span></div>
              <div className="meta-cell"><span className="label">Reverse Charge (Y/N):</span> <span className="value">N</span></div>
              <div className="meta-cell"><span className="label">Other Reference:</span> <span className="value"></span></div>
              <div className="meta-cell"><span className="label">State:</span> <span className="value">Tamil Nadu (Code: 33)</span></div>
              <div className="meta-cell"><span className="label">Place of Supply:</span> <span className="value">{selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29-Karnataka' : '33-Tamil Nadu'}</span></div>
            </div>
            
            <div className="invoice-parties-grid">
              <div className="party-column">
                <div className="party-header">Bill to Party</div>
                <p className="party-name"><strong>Name:</strong> {selectedInvoiceOrder.customerName || 'Customer'}</p>
                {selectedInvoiceOrder.companyName && <p className="party-company"><strong>Company:</strong> {selectedInvoiceOrder.companyName}</p>}
                <p className="party-address"><strong>Address:</strong> {selectedInvoiceOrder.shippingAddress?.address || 'Palavakkam, Chennai'}</p>
                <p className="party-city-pincode">{selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600041'}</p>
                <p className="party-state"><strong>State:</strong> {selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</p>
                <p className="party-phone"><strong>Mobile:</strong> {selectedInvoiceOrder.phone || '+91 9876543210'}</p>
                <p className="party-gstin"><strong>GSTIN:</strong> {selectedInvoiceOrder.gstNumber || '33AALCK3365Q1ZX'}</p>
              </div>
              <div className="party-column">
                <div className="party-header">Ship to Party</div>
                <p className="party-name"><strong>Name:</strong> {selectedInvoiceOrder.customerName || 'Customer'}</p>
                {selectedInvoiceOrder.companyName && <p className="party-company"><strong>Company:</strong> {selectedInvoiceOrder.companyName}</p>}
                <p className="party-address"><strong>Address:</strong> {selectedInvoiceOrder.shippingAddress?.address || 'Palavakkam, Chennai'}</p>
                <p className="party-city-pincode">{selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600041'}</p>
                <p className="party-state"><strong>State:</strong> {selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</p>
                <p className="party-phone"><strong>Mobile:</strong> {selectedInvoiceOrder.phone || '+91 9876543210'}</p>
                <p className="party-gstin"><strong>GSTIN:</strong> {selectedInvoiceOrder.gstNumber || '33AALCK3365Q1ZX'}</p>
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
                {selectedInvoiceOrder.items?.flatMap((item, idx) => {
                  const hsnCode = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? '34029019' : '84502000';
                  const unitLabel = item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? 'Ltr' : 'Nos';

                  const rows = [];
                  
                  // Main Item (Base product)
                  const amcPrice = (item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo?.price) ? item.amcWarrantyInfo.price : 0;
                  const progPrice = item.includeProgramSetup ? 18000 : 0;
                  const baseItemPrice = item.basePrice || Math.max(0, item.price - amcPrice - progPrice);

                  const baseItemTotal = baseItemPrice * item.quantity;
                  const baseBeforeTax = Math.round((baseItemTotal / 1.18) * 100) / 100;
                  const baseIgstAmt = Math.round((baseItemTotal - baseBeforeTax) * 100) / 100;
                  const baseRateBeforeTax = Math.round((baseItemPrice / 1.18) * 100) / 100;

                  rows.push(
                    <tr key={`main-${idx}`} className="item-row">
                      <td>{idx + 1}</td>
                      <td className="desc-cell">
                        <strong>{item.name}</strong>
                        {item.amcWarrantyInfo && (
                          <div style={{ fontSize: '11px', color: '#0f2b5c', marginTop: '2px', fontWeight: '600' }}>
                            [Covered under {item.amcWarrantyInfo.type}]
                          </div>
                        )}
                      </td>
                      <td>{hsnCode}</td>
                      <td>{item.quantity}</td>
                      <td>{unitLabel}</td>
                      <td>{baseRateBeforeTax.toFixed(2)}</td>
                      <td>{baseBeforeTax.toFixed(2)}</td>
                      <td>18</td>
                      <td>{baseIgstAmt.toFixed(2)}</td>
                      <td>{baseItemTotal.toFixed(2)}</td>
                    </tr>
                  );

                  // AMC Warranty Line Item in Invoice
                  if (item.selectedWarranty && item.selectedWarranty !== 'none' && item.amcWarrantyInfo) {
                    const amcTotal = amcPrice * item.quantity;
                    const amcBeforeTax = Math.round((amcTotal / 1.18) * 100) / 100;
                    const amcIgstAmt = Math.round((amcTotal - amcBeforeTax) * 100) / 100;
                    const amcRateBeforeTax = Math.round((amcPrice / 1.18) * 100) / 100;

                    rows.push(
                      <tr key={`amc-${idx}`} className="item-row amc-invoice-line" style={{ background: '#f0f7ff' }}>
                        <td></td>
                        <td className="desc-cell" style={{ paddingLeft: '16px' }}>
                          <strong style={{ color: '#0f2b5c' }}>🛡️ Kleider Care AMC - {item.amcWarrantyInfo.type}</strong>
                          <div style={{ fontSize: '11px', color: '#475569' }}>
                            1 Year Maintenance Contract (3 PM Visits/Yr + 24–48h Priority Hotline)
                          </div>
                        </td>
                        <td>998721</td>
                        <td>{item.quantity}</td>
                        <td>Yr</td>
                        <td>{amcRateBeforeTax.toFixed(2)}</td>
                        <td>{amcBeforeTax.toFixed(2)}</td>
                        <td>18</td>
                        <td>{amcIgstAmt.toFixed(2)}</td>
                        <td>{amcTotal.toFixed(2)}</td>
                      </tr>
                    );
                  }

                  // Machine Program Setup Line Item in Invoice
                  if (item.includeProgramSetup) {
                    const setupTotal = progPrice * item.quantity;
                    const setupBeforeTax = Math.round((setupTotal / 1.18) * 100) / 100;
                    const setupIgstAmt = Math.round((setupTotal - setupBeforeTax) * 100) / 100;
                    const setupRateBeforeTax = Math.round((progPrice / 1.18) * 100) / 100;

                    rows.push(
                      <tr key={`prog-${idx}`} className="item-row amc-invoice-line" style={{ background: '#f8fafc' }}>
                        <td></td>
                        <td className="desc-cell" style={{ paddingLeft: '16px' }}>
                          <strong style={{ color: '#0284c7' }}>⚙️ Machine Program Parameter Setup Add-on</strong>
                          <div style={{ fontSize: '11px', color: '#475569' }}>
                            Custom programming up to 10 programs in LG commercial unit
                          </div>
                        </td>
                        <td>998313</td>
                        <td>{item.quantity}</td>
                        <td>Job</td>
                        <td>{setupRateBeforeTax.toFixed(2)}</td>
                        <td>{setupBeforeTax.toFixed(2)}</td>
                        <td>18</td>
                        <td>{setupIgstAmt.toFixed(2)}</td>
                        <td>{setupTotal.toFixed(2)}</td>
                      </tr>
                    );
                  }

                  return rows;
                })}
                
                {/* Totals Row */}
                {(() => {
                  const totalQty = selectedInvoiceOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;
                  const totalAmount = selectedInvoiceOrder.total || 0;
                  const totalBeforeTax = Math.round((totalAmount / 1.18) * 100) / 100;
                  const totalIgst = Math.round((totalAmount - totalBeforeTax) * 100) / 100;
                  const roundedTotal = Math.round(totalAmount);
                  const roundOff = Math.round((roundedTotal - totalAmount) * 100) / 100;
                  
                  return (
                    <>
                      <tr className="totals-row">
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>{totalQty}</strong></td>
                        <td colSpan="2"></td>
                        <td><strong>{totalBeforeTax.toFixed(2)}</strong></td>
                        <td></td>
                        <td><strong>{totalIgst.toFixed(2)}</strong></td>
                        <td><strong>{selectedInvoiceOrder.total.toFixed(2)}</strong></td>
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
    );
  };

  if (searched && customerData) {
    return (
      <div className="ticketingPageContainer animate-fade-in">
        <div className="ticketingHeader">
          {!isAdmin && (
            <button className="backBtn" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
              Back
            </button>
          )}
          <h1 className="pageTitle">Customer Support Ticketing</h1>
        </div>

        <div className="ticketingContent" id="ticketing-print-area">
          {/* Customer Overview Card */}
          <div className="customerCard">
            <div className="cardHeader">
              <h2>Ticket ID: {customerData.phone}</h2>
              <button className="downloadBtn" onClick={() => window.print()}>
                <Download size={18} />
                Export Details
              </button>
            </div>
            
            <div className="customerDetails">
              <div className="detailItem">
                <User size={18} />
                <div className="detailText">
                  <span className="label">Customer Name</span>
                  <span className="value">{customerData.name}</span>
                </div>
              </div>
              <div className="detailItem">
                <Phone size={18} />
                <div className="detailText">
                  <span className="label">Phone</span>
                  <span className="value">{customerData.phone}</span>
                </div>
              </div>
              <div className="detailItem">
                <Mail size={18} />
                <div className="detailText">
                  <span className="label">Email</span>
                  <span className="value">{customerData.email}</span>
                </div>
              </div>
              <div className="detailItem address">
                <MapPin size={18} />
                <div className="detailText">
                  <span className="label">Address</span>
                  <span className="value">{customerData.address}</span>
                </div>
              </div>
              <div className="detailItem">
                <Calendar size={18} />
                <div className="detailText">
                  <span className="label">Customer Since</span>
                  <span className="value">{customerData.joinDate}</span>
                </div>
              </div>
            </div>

            <div className="customerStats">
              <div className="statBox">
                <div className="statNumber">{customerData.totalOrders}</div>
                <div className="statLabel">Total Orders</div>
              </div>
              <div className="statBox">
                <div className="statNumber">{customerData.totalSpent}</div>
                <div className="statLabel">Total Spent</div>
              </div>
            </div>
          </div>

          {/* Orders Section */}
          <div className="ordersSection">
            <h3 className="sectionTitle">Order History & Details</h3>
            
            {customerData.orders.map((order, index) => (
              <div key={index} className="orderCard">
                <div className="orderHeader">
                  <div className="orderInfo">
                    <h4 className="orderTitle">{order.productName}</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span className="orderId">Order ID: {order.orderId}</span>
                      <span className="orderId" style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        Product ID: {order.productId || `PRD-${order.orderId.replace('ORD', '')}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const numericPrice = parseInt(order.price.replace(/[^\d]/g, ''), 10) || 35999;
                        setSelectedInvoiceOrder({
                          id: order.orderId,
                          customerName: customerData.name,
                          userEmail: customerData.email,
                          phone: customerData.phone,
                          companyName: customerData.name + ' Enterprise Pvt Ltd',
                          gstNumber: '33AALCK3365Q1ZX',
                          date: order.orderDate,
                          total: numericPrice,
                          paymentStatus: 'Paid',
                          shippingAddress: {
                            address: customerData.address,
                            city: 'Chennai',
                            state: 'Tamil Nadu',
                            pincode: '600041'
                          },
                          items: [
                            {
                              name: order.productName,
                              quantity: order.quantity || 1,
                              price: numericPrice,
                              selectedWarranty: order.warranty.includes('Year') ? 'comprehensive' : 'none',
                              amcWarrantyInfo: order.warranty.includes('Year') ? { type: 'Comprehensive AMC', price: 18500 } : null
                            }
                          ]
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: '1px solid #0284c7',
                        background: '#f0f9ff',
                        color: '#0369a1',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="View & Print Official GST Tax Invoice for Customer"
                    >
                      <FileText size={14} /> View Tax Invoice
                    </button>
                    <div className={`statusBadge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </div>
                  </div>
                </div>

                <div className="orderGrid">
                  <div className="orderColumn">
                    <div className="orderDetail">
                      <span className="detailLabel">Product ID</span>
                      <span className="detailValue" style={{ fontWeight: '700', color: '#0f2b5c' }}>
                        {order.productId || `PRD-${order.orderId.replace('ORD', '')}`}
                      </span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Order Date</span>
                      <span className="detailValue">{order.orderDate}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Product Category</span>
                      <span className="detailValue">{order.category}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Price</span>
                      <span className="detailValue">{order.price}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Quantity</span>
                      <span className="detailValue">{order.quantity}</span>
                    </div>
                  </div>

                  <div className="orderColumn">
                    <div className="orderDetail">
                      <span className="detailLabel">Delivery Date</span>
                      <span className="detailValue">{order.deliveryDate || 'Pending'}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Tracking ID</span>
                      <span className="detailValue">{order.trackingId}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Payment Method</span>
                      <span className="detailValue">{order.paymentMethod}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Specifications</span>
                      <span className="detailValue">{order.specifications}</span>
                    </div>
                  </div>

                  <div className="orderColumn">
                    <div className="orderDetail">
                      <Shield size={18} />
                      <span className="detailLabel">Warranty</span>
                      <span className="detailValue">{order.warranty}</span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Warranty Expiry</span>
                      <span className={`detailValue ${!isWarrantyActive(order.warrantyExpiry) && order.warrantyExpiry !== 'N/A' ? 'expired' : ''}`}>
                        {order.warrantyExpiry}
                      </span>
                    </div>
                    <div className="orderDetail">
                      <span className="detailLabel">Warranty Status</span>
                      <span className={`warrantyStatus ${isWarrantyActive(order.warrantyExpiry) ? 'active' : 'inactive'}`}>
                        {isWarrantyActive(order.warrantyExpiry) ? 'Active' : (order.warranty === 'No Warranty' ? 'N/A' : 'Expired')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAX INVOICE MODAL OVERLAY */}
        {renderInvoiceModal()}
      </div>
    );
  }

  return (
    <div className="ticketingPageContainer animate-fade-in">
      <div className="ticketingHeader">
        {!isAdmin && (
          <button className="backBtn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            Back
          </button>
        )}
        <h1 className="pageTitle">Customer Support Ticketing</h1>
      </div>

      <div className="ticketingContent">
        <div className="searchCard">
          <h2 className="searchTitle">Search Customer Ticket</h2>
          <p className="searchSubtitle">Enter customer phone number to view their details, orders, and warranty information</p>

          <form className="searchForm" onSubmit={handleSearch}>
            <div className="searchInputWrapper">
              <Search size={20} className="searchIcon" />
              <input
                type="tel"
                className="searchInput"
                placeholder="Enter customer phone number (e.g., 9876543210)"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                required
              />
              <button type="submit" className="ticketSearchBtn">Search Ticket</button>
            </div>
          </form>

          <div className="sampleTickets">
            <p>Sample Phone Numbers: <strong>9876543210</strong> or <strong>9123456789</strong></p>
          </div>
        </div>

        {searched && !customerData && (
          <div className="noResults">
            <h2>Ticket Not Found</h2>
            <p>No customer found with this phone number. Please verify and try again.</p>
          </div>
        )}

        {/* POPUP CUSTOMER SUPPORT CHATBOT */}
        {!isAdmin && <Chatbot embedded={false} loggedInUser={loggedInUser} userOrders={userOrders} />}
      </div>

      {/* TAX INVOICE MODAL OVERLAY FOR ADMIN SUPPORT TICKETING */}
      {selectedInvoiceOrder && (
        <div className="invoice-modal-overlay" onClick={() => setSelectedInvoiceOrder(null)}>
          <div className="invoice-modal-card" onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-actions-bar">
              <button 
                className="print-btn" 
                onClick={() => {
                  const invId = selectedInvoiceOrder.orderId || selectedInvoiceOrder.id || '203075';
                  const docTitle = `Invoice_KC_${invId.toString().replace(/#/g, '')}`;
                  printInvoiceElement('invoice-print-area', docTitle);
                }}
              >
                <Printer size={16} /> Print Tax Invoice
              </button>
              <button className="invoice-close-btn" onClick={() => setSelectedInvoiceOrder(null)}>Close</button>
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
                    <span>KC {selectedInvoiceOrder.orderId?.substring(3) || selectedInvoiceOrder.id || '759724'}</span>

                    <span className="label">TAX INVOICE DATE</span>
                    <span>:</span>
                    <span>{new Date(selectedInvoiceOrder.date || selectedInvoiceOrder.rawDate || Date.now()).toLocaleDateString('en-IN')}</span>

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
                    <span>{selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29 - Karnataka' : '33 - Tamil Nadu'}</span>

                    <span className="label">STATE</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>
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
                      <span>{selectedInvoiceOrder.customerName || 'Martin David M'}</span>

                      <span className="label">Address</span>
                      <span>:</span>
                      <span>
                        {selectedInvoiceOrder.shippingAddress?.address || 'CMWSSB Division 109, ward 109.'}<br />
                        {selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600094'}
                      </span>

                      <span className="label">State</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                      <span className="label">Mobile</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.phone || '7904309363'}</span>

                      <span className="label">GSTIN</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.gstNumber || 'N/A'}</span>
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
                      <span>{selectedInvoiceOrder.customerName || 'Martin David M'}</span>

                      <span className="label">Address</span>
                      <span>:</span>
                      <span>
                        {selectedInvoiceOrder.shippingAddress?.address || 'CMWSSB Division 109, ward 109.'}<br />
                        {selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600094'}
                      </span>

                      <span className="label">State</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                      <span className="label">Mobile</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.phone || '7904309363'}</span>

                      <span className="label">GSTIN</span>
                      <span>:</span>
                      <span>{selectedInvoiceOrder.gstNumber || 'N/A'}</span>
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
                  {selectedInvoiceOrder.items && selectedInvoiceOrder.items.length > 0 ? (
                    selectedInvoiceOrder.items.flatMap((item, idx) => {
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
                const totalAmount = selectedInvoiceOrder.total || 480000;
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
    </div>
  );
}
