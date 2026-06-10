import { useState } from 'react';
import { Package, Truck, MapPin, Calendar, Clock, ChevronDown } from 'lucide-react';
import './TrackOrder.css';

export default function TrackOrder() {
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
    const order = mockOrders[trackingNumber.toUpperCase()];
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
            const progressPercent = (completedCount / totalCount) * 100;
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
    );
  }

  return (
    <div className="trackOrderForm">
      <div className="formHeader">
        <h1 className="formTitle">Track Your Order</h1>
        <p className="formSubtitle">Enter your order ID to track your package</p>
      </div>

      <form onSubmit={handleSearch} className="searchForm">
        <div className="searchInputWrapper">
          <input
            type="text"
            placeholder="Enter Order ID (e.g., ORD123456)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            className="trackSearchInput"
            required
          />
          <button type="submit" className="trackSearchBtn">
            Track Order
          </button>
        </div>
      </form>

      {searched && !orderData && (
        <div className="noResults">
          <Package size={48} />
          <h2>Order Not Found</h2>
          <p>Please check the order ID and try again</p>
        </div>
      )}

      {!searched && (
        <div className="sampleOrders">
          <p>Try these sample IDs: <strong>ORD123456</strong> or <strong>ORD789012</strong></p>
        </div>
      )}
    </div>
  );
}
