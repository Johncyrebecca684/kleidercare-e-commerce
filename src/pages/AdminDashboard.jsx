import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../config';
import { addProduct, updateProduct, deleteProduct, updateProductStock, bulkProductAction, cleanupDuplicateProducts } from '../services/productService';
import { getAllCategories, addCategory as apiAddCategory, deleteCategory as apiDeleteCategory } from '../services/categoryService';
import { formatImageUrl } from '../utils/imageUtils';
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
  Sliders,
  Bold,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading,
  Type,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Eye,
  Check,
  Tag,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Percent,
  RefreshCw,
  FolderPlus,
  FolderTree,
  ExternalLink,
  Hash
} from 'lucide-react';
import TicketingPage from './TicketingPage';
import { useToast } from '../context/ToastContext';
import '../components/UserProfile.css';
import './AdminDashboard.css';

// Preset Common Technical Specification Keys
const COMMON_SPEC_KEYS = [
  'Capacity',
  'Voltage',
  'Function Type',
  'Loading Type',
  'Automation Grade',
  'Brand',
  'Model Name/Number',
  'Drum Volume',
  'Power Source',
  'Warranty'
];

function objToSpecRows(specsObj) {
  if (!specsObj || typeof specsObj !== 'object') return [];
  return Object.entries(specsObj).map(([key, value]) => ({
    key: key || '',
    value: typeof value === 'object' ? JSON.stringify(value) : String(value || '')
  }));
}

function specRowsToObj(rows) {
  const obj = {};
  if (Array.isArray(rows)) {
    rows.forEach(r => {
      if (r && r.key && r.key.trim()) {
        obj[r.key.trim()] = r.value !== undefined ? String(r.value) : '';
      }
    });
  }
  return obj;
}

// Helper to auto-parse raw pasted text / feature sheets into structured technical specifications
export function parseRawSpecsText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  
  const lines = rawText.split(/\r?\n/);
  const result = [];
  const sectionHeaders = [
    'detailed key features',
    'key features',
    'features',
    'specifications',
    'technical specifications',
    'technical details',
    'highlights',
    'general specifications',
    'product details',
    'specs'
  ];

  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) continue;

    // Strip leading bullets, asterisks, numbers like "1.", "1)", "•", "-", etc.
    trimmed = trimmed.replace(/^[\s•\-\*\u2022\u25E6\u25AA\u25BA\d+[\.\)\]]\s*/, '').trim();
    if (!trimmed) continue;

    // Check if line is just a section title (e.g. "Detailed Key Features:")
    const lower = trimmed.toLowerCase().replace(/[:\-_]+$/, '').trim();
    if (sectionHeaders.includes(lower) && !trimmed.includes(': ') && trimmed.endsWith(':')) {
      continue; // Skip standalone section header line
    }

    // Split on first ':' or ' - '
    let key = '';
    let val = '';

    const colonIdx = trimmed.indexOf(':');
    const dashIdx = trimmed.indexOf(' - ');

    if (colonIdx > 0 && (dashIdx === -1 || colonIdx < dashIdx)) {
      key = trimmed.substring(0, colonIdx).trim();
      val = trimmed.substring(colonIdx + 1).trim();
    } else if (dashIdx > 0) {
      key = trimmed.substring(0, dashIdx).trim();
      val = trimmed.substring(dashIdx + 3).trim();
    } else if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        key = parts[0];
        val = parts.slice(1).join(' ');
      }
    }

    if (key) {
      // Clean up key: remove unwanted leading/trailing symbols
      key = key.replace(/^[:\-\*\s]+|[:\-\*\s]+$/g, '').trim();
      if (key) {
        result.push({ key, value: val || '' });
      }
    } else if (result.length > 0) {
      // Continuation line of previous value
      result[result.length - 1].value += ` ${trimmed}`;
    }
  }

  return result;
}

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
  if (!loggedInUser || loggedInUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const { showSuccess, showError, showWarning, showInfo } = useToast();
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
    'LG Genuine Spare Parts',
    'Laundry Chemicals',
    'Stacker',
    'Packages',
    'Seko'
  ];

  const [dbCategories, setDbCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catSearchTerm, setCatSearchTerm] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const data = await getAllCategories();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDbCategories(data);
        }
      } catch (err) {
        // Silently use existing product categories
      }
    };
    fetchCats();
    return () => { isMounted = false; };
  }, [products]);

  const availableCategories = Array.from(
    new Set([
      ...defaultCategories,
      ...dbCategories.map(c => c.name).filter(Boolean),
      ...products.map(p => p.category).filter(Boolean)
    ])
  ).sort();

  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmed = newCatName.trim();
    if (availableCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showWarning(`Category "${trimmed}" already exists.`);
      return;
    }

    setIsAddingCategory(true);
    try {
      let createdCat;
      try {
        createdCat = await apiAddCategory({ name: trimmed, description: newCatDesc.trim() });
      } catch (apiErr) {
        console.warn('API category creation failed, updating local state:', apiErr);
        createdCat = {
          _id: `cat-${Date.now()}`,
          name: trimmed,
          slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: newCatDesc.trim()
        };
      }
      setDbCategories(prev => [createdCat, ...prev]);
      showSuccess(`Category "${trimmed}" created successfully!`);
      setNewCatName('');
      setNewCatDesc('');
    } catch (err) {
      showError('Failed to add category: ' + err.message);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    const attachedCount = products.filter(p => (p.category || '').toLowerCase() === categoryName.toLowerCase()).length;
    const confirmMsg = attachedCount > 0
      ? `Category "${categoryName}" is currently assigned to ${attachedCount} product(s). Are you sure you want to remove it?`
      : `Are you sure you want to remove category "${categoryName}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const targetCat = dbCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase() || c._id === categoryName);
      const catId = targetCat?._id || categoryName;
      try {
        await apiDeleteCategory(catId);
      } catch (apiErr) {
        console.warn('API category delete warning:', apiErr);
      }
      setDbCategories(prev => prev.filter(c => c.name.toLowerCase() !== categoryName.toLowerCase() && c._id !== categoryName));
      showSuccess(`Category "${categoryName}" removed successfully.`);
    } catch (err) {
      showError('Failed to delete category: ' + err.message);
    }
  };

  // Dedicated Quick Specs Modal State
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [specsEditingProduct, setSpecsEditingProduct] = useState(null);
  const [specsModalRows, setSpecsModalRows] = useState([]);
  const [specsSaving, setSpecsSaving] = useState(false);
  const [rawSpecsModalInput, setRawSpecsModalInput] = useState('');
  const [showRawSpecsModalBox, setShowRawSpecsModalBox] = useState(false);

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productEditActiveTab, setProductEditActiveTab] = useState('general');
  const [rawSpecsInput, setRawSpecsInput] = useState('');
  const [showRawSpecsBox, setShowRawSpecsBox] = useState(false);
  const [productForm, setProductForm] = useState({
    id: '',
    productId: '',
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
    specifications: {},
    specRows: [{ key: '', value: '' }]
  });

  // Helper for generating Product ID
  const handleGenerateProductId = () => {
    const catCode = (productForm.category || 'LG')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4) || 'PRD';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setProductForm(prev => ({ ...prev, productId: `PRD-${catCode}-${randNum}` }));
  };

  // Helper for generating SKU
  const handleGenerateSku = () => {
    const catCode = (productForm.category || 'LG')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4) || 'LG';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setProductForm(prev => ({ ...prev, sku: `SKU-${catCode}-${randNum}` }));
  };

  // Description Rich Text Formatter Ref & Handler
  const descTextareaRef = useRef(null);

  const applyTextFormat = (type) => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentVal = productForm.description || '';
    const selectedText = currentVal.substring(start, end);

    let formatted = '';
    let newCursorPos = start;

    switch (type) {
      case 'bold': {
        const textToWrap = selectedText || 'Bold text';
        formatted = `**${textToWrap}**`;
        newCursorPos = start + formatted.length;
        break;
      }
      case 'bullet': {
        if (selectedText.length > 0) {
          const lines = selectedText.split('\n');
          const bulleted = lines.map(line => line.startsWith('• ') ? line : `• ${line}`).join('\n');
          formatted = bulleted;
          newCursorPos = start + formatted.length;
        } else {
          formatted = '\n• ';
          newCursorPos = start + formatted.length;
        }
        break;
      }
      case 'heading': {
        const text = selectedText || 'Section Heading';
        formatted = `\n### ${text}\n`;
        newCursorPos = start + formatted.length;
        break;
      }
      case 'align-center': {
        const text = selectedText || 'Centered text';
        formatted = `[center]${text}[/center]`;
        newCursorPos = start + formatted.length;
        break;
      }
      case 'align-right': {
        const text = selectedText || 'Right-aligned text';
        formatted = `[right]${text}[/right]`;
        newCursorPos = start + formatted.length;
        break;
      }
      case 'align-left': {
        const text = selectedText || 'Left-aligned text';
        formatted = `[left]${text}[/left]`;
        newCursorPos = start + formatted.length;
        break;
      }
      default:
        return;
    }

    const newVal = currentVal.substring(0, start) + formatted + currentVal.substring(end);
    setProductForm(prev => ({ ...prev, description: newVal }));

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Specs Rows Handlers for Main Edit Product Form
  const handleAddSpecRow = () => {
    setProductForm(prev => ({
      ...prev,
      specRows: [...(prev.specRows || []), { key: '', value: '' }]
    }));
  };

  const handleRemoveSpecRow = (index) => {
    setProductForm(prev => ({
      ...prev,
      specRows: (prev.specRows || []).filter((_, i) => i !== index)
    }));
  };

  const handleSpecRowChange = (index, field, val) => {
    setProductForm(prev => {
      const rows = [...(prev.specRows || [])];
      rows[index] = { ...rows[index], [field]: val };
      return { ...prev, specRows: rows };
    });
  };

  const handleAddPresetSpec = (presetKey) => {
    setProductForm(prev => {
      const existing = prev.specRows || [];
      if (existing.some(r => r.key.toLowerCase() === presetKey.toLowerCase())) {
        return prev;
      }
      const filtered = existing.filter(r => r.key.trim() !== '' || r.value.trim() !== '');
      return {
        ...prev,
        specRows: [...filtered, { key: presetKey, value: '' }]
      };
    });
  };

  // Auto-Parse Paste Handlers for Technical Specifications
  const handleParseAndApplySpecs = (mode = 'replace') => {
    if (!rawSpecsInput.trim()) {
      showWarning('Please paste some text with specifications first.');
      return;
    }
    const parsedRows = parseRawSpecsText(rawSpecsInput);
    if (parsedRows.length === 0) {
      showError('No specifications could be detected. Make sure lines follow "Parameter: Value" format.');
      return;
    }

    setProductForm(prev => {
      const existing = prev.specRows || [];
      const cleanExisting = existing.filter(r => r.key.trim() || r.value.trim());
      const newRows = mode === 'append' ? [...cleanExisting, ...parsedRows] : parsedRows;
      return { ...prev, specRows: newRows };
    });

    showSuccess(`Successfully extracted ${parsedRows.length} specifications!`);
    setRawSpecsInput('');
    setShowRawSpecsBox(false);
  };

  const handleParseAndApplyModalSpecs = (mode = 'replace') => {
    if (!rawSpecsModalInput.trim()) {
      showWarning('Please paste some text with specifications first.');
      return;
    }
    const parsedRows = parseRawSpecsText(rawSpecsModalInput);
    if (parsedRows.length === 0) {
      showError('No specifications could be detected. Make sure lines follow "Parameter: Value" format.');
      return;
    }

    setSpecsModalRows(prev => {
      const cleanExisting = prev.filter(r => r.key.trim() || r.value.trim());
      return mode === 'append' ? [...cleanExisting, ...parsedRows] : parsedRows;
    });

    showSuccess(`Successfully extracted ${parsedRows.length} specifications!`);
    setRawSpecsModalInput('');
    setShowRawSpecsModalBox(false);
  };

  // Specs Modal Handlers (Dedicated Quick Specs Editor)
  const openSpecsModal = (product) => {
    setSpecsEditingProduct(product);
    const rows = objToSpecRows(product.specifications || {});
    setSpecsModalRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    setRawSpecsModalInput('');
    setShowRawSpecsModalBox(false);
    setIsSpecsModalOpen(true);
  };

  const handleSaveSpecsModal = async () => {
    if (!specsEditingProduct) return;
    setSpecsSaving(true);
    try {
      const cleanSpecs = specRowsToObj(specsModalRows);
      const targetId = specsEditingProduct.mongoId || specsEditingProduct._id || specsEditingProduct.id;

      let updatedProduct;
      try {
        updatedProduct = await updateProduct(targetId, { specifications: cleanSpecs });
      } catch (err) {
        console.error('Failed to sync specs to DB, updating locally:', err);
        updatedProduct = { ...specsEditingProduct, specifications: cleanSpecs };
      }

      setProducts(prev => prev.map(p => {
        const isMatch = (p.id && (p.id === specsEditingProduct.id || p.id === specsEditingProduct._id)) ||
                        (p._id && (p._id === specsEditingProduct.id || p._id === specsEditingProduct._id));
        if (isMatch) {
          return { ...p, specifications: cleanSpecs, ...(updatedProduct || {}) };
        }
        return p;
      }));

      setIsSpecsModalOpen(false);
      setSpecsEditingProduct(null);
      showSuccess('Technical specifications updated successfully!');
    } catch (err) {
      showError('Error saving technical specifications: ' + err.message);
    } finally {
      setSpecsSaving(false);
    }
  };

  const handleAddSpecsModalRow = () => {
    setSpecsModalRows(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecsModalRow = (index) => {
    setSpecsModalRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecsModalRowChange = (index, field, val) => {
    setSpecsModalRows(prev => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [field]: val };
      return rows;
    });
  };

  const handleAddPresetToSpecsModal = (presetKey) => {
    setSpecsModalRows(prev => {
      if (prev.some(r => r.key.toLowerCase() === presetKey.toLowerCase())) return prev;
      const filtered = prev.filter(r => r.key.trim() !== '' || r.value.trim() !== '');
      return [...filtered, { key: presetKey, value: '' }];
    });
  };

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
      const rawImages = (productForm.images || []).map(i => (typeof i === 'string' ? i.trim() : '')).filter(Boolean);
      const validImages = rawImages.map(img => formatImageUrl(img));
      const primaryImage = validImages[0] ? formatImageUrl(validImages[0]) : formatImageUrl(productForm.image || '');
      const cleanSpecs = specRowsToObj(productForm.specRows);

      const generatedProdId = productForm.productId ? productForm.productId.trim() : (productForm.id || `PROD-${Date.now()}`);

      const payload = {
        id: generatedProdId,
        productId: generatedProdId,
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
        specifications: cleanSpecs
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
          created = { id: generatedProdId, productId: generatedProdId, ...payload };
        }
        setProducts(prev => [created, ...prev]);
      }
      setIsProductModalOpen(false);
      showSuccess(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
    } catch (error) {
      console.error('Error submitting product:', error);
      showError('Failed to save product: ' + error.message);
    }
  };

  const handleDeleteProduct = async (product, deleteAllDuplicates = false) => {
    const targetId = typeof product === 'object' ? (product._id || product.mongoId || product.id || product.productId) : product;
    const productName = typeof product === 'object' ? product.name : 'this product';
    
    const confirmPrompt = deleteAllDuplicates 
      ? `Are you sure you want to delete ALL instances and duplicates of "${productName}" from the database?`
      : `Are you sure you want to delete "${productName}"?`;

    if (window.confirm(confirmPrompt)) {
      try {
        await deleteProduct(targetId, deleteAllDuplicates);
        
        // Remove from React state
        setProducts(prev => prev.filter(p => {
          if (deleteAllDuplicates) {
            return (p.name || '').trim().toLowerCase() !== productName.trim().toLowerCase();
          }
          return p._id !== targetId && p.id !== targetId && p.mongoId !== targetId && p.productId !== targetId;
        }));

        setSelectedProductIds(prev => prev.filter(pId => pId !== targetId));

        // Update localStorage cache
        try {
          const raw = localStorage.getItem('kc_app_products');
          if (raw) {
            const currentList = JSON.parse(raw);
            const updatedList = currentList.filter(p => {
              if (deleteAllDuplicates) {
                return (p.name || '').trim().toLowerCase() !== productName.trim().toLowerCase();
              }
              return p._id !== targetId && p.id !== targetId && p.mongoId !== targetId && p.productId !== targetId;
            });
            localStorage.setItem('kc_app_products', JSON.stringify(updatedList));
          }
        } catch (e) {
          // ignore
        }

        showSuccess(`"${productName}" deleted successfully from database.`);
      } catch (error) {
        console.error('Error deleting product from database:', error);
        showError(`Failed to delete product from database: ${error.message || 'Please check your connection and login.'}`);
      }
    }
  };

  const handleCleanupDuplicates = async () => {
    if (window.confirm('Scan database and automatically clean up all duplicate products (keeping the newest copy of each)?')) {
      try {
        const result = await cleanupDuplicateProducts();
        if (result && Array.isArray(result.products)) {
          setProducts(result.products);
          try {
            localStorage.setItem('kc_app_products', JSON.stringify(result.products));
          } catch (e) {}
        }
        showSuccess(result?.message || 'Duplicate products cleaned up successfully!');
      } catch (err) {
        console.error('Error cleaning duplicate products:', err);
        showError('Failed to clean duplicate products: ' + err.message);
      }
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
      showSuccess(`Duplicated "${product.name}" successfully!`);
    } catch (err) {
      showError('Failed to duplicate product: ' + err.message);
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
    const formatted = formatImageUrl(value);
    setProductForm(prev => {
      const currentList = Array.isArray(prev.images) ? [...prev.images] : [];
      currentList[index] = formatted;
      return {
        ...prev,
        images: currentList,
        image: currentList[0] || formatted || ''
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
      const specsObj = product.specifications || {};
      const specRows = objToSpecRows(specsObj);
      setProductForm({ 
        id: product.id || product._id || '',
        productId: product.productId || product.id || product._id || '',
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
        specifications: specsObj,
        specRows: specRows.length > 0 ? specRows : [{ key: '', value: '' }]
      });
    } else {
      setEditingProduct(null);
      const newProdId = `PROD-${Date.now()}`;
      setProductForm({ 
        id: newProdId,
        productId: newProdId,
        name: '',
        price: '',
        originalPrice: '',
        category: availableCategories[0] || 'LG Commercial Laundry Machines',
        image: '',
        images: [''],
        sku: `SKU-${Date.now()}`,
        stock: 50,
        lowStockThreshold: 10,
        badge: '',
        description: '',
        specifications: {},
        specRows: [{ key: '', value: '' }]
      });
    }
    setRawSpecsInput('');
    setShowRawSpecsBox(false);
    setProductEditActiveTab('general');
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
            className={`navBtn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FolderTree size={20} />
            Category Manager
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
            isProductModalOpen ? (() => {
              const pricingInsights = (() => {
                const p = parseFloat(productForm.price) || 0;
                const op = parseFloat(productForm.originalPrice) || 0;
                if (op > p && p > 0) {
                  const discountPct = Math.round(((op - p) / op) * 100);
                  const savings = op - p;
                  return { discountPct, savings };
                }
                return null;
              })();

              const currentStockNum = Number(productForm.stock) || 0;
              const lowStockThresh = Number(productForm.lowStockThreshold) || 10;
              const stockStatusTag = currentStockNum === 0 
                ? { text: 'Out of Stock', class: 'danger', icon: XCircle } 
                : currentStockNum <= lowStockThresh 
                  ? { text: 'Low Stock Alert', class: 'warning', icon: AlertTriangle } 
                  : { text: 'In Stock', class: 'success', icon: CheckCircle2 };
              const StatusIcon = stockStatusTag.icon;

              const specsCount = (productForm.specRows || []).filter(r => r.key?.trim() && r.value?.trim()).length;
              const imagesCount = (Array.isArray(productForm.images) && productForm.images.filter(Boolean).length > 0)
                ? productForm.images.filter(Boolean).length
                : (productForm.image ? 1 : 0);

              const modalTabs = [
                { id: 'general', label: 'General Info', icon: Package, badge: null },
                { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign, badge: productForm.price ? `₹${Number(productForm.price).toLocaleString('en-IN')}` : null },
                { id: 'media', label: 'Images & Media', icon: ImageIcon, badge: imagesCount > 0 ? `${imagesCount} img` : null },
                { id: 'description', label: 'Description', icon: FileText, badge: (productForm.description || '').length > 0 ? `${(productForm.description || '').length}c` : null },
                { id: 'specs', label: 'Technical Specs', icon: Sliders, badge: specsCount > 0 ? `${specsCount} specs` : null },
                { id: 'preview', label: 'Storefront Live Preview', icon: Eye, badge: 'Live' }
              ];

              const tabIdx = modalTabs.findIndex(t => t.id === productEditActiveTab);

              return (
                <div className="productEditorFullScreenPane fade-in">
                  {/* TOP NAVIGATION / BREADCRUMB BAR */}
                  <div className="editorTopBar">
                    <div className="editorBreadcrumbGroup">
                      <button 
                        type="button" 
                        className="backToInventoryBtn"
                        onClick={() => setIsProductModalOpen(false)}
                      >
                        <ArrowLeft size={16} /> Back to Product Inventory
                      </button>
                      <span className="breadcrumbDivider">/</span>
                      <span className="breadcrumbCurrent">
                        {editingProduct ? `Edit: ${editingProduct.name || 'Product'}` : 'New Inventory Product'}
                      </span>
                    </div>

                    <div className="editorTopActions">
                      <button 
                        type="button" 
                        className="editorCancelBtn"
                        onClick={() => setIsProductModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="editorPreviewBtn"
                        onClick={() => setProductEditActiveTab('preview')}
                      >
                        <Eye size={15} /> Storefront Preview
                      </button>
                      <button 
                        type="button" 
                        className="editorSaveHeaderBtn"
                        onClick={handleProductSubmit}
                      >
                        <Check size={16} /> Save Product
                      </button>
                    </div>
                  </div>

                  {/* HERO HEADER CARD */}
                  <div className="editorHeroCard">
                    <div className="editorHeroInfo">
                      <div className="editorHeroIcon">
                        <Package size={26} />
                      </div>
                      <div>
                        <div className="editorHeroTitleRow">
                          <h2>{editingProduct ? 'Edit Product & Stock Parameters' : 'Create New Inventory Product'}</h2>
                          {editingProduct && (
                            <span className="skuBadge">{productForm.sku || `ID: ${editingProduct.id || editingProduct._id}`}</span>
                          )}
                          {productForm.badge && (
                            <span className="invBadgeTag">{productForm.badge}</span>
                          )}
                          <span className="editorCatBadge">{productForm.category || 'General Equipment'}</span>
                        </div>
                        <p>
                          {editingProduct 
                            ? `Full screen control: Update catalog information, pricing structure, live stock level, high-res photos, and technical parameters for ${editingProduct.name || 'this product'}` 
                            : 'Fill in catalog attributes, SKU identifier, pricing structure, initial warehouse stock, and technical specifications'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FULL-SCREEN TAB NAVIGATION BAR */}
                  <div className="fullScreenTabBar">
                    {modalTabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = productEditActiveTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`fullScreenTabBtn ${isActive ? 'active' : ''}`}
                          onClick={() => setProductEditActiveTab(tab.id)}
                        >
                          <Icon size={17} className="tabIcon" />
                          <span>{tab.label}</span>
                          {tab.badge && <span className={`tabBadge ${isActive ? 'activeBadge' : ''}`}>{tab.badge}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB CONTENT FORM */}
                  <form onSubmit={handleProductSubmit} className="fullScreenEditorForm">
                    <div className="fullScreenEditorBody">
                      {/* TAB 1: GENERAL INFO */}
                      {productEditActiveTab === 'general' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>General Information</h4>
                              <p>Basic catalog details, SKU identification, category assignment, and promotional badge tags</p>
                            </div>
                          </div>

                          <div className="formGrid">
                            <div className="formGroup fullWidth">
                              <label>Product Name <span className="reqStar">*</span></label>
                              <input 
                                required 
                                type="text" 
                                value={productForm.name} 
                                onChange={e => setProductForm({...productForm, name: e.target.value})} 
                                placeholder="e.g. LG Titan C Max Commercial Front Load Washer (15 Kg)" 
                              />
                            </div>

                            <div className="formGroup">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Product ID / Code <span className="reqStar">*</span></label>
                                <button
                                  type="button"
                                  className="inlineTextActionBtn"
                                  onClick={handleGenerateProductId}
                                  title="Generate standard Product ID"
                                >
                                  <RefreshCw size={11} /> Auto-Generate
                                </button>
                              </div>
                              <input 
                                required
                                type="text" 
                                value={productForm.productId || ''} 
                                onChange={e => setProductForm({...productForm, productId: e.target.value})} 
                                placeholder="e.g. PRD-LG-101 or PROD-1725890" 
                              />
                            </div>

                            <div className="formGroup">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>SKU Code</label>
                                <button
                                  type="button"
                                  className="inlineTextActionBtn"
                                  onClick={handleGenerateSku}
                                  title="Generate standard SKU code"
                                >
                                  <RefreshCw size={11} /> Auto-Generate
                                </button>
                              </div>
                              <input 
                                type="text" 
                                value={productForm.sku} 
                                onChange={e => setProductForm({...productForm, sku: e.target.value})} 
                                placeholder="e.g. SKU-LG-WM15" 
                              />
                            </div>

                            <div className="formGroup fullWidth">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Product Category <span className="reqStar">*</span></label>
                                <button
                                  type="button"
                                  className="inlineTextActionBtn"
                                  onClick={() => { setIsProductModalOpen(false); setActiveTab('categories'); }}
                                  title="Add or remove categories"
                                >
                                  <FolderPlus size={11} /> Manage Categories
                                </button>
                              </div>
                              <select 
                                value={productForm.category} 
                                onChange={e => setProductForm({...productForm, category: e.target.value})}
                              >
                                {availableCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            <div className="formGroup fullWidth">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ margin: 0 }}>Badge / Promotional Tag</label>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>Quick suggestions:</span>
                              </div>
                              <input 
                                type="text" 
                                value={productForm.badge || ''} 
                                onChange={e => setProductForm({...productForm, badge: e.target.value})} 
                                placeholder="e.g. Best Seller, New Arrival, 20% OFF, Commercial Heavy Duty" 
                              />
                              <div className="quickTagChips">
                                {['Best Seller', 'New Arrival', 'Commercial Pick', '20% OFF', 'Heavy Duty', 'Energy Efficient'].map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    className="quickTagChip"
                                    onClick={() => setProductForm({ ...productForm, badge: tag })}
                                  >
                                    + {tag}
                                  </button>
                                ))}
                                {productForm.badge && (
                                  <button
                                    type="button"
                                    className="quickTagChip clear"
                                    onClick={() => setProductForm({ ...productForm, badge: '' })}
                                  >
                                    Clear Badge
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="infoCalloutBox">
                            <Package size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                            <div>
                              <strong>Catalog Organization Tip:</strong>
                              <p>Products are indexed under the selected category for instant filtering in both admin reports and customer navigation.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: PRICING & STOCK */}
                      {productEditActiveTab === 'pricing' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>Pricing & Inventory Control</h4>
                              <p>Set selling price, original MRP, warehouse stock quantities, and low stock threshold alerts</p>
                            </div>
                          </div>

                          <div className="formGrid">
                            <div className="formGroup">
                              <label>Selling Price (₹) <span className="reqStar">*</span></label>
                              <div className="inputWithPrefix">
                                <span className="inputPrefix">₹</span>
                                <input 
                                  required 
                                  type="number" 
                                  min="0" 
                                  value={productForm.price} 
                                  onChange={e => setProductForm({...productForm, price: e.target.value})} 
                                  placeholder="349000" 
                                />
                              </div>
                            </div>

                            <div className="formGroup">
                              <label>Original / MRP Price (₹)</label>
                              <div className="inputWithPrefix">
                                <span className="inputPrefix">₹</span>
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={productForm.originalPrice} 
                                  onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} 
                                  placeholder="389000" 
                                />
                              </div>
                            </div>

                            {/* Pricing Insights Card */}
                            <div className="formGroup fullWidth">
                              <div className="pricingInsightBanner">
                                {pricingInsights ? (
                                  <div className="insightContent">
                                    <div className="discountTag">
                                      <Percent size={14} /> {pricingInsights.discountPct}% DISCOUNT
                                    </div>
                                    <span className="savingText">
                                      Customer saves <strong>₹{pricingInsights.savings.toLocaleString('en-IN')}</strong> compared to MRP
                                    </span>
                                  </div>
                                ) : (
                                  <div className="insightContent regular">
                                    <Tag size={15} style={{ color: '#64748b' }} />
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                      {productForm.originalPrice && Number(productForm.originalPrice) <= Number(productForm.price)
                                        ? 'MRP is equal to or less than selling price. No discount banner will show.'
                                        : 'Enter an Original MRP higher than the Selling Price to display a discount badge to customers.'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="formGroup">
                              <label>Stock Quantity (Units) <span className="reqStar">*</span></label>
                              <div className="stockInputWithButtons">
                                <button
                                  type="button"
                                  className="stockStepBtn"
                                  onClick={() => setProductForm(prev => ({ ...prev, stock: Math.max(0, (Number(prev.stock) || 0) - 1) }))}
                                >
                                  <Minus size={14} />
                                </button>
                                <input 
                                  required 
                                  type="number" 
                                  min="0" 
                                  value={productForm.stock} 
                                  onChange={e => setProductForm({...productForm, stock: e.target.value})} 
                                  placeholder="50" 
                                />
                                <button
                                  type="button"
                                  className="stockStepBtn"
                                  onClick={() => setProductForm(prev => ({ ...prev, stock: (Number(prev.stock) || 0) + 1 }))}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="formGroup">
                              <label>Low Stock Alert Threshold</label>
                              <input 
                                type="number" 
                                min="1" 
                                value={productForm.lowStockThreshold} 
                                onChange={e => setProductForm({...productForm, lowStockThreshold: e.target.value})} 
                                placeholder="10" 
                              />
                            </div>

                            <div className="formGroup fullWidth">
                              <div className={`stockStatusPreviewBox ${stockStatusTag.class}`}>
                                <StatusIcon size={18} />
                                <div className="stockStatusInfo">
                                  <strong>Current Status: {stockStatusTag.text}</strong>
                                  <span>
                                    {currentStockNum === 0 
                                      ? 'Item will show as Out of Stock and cannot be added to customer carts.' 
                                      : currentStockNum <= lowStockThresh 
                                        ? `Item is in Low Stock zone (≤${lowStockThresh} units). Consider reordering.` 
                                        : `Item has sufficient inventory (${currentStockNum} available units).`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 3: IMAGES & MEDIA */}
                      {productEditActiveTab === 'media' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>Product Images & Gallery</h4>
                              <p>Manage primary cover image and supplementary gallery product photos</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddImageField}
                              className="addSpecBtn"
                            >
                              <Plus size={14} /> Add Image URL
                            </button>
                          </div>

                          {/* Cover Image Feature Card */}
                          <div className="coverImageFeatureCard">
                            <div className="coverPreviewWrapper">
                              <img 
                                src={Array.isArray(productForm.images) && productForm.images[0] ? productForm.images[0] : (productForm.image || '/10kglggiantwasher.png')} 
                                alt="Cover Preview" 
                                className="coverPreviewImg"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/160?text=No+Image'; }}
                              />
                              <span className="primaryCoverBadge">Primary Cover</span>
                            </div>
                            <div className="coverInputWrapper">
                              <label>Cover Photo URL <span className="reqStar">*</span></label>
                              <input
                                required
                                type="text"
                                value={Array.isArray(productForm.images) && productForm.images[0] !== undefined ? productForm.images[0] : (productForm.image || '')}
                                onChange={(e) => handleImageFieldChange(0, e.target.value)}
                                placeholder="e.g. /10kglggiantwasher.png or https://images.unsplash.com/..."
                              />
                              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                                This image appears on catalog lists, search results, and as the main display photo.
                              </p>
                            </div>
                          </div>

                          {/* Additional Gallery URLs */}
                          <div className="gallerySection">
                            <label style={{ fontSize: '13px', fontWeight: '700', color: '#0f2b5c', marginBottom: '8px', display: 'block' }}>
                              Gallery Photos ({(Array.isArray(productForm.images) ? productForm.images.length : 1) - 1} additional)
                            </label>

                            <div className="galleryRowsList">
                              {(Array.isArray(productForm.images) && productForm.images.length > 1) ? (
                                productForm.images.slice(1).map((imgUrl, sliceIdx) => {
                                  const realIdx = sliceIdx + 1;
                                  return (
                                    <div key={realIdx} className="galleryRowCard">
                                      <span className="galleryIndexBadge">#{realIdx + 1}</span>
                                      {imgUrl ? (
                                        <img 
                                          src={imgUrl} 
                                          alt={`Gallery ${realIdx + 1}`} 
                                          className="galleryRowThumb"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      ) : (
                                        <div className="galleryThumbPlaceholder"><ImageIcon size={16} /></div>
                                      )}
                                      <input
                                        type="text"
                                        value={imgUrl}
                                        onChange={(e) => handleImageFieldChange(realIdx, e.target.value)}
                                        placeholder="https://... or /image-name.png"
                                        className="galleryUrlInput"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImageField(realIdx)}
                                        className="removeSpecBtn"
                                        title="Remove this image"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="emptyGalleryPrompt">
                                  <ImageIcon size={24} style={{ color: '#94a3b8' }} />
                                  <p>No additional gallery images added. Click "Add Image URL" above to add more angles.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: DESCRIPTION */}
                      {productEditActiveTab === 'description' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>Product Description & Features</h4>
                              <p>Format rich product overview, key features, and commercial benefits</p>
                            </div>
                            <span className="descHelpBadge">
                              <HelpCircle size={12} /> Markdown Enabled
                            </span>
                          </div>

                          <div className="descriptionEditorGroup">
                            {/* Rich Text Toolbar */}
                            <div className="descToolbar">
                              <div className="descToolbarGroup">
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('bold')}
                                  title="Bold Text (**text**)"
                                >
                                  <Bold size={14} /> <span>Bold</span>
                                </button>
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('bullet')}
                                  title="Add Bullet Point (• item)"
                                >
                                  <List size={14} /> <span>Bullet</span>
                                </button>
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('heading')}
                                  title="Add Subheading (### Title)"
                                >
                                  <Heading size={14} /> <span>Heading</span>
                                </button>
                              </div>

                              <div className="descToolbarDivider" />

                              <div className="descToolbarGroup">
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('align-left')}
                                  title="Left Align"
                                >
                                  <AlignLeft size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('align-center')}
                                  title="Center Align"
                                >
                                  <AlignCenter size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="descToolBtn"
                                  onClick={() => applyTextFormat('align-right')}
                                  title="Right Align"
                                >
                                  <AlignRight size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Enlarged Description Textarea */}
                            <textarea
                              ref={descTextareaRef}
                              rows="12"
                              className="expandedDescTextarea"
                              value={productForm.description || ''}
                              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                              placeholder={`Enter detailed description, features, and technical points:\n\n• High-efficiency inverter direct drive motor\n• **Energy Saving:** Up to 40% water & power reduction\n• Heavy-duty commercial stainless steel construction\n\nUse the toolbar above to apply Bold, Bullet Points, or Alignments.`}
                            />

                            <div className="descFooterMeta">
                              <span>
                                {(productForm.description || '').length} characters | {(productForm.description || '').split('\n').filter(Boolean).length} lines
                              </span>
                              <span className="descQuickTips">
                                Tip: Highlight text and click <strong>Bold</strong>, <strong>Bullet</strong>, or alignment.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 5: TECHNICAL SPECIFICATIONS */}
                      {productEditActiveTab === 'specs' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>Technical Specifications</h4>
                              <p>Define structured machine parameters (e.g. Capacity, Voltage, Loading Type)</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setShowRawSpecsBox(prev => !prev)}
                                className="autoFetchSpecsBtn"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 14px',
                                  background: showRawSpecsBox ? '#0284c7' : '#f0f9ff',
                                  color: showRawSpecsBox ? '#ffffff' : '#0369a1',
                                  border: '1.5px solid #7dd3fc',
                                  borderRadius: '8px',
                                  fontSize: '12.5px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: showRawSpecsBox ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                                }}
                                title="Paste features or specifications text to auto-fetch details"
                              >
                                <Sparkles size={14} /> {showRawSpecsBox ? 'Hide Paste Box' : 'Auto-Fetch / Paste Specs'}
                              </button>
                              <button
                                type="button"
                                onClick={handleAddSpecRow}
                                className="addSpecBtn"
                              >
                                <Plus size={14} /> Add Spec Field
                              </button>
                            </div>
                          </div>

                          {/* SMART AUTO-FETCH PASTE BOX */}
                          {showRawSpecsBox && (
                            <div className="rawSpecsPasteCard fade-in">
                              <div className="rawSpecsHeader">
                                <div className="rawSpecsHeaderTitle">
                                  <Sparkles size={16} style={{ color: '#0284c7' }} />
                                  <strong>Smart Technical Specifications Auto-Fetcher</strong>
                                </div>
                                <span className="rawSpecsHint">Paste machine features, HSN codes, or specifications text to automatically extract fields</span>
                              </div>
                              <textarea
                                rows="8"
                                className="rawSpecsTextarea"
                                value={rawSpecsInput}
                                onChange={e => setRawSpecsInput(e.target.value)}
                                placeholder={`Paste features or specifications here, e.g.:\nHSN Code: 84501100\nCapacity: 10 Kg\nCategory: SoftMount\nDetailed Key Features:\nDirect Drive Motor: Minimizes belt wear and noise while maximizing reliability and drum control.\nGyro Balancing System: Real-time vibration sensors adjust drum rotation to ensure smooth, quiet operation.\nMultiheat Treatment: Provides higher wash temperatures to effectively dissolve stubborn stains.\nAuto Dosing System: Automatically measures and injects precise amounts of detergent.`}
                              />
                              <div className="rawSpecsActions">
                                <div className="rawSpecsStats">
                                  {rawSpecsInput.trim() ? (
                                    <span className="parsedCountBadge">
                                      ✓ {parseRawSpecsText(rawSpecsInput).length} parameters detected
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Ready to paste & extract</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="applyAppendBtn"
                                    onClick={() => handleParseAndApplySpecs('append')}
                                    disabled={!rawSpecsInput.trim()}
                                  >
                                    + Append to Existing
                                  </button>
                                  <button
                                    type="button"
                                    className="applyReplaceBtn"
                                    onClick={() => handleParseAndApplySpecs('replace')}
                                    disabled={!rawSpecsInput.trim()}
                                  >
                                    <Check size={14} /> Auto-Fetch & Apply Specs
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Presets */}
                          <div className="presetChipsContainer">
                            <span className="presetChipsLabel">Quick Presets:</span>
                            {COMMON_SPEC_KEYS.map(preset => (
                              <button
                                key={preset}
                                type="button"
                                className="presetChip"
                                onClick={() => handleAddPresetSpec(preset)}
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>

                          {/* Dynamic Key-Value Rows */}
                          <div className="specRowsContainer">
                            {(productForm.specRows || []).map((row, idx) => (
                              <div key={idx} className="specRowInputGroup">
                                <input
                                  type="text"
                                  value={row.key || ''}
                                  onChange={(e) => handleSpecRowChange(idx, 'key', e.target.value)}
                                  placeholder="Spec Parameter (e.g. Capacity)"
                                  className="specKeyInput"
                                />
                                <input
                                  type="text"
                                  value={row.value || ''}
                                  onChange={(e) => handleSpecRowChange(idx, 'value', e.target.value)}
                                  placeholder="Spec Value (e.g. 15 Kg Commercial)"
                                  className="specValueInput"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpecRow(idx)}
                                  className="removeSpecBtn"
                                  title="Remove specification field"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}

                            {(!productForm.specRows || productForm.specRows.length === 0) && (
                              <div className="emptyGalleryPrompt">
                                <Sliders size={22} style={{ color: '#94a3b8' }} />
                                <p>No specifications added. Click "Add Spec Field" or use quick presets above.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 6: LIVE STORE PREVIEW */}
                      {productEditActiveTab === 'preview' && (
                        <div className="editTabPane fade-in">
                          <div className="tabSectionHeader">
                            <div>
                              <h4>Storefront Live Preview</h4>
                              <p>Real-time rendering of how customers will see this product on the store catalog</p>
                            </div>
                            <span className="livePreviewBadge">
                              <Eye size={13} /> Interactive Preview
                            </span>
                          </div>

                          <div className="storeLivePreviewCard">
                            <div className="previewImageCol">
                              <img 
                                src={Array.isArray(productForm.images) && productForm.images[0] ? productForm.images[0] : (productForm.image || '/10kglggiantwasher.png')} 
                                alt={productForm.name || 'Product'} 
                                className="previewProductImg"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/260?text=Kleider+Care'; }}
                              />
                              {productForm.badge && (
                                <span className="previewBadgeTag">{productForm.badge}</span>
                              )}
                            </div>

                            <div className="previewDetailsCol">
                              <div className="previewCatRow">
                                <span className="previewCatTag">{productForm.category || 'Commercial Equipment'}</span>
                                <code className="previewSkuTag">{productForm.sku || 'SKU-SAMPLE'}</code>
                              </div>

                              <h3 className="previewTitle">{productForm.name || 'Untitled Product Name'}</h3>

                              <div className="previewPriceRow">
                                <span className="previewCurrentPrice">
                                  ₹{Number(productForm.price || 0).toLocaleString('en-IN')}
                                </span>
                                {productForm.originalPrice && Number(productForm.originalPrice) > Number(productForm.price) && (
                                  <span className="previewOrigPrice">
                                    ₹{Number(productForm.originalPrice).toLocaleString('en-IN')}
                                  </span>
                                )}
                                {pricingInsights && (
                                  <span className="previewDiscountBadge">
                                    {pricingInsights.discountPct}% OFF
                                  </span>
                                )}
                              </div>

                              <div className="previewStockRow">
                                <span className={`stockStatusPill ${stockStatusTag.class}`}>
                                  <StatusIcon size={13} />
                                  {stockStatusTag.text} ({productForm.stock || 0} units)
                                </span>
                              </div>

                              {/* Preview Specifications */}
                              {productForm.specRows && productForm.specRows.some(r => r.key?.trim()) && (
                                <div className="previewSpecsSection">
                                  <strong>Key Specifications:</strong>
                                  <div className="previewSpecsChips">
                                    {productForm.specRows.filter(r => r.key?.trim()).slice(0, 4).map((r, i) => (
                                      <span key={i} className="previewSpecChip">
                                        <strong>{r.key}:</strong> {r.value || '-'}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Preview Description Snippet */}
                              {productForm.description && (
                                <div className="previewDescSnippet">
                                  <p>{productForm.description.slice(0, 180)}{productForm.description.length > 180 ? '...' : ''}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM STICKY ACTION BAR */}
                    <div className="editorBottomBar">
                      <div className="footerLeftGroup">
                        <button type="button" className="editorCancelBtn" onClick={() => setIsProductModalOpen(false)}>
                          Discard Changes
                        </button>
                        {productEditActiveTab !== 'preview' && (
                          <button 
                            type="button" 
                            className="previewShortcutBtn"
                            onClick={() => setProductEditActiveTab('preview')}
                          >
                            <Eye size={14} /> Quick Preview
                          </button>
                        )}
                      </div>

                      <div className="footerRightGroup">
                        {tabIdx > 0 && (
                          <button
                            type="button"
                            className="stepNavBtn prev"
                            onClick={() => setProductEditActiveTab(modalTabs[tabIdx - 1].id)}
                          >
                            <ArrowLeft size={15} /> Previous Step
                          </button>
                        )}

                        {tabIdx < modalTabs.length - 1 && (
                          <button
                            type="button"
                            className="stepNavBtn next"
                            onClick={() => setProductEditActiveTab(modalTabs[tabIdx + 1].id)}
                          >
                            Next Step <ArrowRight size={15} />
                          </button>
                        )}

                        <button type="submit" className="saveBtn">
                          <Check size={16} /> Save Product & Inventory
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              );
            })() : (
              <div className="tabPane fade-in">
                <div className="paneHeader">
                  <div>
                    <h3>Product Inventory & Stock Management</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                      Manage store catalog, track real-time stock levels, update prices, and process inventory operations
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="cleanDuplicatesBtn"
                      onClick={handleCleanupDuplicates}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 15px',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Scan database and remove any duplicate product records"
                    >
                      <Sparkles size={16} style={{ color: '#0284c7' }} /> Clean Duplicate Products
                    </button>
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
                        <th>Product ID</th>
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
                          <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                            No products found matching your inventory filters.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product, pIdx) => {
                          const prodId = product.productId || product.id || product._id || `PROD-${pIdx}`;
                          const stock = getProductStock(product);
                          const status = getStockStatus(product);
                          const isSelected = selectedProductIds.includes(product.id) || (product._id && selectedProductIds.includes(product._id));

                          return (
                            <tr key={prodId} className={isSelected ? 'selectedRow' : ''}>
                              <td>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectProduct(product.id || product._id || prodId)}
                                />
                              </td>
                              <td>
                                <div className="productCell">
                                  <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} />
                                  <div className="productTitleMeta">
                                    <strong>{product.name}</strong>
                                    {product.badge && <span className="invBadgeTag">{product.badge}</span>}
                                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                                      <div className="specPreviewList">
                                        {Object.entries(product.specifications).slice(0, 3).map(([k, v], sIdx) => (
                                          <span key={`${prodId}-${k}-${sIdx}`} className="specPreviewChip">
                                            <strong>{k}:</strong> {v}
                                          </span>
                                        ))}
                                        {Object.keys(product.specifications).length > 3 && (
                                          <span className="specPreviewChip count">+{Object.keys(product.specifications).length - 3} specs</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="productIdBadgeTag" title={`Product ID: ${prodId}`}>
                                  <Hash size={11} /> {prodId}
                                </span>
                              </td>
                              <td>
                                <code className="skuTag">{product.sku || `SKU-${prodId}`}</code>
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
                                  <button className="iconBtn specs" title="Edit Technical Specifications" onClick={() => openSpecsModal(product)}>
                                    <Sliders size={16} />
                                  </button>
                                  <button className="iconBtn edit" title="Edit Product Details" onClick={() => openProductModal(product)}>
                                    <Edit size={16} />
                                  </button>
                                  <button className="iconBtn delete" title="Delete Product" onClick={() => handleDeleteProduct(product)}>
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
            )
          )}

          {activeTab === 'categories' && (() => {
            const filteredCategories = availableCategories.filter(cat => 
              !catSearchTerm || cat.toLowerCase().includes(catSearchTerm.toLowerCase())
            );

            return (
              <div className="tabPane fade-in">
                <div className="paneHeader">
                  <div>
                    <h3>Product Category Management</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                      Add new commercial product categories or delete existing categories. Changes sync across product creation, filters, and store catalog.
                    </p>
                  </div>
                </div>

                {/* ADD NEW CATEGORY CARD */}
                <div className="categoryAddCard">
                  <div className="categoryAddHeader">
                    <div className="categoryAddIcon"><FolderPlus size={22} /></div>
                    <div>
                      <h4>Add New Product Category</h4>
                      <p>Create a distinct category group to classify washers, dryers, spare parts, chemicals, and equipment</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddCategory} className="categoryAddForm">
                    <div className="categoryFormFields">
                      <div className="categoryFormGroup">
                        <label>Category Name <span className="reqStar">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Industrial Dry Cleaners, Commercial Steamers..."
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                        />
                      </div>
                      <div className="categoryFormGroup wide">
                        <label>Category Description / Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="Brief description for catalog grouping..."
                          value={newCatDesc}
                          onChange={e => setNewCatDesc(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="addCategorySubmitBtn" disabled={isAddingCategory}>
                      <Plus size={16} /> {isAddingCategory ? 'Adding...' : 'Add Category'}
                    </button>
                  </form>
                </div>

                {/* CATEGORIES STATS & SEARCH BAR */}
                <div className="categoryToolbar">
                  <div className="categorySearchBox">
                    <Search size={16} className="searchIcon" />
                    <input 
                      type="text" 
                      placeholder="Search categories..." 
                      value={catSearchTerm}
                      onChange={e => setCatSearchTerm(e.target.value)}
                    />
                    {catSearchTerm && (
                      <button 
                        type="button" 
                        onClick={() => setCatSearchTerm('')}
                        className="clearSearchBtn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <span className="categoryCountBadge">
                    Showing <strong>{filteredCategories.length}</strong> of <strong>{availableCategories.length}</strong> categories
                  </span>
                </div>

                {/* CATEGORY GRID CARDS */}
                <div className="categoryCardsGrid">
                  {filteredCategories.length === 0 ? (
                    <div className="emptyCategoryNotice">
                      <FolderTree size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                      <p>No categories found matching &quot;{catSearchTerm}&quot;.</p>
                    </div>
                  ) : (
                    filteredCategories.map((catName) => {
                      const count = products.filter(p => (p.category || '').toLowerCase() === catName.toLowerCase()).length;
                      const isDbCat = dbCategories.some(c => c.name.toLowerCase() === catName.toLowerCase());
                      const dbItem = dbCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());

                      return (
                        <div key={catName} className="categoryCard">
                          <div className="categoryCardTop">
                            <div className="categoryCardIcon">
                              <FolderTree size={20} />
                            </div>
                            <button
                              type="button"
                              className="categoryDeleteBtn"
                              onClick={() => handleDeleteCategory(catName)}
                              title={`Delete category "${catName}"`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="categoryCardContent">
                            <h4 className="categoryCardTitle">{catName}</h4>
                            {dbItem?.description && (
                              <p className="categoryCardDesc">{dbItem.description}</p>
                            )}
                            <div className="categoryCardMeta">
                              <span className="categoryProductCount">
                                <Package size={13} /> {count} {count === 1 ? 'Product' : 'Products'}
                              </span>
                              {isDbCat ? (
                                <span className="categoryTypeBadge custom">Custom Category</span>
                              ) : (
                                <span className="categoryTypeBadge system">System Category</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

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
                      {filteredOrders.map((order, oIdx) => {
                        const currentStatus = order.status || 'Processing';
                        const normalizedStatus = 
                          currentStatus === 'delivered' ? 'Delivered' : 
                          currentStatus === 'in-transit' ? 'Shipped' : currentStatus;
                        const orderKey = order.id || order._id || `order-${oIdx}`;

                        return (
                          <tr key={orderKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
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

      {/* DEDICATED QUICK TECHNICAL SPECS MODAL */}
      {isSpecsModalOpen && specsEditingProduct && (
        <div className="modalOverlay" onClick={() => setIsSpecsModalOpen(false)}>
          <div className="modalContent inventoryModalContent specsModalContent" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={20} style={{ color: '#0284c7' }} /> Edit Technical Specifications
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Updating technical specs for: <strong>{specsEditingProduct.name}</strong>
                </p>
              </div>
              <button className="closeModalBtn" onClick={() => setIsSpecsModalOpen(false)}>×</button>
            </div>

            <div className="modalBody">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span className="presetChipsLabel" style={{ fontSize: '13px', fontWeight: '700', color: '#0f2b5c' }}>Parameters & Values:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRawSpecsModalBox(prev => !prev)}
                    className="autoFetchSpecsBtn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: showRawSpecsModalBox ? '#0284c7' : '#f0f9ff',
                      color: showRawSpecsModalBox ? '#ffffff' : '#0369a1',
                      border: '1.5px solid #7dd3fc',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: showRawSpecsModalBox ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                    }}
                    title="Paste features or specifications text to auto-fetch details"
                  >
                    <Sparkles size={13} /> {showRawSpecsModalBox ? 'Hide Paste Box' : 'Auto-Fetch / Paste Specs'}
                  </button>
                </div>
              </div>

              {/* SMART AUTO-FETCH PASTE BOX FOR MODAL */}
              {showRawSpecsModalBox && (
                <div className="rawSpecsPasteCard fade-in" style={{ marginBottom: '16px' }}>
                  <div className="rawSpecsHeader">
                    <div className="rawSpecsHeaderTitle">
                      <Sparkles size={15} style={{ color: '#0284c7' }} />
                      <strong>Smart Technical Specifications Auto-Fetcher</strong>
                    </div>
                    <span className="rawSpecsHint">Paste machine features or specifications below</span>
                  </div>
                  <textarea
                    rows="7"
                    className="rawSpecsTextarea"
                    value={rawSpecsModalInput}
                    onChange={e => setRawSpecsModalInput(e.target.value)}
                    placeholder={`Paste features or specifications here, e.g.:\nHSN Code: 84501100\nCapacity: 10 Kg\nCategory: SoftMount\nDetailed Key Features:\nDirect Drive Motor: Minimizes belt wear and noise while maximizing reliability and drum control.\nGyro Balancing System: Real-time vibration sensors adjust drum rotation to ensure smooth, quiet operation.\nMultiheat Treatment: Provides higher wash temperatures to effectively dissolve stubborn stains.\nAuto Dosing System: Automatically measures and injects precise amounts of detergent.`}
                  />
                  <div className="rawSpecsActions">
                    <div className="rawSpecsStats">
                      {rawSpecsModalInput.trim() ? (
                        <span className="parsedCountBadge">
                          ✓ {parseRawSpecsText(rawSpecsModalInput).length} parameters detected
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>Ready to paste & extract</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="applyAppendBtn"
                        onClick={() => handleParseAndApplyModalSpecs('append')}
                        disabled={!rawSpecsModalInput.trim()}
                      >
                        + Append
                      </button>
                      <button
                        type="button"
                        className="applyReplaceBtn"
                        onClick={() => handleParseAndApplyModalSpecs('replace')}
                        disabled={!rawSpecsModalInput.trim()}
                      >
                        <Check size={14} /> Auto-Fetch & Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="presetChipsContainer" style={{ marginBottom: '16px' }}>
                <span className="presetChipsLabel">Quick Presets:</span>
                {COMMON_SPEC_KEYS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className="presetChip"
                    onClick={() => handleAddPresetToSpecsModal(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="specRowsContainer" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {specsModalRows.map((row, idx) => (
                  <div key={idx} className="specRowInputGroup">
                    <input
                      type="text"
                      value={row.key || ''}
                      onChange={(e) => handleSpecsModalRowChange(idx, 'key', e.target.value)}
                      placeholder="Spec Name (e.g. Capacity)"
                      className="specKeyInput"
                    />
                    <input
                      type="text"
                      value={row.value || ''}
                      onChange={(e) => handleSpecsModalRowChange(idx, 'value', e.target.value)}
                      placeholder="Spec Value (e.g. 15 Kg, 220 V)"
                      className="specValueInput"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecsModalRow(idx)}
                      className="removeSpecBtn"
                      title="Delete this spec pair"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {specsModalRows.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    No specifications present. Click "Add New Specification Parameter" below.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddSpecsModalRow}
                className="addSpecBtn"
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
              >
                <Plus size={15} /> Add New Specification Parameter
              </button>
            </div>

            <div className="modalFooter">
              <button type="button" className="cancelBtn" onClick={() => setIsSpecsModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="saveBtn"
                onClick={handleSaveSpecsModal}
                disabled={specsSaving}
              >
                {specsSaving ? 'Saving Specifications...' : 'Save Technical Specifications'}
              </button>
            </div>
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
