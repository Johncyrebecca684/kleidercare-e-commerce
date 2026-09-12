import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  Calendar,
  Shield,
  Download,
  User,
  FileText,
  Printer,
  Plus,
  Wrench,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  FileCheck,
  Building2,
  Tag,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import Chatbot from '../components/Chatbot';
import { printInvoiceElement } from '../utils/invoicePrint';
import { API_URL } from '../config';
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
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'amc' | 'warranty' | 'parts' | 'tickets'
  const [orderFilterTerm, setOrderFilterTerm] = useState('');

  // Modal State for Parts Replacement & Support Ticket creation
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [newPartForm, setNewPartForm] = useState({
    equipmentName: '',
    partName: '',
    partSerial: '',
    technicianName: '',
    reason: '',
    warrantyPeriod: '6 Months',
    replacementDate: new Date().toISOString().split('T')[0]
  });

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'Breakdown Support',
    priority: 'High',
    description: '',
    assignedEngineer: 'Rajesh Kumar (Senior Technical Support)'
  });

  // Calculate default expiry date (e.g. +6 months) based on selected replacement warranty period
  const calculatePartWarrantyExpiry = (startDateStr, durationStr) => {
    const start = startDateStr ? new Date(startDateStr) : new Date();
    let months = 6;
    if (durationStr.includes('1 Year') || durationStr.includes('12')) months = 12;
    else if (durationStr.includes('3 Months')) months = 3;
    else if (durationStr.includes('2 Year')) months = 24;

    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry.toISOString().split('T')[0];
  };

  const isWarrantyActive = (expiryStr) => {
    if (!expiryStr || expiryStr === 'N/A') return false;
    const expiryDate = new Date(expiryStr);
    return expiryDate > new Date();
  };

  // Perform Live Customer Lookup from real database orders
  const executeCustomerSearch = async (targetPhone) => {
    const rawSearch = targetPhone.trim();
    if (!rawSearch) return;

    setLoadingSearch(true);
    const cleanPhoneDigits = rawSearch.replace(/\D/g, '');

    let allOrdersList = [...userOrders];

    // Attempt fetching live orders from backend database if local prop is empty
    if (allOrdersList.length === 0) {
      try {
        const token = localStorage.getItem('kc_auth_token');
        const endpoint = isAdmin || (loggedInUser && loggedInUser.role === 'admin')
          ? `${API_URL}/api/orders/admin-all`
          : `${API_URL}/api/orders/my-orders`;

        const res = await fetch(endpoint, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const dbOrders = await res.json();
          if (Array.isArray(dbOrders)) {
            allOrdersList = dbOrders.map(o => ({
              id: o.orderId || o._id,
              orderId: o.orderId || o._id,
              mongoId: o._id,
              date: new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN'),
              rawDate: o.createdAt || new Date().toISOString(),
              items: o.items || [],
              totalAmount: o.totalAmount || 0,
              total: o.totalAmount || 0,
              status: o.status || 'Delivered',
              userEmail: o.userEmail || o.email || '',
              customerName: o.customerName || 'Customer',
              paymentStatus: o.paymentStatus || 'Paid',
              paymentMethod: o.paymentMethod || 'Online Payment',
              phone: o.phone || o.shippingAddress?.phone || '',
              shippingAddress: o.shippingAddress || {},
              companyName: o.companyName || '',
              gstNumber: o.gstNumber || '',
              warranty: o.warranty || '1 Year Standard Warranty'
            }));
          }
        }
      } catch (err) {
        console.warn('Could not fetch external orders for ticket lookup:', err);
      }
    }

    // Filter orders matching phone number, email, or order ID
    const matchingOrders = allOrdersList.filter(o => {
      const orderPhone = (o.phone || o.shippingAddress?.phone || '').replace(/\D/g, '');
      const userEmail = (o.userEmail || o.email || '').toLowerCase();
      const orderId = (o.orderId || o.id || '').toLowerCase();
      const lowerSearch = rawSearch.toLowerCase();

      return (cleanPhoneDigits && orderPhone.includes(cleanPhoneDigits)) ||
             (lowerSearch && userEmail.includes(lowerSearch)) ||
             (lowerSearch && orderId.includes(lowerSearch));
    });

    const targetPhoneKey = cleanPhoneDigits || rawSearch;

    // Load saved parts replacement history from localStorage
    const savedParts = JSON.parse(localStorage.getItem('kc_parts_replacements') || '[]');
    const customerParts = savedParts.filter(p => (p.phone && p.phone.includes(targetPhoneKey)) || (p.customerPhone && p.customerPhone.includes(targetPhoneKey)));

    // Load saved customer support tickets from localStorage
    const savedTickets = JSON.parse(localStorage.getItem('kc_customer_tickets') || '[]');
    const customerTickets = savedTickets.filter(t => (t.phone && t.phone.includes(targetPhoneKey)) || (t.customerPhone && t.customerPhone.includes(targetPhoneKey)));

    if (matchingOrders.length > 0) {
      const primaryOrder = matchingOrders[0];
      const customerName = primaryOrder.customerName || 'Valued Customer';
      const customerEmail = primaryOrder.userEmail || 'customer@kleidercare.com';
      const customerPhone = primaryOrder.phone || targetPhoneKey;
      const addrObj = primaryOrder.shippingAddress || {};
      const fullAddressStr = typeof addrObj === 'object'
        ? `${addrObj.address || ''}, ${addrObj.city || ''}, ${addrObj.state || ''} ${addrObj.pincode || ''}`
        : String(addrObj || '');

      const totalSpentVal = matchingOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

      // Derive AMC contracts dynamically from orders
      const amcContracts = matchingOrders.flatMap(o => {
        return (o.items || []).filter(item => {
          const itemNameLower = (item.name || '').toLowerCase();
          return item.selectedWarranty || item.amcWarrantyInfo || itemNameLower.includes('washer') || itemNameLower.includes('dryer') || itemNameLower.includes('lg') || itemNameLower.includes('speed queen');
        }).map((item, idx) => {
          const orderDate = new Date(o.rawDate || o.date || Date.now());
          const expiryDate = new Date(orderDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);

          const pm1Date = new Date(orderDate); pm1Date.setDate(pm1Date.getDate() + 30);
          const pm2Date = new Date(orderDate); pm2Date.setDate(pm2Date.getDate() + 180);
          const pm3Date = new Date(orderDate); pm3Date.setDate(pm3Date.getDate() + 300);

          return {
            contractId: `AMC-${o.orderId || o.id}-${idx + 1}`,
            orderId: o.orderId || o.id,
            equipmentName: item.name || 'Commercial Laundry Equipment',
            planType: item.amcWarrantyInfo?.type || (item.selectedWarranty === 'comprehensive' ? 'Kleider Care Comprehensive AMC' : 'Kleider Care 1-Year AMC Plan'),
            status: expiryDate > new Date() ? 'Active' : 'Expired',
            startDate: orderDate.toLocaleDateString('en-IN'),
            expiryDate: expiryDate.toLocaleDateString('en-IN'),
            pmVisits: [
              { visitNo: 1, title: '1st Preventive Maintenance Visit', date: pm1Date.toLocaleDateString('en-IN'), status: 'Completed', details: 'Oil level, V-belt tension, water inlet mesh filter cleaning & electrical safety check.' },
              { visitNo: 2, title: '2nd Preventive Maintenance Visit', date: pm2Date.toLocaleDateString('en-IN'), status: pm2Date < new Date() ? 'Completed' : 'Scheduled', details: 'Inverter PCB dust removal, steam valve calibration & drum bearing clearance audit.' },
              { visitNo: 3, title: '3rd Preventive Maintenance Visit', date: pm3Date.toLocaleDateString('en-IN'), status: pm3Date < new Date() ? 'Completed' : 'Scheduled', details: 'Full heating element descaling, shaper mould inspection & water hardness testing.' }
            ],
            emergencySLA: '24–48 Hours Priority On-Site Response'
          };
        });
      });

      // Derive Warranty details dynamically from orders
      const warrantyItems = matchingOrders.flatMap(o => {
        return (o.items || []).map((item, idx) => {
          const orderDate = new Date(o.rawDate || o.date || Date.now());
          const expiryDate = new Date(orderDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 Years Standard Warranty

          return {
            warrantyId: `WAR-${o.orderId || o.id}-${idx + 1}`,
            orderId: o.orderId || o.id,
            productName: item.name,
            warrantyType: item.name.toLowerCase().includes('chemical') || item.name.toLowerCase().includes('stain') ? 'No Warranty (Consumable Product)' : '2 Years (Parts & Labor Warranty)',
            purchaseDate: orderDate.toLocaleDateString('en-IN'),
            expiryDate: expiryDate.toLocaleDateString('en-IN'),
            isActive: expiryDate > new Date(),
            coveredComponents: [
              'Heavy Duty Motor & Inverter Drive Assembly',
              'Stainless Steel Inner & Outer Drum Assembly',
              'Microprocessor Main Electronic PCB Control Board',
              'Electric & Steam Heating Element',
              'Solenoid Water Valves & High-Pressure Seals'
            ]
          };
        });
      });

      setCustomerData({
        customerId: `CUST-${cleanPhoneDigits.slice(-4) || '1001'}`,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: fullAddressStr.trim() || 'Address on record',
        companyName: primaryOrder.companyName || '',
        gstNumber: primaryOrder.gstNumber || '',
        joinDate: new Date(primaryOrder.rawDate || primaryOrder.date || Date.now()).toLocaleDateString('en-IN'),
        totalOrders: matchingOrders.length,
        totalSpent: `₹${totalSpentVal.toLocaleString('en-IN')}`,
        orders: matchingOrders,
        amcContracts,
        warranties: warrantyItems,
        partsReplacements: customerParts,
        tickets: customerTickets
      });
      setSearched(true);
    } else {
      // Return empty database customer result container so user can view/create tickets & parts changes for any phone number
      setCustomerData({
        customerId: `CUST-${cleanPhoneDigits.slice(-4) || 'NEW'}`,
        name: 'Customer Record (No Orders Found)',
        phone: targetPhoneKey,
        email: 'N/A',
        address: 'No order address on record',
        companyName: '',
        gstNumber: '',
        joinDate: new Date().toLocaleDateString('en-IN'),
        totalOrders: 0,
        totalSpent: '₹0',
        orders: [],
        amcContracts: [],
        warranties: [],
        partsReplacements: customerParts,
        tickets: customerTickets
      });
      setSearched(true);
    }

    setLoadingSearch(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeCustomerSearch(searchPhone);
  };

  // Add a new machine part replacement / shaper change entry to localStorage & state
  const handleAddPartReplacementSubmit = (e) => {
    e.preventDefault();
    if (!customerData) return;

    const expiryDateStr = calculatePartWarrantyExpiry(newPartForm.replacementDate, newPartForm.warrantyPeriod);

    const newPartEntry = {
      id: `PART-REP-${Math.floor(100000 + Math.random() * 900000)}`,
      phone: customerData.phone,
      customerPhone: customerData.phone,
      equipmentName: newPartForm.equipmentName || 'Commercial Washer Extractor',
      partName: newPartForm.partName,
      partSerial: newPartForm.partSerial || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      technicianName: newPartForm.technicianName || 'Rajesh Kumar (Lead Engineer)',
      reason: newPartForm.reason || 'Preventive Wear & Tear Replacement',
      replacementDate: newPartForm.replacementDate,
      warrantyPeriod: newPartForm.warrantyPeriod,
      partsWarrantyExpiry: expiryDateStr,
      status: 'Active Warranty'
    };

    const existing = JSON.parse(localStorage.getItem('kc_parts_replacements') || '[]');
    const updated = [newPartEntry, ...existing];
    localStorage.setItem('kc_parts_replacements', JSON.stringify(updated));

    setCustomerData(prev => ({
      ...prev,
      partsReplacements: [newPartEntry, ...(prev.partsReplacements || [])]
    }));

    setIsPartsModalOpen(false);
    setNewPartForm({
      equipmentName: '',
      partName: '',
      partSerial: '',
      technicianName: '',
      reason: '',
      warrantyPeriod: '6 Months',
      replacementDate: new Date().toISOString().split('T')[0]
    });
  };

  // Add a new support ticket entry to localStorage & state
  const handleCreateTicketSubmit = (e) => {
    e.preventDefault();
    if (!customerData) return;

    const ticketId = `KC-SUP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicketEntry = {
      ticketId,
      phone: customerData.phone,
      customerPhone: customerData.phone,
      customerName: customerData.name,
      subject: newTicketForm.subject,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'Open',
      createdDate: new Date().toLocaleDateString('en-IN'),
      assignedEngineer: newTicketForm.assignedEngineer,
      description: newTicketForm.description,
      notes: 'Ticket logged by support representative. Priority technician dispatched.'
    };

    const existing = JSON.parse(localStorage.getItem('kc_customer_tickets') || '[]');
    const updated = [newTicketEntry, ...existing];
    localStorage.setItem('kc_customer_tickets', JSON.stringify(updated));

    setCustomerData(prev => ({
      ...prev,
      tickets: [newTicketEntry, ...(prev.tickets || [])]
    }));

    setIsTicketModalOpen(false);
    setNewTicketForm({
      subject: '',
      category: 'Breakdown Support',
      priority: 'High',
      description: '',
      assignedEngineer: 'Rajesh Kumar (Senior Technical Support)'
    });
  };

  // Tax Invoice Modal Overlay
  const renderInvoiceModal = () => {
    if (!selectedInvoiceOrder) return null;

    return createPortal(
      <div className="invoice-modal-overlay fullScreenInvoiceOverlay" onClick={() => setSelectedInvoiceOrder(null)}>
        <div className="invoice-modal-card fullScreenInvoiceCard" onClick={e => e.stopPropagation()}>
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
                    <span>{selectedInvoiceOrder.customerName || customerData?.name || 'Customer'}</span>

                    <span className="label">Address</span>
                    <span>:</span>
                    <span>
                      {selectedInvoiceOrder.shippingAddress?.address || 'Palavakkam'}<br />
                      {selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600041'}
                    </span>

                    <span className="label">State</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                    <span className="label">Mobile</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.phone || customerData?.phone || '8148814205'}</span>

                    <span className="label">GSTIN</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.gstNumber || customerData?.gstNumber || 'N/A'}</span>
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
                    <span>{selectedInvoiceOrder.customerName || customerData?.name || 'Customer'}</span>

                    <span className="label">Address</span>
                    <span>:</span>
                    <span>
                      {selectedInvoiceOrder.shippingAddress?.address || 'Palavakkam'}<br />
                      {selectedInvoiceOrder.shippingAddress?.city || 'Chennai'} - {selectedInvoiceOrder.shippingAddress?.pincode || '600041'}
                    </span>

                    <span className="label">State</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.shippingAddress?.state || 'Tamil Nadu'} (Code: {selectedInvoiceOrder.shippingAddress?.state === 'Karnataka' ? '29' : '33'})</span>

                    <span className="label">Mobile</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.phone || customerData?.phone || '8148814205'}</span>

                    <span className="label">GSTIN</span>
                    <span>:</span>
                    <span>{selectedInvoiceOrder.gstNumber || customerData?.gstNumber || 'N/A'}</span>
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
                    const hsnCode = (item.name || '').toLowerCase().includes('chemical') || (item.name || '').toLowerCase().includes('stain') ? '34029019' : '84502000';
                    const unitLabel = (item.name || '').toLowerCase().includes('chemical') || (item.name || '').toLowerCase().includes('stain') ? 'Ltr' : 'Nos';

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
                        Commercial Laundry Equipment Order
                      </div>
                    </td>
                    <td>84502000</td>
                    <td>1</td>
                    <td>Nos</td>
                    <td>{((selectedInvoiceOrder.totalAmount || selectedInvoiceOrder.total || 35999) / 1.18).toFixed(2)}</td>
                    <td>{((selectedInvoiceOrder.totalAmount || selectedInvoiceOrder.total || 35999) / 1.18).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* TOTALS */}
            {(() => {
              const totalAmount = selectedInvoiceOrder.totalAmount || selectedInvoiceOrder.total || 35999;
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
      </div>,
      document.body
    );
  };

  // Full-Screen Raise Support Ticket Modal Overlay
  const renderCreateTicketModal = () => {
    if (!isTicketModalOpen) return null;

    return createPortal(
      <div className="fullScreenTicketModalOverlay fade-in" onClick={() => setIsTicketModalOpen(false)}>
        <div className="fullScreenTicketModalCard" onClick={e => e.stopPropagation()}>
          {/* Header Bar */}
          <div className="fullScreenModalHeader">
            <div className="fullScreenModalTitleBlock">
              <div className="fullScreenBadge">
                <Plus size={14} />
                <span>New Ticket Dispatch</span>
              </div>
              <h2>Raise Support & Technical Service Ticket</h2>
              <p>Create a commercial service request for <strong>{customerData.name}</strong> ({customerData.phone})</p>
            </div>
            <button className="fullScreenCloseBtn" onClick={() => setIsTicketModalOpen(false)}>
              <X size={18} />
              <span>Close Window</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="fullScreenModalBody">
            <form onSubmit={handleCreateTicketSubmit} className="fullScreenTicketForm">
              
              {/* Section 1: Customer & Machinery Overview */}
              <div className="formSectionCard">
                <h4 className="formSectionTitle">
                  <User size={18} /> Customer & Machinery Overview
                </h4>
                
                <div className="formGridTwo">
                  <div className="formGroup">
                    <label>Customer Account Name</label>
                    <input type="text" value={customerData.name} disabled className="disabledInput" />
                  </div>
                  <div className="formGroup">
                    <label>Registered Phone Number</label>
                    <input type="text" value={customerData.phone} disabled className="disabledInput" />
                  </div>
                </div>

                <div className="formGroup" style={{ marginTop: '16px' }}>
                  <label>Customer Shipping / Billing Site Address</label>
                  <input type="text" value={customerData.address} disabled className="disabledInput" />
                </div>

                <div className="formGroup" style={{ marginTop: '16px' }}>
                  <label>Ticket Subject / Primary Issue Summary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LG Washer Error Code OE / High-pressure steam valve leakage"
                    value={newTicketForm.subject}
                    onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 2: Category, SLA & Technical Assignment */}
              <div className="formSectionCard">
                <h4 className="formSectionTitle">
                  <Wrench size={18} /> Category, SLA & Technical Assignment
                </h4>

                <div className="formGridTwo">
                  <div className="formGroup">
                    <label>Support Service Category *</label>
                    <select
                      value={newTicketForm.category}
                      onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    >
                      <option value="Breakdown Support">Emergency Breakdown Support</option>
                      <option value="Preventive Maintenance">Preventive Maintenance Request</option>
                      <option value="Parameter Programming">Machine Program Parameter Setup</option>
                      <option value="Spare Parts Request">Spare Parts & Shapers Request</option>
                      <option value="General Query">General Technical Query</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Priority Response SLA *</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={e => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    >
                      <option value="Urgent (24h SLA)">Urgent (24h Breakdown SLA)</option>
                      <option value="High (48h SLA)">High (48h SLA)</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>

                <div className="formGroup" style={{ marginTop: '16px' }}>
                  <label>Assigned Technical Engineer / Service Specialist</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar (Senior Field Engineer)"
                    value={newTicketForm.assignedEngineer}
                    onChange={e => setNewTicketForm({ ...newTicketForm, assignedEngineer: e.target.value })}
                  />
                </div>

                <div className="formGroup" style={{ marginTop: '16px' }}>
                  <label>Detailed Complaint Description & Action Notes *</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Provide detailed breakdown symptoms, error codes, noise behavior, or machine parameters requiring technician investigation..."
                    value={newTicketForm.description}
                    onChange={e => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="fullScreenModalFooter">
                <button type="button" className="fullScreenCancelBtn" onClick={() => setIsTicketModalOpen(false)}>
                  Cancel & Return
                </button>
                <button type="submit" className="fullScreenSubmitBtn">
                  <CheckCircle size={18} /> Create & Dispatch Support Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Full-Screen Log Machine Part / Shaper Replacement Modal Overlay
  const renderPartsModal = () => {
    if (!isPartsModalOpen) return null;

    return createPortal(
      <div className="fullScreenTicketModalOverlay fade-in" onClick={() => setIsPartsModalOpen(false)}>
        <div className="fullScreenTicketModalCard" onClick={e => e.stopPropagation()}>
          {/* Header Bar */}
          <div className="fullScreenModalHeader">
            <div className="fullScreenModalTitleBlock">
              <div className="fullScreenBadge">
                <Wrench size={14} />
                <span>Spare Parts Maintenance Log</span>
              </div>
              <h2>Log Machine Part & Shaper Replacement</h2>
              <p>Record component replacements, serial numbers, & parts warranty for <strong>{customerData.name}</strong> ({customerData.phone})</p>
            </div>
            <button className="fullScreenCloseBtn" onClick={() => setIsPartsModalOpen(false)}>
              <X size={18} />
              <span>Close Window</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="fullScreenModalBody">
            <form onSubmit={handleAddPartReplacementSubmit} className="fullScreenTicketForm">
              
              {/* Section 1: Equipment & Part Information */}
              <div className="formSectionCard">
                <h4 className="formSectionTitle">
                  <Wrench size={18} /> Commercial Machinery & Replacement Component
                </h4>
                
                <div className="formGridTwo">
                  <div className="formGroup">
                    <label>Customer Account & Phone</label>
                    <input type="text" value={`${customerData.name} (${customerData.phone})`} disabled className="disabledInput" />
                  </div>

                  <div className="formGroup">
                    <label>Equipment Name / Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LG Commercial Front Load Washer 15kg / Speed Queen Tumbler Dryer"
                      value={newPartForm.equipmentName}
                      onChange={e => setNewPartForm({ ...newPartForm, equipmentName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="formGridTwo" style={{ marginTop: '16px' }}>
                  <div className="formGroup">
                    <label>Replaced Part / Shaper Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shaper Mould Filter / Inverter PCB / Heavy-Duty V-Belt"
                      value={newPartForm.partName}
                      onChange={e => setNewPartForm({ ...newPartForm, partName: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Part Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-982341-KC"
                      value={newPartForm.partSerial}
                      onChange={e => setNewPartForm({ ...newPartForm, partSerial: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Service Technician & Warranty Log */}
              <div className="formSectionCard">
                <h4 className="formSectionTitle">
                  <ShieldCheck size={18} /> Service Technician & Component Warranty Log
                </h4>

                <div className="formGridTwo">
                  <div className="formGroup">
                    <label>Servicing Technician Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar (Senior Field Specialist)"
                      value={newPartForm.technicianName}
                      onChange={e => setNewPartForm({ ...newPartForm, technicianName: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Replacement Date *</label>
                    <input
                      type="date"
                      required
                      value={newPartForm.replacementDate}
                      onChange={e => setNewPartForm({ ...newPartForm, replacementDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="formGridTwo" style={{ marginTop: '16px' }}>
                  <div className="formGroup">
                    <label>Warranty Period on Replaced Part *</label>
                    <select
                      value={newPartForm.warrantyPeriod}
                      onChange={e => setNewPartForm({ ...newPartForm, warrantyPeriod: e.target.value })}
                    >
                      <option value="3 Months">3 Months Parts Warranty</option>
                      <option value="6 Months">6 Months Parts Warranty</option>
                      <option value="1 Year">1 Year Parts Warranty</option>
                      <option value="2 Years">2 Years Parts Warranty</option>
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Computed Warranty Expiry Date:</label>
                    <input
                      type="text"
                      disabled
                      value={calculatePartWarrantyExpiry(newPartForm.replacementDate, newPartForm.warrantyPeriod)}
                      className="disabledInput"
                    />
                  </div>
                </div>

                <div className="formGroup" style={{ marginTop: '16px' }}>
                  <label>Reason for Replacement / Servicing & Installation Notes</label>
                  <textarea
                    rows="4"
                    placeholder="e.g. Preventive replacement due to normal wear & tear during routine audit. Pressure and spin cycle tested successfully."
                    value={newPartForm.reason}
                    onChange={e => setNewPartForm({ ...newPartForm, reason: e.target.value })}
                  />
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="fullScreenModalFooter">
                <button type="button" className="fullScreenCancelBtn" onClick={() => setIsPartsModalOpen(false)}>
                  Cancel & Return
                </button>
                <button type="submit" className="fullScreenSubmitBtn">
                  <CheckCircle size={18} /> Save & Log Part Replacement
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Render searched Customer Details Dashboard
  if (searched && customerData) {
    const hasActiveAmc = customerData.amcContracts?.some(a => a.status === 'Active');
    const activeWarrantyCount = customerData.warranties?.filter(w => w.isActive).length || 0;
    const partsCount = customerData.partsReplacements?.length || 0;
    const ticketsCount = customerData.tickets?.length || 0;

    return (
      <div className="ticketingPageContainer animate-fade-in">
        <div className="ticketingHeader">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {!isAdmin && (
              <button className="backBtn" onClick={() => navigate('/')}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div className="headerTitleBlock">
              <h1 className="pageTitle">Customer Support Ticketing & Account Dashboard</h1>
              <p className="pageSubtitle">
                Live customer details, purchase history, AMC contract status, warranty coverage & machine parts replacement log
              </p>
            </div>
          </div>
          <button className="smallSearchBtn" onClick={() => setSearched(false)}>
            <Search size={14} /> Search Another Customer
          </button>
        </div>

        <div className="ticketingContent" id="ticketing-print-area">
          {/* Customer Profile Banner Card */}
          <div className="customerCard">
            <div className="cardHeader">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2b5c' }}>
                  {customerData.name}
                </h2>
                <span className="customerBadgeId">{customerData.customerId}</span>
              </div>
              <button className="downloadBtn" onClick={() => window.print()}>
                <Download size={16} />
                Export Profile PDF
              </button>
            </div>
            
            <div className="customerDetails">
              <div className="detailItem">
                <Phone size={18} />
                <div className="detailText">
                  <span className="label">Phone / Mobile</span>
                  <span className="value">{customerData.phone}</span>
                </div>
              </div>
              <div className="detailItem">
                <Mail size={18} />
                <div className="detailText">
                  <span className="label">Email Address</span>
                  <span className="value">{customerData.email}</span>
                </div>
              </div>
              {customerData.companyName && (
                <div className="detailItem">
                  <Building2 size={18} />
                  <div className="detailText">
                    <span className="label">Company Name</span>
                    <span className="value">{customerData.companyName}</span>
                  </div>
                </div>
              )}
              {customerData.gstNumber && (
                <div className="detailItem">
                  <Tag size={18} />
                  <div className="detailText">
                    <span className="label">GSTIN</span>
                    <span className="value">{customerData.gstNumber}</span>
                  </div>
                </div>
              )}
              <div className="detailItem address">
                <MapPin size={18} />
                <div className="detailText">
                  <span className="label">Billing / Shipping Address</span>
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

            {/* Quick Stats Grid */}
            <div className="customerStatsGrid">
              <div className="statBox">
                <div className="statBoxHeader">
                  <span className="statLabel">Database Orders</span>
                  <Package size={15} className="statIcon" />
                </div>
                <div className="statNumber">{customerData.totalOrders}</div>
              </div>

              <div className="statBox">
                <div className="statBoxHeader">
                  <span className="statLabel">Total Spent</span>
                  <Wallet size={15} className="statIcon" />
                </div>
                <div className="statNumber">{customerData.totalSpent}</div>
              </div>

              <div className={`statBox ${hasActiveAmc ? 'amc-active' : 'amc-inactive'}`}>
                <div className="statBoxHeader">
                  <span className="statLabel">AMC Plan Status</span>
                  <ShieldCheck size={15} className="statIcon" />
                </div>
                <div className="statNumber">
                  <span className={`statusPillTag ${hasActiveAmc ? 'active' : 'inactive'}`}>
                    {hasActiveAmc ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              <div className="statBox">
                <div className="statBoxHeader">
                  <span className="statLabel">Machine Warranties</span>
                  <Shield size={15} className="statIcon" />
                </div>
                <div className="statNumber">{activeWarrantyCount} Active</div>
              </div>

              <div className="statBox">
                <div className="statBoxHeader">
                  <span className="statLabel">Parts / Shapers Changed</span>
                  <Wrench size={15} className="statIcon" />
                </div>
                <div className="statNumber">{partsCount} Logged</div>
              </div>

              <div className="statBox">
                <div className="statBoxHeader">
                  <span className="statLabel">Support Requests</span>
                  <FileText size={15} className="statIcon" />
                </div>
                <div className="statNumber">{ticketsCount} Tickets</div>
              </div>
            </div>
          </div>

          {/* DASHBOARD TAB NAVIGATION BAR */}
          <div className="ticketingTabsBar">
            <button
              className={`tabItem ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={16} />
              <span>Purchase History ({customerData.orders.length})</span>
            </button>

            <button
              className={`tabItem ${activeTab === 'amc' ? 'active' : ''}`}
              onClick={() => setActiveTab('amc')}
            >
              <Calendar size={16} />
              <span>AMC & PM Servicing ({customerData.amcContracts?.length || 0})</span>
            </button>

            <button
              className={`tabItem ${activeTab === 'warranty' ? 'active' : ''}`}
              onClick={() => setActiveTab('warranty')}
            >
              <Shield size={16} />
              <span>Warranty Coverage ({customerData.warranties?.length || 0})</span>
            </button>

            <button
              className={`tabItem ${activeTab === 'parts' ? 'active' : ''}`}
              onClick={() => setActiveTab('parts')}
            >
              <Wrench size={16} />
              <span>Parts & Shapers ({partsCount})</span>
            </button>

            <button
              className={`tabItem ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('tickets')}
            >
              <FileText size={16} />
              <span>Support Tickets ({ticketsCount})</span>
            </button>
          </div>

          {/* TAB 1: PURCHASE HISTORY & INVOICES */}
          {activeTab === 'orders' && (() => {
            const filteredOrders = (customerData.orders || []).filter(order => {
              if (!orderFilterTerm.trim()) return true;
              const term = orderFilterTerm.toLowerCase().trim();
              const orderIdStr = (order.orderId || order.id || '').toLowerCase();
              const paymentIdStr = (order.paymentId || '').toLowerCase();
              const statusStr = (order.status || '').toLowerCase();
              const itemsStr = (order.items || []).map(i => (i.name || '').toLowerCase()).join(' ');

              return orderIdStr.includes(term) || paymentIdStr.includes(term) || statusStr.includes(term) || itemsStr.includes(term);
            });

            return (
              <div className="tabContentSection fade-in">
                <div className="sectionHeaderFlex">
                  <div>
                    <h3 className="sectionTitle">Customer Order & Purchase History</h3>
                    <p className="sectionSubtitle">Live database orders linked to phone number {customerData.phone}</p>
                  </div>

                  {/* ORDER SEARCH INPUT BAR */}
                  <div className="orderSearchBox">
                    <div className="orderSearchInputWrap">
                      <Search size={15} className="orderSearchIcon" />
                      <input
                        type="text"
                        className="orderSearchInput"
                        placeholder="Search orders by product, Order ID..."
                        value={orderFilterTerm}
                        onChange={(e) => setOrderFilterTerm(e.target.value)}
                      />
                      {orderFilterTerm && (
                        <button className="clearOrderSearchBtn" onClick={() => setOrderFilterTerm('')} title="Clear search">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="emptyStateBox">
                    <Package size={40} className="emptyIcon" />
                    <h4>{orderFilterTerm ? 'No Orders Match Your Search' : 'No Database Orders Found'}</h4>
                    <p>{orderFilterTerm ? `No order records matching "${orderFilterTerm}".` : 'No purchase records exist in MongoDB for this phone number yet.'}</p>
                  </div>
                ) : (
                  filteredOrders.map((order, index) => (
                  <div key={index} className="orderCard">
                    <div className="orderHeader">
                      <div className="orderInfo">
                        <h4 className="orderTitle">
                          {order.items && order.items.length > 0 ? order.items.map(i => i.name).join(', ') : `Order #${order.orderId || order.id}`}
                        </h4>
                        <div className="orderMetaBadgeRow">
                          <span className="orderIdPill">Order ID: {order.orderId || order.id}</span>
                          {order.paymentId && <span className="paymentIdPill">Payment ID: {order.paymentId}</span>}
                          <span className="datePill">Purchased: {order.date || new Date(order.rawDate || Date.now()).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="orderHeaderActions">
                        <button
                          type="button"
                          className="viewInvoiceBtn"
                          onClick={() => setSelectedInvoiceOrder(order)}
                          title="View & Print Official GST Tax Invoice for Customer"
                        >
                          <FileText size={15} /> View Tax Invoice
                        </button>

                        <div className={`statusBadge ${ (order.status || 'delivered').toLowerCase() }`}>
                          {order.status || 'Delivered'}
                        </div>
                      </div>
                    </div>

                    <div className="orderGrid">
                      <div className="orderColumn">
                        <div className="orderDetail">
                          <span className="detailLabel">Order Total</span>
                          <span className="detailValue priceHighlight">
                            ₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="orderDetail">
                          <span className="detailLabel">Payment Status</span>
                          <span className={`detailValue ${ (order.paymentStatus || 'Paid').toLowerCase() === 'paid' ? 'statusSuccess' : 'statusWarning' }`}>
                            {order.paymentStatus || 'Paid'}
                          </span>
                        </div>
                        <div className="orderDetail">
                          <span className="detailLabel">Payment Method</span>
                          <span className="detailValue">{order.paymentMethod || 'Online Payment'}</span>
                        </div>
                      </div>

                      <div className="orderColumn">
                        <div className="orderDetail">
                          <span className="detailLabel">Items Ordered</span>
                          <span className="detailValue">
                            {order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 1} Item(s)
                          </span>
                        </div>
                        <div className="orderDetail">
                          <span className="detailLabel">Shipping Address</span>
                          <span className="detailValue">
                            {typeof order.shippingAddress === 'object' ? `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}` : String(order.shippingAddress || 'On file')}
                          </span>
                        </div>
                        <div className="orderDetail">
                          <span className="detailLabel">Warranty Term</span>
                          <span className="detailValue">{order.warranty || '2 Years Standard Warranty'}</span>
                        </div>
                      </div>

                      <div className="orderColumn">
                        <div className="orderDetail">
                          <Shield size={16} color="#0284c7" />
                          <span className="detailLabel">AMC Status</span>
                          <span className="detailValue" style={{ fontWeight: '700', color: '#0369a1' }}>
                            {hasActiveAmc ? 'Active Coverage' : 'Standard Warranty'}
                          </span>
                        </div>
                        <div className="orderDetail">
                          <Truck size={16} color="#16a34a" />
                          <span className="detailLabel">Fulfillment</span>
                          <span className="detailValue" style={{ color: '#16a34a', fontWeight: '700' }}>
                            Installed & Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Items List */}
                    {order.items && order.items.length > 0 && (
                      <div className="orderedItemsTableWrapper">
                        <div className="tableTitle">Items Breakdown:</div>
                        <table className="miniItemsTable">
                          <thead>
                            <tr>
                              <th>Product Name</th>
                              <th>Qty</th>
                              <th>Unit Price</th>
                              <th>Item Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((it, iIdx) => (
                              <tr key={iIdx}>
                                <td>
                                  <strong>{it.name}</strong>
                                  {it.amcWarrantyInfo && (
                                    <span className="amcInlineTag">
                                      🛡️ AMC: {it.amcWarrantyInfo.type}
                                    </span>
                                  )}
                                </td>
                                <td>{it.quantity}</td>
                                <td>₹{(it.price || 0).toLocaleString('en-IN')}</td>
                                <td>₹{((it.price || 0) * it.quantity).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            );
          })()}

          {/* TAB 2: AMC PLAN & PREVENTIVE MAINTENANCE SERVICING */}
          {activeTab === 'amc' && (
            <div className="tabContentSection fade-in">
              <div className="amcSectionHeader">
                <div className="amcHeaderMain">
                  <div className="amcTagPill">
                    <Wrench size={13} />
                    <span>Commercial Service Agreements</span>
                  </div>
                  <h3 className="amcTitle">Annual Maintenance Contracts (AMC) & Preventive Maintenance</h3>
                  <p className="amcSubtitle">
                    1-Year Comprehensive Agreements • 3 Routine PM Audits • 24–48h Priority Emergency Response SLA
                  </p>
                </div>
              </div>

              {(!customerData.amcContracts || customerData.amcContracts.length === 0) ? (
                <div className="emptyStateBox">
                  <Calendar size={40} className="emptyIcon" />
                  <h4>No Active AMC Contracts Found</h4>
                  <p>No commercial AMC agreement registered under this phone number yet.</p>
                </div>
              ) : (
                customerData.amcContracts.map((amc, idx) => (
                  <div key={idx} className="amcCardMinimal">
                    {/* Top Row: Equipment Info & Status Pill */}
                    <div className="amcCardTopBar">
                      <div className="amcEquipmentInfo">
                        <div className="amcIconWrapper">
                          <Wrench size={20} className="amcHeaderIcon" />
                        </div>
                        <div>
                          <div className="amcTitleRow">
                            <h4 className="amcEquipName">{amc.equipmentName}</h4>
                            <span className="amcContractIdPill">{amc.contractId}</span>
                          </div>
                          <p className="amcPlanMeta">
                            {amc.planType} <span className="metaDivider">•</span> Linked Order <strong>#{amc.orderId}</strong>
                          </p>
                        </div>
                      </div>

                      <div className={`amcStatusPillMinimal ${amc.status.toLowerCase()}`}>
                        {amc.status === 'Active' ? (
                          <>
                            <CheckCircle size={13} />
                            <span>AMC Contract Active</span>
                          </>
                        ) : (
                          <>
                            <Clock size={13} />
                            <span>Expired</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Minimal Metrics Grid */}
                    <div className="amcMetricsBar">
                      <div className="amcMetricItem">
                        <span className="amcMetricLabel">Start Date</span>
                        <span className="amcMetricValue">{amc.startDate}</span>
                      </div>
                      <div className="amcMetricDivider" />
                      <div className="amcMetricItem">
                        <span className="amcMetricLabel">Expiry Date</span>
                        <span className="amcMetricValue highlightBlue">{amc.expiryDate}</span>
                      </div>
                      <div className="amcMetricDivider" />
                      <div className="amcMetricItem">
                        <span className="amcMetricLabel">Emergency Breakdown SLA</span>
                        <span className="amcMetricValue highlightGreen">{amc.emergencySLA}</span>
                      </div>
                    </div>

                    {/* Preventive Maintenance (PM) Audits */}
                    <div className="amcPmSection">
                      <div className="amcPmSectionHeader">
                        <h5 className="amcPmTitle">Routine Preventive Maintenance (PM) Audits</h5>
                        <span className="amcPmCountPill">{amc.pmVisits?.length || 3} Visits Scheduled</span>
                      </div>

                      <div className="amcPmGrid">
                        {amc.pmVisits.map((pm, pIdx) => (
                          <div key={pIdx} className={`amcPmCard ${pm.status.toLowerCase()}`}>
                            <div className="amcPmCardHeader">
                              <span className="amcPmVisitNum">Visit #{pm.visitNo}</span>
                              <span className={`amcPmStatusBadge ${pm.status.toLowerCase()}`}>
                                {pm.status === 'Completed' ? (
                                  <>
                                    <CheckCircle size={11} />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={11} />
                                    <span>Scheduled</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <h6 className="amcPmCardTitle">{pm.title}</h6>
                            
                            <div className="amcPmDateRow">
                              <Calendar size={12} className="amcDateIcon" />
                              <span>Scheduled Date: <strong>{pm.date}</strong></span>
                            </div>

                            <p className="amcPmDetailsText">{pm.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: WARRANTY COVERAGE */}
          {activeTab === 'warranty' && (
            <div className="tabContentSection fade-in">
              <div className="sectionHeaderFlex">
                <div>
                  <h3 className="sectionTitle">Commercial Equipment Warranty Coverage</h3>
                  <p className="sectionSubtitle">Standard & Extended Warranty terms, covered internal components, & active status</p>
                </div>
              </div>

              {(!customerData.warranties || customerData.warranties.length === 0) ? (
                <div className="emptyStateBox">
                  <Shield size={40} className="emptyIcon" />
                  <h4>No Warranty Records Found</h4>
                  <p>No machine warranty information linked to this phone number.</p>
                </div>
              ) : (
                customerData.warranties.map((war, idx) => (
                  <div key={idx} className="warrantyCard">
                    <div className="warrantyHeader">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={20} color="#0284c7" />
                          <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f2b5c', margin: 0 }}>{war.productName}</h4>
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '13px' }}>
                          Warranty Ref: {war.warrantyId} • Order #{war.orderId}
                        </p>
                      </div>

                      <div className={`warrantyBadge ${war.isActive ? 'active' : 'expired'}`}>
                        {war.isActive ? '🛡️ Active Warranty' : 'Expired Warranty'}
                      </div>
                    </div>

                    <div className="warrantyMetaGrid">
                      <div>
                        <span className="lbl">Warranty Type:</span>
                        <span className="val">{war.warrantyType}</span>
                      </div>
                      <div>
                        <span className="lbl">Purchase Date:</span>
                        <span className="val">{war.purchaseDate}</span>
                      </div>
                      <div>
                        <span className="lbl">Warranty Valid Until:</span>
                        <span className="val" style={{ fontWeight: '800', color: war.isActive ? '#16a34a' : '#ef4444' }}>
                          {war.expiryDate}
                        </span>
                      </div>
                    </div>

                    <div className="coveredComponentsBox">
                      <h5 className="compTitle">Covered Internal Components & Spare Parts:</h5>
                      <ul className="compList">
                        {war.coveredComponents.map((c, cIdx) => (
                          <li key={cIdx}>
                            <CheckCircle size={14} color="#16a34a" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SHAPERS & MACHINE PARTS REPLACEMENT WARRANTY LOG */}
          {activeTab === 'parts' && (
            <div className="tabContentSection fade-in">
              <div className="sectionHeaderFlex">
                <div>
                  <h3 className="sectionTitle">Shapers & Machine Parts Replacement History</h3>
                  <p className="sectionSubtitle">Audit log of changed spare parts, replacement dates, technician, & <strong>Warranty on Replaced Parts</strong></p>
                </div>
                <button
                  className="ticketSearchBtn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setIsPartsModalOpen(true)}
                >
                  <Plus size={16} /> Log Machine Part Replacement
                </button>
              </div>

              {(!customerData.partsReplacements || customerData.partsReplacements.length === 0) ? (
                <div className="emptyStateBox">
                  <Wrench size={40} className="emptyIcon" />
                  <h4>No Parts Replacement History Logged</h4>
                  <p>No machine spare parts or shapers changed for this customer yet. Click "Log Machine Part Replacement" above to record a new replacement.</p>
                </div>
              ) : (
                <div className="partsTableContainer">
                  <table className="partsTable">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Equipment Name</th>
                        <th>Replaced Part / Shaper Name</th>
                        <th>Part Serial #</th>
                        <th>Technician Name</th>
                        <th>Reason for Replacement</th>
                        <th>Part Warranty</th>
                        <th>Warranty Expiry</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.partsReplacements.map((pt, pIdx) => {
                        const active = isWarrantyActive(pt.partsWarrantyExpiry);
                        return (
                          <tr key={pIdx}>
                            <td><strong>{pt.replacementDate}</strong></td>
                            <td>{pt.equipmentName}</td>
                            <td className="partHighlightName">
                              <Wrench size={14} color="#0284c7" />
                              <strong>{pt.partName}</strong>
                            </td>
                            <td><code>{pt.partSerial}</code></td>
                            <td>{pt.technicianName}</td>
                            <td>{pt.reason}</td>
                            <td>
                              <span className="partsWarrantyTag">
                                🛡️ {pt.warrantyPeriod || '6 Months'}
                              </span>
                            </td>
                            <td><strong>{pt.partsWarrantyExpiry}</strong></td>
                            <td>
                              <span className={`partsStatusPill ${active ? 'active' : 'expired'}`}>
                                {active ? 'Active Parts Warranty' : 'Expired Parts Warranty'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPPORT TICKETS HISTORY & ACTION */}
          {activeTab === 'tickets' && (
            <div className="tabContentSection fade-in">
              <div className="sectionHeaderFlex">
                <div>
                  <h3 className="sectionTitle">Customer Support Tickets & Service Requests Log</h3>
                  <p className="sectionSubtitle">Historical support queries, breakdown tickets, technician assignments, & resolution notes</p>
                </div>
                <button
                  className="ticketSearchBtn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setIsTicketModalOpen(true)}
                >
                  <Plus size={16} /> Raise New Support Ticket
                </button>
              </div>

              {(!customerData.tickets || customerData.tickets.length === 0) ? (
                <div className="emptyStateBox">
                  <FileText size={40} className="emptyIcon" />
                  <h4>No Support Tickets Filed</h4>
                  <p>No support or service tickets found for this phone number. Click "Raise New Support Ticket" to create one.</p>
                </div>
              ) : (
                customerData.tickets.map((t, idx) => (
                  <div key={idx} className="ticketRecordCard">
                    <div className="ticketRecordHeader">
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span className="ticketIdTag">{t.ticketId}</span>
                          <h4 className="ticketSubject">{t.subject}</h4>
                        </div>
                        <p className="ticketSubMeta">
                          Category: <strong>{t.category}</strong> • Priority: <strong>{t.priority}</strong> • Logged On: <strong>{t.createdDate}</strong>
                        </p>
                      </div>

                      <div className={`ticketStatusBadge ${(t.status || 'open').toLowerCase().replace(' ', '')}`}>
                        {t.status}
                      </div>
                    </div>

                    <div className="ticketBody">
                      <p className="ticketDesc"><strong>Issue Details:</strong> {t.description}</p>
                      <div className="ticketAssignedRow">
                        <span><strong>Assigned Technician:</strong> {t.assignedEngineer}</span>
                        {t.notes && <span><strong>Action Taken:</strong> {t.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* TAX INVOICE MODAL OVERLAY */}
        {renderInvoiceModal()}

        {/* FULL SCREEN RAISE SUPPORT TICKET MODAL OVERLAY */}
        {renderCreateTicketModal()}

        {/* FULL SCREEN LOG MACHINE PART / SHAPER REPLACEMENT MODAL OVERLAY */}
        {renderPartsModal()}




      </div>
    );
  }

  // SEARCH FORM SCREEN
  return (
    <div className="ticketingPageContainer animate-fade-in">
      <div className="ticketingHeader">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {!isAdmin && (
            <button className="backBtn" onClick={() => navigate('/')}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div className="headerTitleBlock">
            <h1 className="pageTitle">Customer Support Ticketing & Account Lookup</h1>
            <p className="pageSubtitle">
              Lookup customer by phone number to view purchase history, AMC contracts, machine warranties & parts replacement records
            </p>
          </div>
        </div>
      </div>

      <div className="ticketingContent">
        <div className="searchCard">
          <h2 className="searchTitle">Search Customer Account Details</h2>
          <p className="searchSubtitle">Enter customer phone number, email address, or order ID to load real database records</p>

          <form className="searchForm" onSubmit={handleSearch}>
            <div className="searchInputWrapper">
              <Search size={20} className="searchIcon" />
              <input
                type="text"
                className="searchInput"
                placeholder="Enter customer phone number (e.g., 8148814205, 9876543210, 7904309363)"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                required
              />
              <button type="submit" className="ticketSearchBtn" disabled={loadingSearch}>
                {loadingSearch ? 'Searching Database...' : 'Search Ticket'}
              </button>
            </div>
          </form>

          <div className="sampleTickets">
            <p>💡 Tip: Enter any customer phone number to pull live database orders, AMC plans, warranties, and parts changes history.</p>
          </div>
        </div>

        {searched && !customerData && (
          <div className="noResults">
            <h2>No Database Records Found</h2>
            <p>No customer found with phone number "{searchPhone}". Please verify the number and try again.</p>
          </div>
        )}

        {/* POPUP CUSTOMER SUPPORT CHATBOT */}
        {!isAdmin && <Chatbot embedded={false} loggedInUser={loggedInUser} userOrders={userOrders} />}
      </div>

      {/* TAX INVOICE MODAL OVERLAY */}
      {selectedInvoiceOrder && renderInvoiceModal()}
    </div>
  );
}

