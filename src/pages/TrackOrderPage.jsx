import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';
import '../components/TrackOrder.css';
import './TrackOrderPage.css';

export default function TrackOrderPage({ userOrders = [] }) {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [searched, setSearched] = useState(false);

  // Mock order data - replace with actual API call
  const mockOrders = {
    'ORD123456': {
      orderId: 'ORD123456',
      productName: 'LG Front Load Washing Machine',
      productImage: 'https://via.placeholder.com/120x120?text=LG+Machine',
      orderDate: '2024-05-15',
      estimatedDelivery: '2024-05-22',
      status: 'In Transit',
      currentLocation: 'Distribution Center, Mumbai',
      price: '₹35,999',
      seller: 'Kleider Care Official',
      trackingSteps: [
        { step: 'Order Confirmed', date: '2024-05-15', time: '10:30 AM', completed: true },
        { step: 'Processing', date: '2024-05-16', time: '02:15 PM', completed: true },
        { step: 'Shipped', date: '2024-05-17', time: '08:45 AM', completed: true },
        { step: 'In Transit', date: '2024-05-19', time: '11:20 AM', completed: true },
        { step: 'Out for Delivery', date: '2024-05-22', time: 'Pending', completed: false },
        { step: 'Delivered', date: '2024-05-22', time: 'Pending', completed: false },
      ],
    },
    'ORD789012': {
      orderId: 'ORD789012',
      productName: 'Speed Queen Commercial Washer',
      productImage: 'https://via.placeholder.com/120x120?text=Speed+Queen',
      orderDate: '2024-05-10',
      estimatedDelivery: '2024-05-18',
      status: 'Delivered',
      currentLocation: 'Delivered to Chennai',
      price: '₹78,500',
      seller: 'Kleider Care Official',
      trackingSteps: [
        { step: 'Order Confirmed', date: '2024-05-10', time: '09:00 AM', completed: true },
        { step: 'Processing', date: '2024-05-11', time: '03:30 PM', completed: true },
        { step: 'Shipped', date: '2024-05-12', time: '10:15 AM', completed: true },
        { step: 'In Transit', date: '2024-05-15', time: '04:45 PM', completed: true },
        { step: 'Out for Delivery', date: '2024-05-18', time: '08:00 AM', completed: true },
        { step: 'Delivered', date: '2024-05-18', time: '02:30 PM', completed: true },
      ],
    },
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchVal = trackingNumber.replace(/#/g, '').trim().toLowerCase();
    const mockOrderId = trackingNumber.toUpperCase().replace(/#/g, '').trim();
    
    // Check real user orders first
    const userOrder = userOrders.find(o => {
      const orderIdLower = (o.orderId || '').toLowerCase();
      const mongoIdLower = (o.mongoId || o.id || '').toLowerCase();
      return orderIdLower === searchVal || 
             orderIdLower === `ord${searchVal}` || 
             mongoIdLower === searchVal;
    });
    
    if (userOrder) {
      const formattedOrder = {
        orderId: userOrder.orderId,
        productName: userOrder.items[0]?.name || 'Multiple Items',
        productImage: userOrder.items[0]?.image || 'https://via.placeholder.com/120x120?text=Order',
        orderDate: userOrder.date,
        estimatedDelivery: 'Processing',
        status: userOrder.status,
        currentLocation: 'Fulfillment Center',
        price: '₹' + userOrder.total.toLocaleString('en-IN'),
        seller: 'Kleider Care Official',
        trackingSteps: [
          { step: 'Order Confirmed', date: userOrder.date, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), completed: true },
          { step: 'Processing', date: 'Pending', time: 'Pending', completed: false },
          { step: 'Shipped', date: 'Pending', time: 'Pending', completed: false },
          { step: 'In Transit', date: 'Pending', time: 'Pending', completed: false },
          { step: 'Out for Delivery', date: 'Pending', time: 'Pending', completed: false },
          { step: 'Delivered', date: 'Pending', time: 'Pending', completed: false },
        ]
      };
      setOrderData(formattedOrder);
      setSearched(true);
      return;
    }

    // Fallback to mock orders
    const order = mockOrders[mockOrderId];
    if (order) {
      setOrderData(order);
      setSearched(true);
    } else {
      setOrderData(null);
      setSearched(true);
    }
  };

  if (searched && orderData) {
    return (
      <div className="trackOrderPageContainer animate-fade-in">
        <div className="trackOrderPageHeader">
          <button className="backBtn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="pageTitle">Track Your Order</h1>
        </div>

        <div className="trackOrderPageContent">
          <div className="trackingResults">
            {/* Order Summary Card */}
            <div className="orderSummaryCard">
              <div className="orderImageSection">
                <img src={orderData.productImage} alt={orderData.productName} className="productImage" />
              </div>
              <div className="orderDetailsSection">
                <h2 className="productName">{orderData.productName}</h2>
                <p className="orderId">Order ID: <span>{orderData.orderId}</span></p>
                <p className="seller">Seller: <span>{orderData.seller}</span></p>
                <p className="orderPrice">{orderData.price}</p>
                <div className="orderDates">
                  <div className="dateItem">
                    <Calendar size={16} />
                    <span>Ordered: {orderData.orderDate}</span>
                  </div>
                  <div className="dateItem">
                    <Truck size={16} />
                    <span>Est. Delivery: {orderData.estimatedDelivery}</span>
                  </div>
                </div>
              </div>
              <div className="statusBadgeSection">
                <div className={`statusBadge ${orderData.status.toLowerCase().replace(' ', '-')}`}>
                  {orderData.status}
                </div>
                <div className="currentLocation">
                  <MapPin size={16} />
                  <span>{orderData.currentLocation}</span>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="trackingTimeline">
              <h3 className="timelineTitle">Delivery Timeline</h3>
              {(() => {
                const completedCount = orderData.trackingSteps.filter(s => s.completed).length;
                const totalCount = orderData.trackingSteps.length;
                const progressPercent = completedCount > 1 ? ((completedCount - 1) / (totalCount - 1)) * 100 : 0;
                return (
                  <div 
                    className="timelineTrack"
                    style={{
                      '--progress-percent': `${progressPercent}%`
                    }}
                  >
                    {orderData.trackingSteps.map((track, index) => (
                      <div key={index} className={`timelineStep ${track.completed ? 'completed' : 'pending'}`}>
                        <div className="stepIndicator">
                          <div className="stepDot"></div>
                          {index < orderData.trackingSteps.length - 1 && <div className="stepLine"></div>}
                        </div>
                        <div className="stepContent">
                          <h4 className="stepName">{track.step}</h4>
                          <div className="stepDateTime">
                            <Calendar size={14} />
                            <span>{track.date}</span>
                          </div>
                          <div className="stepTime">
                            <Clock size={14} />
                            <span>{track.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Additional Details */}
            <div className="additionalDetails">
              <div className="detailCard">
                <Package size={24} />
                <h4>Handling with Care</h4>
                <p>Your washing machine is carefully packaged and handled throughout the journey.</p>
              </div>
              <div className="detailCard">
                <Truck size={24} />
                <h4>Free Delivery</h4>
                <p>Enjoy free delivery on orders above ₹500. No hidden charges!</p>
              </div>
              <div className="detailCard">
                <MapPin size={24} />
                <h4>Real-time Updates</h4>
                <p>Get SMS and email notifications at every step of your delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trackOrderPageContainer animate-fade-in">
      <div className="trackOrderPageHeader">
        <button className="backBtn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="pageTitle">Track Your Order</h1>
      </div>

      <div className="trackOrderPageContent">
        <div className="trackOrderForm">
          <div className="formHeader">
            <h1 className="formTitle">Track Your Order</h1>
            <p className="formSubtitle">Enter your order ID to track your delivery status</p>
          </div>

          <form className="searchForm" onSubmit={handleSearch}>
            <div className="searchInputWrapper">
              <input
                type="text"
                className="trackSearchInput"
                placeholder="Enter order ID (e.g., ORD123456)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
              />
              <button type="submit" className="trackSearchBtn">Search</button>
            </div>
          </form>

          <div className="sampleOrders">
            <p>Sample Order IDs: <strong>ORD123456</strong> or <strong>ORD789012</strong></p>
          </div>
        </div>

        {searched && !orderData && (
          <div className="noResults">
            <h2>Order Not Found</h2>
            <p>Please check your order ID and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
