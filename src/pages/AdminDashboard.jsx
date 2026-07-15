import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { addProduct, updateProduct, deleteProduct } from '../services/productService';
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
  BarChart3,
  Ticket
} from 'lucide-react';
import TicketingPage from './TicketingPage';
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

  // Dynamic Conversion Rate
  const uniqueBuyers = new Set(orders.map(o => o.userEmail)).size;
  const conversionRate = activeCustomers > 0 ? ((uniqueBuyers / activeCustomers) * 100).toFixed(1) : '0.0';

  // Calculate last 6 months sales dynamically
  const getMonthlySalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesMap = {};
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const key = `${monthName} ${d.getFullYear()}`;
      last6Months.push({ monthName, key, total: 0 });
      salesMap[key] = 0;
    }

    orders.forEach(order => {
      try {
        const orderDate = new Date(order.rawDate || order.date);
        if (!isNaN(orderDate.getTime())) {
          const monthName = months[orderDate.getMonth()];
          const key = `${monthName} ${orderDate.getFullYear()}`;
          if (salesMap[key] !== undefined) {
            salesMap[key] += order.total;
          }
        }
      } catch (err) {
        console.error('Error parsing order date:', err);
      }
    });

    return last6Months.map(m => ({
      label: m.monthName,
      total: salesMap[m.key]
    }));
  };

  const monthlySales = getMonthlySalesData();
  const maxSales = Math.max(...monthlySales.map(s => s.total), 100);
  const xCoords = [50, 190, 330, 470, 610, 750];
  const chartPoints = monthlySales.map((data, index) => {
    const x = xCoords[index];
    const y = 250 - (data.total / maxSales) * 180; // Keep within top/bottom padding
    return { x, y, label: data.label, total: data.total };
  });

  const linePathStr = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPathStr = `${linePathStr} L 750,250 L 50,250 Z`;

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const payload = {
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          originalPrice: Number(productForm.originalPrice || productForm.price),
          image: productForm.image,
          description: productForm.description || '',
          badge: productForm.badge || null,
          specifications: productForm.specifications || {}
        };
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const payload = {
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          originalPrice: Number(productForm.price),
          image: productForm.image,
          description: '',
          badge: null,
          specifications: { 'Status': 'New Product' }
        };
        const created = await addProduct(payload);
        setProducts(prev => [created, ...prev]);
      }
      setIsProductModalOpen(false);
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Failed to save product: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
      }
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
          <button 
            className={`navBtn ${activeTab === 'ticketing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ticketing')}
          >
            <Ticket size={20} />
            Support Ticketing
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
                    <h2>{conversionRate}%</h2>
                    <span className="trend positive">Based on customer signups</span>
                  </div>
                </div>
              </div>

              <div className="chartsSection">
                <div className="chartCard">
                  <div className="chartHeader">
                    <h3>Sales Overview (Last 6 Months)</h3>
                    <div className="chartLegend">
                      <span className="legendItem"><span className="dot current"></span> Store Sales</span>
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
                        d={areaPathStr} 
                        fill="url(#gradientFill)" 
                      />
                      
                      {/* Line connecting points */}
                      <path 
                        d={linePathStr} 
                        fill="none" 
                        stroke="#00a8e8" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data Points and Amounts */}
                      <g className="dataPoints">
                        {chartPoints.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="6" fill="#00a8e8" stroke="#ffffff" strokeWidth="2" />
                            <text x={p.x} y={p.y - 12} textAnchor="middle" className="chartPercent positive" style={{ fill: '#1e293b', fontWeight: '700', fontSize: '11px' }}>
                              ₹{p.total.toLocaleString('en-IN')}
                            </text>
                          </g>
                        ))}
                      </g>
                      
                      {/* X Axis Labels */}
                      <g className="axisLabels">
                        {chartPoints.map((p, i) => (
                          <text key={i} x={p.x} y="280" textAnchor="middle" style={{ fill: '#64748b', fontSize: '12px' }}>{p.label}</text>
                        ))}
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

          {activeTab === 'ticketing' && (
            <div className="tabPane fade-in">
              <TicketingPage isAdmin={true} />
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
