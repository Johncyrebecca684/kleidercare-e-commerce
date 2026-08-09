import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../config';
import { addProduct, updateProduct, deleteProduct, updateProductStock, bulkProductAction } from '../services/productService';
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
  Ticket,
  Search,
  Filter,
  FileText,
  Printer,
  AlertTriangle,
  Download,
  Copy,
  ArrowUpDown,
  Archive,
  Minus,
  Mail,
  Building2,
  Sliders
} from 'lucide-react';
import TicketingPage from './TicketingPage';
import '../components/UserProfile.css';
import './AdminDashboard.css';

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

export default function AdminDashboard({ products, setProducts, users, orders, onUpdateOrderSetup, loggedInUser }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  
  // Customer Orders Search & Filter State
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('All');
  const [orderWarrantyFilter, setOrderWarrantyFilter] = useState('All');
  const [orderFulfillmentFilter, setOrderFulfillmentFilter] = useState('All');

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // 1. Optimistically update local React state so status changes in the UI immediately
    if (onUpdateOrderSetup) {
      onUpdateOrderSetup(orderId, undefined, newStatus);
    }

    // 2. Persist to MongoDB backend if token and order ID are available
    try {
      const token = localStorage.getItem('kc_auth_token');
      if (token) {
        const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
        const dbId = targetOrder?.mongoId || targetOrder?.orderId || orderId;

        await fetch(`${API_URL}/api/orders/${dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      }
    } catch (err) {
      console.error('Error updating order fulfillment status in DB:', err);
    }
  };

  const handleUpdateOrderSetupField = async (orderId, newSetup) => {
    // Optimistically update React state
    if (onUpdateOrderSetup) {
      onUpdateOrderSetup(orderId, newSetup, undefined);
    }

    // Persist setup change to backend
    try {
      const token = localStorage.getItem('kc_auth_token');
      if (token) {
        const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
        const dbId = targetOrder?.mongoId || targetOrder?.orderId || orderId;

        await fetch(`${API_URL}/api/orders/${dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ setup: newSetup })
        });
      }
    } catch (err) {
      console.error('Error updating order setup status in DB:', err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    // 1. Optimistically update React state in App.jsx
    if (onUpdateOrderSetup) {
      onUpdateOrderSetup(orderId, undefined, undefined, newPaymentStatus);
    }

    // 2. Persist paymentStatus change to backend MongoDB database
    try {
      const token = localStorage.getItem('kc_auth_token');
      if (token) {
        const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
        const dbId = targetOrder?.mongoId || targetOrder?.orderId || orderId;

        await fetch(`${API_URL}/api/orders/${dbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentStatus: newPaymentStatus })
        });
      }
    } catch (err) {
      console.error('Error updating order payment status in DB:', err);
    }
  };

  // Product Inventory Search, Filter, Sort & Selection State
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('All');
  const [productSortBy, setProductSortBy] = useState('name-asc');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkStockVal, setBulkStockVal] = useState('');

  // Dynamic list of categories from catalog & database
  const defaultCategories = [
    'LG Commercial Laundry Machines',
    'Speed Queen Commercial Laundry Machines',
    'PONY Finishing Equipments',
    'Genuine Spare Parts',
    'Chemicals',
    'Stacker',
    'Packages',
    'Seko'
  ];

  const availableCategories = Array.from(
    new Set([
      ...defaultCategories,
      ...products.map(p => p.category).filter(Boolean)
    ])
  ).sort();

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: '',
    originalPrice: '',
    category: 'LG Commercial Laundry Machines',
    image: '',
    sku: '',
    stock: 50,
    lowStockThreshold: 10,
    badge: '',
    description: '',
    specifications: {}
  });

  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Helper stock helper
  const getProductStock = (p) => p.stock !== undefined ? p.stock : 50;
  const getProductThreshold = (p) => p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10;
  const getStockStatus = (p) => {
    const s = getProductStock(p);
    const t = getProductThreshold(p);
    if (s <= 0) return 'Out of Stock';
    if (s <= t) return 'Low Stock';
    return 'In Stock';
  };

  // Derived Product Metrics
  const totalStockItems = products.reduce((sum, p) => sum + getProductStock(p), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * getProductStock(p)), 0);
  const lowStockCount = products.filter(p => getStockStatus(p) === 'Low Stock').length;
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'Out of Stock').length;
  const inStockCount = products.filter(p => getStockStatus(p) === 'In Stock').length;

  // Filtered and Sorted Products
  const filteredProducts = products.filter(product => {
    const status = getStockStatus(product);
    const sku = (product.sku || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const prodId = String(product.id || product._id || '').toLowerCase();
    const badge = (product.badge || '').toLowerCase();
    const search = productSearchTerm.trim().toLowerCase();

    const matchesSearch = 
      !search ||
      name.includes(search) ||
      sku.includes(search) ||
      category.includes(search) ||
      prodId.includes(search) ||
      badge.includes(search);

    const matchesCategory = 
      productCategoryFilter === 'All' || 
      category === productCategoryFilter.toLowerCase();

    const matchesStock = 
      productStockFilter === 'All' || 
      status === productStockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (productSortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (productSortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (productSortBy === 'stock-asc') return getProductStock(a) - getProductStock(b);
    if (productSortBy === 'stock-desc') return getProductStock(b) - getProductStock(a);
    if (productSortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
    return (a.name || '').localeCompare(b.name || '');
  });

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
      const validImages = (productForm.images || []).map(i => (typeof i === 'string' ? i.trim() : '')).filter(Boolean);
      const primaryImage = validImages[0] || productForm.image || '';

      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice || productForm.price),
        image: primaryImage,
        images: validImages.length > 0 ? validImages : [primaryImage],
        description: productForm.description || '',
        badge: productForm.badge || null,
        sku: productForm.sku || `SKU-${Date.now()}`,
        stock: Number(productForm.stock || 0),
        lowStockThreshold: Number(productForm.lowStockThreshold || 10),
        specifications: productForm.specifications || {}
      };

      if (editingProduct) {
        const prodId = editingProduct.id || editingProduct._id;
        let updated;
        try {
          updated = await updateProduct(prodId, payload);
        } catch (apiErr) {
          console.error('Database product update failed, updating local state:', apiErr);
          updated = { ...editingProduct, ...payload };
        }
        setProducts(prev => prev.map(p => (p.id === prodId || p._id === prodId || p.id === editingProduct.id) ? updated : p));
      } else {
        let created;
        try {
          created = await addProduct(payload);
        } catch (apiErr) {
          console.error('Database product creation failed, adding to local state:', apiErr);
          created = { id: `PROD-${Date.now()}`, ...payload };
        }
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
      } catch (error) {
        console.error('Error deleting product from database:', error);
      }
      setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
    }
  };

  const handleQuickStockChange = async (product, delta) => {
    const currentStock = getProductStock(product);
    const newStock = Math.max(0, currentStock + delta);
    const targetId = product.mongoId || product._id || product.id;

    // Optimistically update React state
    setProducts(prev => prev.map(p => {
      const isMatch = (p.id && (p.id === product.id || p.id === product._id)) || 
                      (p._id && (p._id === product.id || p._id === product._id)) || 
                      (p.sku && product.sku && p.sku === product.sku);
      if (isMatch) {
        const s = newStock;
        const t = p.lowStockThreshold || 10;
        let stockStatus = 'In Stock';
        if (s <= 0) stockStatus = 'Out of Stock';
        else if (s <= t) stockStatus = 'Low Stock';
        return { ...p, stock: s, stockStatus };
      }
      return p;
    }));

    try {
      if (targetId) {
        await updateProductStock(targetId, newStock);
      }
    } catch (err) {
      console.error('Error syncing stock update to database:', err);
    }
  };

  const handleDirectStockChange = async (product, value) => {
    const newStock = Math.max(0, parseInt(value, 10) || 0);
    const targetId = product.mongoId || product._id || product.id;

    setProducts(prev => prev.map(p => {
      const isMatch = (p.id && (p.id === product.id || p.id === product._id)) || 
                      (p._id && (p._id === product.id || p._id === product._id)) || 
                      (p.sku && product.sku && p.sku === product.sku);
      if (isMatch) {
        const t = p.lowStockThreshold || 10;
        let stockStatus = 'In Stock';
        if (newStock <= 0) stockStatus = 'Out of Stock';
        else if (newStock <= t) stockStatus = 'Low Stock';
        return { ...p, stock: newStock, stockStatus };
      }
      return p;
    }));

    try {
      if (targetId) {
        await updateProductStock(targetId, newStock);
      }
    } catch (err) {
      console.error('Error syncing stock update to database:', err);
    }
  };

  const handleDuplicateProduct = async (product) => {
    try {
      const payload = {
        name: `${product.name} (Copy)`,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: product.image,
        description: product.description || '',
        badge: product.badge || null,
        sku: `SKU-${Date.now()}`,
        stock: getProductStock(product),
        lowStockThreshold: getProductThreshold(product),
        specifications: product.specifications || {}
      };
      const created = await addProduct(payload);
      setProducts(prev => [created, ...prev]);
    } catch (err) {
      alert('Failed to duplicate product: ' + err.message);
    }
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectProduct = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedProductIds.length} selected products?`)) {
      try {
        await bulkProductAction(selectedProductIds, 'delete');
      } catch (err) {
        console.error('Bulk delete API error:', err);
      }
      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id) && !selectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
    }
  };

  const handleBulkUpdateStock = async () => {
    if (selectedProductIds.length === 0 || bulkStockVal === '') return;
    const newStock = Number(bulkStockVal);

    // Update state immediately
    setProducts(prev => prev.map(p => {
      if (selectedProductIds.includes(p.id) || selectedProductIds.includes(p._id)) {
        const t = p.lowStockThreshold || 10;
        let stockStatus = 'In Stock';
        if (newStock <= 0) stockStatus = 'Out of Stock';
        else if (newStock <= t) stockStatus = 'Low Stock';
        return { ...p, stock: newStock, stockStatus };
      }
      return p;
    }));

    try {
      await bulkProductAction(selectedProductIds, 'updateStock', { stock: newStock });
    } catch (err) {
      console.error('Bulk stock update API error:', err);
    }
    setBulkStockVal('');
    setSelectedProductIds([]);
  };

  const handleExportCSV = () => {
    const headers = ['ID,SKU,Name,Category,Price(INR),Original Price(INR),Stock,Status,Badge'];
    const rows = filteredProducts.map(p => [
      `"${p.id}"`,
      `"${p.sku || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      p.price,
      p.originalPrice || p.price,
      getProductStock(p),
      `"${getStockStatus(p)}"`,
      `"${p.badge || ''}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageFieldChange = (index, value) => {
    setProductForm(prev => {
      const currentList = Array.isArray(prev.images) ? [...prev.images] : [];
      currentList[index] = value;
      return {
        ...prev,
        images: currentList,
        image: currentList[0] || value || ''
      };
    });
  };

  const handleAddImageField = () => {
    setProductForm(prev => ({
      ...prev,
      images: [...(Array.isArray(prev.images) ? prev.images : []), '']
    }));
  };

  const handleRemoveImageField = (index) => {
    setProductForm(prev => {
      const currentList = Array.isArray(prev.images) ? [...prev.images] : [];
      const updated = currentList.filter((_, i) => i !== index);
      const finalImages = updated.length > 0 ? updated : [''];
      return {
        ...prev,
        images: finalImages,
        image: finalImages[0] || ''
      };
    });
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      const existingImages = (Array.isArray(product.images) && product.images.length > 0)
        ? product.images
        : (product.image ? [product.image] : ['']);
      setProductForm({ 
        id: product.id,
        name: product.name || '',
        price: product.price || '',
        originalPrice: product.originalPrice || product.price || '',
        category: product.category || 'LG Commercial Laundry Machines',
        image: product.image || existingImages[0] || '',
        images: existingImages,
        sku: product.sku || `SKU-${product.id}`,
        stock: getProductStock(product),
        lowStockThreshold: getProductThreshold(product),
        badge: product.badge || '',
        description: product.description || '',
        specifications: product.specifications || {}
      });
    } else {
      setEditingProduct(null);
      setProductForm({ 
        id: '',
        name: '',
        price: '',
        originalPrice: '',
        category: 'LG Commercial Laundry Machines',
        image: '',
        images: [''],
        sku: `SKU-${Date.now()}`,
        stock: 50,
        lowStockThreshold: 10,
        badge: '',
        description: '',
        specifications: {}
      });
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
            Overview Analytics
          </button>
          <button 
            className={`navBtn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} />
            Product Inventory
          </button>
          <button 
            className={`navBtn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <ShoppingBag size={20} />
            Orders & Invoices
          </button>
          <button 
            className={`navBtn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            User Management
          </button>
          <button 
            className={`navBtn ${activeTab === 'ticketing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ticketing')}
          >
            <Ticket size={20} />
            Support Tickets
          </button>
        </nav>
      </aside>

      <main className="adminMain">
        <header className="adminHeader">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Manage your commercial laundry store, inventory, orders, and customer accounts</p>
          </div>
          <div className="headerBadge">
            <span className="pulse-dot"></span> Store System Active
          </div>
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
                <div>
                  <h3>Product Inventory & Stock Management</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Manage store catalog, track real-time stock levels, update prices, and process inventory operations
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="exportCsvBtn" onClick={handleExportCSV}>
                    <Download size={18} /> Export CSV
                  </button>
                  <button className="addBtn" onClick={() => openProductModal()}>
                    <Plus size={20} /> Add New Product
                  </button>
                </div>
              </div>

              {/* INVENTORY METRICS CARDS */}
              <div className="inventoryKpiGrid">
                <div 
                  className={`inventoryKpiCard ${productStockFilter === 'All' && productCategoryFilter === 'All' && !productSearchTerm ? 'active' : ''}`}
                  onClick={() => { setProductStockFilter('All'); setProductCategoryFilter('All'); setProductSearchTerm(''); }}
                  style={{ cursor: 'pointer' }}
                  title="Click to show all products"
                >
                  <div className="kpiIcon"><Package size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Total Products</span>
                    <div className="kpiValRow">
                      <strong className="kpiValue">{products.length}</strong>
                    </div>
                    <span className="subVal">{totalStockItems} total units in store</span>
                  </div>
                </div>

                <div 
                  className={`inventoryKpiCard success ${productStockFilter === 'In Stock' ? 'active' : ''}`}
                  onClick={() => setProductStockFilter(productStockFilter === 'In Stock' ? 'All' : 'In Stock')}
                  style={{ cursor: 'pointer' }}
                  title="Click to filter In Stock items"
                >
                  <div className="kpiIcon success"><CheckCircle2 size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">In Stock</span>
                    <div className="kpiValRow">
                      <strong className="kpiValue" style={{ color: '#10b981' }}>{inStockCount}</strong>
                    </div>
                    <span className="subVal">Sufficient stock available</span>
                  </div>
                </div>

                <div 
                  className={`inventoryKpiCard warning ${productStockFilter === 'Low Stock' ? 'active' : ''}`}
                  onClick={() => setProductStockFilter(productStockFilter === 'Low Stock' ? 'All' : 'Low Stock')}
                  style={{ cursor: 'pointer' }}
                  title="Click to filter Low Stock items"
                >
                  <div className="kpiIcon warning"><AlertTriangle size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Low Stock Alert</span>
                    <div className="kpiValRow">
                      <strong className="kpiValue" style={{ color: '#f59e0b' }}>{lowStockCount}</strong>
                    </div>
                    <span className="subVal">Items near threshold (≤10)</span>
                  </div>
                </div>

                <div 
                  className={`inventoryKpiCard danger ${productStockFilter === 'Out of Stock' ? 'active' : ''}`}
                  onClick={() => setProductStockFilter(productStockFilter === 'Out of Stock' ? 'All' : 'Out of Stock')}
                  style={{ cursor: 'pointer' }}
                  title="Click to filter Out of Stock items"
                >
                  <div className="kpiIcon danger"><XCircle size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Out of Stock</span>
                    <div className="kpiValRow">
                      <strong className="kpiValue" style={{ color: '#ef4444' }}>{outOfStockCount}</strong>
                    </div>
                    <span className="subVal">Action required immediately</span>
                  </div>
                </div>

                <div className="inventoryKpiCard primary valuationCard">
                  <div className="kpiIcon primary"><DollarSign size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Total Inventory Valuation</span>
                    <div className="kpiValRow">
                      <strong className="kpiValue valuationValue">₹{Math.round(totalInventoryValue).toLocaleString('en-IN')}</strong>
                    </div>
                    <span className="subVal">Combined total asset value of all products in stock</span>
                  </div>
                </div>
              </div>

              {/* SEARCH, FILTER & SORT TOOLBAR */}
              <div className="inventoryFilterBar">
                <div className="searchBox">
                  <Search size={18} className="searchIcon" />
                  <input 
                    type="text" 
                    placeholder="Search product name, SKU, category, ID..." 
                    value={productSearchTerm}
                    onChange={e => setProductSearchTerm(e.target.value)}
                  />
                  {productSearchTerm && (
                    <button 
                      type="button" 
                      onClick={() => setProductSearchTerm('')}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="filterGroup">
                  <Filter size={16} />
                  <select value={productCategoryFilter} onChange={e => setProductCategoryFilter(e.target.value)}>
                    <option value="All">All Categories ({products.length})</option>
                    {availableCategories.map(cat => {
                      const count = products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <option key={cat} value={cat}>{cat} ({count})</option>
                      );
                    })}
                  </select>
                </div>

                <div className="filterGroup">
                  <Archive size={16} />
                  <select value={productStockFilter} onChange={e => setProductStockFilter(e.target.value)}>
                    <option value="All">All Stock Statuses ({products.length})</option>
                    <option value="In Stock">In Stock ({inStockCount})</option>
                    <option value="Low Stock">Low Stock ({lowStockCount})</option>
                    <option value="Out of Stock">Out of Stock ({outOfStockCount})</option>
                  </select>
                </div>

                <div className="filterGroup">
                  <ArrowUpDown size={16} />
                  <select value={productSortBy} onChange={e => setProductSortBy(e.target.value)}>
                    <option value="name-asc">Sort: Name (A-Z)</option>
                    <option value="name-desc">Sort: Name (Z-A)</option>
                    <option value="price-asc">Sort: Price (Low to High)</option>
                    <option value="price-desc">Sort: Price (High to Low)</option>
                    <option value="stock-desc">Sort: Stock Level (High First)</option>
                    <option value="stock-asc">Sort: Stock Level (Low First)</option>
                  </select>
                </div>

                {(productSearchTerm || productCategoryFilter !== 'All' || productStockFilter !== 'All') && (
                  <button 
                    type="button" 
                    onClick={() => { setProductSearchTerm(''); setProductCategoryFilter('All'); setProductStockFilter('All'); setProductSortBy('name-asc'); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    title="Reset all search and filter criteria"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* BULK ACTIONS TOOLBAR */}
              {selectedProductIds.length > 0 && (
                <div className="bulkActionBar">
                  <span>Selected <strong>{selectedProductIds.length}</strong> items</span>
                  <div className="bulkControls">
                    <div className="bulkStockInput">
                      <input 
                        type="number" 
                        placeholder="Set Stock" 
                        value={bulkStockVal}
                        onChange={e => setBulkStockVal(e.target.value)}
                      />
                      <button onClick={handleBulkUpdateStock} className="bulkBtn">Update Stock</button>
                    </div>
                    <button onClick={handleBulkDelete} className="bulkBtn delete">
                      <Trash2 size={16} /> Delete Selected
                    </button>
                  </div>
                </div>
              )}

              {/* INVENTORY PRODUCTS DATA TABLE */}
              <div className="tableContainer">
                <table className="adminTable inventoryTable">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                          onChange={handleSelectAllProducts}
                        />
                      </th>
                      <th>Product Info</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Price & Offer</th>
                      <th>Stock Level</th>
                      <th>Stock Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No products found matching your inventory filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(product => {
                        const stock = getProductStock(product);
                        const status = getStockStatus(product);
                        const isSelected = selectedProductIds.includes(product.id);

                        return (
                          <tr key={product.id} className={isSelected ? 'selectedRow' : ''}>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleToggleSelectProduct(product.id)}
                              />
                            </td>
                            <td>
                              <div className="productCell">
                                <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} />
                                <div className="productTitleMeta">
                                  <strong>{product.name}</strong>
                                  {product.badge && <span className="invBadgeTag">{product.badge}</span>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <code className="skuTag">{product.sku || `SKU-${product.id}`}</code>
                            </td>
                            <td>{product.category}</td>
                            <td>
                              <div className="priceMeta">
                                <strong>₹{product.price.toLocaleString('en-IN')}</strong>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <span className="origPrice">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="stockControlCell" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <button 
                                  type="button" 
                                  className="stockStepBtn" 
                                  onClick={() => handleQuickStockChange(product, -1)}
                                  title="Decrease stock by 1"
                                >
                                  <Minus size={12} />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={stock}
                                  onChange={(e) => handleDirectStockChange(product, e.target.value)}
                                  className="stockInlineInput"
                                  style={{
                                    width: '56px',
                                    textAlign: 'center',
                                    padding: '3px 4px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    background: '#ffffff',
                                    color: '#0f2b5c',
                                    outline: 'none'
                                  }}
                                  title="Type stock quantity directly"
                                />
                                <button 
                                  type="button" 
                                  className="stockStepBtn" 
                                  onClick={() => handleQuickStockChange(product, 1)}
                                  title="Increase stock by 1"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className={`stockStatusPill ${status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {status === 'In Stock' && <CheckCircle2 size={13} />}
                                {status === 'Low Stock' && <AlertTriangle size={13} />}
                                {status === 'Out of Stock' && <XCircle size={13} />}
                                {status}
                              </span>
                            </td>
                            <td>
                              <div className="actionBtns" style={{ justifyContent: 'flex-end' }}>
                                <button className="iconBtn edit" title="Edit Details" onClick={() => openProductModal(product)}>
                                  <Edit size={16} />
                                </button>
                                <button className="iconBtn delete" title="Delete Product" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (() => {
            const filteredOrders = orders.filter(order => {
              const matchesSearch = 
                (order.customerName || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                (order.companyName || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                (order.gstNumber || '').toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                (order.id || '').toString().toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                order.items.some(item => (item.name || '').toLowerCase().includes(orderSearchTerm.toLowerCase()));

              const matchesPayment = orderPaymentFilter === 'All' || order.paymentStatus === orderPaymentFilter;
              const matchesWarranty = orderWarrantyFilter === 'All' || order.warranty === orderWarrantyFilter;
              const normStatus = (order.status === 'delivered' ? 'Delivered' : (order.status === 'in-transit' || order.status === 'shipped') ? 'Shipped' : (order.status || 'Processing'));
              const matchesFulfillment = orderFulfillmentFilter === 'All' || normStatus === orderFulfillmentFilter;

              return matchesSearch && matchesPayment && matchesWarranty && matchesFulfillment;
            });

            const warrantyOptions = Array.from(new Set(orders.map(o => o.warranty).filter(Boolean)));

            return (
              <div className="tabPane fade-in">
                <div className="paneHeader">
                  <div>
                    <h3>Customer Orders & Delivery Management</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                      Track customer purchases, update order fulfillment status (Shipping, Delivered, Processing), manage equipment installation, and generate Tax Invoices
                    </p>
                  </div>
                </div>

                {/* SUMMARY MINI KPIS FOR CUSTOMER ORDERS */}
                <div className="ordersKpiGrid">
                  <div className="ordersKpiCard">
                    <span className="kpiLabel">Total Orders</span>
                    <strong className="kpiValue">{orders.length}</strong>
                  </div>
                  <div className="ordersKpiCard">
                    <span className="kpiLabel">Paid Orders</span>
                    <strong className="kpiValue" style={{ color: '#10b981' }}>
                      {orders.filter(o => o.paymentStatus === 'Paid').length}
                    </strong>
                  </div>
                  <div className="ordersKpiCard">
                    <span className="kpiLabel">Out for Delivery / Shipped</span>
                    <strong className="kpiValue" style={{ color: '#0284c7' }}>
                      {orders.filter(o => o.status === 'Shipped' || o.status === 'in-transit').length}
                    </strong>
                  </div>
                  <div className="ordersKpiCard">
                    <span className="kpiLabel">Delivered Orders</span>
                    <strong className="kpiValue" style={{ color: '#059669' }}>
                      {orders.filter(o => o.status === 'Delivered' || o.status === 'delivered').length}
                    </strong>
                  </div>
                  <div className="ordersKpiCard">
                    <span className="kpiLabel">Total Revenue</span>
                    <strong className="kpiValue" style={{ color: '#0f2b5c' }}>
                      ₹{orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* SEARCH AND FILTER CONTROL BAR */}
                <div className="adminFilterBar">
                  <div className="adminSearchBox">
                    <Search size={18} className="searchIcon" />
                    <input
                      type="text"
                      placeholder="Search customer, company, GST, order ID..."
                      value={orderSearchTerm}
                      onChange={e => setOrderSearchTerm(e.target.value)}
                    />
                    {orderSearchTerm && (
                      <button className="clearSearchBtn" onClick={() => setOrderSearchTerm('')}>×</button>
                    )}
                  </div>

                  <div className="adminFilterGroup">
                    <div className="filterSelectWrapper">
                      <Filter size={16} className="filterIcon" />
                      <select 
                        value={orderFulfillmentFilter} 
                        onChange={e => setOrderFulfillmentFilter(e.target.value)}
                        className="adminSelect"
                      >
                        <option value="All">All Fulfillment Statuses</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped / In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="filterSelectWrapper">
                      <select 
                        value={orderPaymentFilter} 
                        onChange={e => setOrderPaymentFilter(e.target.value)}
                        className="adminSelect"
                      >
                        <option value="All">All Payment Statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    <div className="filterSelectWrapper">
                      <select 
                        value={orderWarrantyFilter} 
                        onChange={e => setOrderWarrantyFilter(e.target.value)}
                        className="adminSelect"
                      >
                        <option value="All">All Warranty Types</option>
                        {warrantyOptions.map((w, idx) => (
                          <option key={idx} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    {(orderSearchTerm || orderPaymentFilter !== 'All' || orderWarrantyFilter !== 'All' || orderFulfillmentFilter !== 'All') && (
                      <button 
                        className="resetFiltersBtn"
                        onClick={() => {
                          setOrderSearchTerm('');
                          setOrderPaymentFilter('All');
                          setOrderWarrantyFilter('All');
                          setOrderFulfillmentFilter('All');
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="tableContainer" style={{ overflowX: 'auto' }}>
                  <table className="adminTable alignedOrdersTable" style={{ width: '100%', minWidth: '1150px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '22%', minWidth: '220px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Order & Customer</th>
                        <th style={{ width: '25%', minWidth: '240px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Products Purchased</th>
                        <th style={{ width: '13%', minWidth: '130px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Total Amount</th>
                        <th style={{ width: '14%', minWidth: '150px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Fulfillment Status</th>
                        <th style={{ width: '13%', minWidth: '145px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Payment Status</th>
                        <th style={{ width: '13%', minWidth: '155px', padding: '14px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>Setup & Installation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => {
                        const currentStatus = order.status || 'Processing';
                        const normalizedStatus = 
                          currentStatus === 'delivered' ? 'Delivered' : 
                          currentStatus === 'in-transit' ? 'Shipped' : currentStatus;

                        return (
                          <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px' }}>
                              <div className="customerOrderCell">
                                <span className="orderIdBadge">#{order.id}</span>
                                <strong className="customerName">{order.customerName || 'Customer'}</strong>
                                {order.userEmail && (
                                  <span className="customerMeta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Mail size={12} style={{ color: '#64748b' }} /> {order.userEmail}
                                  </span>
                                )}
                                {order.companyName && (
                                  <span className="customerMeta" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Building2 size={12} style={{ color: '#64748b' }} /> {order.companyName}
                                  </span>
                                )}
                                {order.gstNumber && (
                                  <span className="customerMeta gst" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <FileText size={12} style={{ color: '#0284c7' }} /> GST: {order.gstNumber}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedInvoiceOrder(order)}
                                  style={{
                                    marginTop: '8px',
                                    padding: '5px 12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: '1px solid #0284c7',
                                    background: '#f0f9ff',
                                    color: '#0369a1',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    width: 'fit-content'
                                  }}
                                  title="View & Print Official GST Tax Invoice"
                                >
                                  <FileText size={13} /> View Invoice
                                </button>
                              </div>
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px' }}>
                              <div className="orderItemsList">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="orderItemRow">
                                    <span className="itemName">• {item.name}</span>
                                    <span className="itemQty">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px', paddingTop: '20px' }}>
                              <strong className="orderPrice" style={{ whiteSpace: 'nowrap', fontSize: '15px' }}>
                                ₹{order.total.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px' }}>
                              {/* FULFILLMENT ORDER STATUS DROPDOWN */}
                              <select
                                value={normalizedStatus}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="orderSetupSelect"
                                style={{
                                  padding: '8px 10px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: normalizedStatus === 'Delivered'
                                    ? '#dcfce7'
                                    : normalizedStatus === 'Shipped' || normalizedStatus === 'in-transit'
                                    ? '#e0f2fe'
                                    : normalizedStatus === 'Cancelled'
                                    ? '#fef2f2'
                                    : '#fef9c3',
                                  color: normalizedStatus === 'Delivered'
                                    ? '#15803d'
                                    : normalizedStatus === 'Shipped' || normalizedStatus === 'in-transit'
                                    ? '#0369a1'
                                    : normalizedStatus === 'Cancelled'
                                    ? '#dc2626'
                                    : '#a16207',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  width: '100%',
                                  minWidth: '145px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px' }}>
                              <select
                                value={order.paymentStatus || 'Pending'}
                                onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                                className="orderPaymentStatusSelect"
                                style={{
                                  padding: '8px 10px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: order.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                                  color: order.paymentStatus === 'Paid' ? '#15803d' : '#a16207',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  width: '100%',
                                  minWidth: '135px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <option value="Pending">Pending (COD)</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </td>
                            <td style={{ verticalAlign: 'top', padding: '16px 14px' }}>
                              <select
                                value={order.setup || 'Pending Installation'}
                                onChange={(e) => handleUpdateOrderSetupField(order.id, e.target.value)}
                                className="orderSetupSelect"
                                style={{
                                  padding: '8px 10px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: (order.setup || '').includes('Completed') || (order.setup || '').includes('Installed')
                                    ? '#dcfce7'
                                    : (order.setup || '').includes('Scheduled') || (order.setup || '').includes('Progress')
                                    ? '#fef9c3'
                                    : '#f1f5f9',
                                  color: (order.setup || '').includes('Completed') || (order.setup || '').includes('Installed')
                                    ? '#15803d'
                                    : (order.setup || '').includes('Scheduled') || (order.setup || '').includes('Progress')
                                    ? '#a16207'
                                    : '#475569',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  width: '100%',
                                  minWidth: '145px',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <option value="Pending Installation">Pending Setup</option>
                                <option value="Scheduled for Setup">Scheduled</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed (Standard)">Installed (Std)</option>
                                <option value="Completed (10-Program Setup)">Installed (10-Prog)</option>
                                <option value="Cancelled / Declined">Declined</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            No orders found matching your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {activeTab === 'users' && (
            <div className="tabPane fade-in">
              <div className="paneHeader">
                <div>
                  <h3>User Account Management</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    View registered store customers, administrative accounts, and user registration data ({users.length} total users)
                  </p>
                </div>
              </div>

              {/* USER METRICS CARDS */}
              <div className="inventoryKpiGrid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="inventoryKpiCard">
                  <div className="kpiIcon"><Users size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Total Users</span>
                    <strong className="kpiValue">{users.length}</strong>
                    <span className="subVal">Registered store accounts</span>
                  </div>
                </div>

                <div className="inventoryKpiCard success">
                  <div className="kpiIcon success"><ShoppingBag size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Customers</span>
                    <strong className="kpiValue" style={{ color: '#10b981' }}>{users.filter(u => u.role === 'customer' || !u.role).length}</strong>
                    <span className="subVal">Active buyer accounts</span>
                  </div>
                </div>

                <div className="inventoryKpiCard primary">
                  <div className="kpiIcon primary"><ShieldCheck size={22} /></div>
                  <div className="kpiContent">
                    <span className="kpiLabel">Administrators</span>
                    <strong className="kpiValue" style={{ color: '#0284c7' }}>{users.filter(u => u.role === 'admin').length}</strong>
                    <span className="subVal">Super Admin access</span>
                  </div>
                </div>
              </div>

              {/* USER TABLE */}
              <div className="tableContainer">
                <table className="adminTable inventoryTable">
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Email Address</th>
                      <th>Account Role</th>
                      <th>Date Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id || idx}>
                        <td>
                          <div className="productCell">
                            <div className="adminAvatar" style={{ width: '38px', height: '38px', fontSize: '14px', borderRadius: '50%' }}>
                              {(u.firstName || u.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="productTitleMeta">
                              <strong>{u.firstName || ''} {u.lastName || ''}</strong>
                              <span className="customerMeta">{u.phone || 'No phone recorded'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <code className="skuTag">{u.email}</code>
                        </td>
                        <td>
                          <span className={`stockStatusPill ${u.role === 'admin' ? 'in-stock' : 'low-stock'}`}>
                            {u.role === 'admin' ? <ShieldCheck size={13} /> : <Users size={13} />}
                            {u.role === 'admin' ? 'Super Admin' : 'Customer'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
          <div className="modalContent inventoryModalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>{editingProduct ? 'Edit Product & Stock' : 'Add New Inventory Product'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {editingProduct ? `Updating inventory details for ID: ${editingProduct.id}` : 'Fill in product specs, pricing, SKU, and stock count'}
                </p>
              </div>
              <button className="closeModalBtn" onClick={() => setIsProductModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleProductSubmit}>
              <div className="modalBody">
                <div className="formRow">
                  <div className="formGroup flex-2">
                    <label>Product Name *</label>
                    <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. LG Titan C Max Commercial Washer" />
                  </div>
                  <div className="formGroup flex-1">
                    <label>SKU Code</label>
                    <input type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} placeholder="e.g. SKU-LG-WM15" />
                  </div>
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label>Category *</label>
                    <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="formGroup">
                    <label>Badge Tag</label>
                    <input type="text" value={productForm.badge || ''} onChange={e => setProductForm({...productForm, badge: e.target.value})} placeholder="e.g. Best Seller, New, 20% OFF" />
                  </div>
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label>Selling Price (₹) *</label>
                    <input required type="number" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="349000" />
                  </div>
                  <div className="formGroup">
                    <label>Original / MRP Price (₹)</label>
                    <input type="number" min="0" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} placeholder="389000" />
                  </div>
                </div>

                <div className="formRow">
                  <div className="formGroup">
                    <label>Stock Quantity *</label>
                    <input required type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} placeholder="50" />
                  </div>
                  <div className="formGroup">
                    <label>Low Stock Threshold</label>
                    <input type="number" min="1" value={productForm.lowStockThreshold} onChange={e => setProductForm({...productForm, lowStockThreshold: e.target.value})} placeholder="10" />
                  </div>
                </div>

                <div className="formGroup">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0, fontWeight: '700' }}>Product Images (Primary & Gallery) *</label>
                    <button
                      type="button"
                      onClick={handleAddImageField}
                      style={{
                        background: '#f0f9ff',
                        color: '#0284c7',
                        border: '1px solid #bae6fd',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Add Image URL
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(Array.isArray(productForm.images) && productForm.images.length > 0 ? productForm.images : ['']).map((imgUrl, idx) => (
                      <div key={idx} className="imageUrlInputGroup" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', minWidth: '70px', textTransform: 'uppercase' }}>
                          {idx === 0 ? 'Cover *' : `Image ${idx + 1}`}
                        </span>
                        <input
                          required={idx === 0}
                          type="text"
                          value={imgUrl}
                          onChange={(e) => handleImageFieldChange(idx, e.target.value)}
                          placeholder={idx === 0 ? "/10kglggiantwasher.png or https://..." : "Additional image URL..."}
                          style={{ flex: 1 }}
                        />
                        {imgUrl && (
                          <img 
                            src={imgUrl} 
                            alt={`Preview ${idx + 1}`} 
                            className="inputImgPreview" 
                            style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            onError={(e) => e.target.style.display='none'} 
                          />
                        )}
                        {productForm.images && productForm.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageField(idx)}
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Remove this image URL"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="formGroup">
                  <label>Description</label>
                  <textarea rows="2" value={productForm.description || ''} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Product specifications and key features..." />
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" className="cancelBtn" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="saveBtn">Save Product & Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAX INVOICE MODAL OVERLAY FOR ADMIN */}
      {selectedInvoiceOrder && (
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
                    const progPrice = item.includeProgramSetup ? 3500 : 0;
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
                            <strong style={{ color: '#0f2b5c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={13} style={{ color: '#0f2b5c' }} /> Kleider Care AMC - {item.amcWarrantyInfo.type}
                            </strong>
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
                            <strong style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sliders size={13} style={{ color: '#0284c7' }} /> Machine Program Parameter Setup Add-on
                            </strong>
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
      )}
    </div>
  );
}
