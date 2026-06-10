import { useState } from 'react';
import { X, LogOut, ShoppingBag, Trash2, User, Mail, Phone } from 'lucide-react';
import './UserProfile.css';

export default function UserProfile({ isOpen, onClose, userData, onLogout, orders = [] }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !userData) return null;

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const handleDeleteAccount = () => {
    alert('Account deletion will be processed. Thank you for using KleidesrCare!');
    onLogout();
    onClose();
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={18} />
            Orders
          </button>
        </div>

        {/* Profile Content */}
        {activeTab === 'profile' && (
          <div className="profile-content">
            <div className="welcome-section">
              <h2 className="welcome-title">Hello {userData.firstName}</h2>
              <p className="welcome-subtitle">Welcome to your KleidesrCare account</p>
            </div>

            <div className="profile-card">
              <div className="profile-header">
                <div className="avatar">
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">
                    {userData.firstName} {userData.lastName}
                  </h3>
                  <p className="profile-email">{userData.email}</p>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-item">
                  <Mail size={18} />
                  <div>
                    <p className="detail-label">Email Address</p>
                    <p className="detail-value">{userData.email}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <User size={18} />
                  <div>
                    <p className="detail-label">Full Name</p>
                    <p className="detail-value">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                </div>
                <div className="detail-item">
                  <ShoppingBag size={18} />
                  <div>
                    <p className="detail-label">Member Since</p>
                    <p className="detail-value">
                      {new Date(userData.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button className="edit-btn">Edit Profile</button>
                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>

            <div className="danger-zone">
              <h4></h4>
              {!showDeleteConfirm ? (
                <button 
                  className="delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                  <div className="confirm-buttons">
                    <button 
                      className="confirm-delete"
                      onClick={handleDeleteAccount}
                    >
                      Yes, Delete Account
                    </button>
                    <button 
                      className="cancel-delete"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <div className="profile-content">
            <div className="orders-section">
              {orders.length === 0 ? (
                <div className="empty-orders">
                  <ShoppingBag size={48} />
                  <h3>No Orders Yet</h3>
                  <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order, index) => (
                    <div key={index} className="order-history-card">
                      <div className="order-history-header">
                        <span className="order-history-id">Order #{order.orderId}</span>
                        <span className="order-history-date">{order.date}</span>
                      </div>
                      <div className="order-history-items">
                        {order.items.map((item, i) => (
                          <div key={i} className="order-history-item">
                            <span>{item.name} <span style={{color: '#888'}}>x{item.quantity}</span></span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-history-footer">
                        <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                        <span className="order-history-total">Total: ₹{order.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
