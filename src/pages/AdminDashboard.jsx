import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Edit, 
  Trash2, 
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({ products, setProducts, users, orders, loggedInUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    id: '', name: '', price: '', category: 'Washing Machines', image: '', specs: []
  });

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Derived Metrics
  const activeCustomers = users.filter(u => u.role === 'customer').length;
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === productForm.id ? { ...p, ...productForm, price: Number(productForm.price) } : p));
    } else {
      const newProduct = {
        ...productForm,
        id: `PROD-${Date.now()}`,
        price: Number(productForm.price),
        specs: ['New Product']
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ ...product });
    } else {
      setEditingProduct(null);
      setProductForm({ id: '', name: '', price: '', category: 'Washing Machines', image: '', specs: [] });
    }
    setIsProductModalOpen(true);
  };

  return (
    <div className="adminContainer animate-fade-in">
      <aside className="adminSidebar">
        <div className="adminProfile">
          <div className="adminAvatar">
            <ShieldCheck size={32} />
          </div>
          <div className="adminInfo">
            <h3>{loggedInUser.firstName} {loggedInUser.lastName}</h3>
            <span>Super Admin</span>
          </div>
        </div>

        <nav className="adminNav">
          <button 
            className={`navBtn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={20} />
            Overview
          </button>
          <button 
            className={`navBtn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} />
            Products Manage
          </button>
          <button 
            className={`navBtn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={20} />
            Customer Sales
          </button>
        </nav>
      </aside>

      <main className="adminMain">
        <header className="adminHeader">
          <h2>Admin Dashboard</h2>
          <p>Manage your store, products, and customers</p>
        </header>

        <div className="adminContent">
          {activeTab === 'overview' && (
            <div className="tabPane fade-in">
              <div className="metricGrid">
                <div className="metricCard">
                  <div className="metricIcon"><Users size={24} /></div>
                  <div className="metricData">
                    <h4>Active Customers</h4>
                    <h2>{activeCustomers}</h2>
                  </div>
                </div>
                <div className="metricCard">
                  <div className="metricIcon success"><DollarSign size={24} /></div>
                  <div className="metricData">
                    <h4>Total Revenue</h4>
                    <h2>₹{totalSales.toLocaleString('en-IN')}</h2>
                    <span className="trend positive">↑ 18.2% vs last month</span>
                  </div>
                </div>
                <div className="metricCard">
                  <div className="metricIcon warning"><ShoppingBag size={24} /></div>
                  <div className="metricData">
                    <h4>Total Orders</h4>
                    <h2>{totalOrders}</h2>
                    <span className="trend positive">↑ 5.4% vs last month</span>
                  </div>
                </div>
                <div className="metricCard">
                  <div className="metricIcon info"><TrendingUp size={24} /></div>
                  <div className="metricData">
                    <h4>Conversion Rate</h4>
                    <h2>14.5%</h2>
                    <span className="trend negative">↓ 1.2% vs last month</span>
                  </div>
                </div>
              </div>

              <div className="chartsSection">
                <div className="chartCard">
                  <div className="chartHeader">
                    <h3>Sales Overview (Monthly)</h3>
                    <div className="chartLegend">
                      <span className="legendItem"><span className="dot current"></span> Current Year</span>
                    </div>
                  </div>
                  <div className="svgChartContainer">
                    <svg viewBox="0 0 800 300" className="lineChart" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(0, 168, 232, 0.4)" />
                          <stop offset="100%" stopColor="rgba(0, 168, 232, 0.0)" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="250" x2="800" y2="250" className="gridLine" />
                      <line x1="0" y1="187.5" x2="800" y2="187.5" className="gridLine" />
                      <line x1="0" y1="125" x2="800" y2="125" className="gridLine" />
                      <line x1="0" y1="62.5" x2="800" y2="62.5" className="gridLine" />
                      
                      {/* Area Fill */}
                      <path 
                        d="M 50,180 L 200,80 L 350,140 L 500,60 L 650,110 L 750,40 L 750,250 L 50,250 Z" 
                        fill="url(#gradientFill)" 
                      />
                      
                      {/* Line connecting points */}
                      <path 
                        d="M 50,180 L 200,80 L 350,140 L 500,60 L 650,110 L 750,40" 
                        fill="none" 
                        stroke="#00a8e8" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data Points and Percentages */}
                      <g className="dataPoints">
                        <circle cx="50" cy="180" r="6" />
                        <circle cx="200" cy="80" r="6" />
                        <text x="200" y="60" className="chartPercent positive">+45%</text>
                        
                        <circle cx="350" cy="140" r="6" />
                        <text x="350" y="120" className="chartPercent negative">-20%</text>
                        
                        <circle cx="500" cy="60" r="6" />
                        <text x="500" y="40" className="chartPercent positive">+60%</text>
                        
                        <circle cx="650" cy="110" r="6" />
                        <text x="650" y="90" className="chartPercent negative">-15%</text>
                        
                        <circle cx="750" cy="40" r="6" />
                        <text x="750" y="20" className="chartPercent positive">+35%</text>
                      </g>
                      
                      {/* X Axis Labels */}
                      <g className="axisLabels">
                        <text x="50" y="280">Jan</text>
                        <text x="200" y="280">Feb</text>
                        <text x="350" y="280">Mar</text>
                        <text x="500" y="280">Apr</text>
                        <text x="650" y="280">May</text>
                        <text x="750" y="280">Jun</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="tabPane fade-in">
              <div className="paneHeader">
                <h3>Product Inventory</h3>
                <button className="addBtn" onClick={() => openProductModal()}>
                  <Plus size={20} /> Add New Product
                </button>
              </div>

              <div className="tableContainer">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="productCell">
                            <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} />
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>₹{product.price}</td>
                        <td>
                          <div className="actionBtns">
                            <button className="iconBtn edit" onClick={() => openProductModal(product)}><Edit size={16} /></button>
                            <button className="iconBtn delete" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="tabPane fade-in">
              <div className="paneHeader">
                <h3>Customer Orders & Details</h3>
              </div>

              <div className="tableContainer">
                <table className="adminTable">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Product Bought</th>
                      <th>Paid Status</th>
                      <th>Amount Paid</th>
                      <th>Warranty Details</th>
                      <th>Setup Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td><strong>{order.customerName}</strong></td>
                        <td>
                          <div className="itemList">
                            {order.items.map((item, idx) => (
                              <span key={idx}>{item.name} (x{item.quantity})</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`statusBadge ${order.paymentStatus === 'Paid' ? 'success' : 'warning'}`}>
                            {order.paymentStatus === 'Paid' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td><strong>₹{order.total.toLocaleString('en-IN')}</strong></td>
                        <td><span className="warrantyBadge">{order.warranty}</span></td>
                        <td><span className="setupBadge">{order.setup}</span></td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No customer orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {isProductModalOpen && (
        <div className="modalOverlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleProductSubmit}>
              <div className="formGroup">
                <label>Product Name</label>
                <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div className="formGroup">
                <label>Category</label>
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                  <option>Washing Machines</option>
                  <option>Dryers</option>
                  <option>Spare Parts</option>
                  <option>Accessories</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Price ($)</label>
                <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
              </div>
              <div className="formGroup">
                <label>Image URL</label>
                <input required type="text" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} />
              </div>
              <div className="modalActions">
                <button type="button" className="cancelBtn" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="saveBtn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
