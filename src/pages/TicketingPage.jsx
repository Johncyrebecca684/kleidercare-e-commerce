import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Phone, Mail, MapPin, Package, Truck, Calendar, Shield, Download, User } from 'lucide-react';
import './TicketingPage.css';

export default function TicketingPage({ isAdmin = false }) {
  const navigate = useNavigate();
  const [searchPhone, setSearchPhone] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [searched, setSearched] = useState(false);

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
                    <span className="orderId">Order ID: {order.orderId}</span>
                  </div>
                  <div className={`statusBadge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </div>
                </div>

                <div className="orderGrid">
                  <div className="orderColumn">
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
      </div>
    </div>
  );
}
