import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  Sparkles,
  CreditCard,
  Truck,
  HeartHandshake,
  CheckSquare,
  Receipt,
  BarChart3,
  Bell,
  ShieldCheck,
  History,
  Sliders,
  Search,
  Plus,
  Filter,
  Download,
  Printer,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  TrendingUp,
  RefreshCw,
  LogOut,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Send,
  UserPlus,
  Eye,
  Menu,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldAlert,
  Building2,
  Store,
  Check,
  Percent,
  FileText
} from 'lucide-react';
import QuotesManagement from '../components/QuotesManagement';
import {
  erpGetMe,
  erpLogout,
  erpGetDashboardMetrics,
  erpGetEmployees,
  erpCreateEmployee,
  erpUpdateEmployee,
  erpDeleteEmployee,
  erpGetRolesPermissions,
  erpGetCustomers,
  erpGetCustomerById,
  erpCreateCustomer,
  erpUpdateCustomer,
  erpGetCrmFollowUps,
  erpCreateCrmFollowUp,
  erpUpdateCrmFollowUp,
  erpSendRetentionMessage,
  erpGetOrders,
  erpCreateOrder,
  erpUpdateOrderStatus,
  erpGetProducts,
  erpCreateProduct,
  erpUpdateProduct,
  erpGetPayments,
  erpRecordPayment,
  erpProcessRefund,
  erpGetDeliveries,
  erpCreateDelivery,
  erpAssignDelivery,
  erpUpdateDeliveryStatus,
  erpGetTasks,
  erpCreateTask,
  erpUpdateTask,
  erpDeleteTask,
  erpGetExpenses,
  erpCreateExpense,
  erpApproveExpense,
  erpGetReports,
  erpGetAuditLogs,
  erpGetNotifications,
  erpMarkNotificationsRead,
  erpGetBranches,
  erpCreateBranch,
  erpGlobalSearch,
  erpUpdateProfile
} from '../services/erpService';
import './ErpPortal.css';

export default function ErpPortal() {
  const navigate = useNavigate();

  // Navigation Dropdowns & Search State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openNavDropdown, setOpenNavDropdown] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const navDropdownRef = useRef(null);

  // Close nav dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setOpenNavDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current Employee Session & RBAC
  const [employee, setEmployee] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('Main Branch - Mumbai');

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Global Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Module Data States
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [crmFollowUps, setCrmFollowUps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rolesData, setRolesData] = useState(null);

  // UI Modals & Drawers
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAddCustomerModal, setIsAddCustomerModal] = useState(false);
  const [isAddOrderModal, setIsAddOrderModal] = useState(false);
  const [isAddProductModal, setIsAddProductModal] = useState(false);
  const [isRecordPaymentModal, setIsRecordPaymentModal] = useState(false);
  const [isRefundModal, setIsRefundModal] = useState(false);
  const [isAssignDeliveryModal, setIsAssignDeliveryModal] = useState(false);
  const [isAddFollowUpModal, setIsAddFollowUpModal] = useState(false);
  const [isRetentionModal, setIsRetentionModal] = useState(false);
  const [isAddTaskModal, setIsAddTaskModal] = useState(false);
  const [isAddExpenseModal, setIsAddExpenseModal] = useState(false);
  const [isAddEmployeeModal, setIsAddEmployeeModal] = useState(false);
  const [isEditEmployeeModal, setIsEditEmployeeModal] = useState(false);
  const [selectedEmployeeToEdit, setSelectedEmployeeToEdit] = useState(null);
  const [isProfileModal, setIsProfileModal] = useState(false);
  const [isInvoicePreviewModal, setIsInvoicePreviewModal] = useState(false);
  const [statusUpdateRemark, setStatusUpdateRemark] = useState('');
  const [activeCustomerSegment, setActiveCustomerSegment] = useState('All');

  // Search & Filter Inputs per module
  const [customerFilterSearch, setCustomerFilterSearch] = useState('');
  const [customerFilterType, setCustomerFilterType] = useState('All');
  const [orderFilterSearch, setOrderFilterSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');
  const [paymentFilterMethod, setPaymentFilterMethod] = useState('All');
  const [deliveryFilterStatus, setDeliveryFilterStatus] = useState('All');
  const [taskFilterStatus, setTaskFilterStatus] = useState('All');
  const [expenseFilterCat, setExpenseFilterCat] = useState('All');
  const [auditFilterModule, setAuditFilterModule] = useState('All');

  // Load Session & Initial Data
  useEffect(() => {
    const initSession = async () => {
      try {
        let currentEmp = null;
        try {
          const meRes = await erpGetMe();
          if (meRes && meRes.employee) {
            currentEmp = meRes.employee;
          }
        } catch (e) {
          console.warn('Backend session fetch notice, checking local session:', e.message);
        }

        if (!currentEmp) {
          const stored = localStorage.getItem('kc_erp_employee') || localStorage.getItem('kc_employee_session');
          if (stored) {
            try {
              currentEmp = JSON.parse(stored);
              if (!currentEmp.role) currentEmp.role = 'SUPER_ADMIN';
              if (!currentEmp.name) currentEmp.name = `${currentEmp.firstName || 'Kleider Care'} ${currentEmp.lastName || 'Staff'}`.trim();
            } catch (err) {}
          }
        }

        if (currentEmp) {
          setEmployee(currentEmp);
        } else {
          navigate('/employee/login', { replace: true });
          return;
        }

        try {
          const [branchRes, notifRes, rolesRes] = await Promise.all([
            erpGetBranches().catch(() => null),
            erpGetNotifications().catch(() => null),
            erpGetRolesPermissions().catch(() => null)
          ]);

          if (branchRes?.branches) setBranches(branchRes.branches);
          if (notifRes?.notifications) {
            setNotifications(notifRes.notifications);
            setUnreadNotificationsCount(notifRes.unreadCount || 0);
          }
          if (rolesRes) setRolesData(rolesRes);
        } catch (subErr) {
          console.warn('Notice loading secondary ERP master data:', subErr.message);
        }
      } catch (err) {
        console.error('Session init error:', err);
        navigate('/employee/login', { replace: true });
      } finally {
        setLoadingSession(false);
      }
    };
    initSession();
  }, [navigate]);

  // Fetch Module Data on Tab Change
  const refreshActiveTab = async (tabToLoad = activeTab) => {
    try {
      if (tabToLoad === 'dashboard') {
        const res = await erpGetDashboardMetrics();
        if (res?.metrics) setDashboardMetrics(res.metrics);
      } else if (tabToLoad === 'customers') {
        const res = await erpGetCustomers({ search: customerFilterSearch, customerType: customerFilterType });
        if (res?.customers) setCustomers(res.customers);
      } else if (tabToLoad === 'orders') {
        const res = await erpGetOrders({ search: orderFilterSearch, status: orderFilterStatus });
        if (res?.orders) setOrders(res.orders);
      } else if (tabToLoad === 'products') {
        const res = await erpGetProducts();
        if (res?.products) setProducts(res.products);
      } else if (tabToLoad === 'payments') {
        const res = await erpGetPayments({ method: paymentFilterMethod });
        if (res?.payments) setPayments(res.payments);
      } else if (tabToLoad === 'deliveries') {
        const res = await erpGetDeliveries({ status: deliveryFilterStatus });
        if (res?.deliveries) setDeliveries(res.deliveries);
      } else if (tabToLoad === 'crm') {
        const [followUpRes, custRes] = await Promise.all([
          erpGetCrmFollowUps(),
          erpGetCustomers()
        ]);
        if (followUpRes?.followUps) setCrmFollowUps(followUpRes.followUps);
        if (custRes?.customers) setCustomers(custRes.customers);
      } else if (tabToLoad === 'tasks') {
        const res = await erpGetTasks({ status: taskFilterStatus });
        if (res?.tasks) setTasks(res.tasks);
      } else if (tabToLoad === 'expenses') {
        const res = await erpGetExpenses({ category: expenseFilterCat });
        if (res?.expenses) setExpenses(res.expenses);
      } else if (tabToLoad === 'reports') {
        const res = await erpGetReports();
        if (res?.reports) setReportsData(res.reports);
      } else if (tabToLoad === 'notifications') {
        const res = await erpGetNotifications();
        if (res?.notifications) {
          setNotifications(res.notifications);
          setUnreadNotificationsCount(res.unreadCount || 0);
        }
      } else if (tabToLoad === 'employees') {
        const res = await erpGetEmployees();
        if (res?.employees) setEmployeesList(res.employees);
      } else if (tabToLoad === 'audit') {
        const res = await erpGetAuditLogs({ module: auditFilterModule });
        if (res?.logs) setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error(`Error loading data for ${tabToLoad}:`, err);
    }
  };

  useEffect(() => {
    if (employee) {
      refreshActiveTab(activeTab);
    }
  }, [activeTab, employee, customerFilterSearch, customerFilterType, orderFilterSearch, orderFilterStatus, paymentFilterMethod, deliveryFilterStatus, taskFilterStatus, expenseFilterCat, auditFilterModule]);

  // Global Search Handler
  const handleGlobalSearch = async (val) => {
    setGlobalSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    try {
      const data = await erpGlobalSearch(val);
      if (data && data.results) {
        setSearchResults(data.results);
        setShowSearchDropdown(true);
      }
    } catch (err) {
      console.error('Global search error:', err);
    }
  };

  const handleLogout = () => {
    erpLogout();
    navigate('/employee/login', { replace: true });
  };

  // RBAC Permission Check Helper
  const can = (permission) => {
    if (!employee) return false;
    const role = employee.role || '';
    if (role === 'SUPER_ADMIN' || role === 'OWNER' || role === 'ADMIN') return true;
    if (Array.isArray(employee.effectivePermissions)) {
      return employee.effectivePermissions.includes(permission);
    }
    return false;
  };

  // CSV Export utility
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...data.map(item => keys.map(k => `"${String(item[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingSession) {
    return (
      <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', gap: '12px', fontSize: '16px', fontWeight: 600 }}>
        <RefreshCw size={24} className="erp-spin" color="#1d4ed8" />
        <span>Initializing Workspace...</span>
      </div>
    );
  }

  // Determine active dropdown parent for styling
  const isOperationsActive = ['dashboard', 'orders', 'quotes', 'customers', 'deliveries', 'payments'].includes(activeTab);
  const isCatalogueActive = ['products'].includes(activeTab);
  const isGrowthActive = ['crm', 'tasks', 'expenses'].includes(activeTab);
  const isAnalyticsActive = ['reports', 'audit'].includes(activeTab);
  const isSystemActive = ['notifications', 'employees', 'settings'].includes(activeTab);

  const toggleDropdown = (name) => {
    setOpenNavDropdown(prev => prev === name ? null : name);
  };

  const selectTab = (tabKey) => {
    setActiveTab(tabKey);
    setOpenNavDropdown(null);
  };

  return (
    <div className="erp-root erp-top-nav-layout">
      {/* ───────────────────────────────────────────────────────────
          TOP NAVBAR WITH CATEGORY DROPDOWNS:
          LOGO
            ↓
          Operations ▼ | Catalogue ▼ | Growth ▼ | Analytics ▼ | System ▼       🔍 🔔 👤
          ─────────────────────────────────────────────────────────── */}
      <header className="erp-main-navbar" ref={navDropdownRef}>
        {/* 1. Left: LOGO */}
        <div className="erp-nav-left">
          <Link to="/employee/portal" className="erp-brand-logo">
            <div className="erp-logo-icon">
              <ShieldCheck size={22} />
            </div>
            <div className="erp-brand-text">
              <span className="erp-brand-name">Kleider Care</span>
            </div>
          </Link>
        </div>

        {/* 2. Center: CATEGORY DROPDOWNS */}
        <nav className="erp-dropdown-nav">
          {/* Operations Dropdown */}
          <div className="erp-dropdown-container">
            <button
              type="button"
              className={`erp-dropdown-trigger ${isOperationsActive ? 'active' : ''} ${openNavDropdown === 'operations' ? 'open' : ''}`}
              onClick={() => toggleDropdown('operations')}
            >
              <LayoutDashboard size={16} />
              <span>Operations</span>
              {dashboardMetrics?.pendingOrders > 0 && (
                <span className="erp-nav-dot" />
              )}
              <ChevronDown size={14} className={`erp-chevron ${openNavDropdown === 'operations' ? 'rotated' : ''}`} />
            </button>

            {openNavDropdown === 'operations' && (
              <div className="erp-nav-dropdown-menu">
                <div className="erp-dropdown-header">Sales & Fulfillment</div>
                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => selectTab('dashboard')}
                >
                  <LayoutDashboard size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Dashboard</span>
                    <span className="erp-dd-desc">Command center overview</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => selectTab('orders')}
                >
                  <ShoppingBag size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Orders & Status</span>
                    <span className="erp-dd-desc">Fulfillment pipeline</span>
                  </div>
                  {dashboardMetrics?.pendingOrders > 0 && (
                    <span className="erp-nav-badge">{dashboardMetrics.pendingOrders}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'quotes' ? 'active' : ''}`}
                  onClick={() => selectTab('quotes')}
                >
                  <FileText size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Quotes & Proposals</span>
                    <span className="erp-dd-desc">Manage quotes & conversions</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'customers' ? 'active' : ''}`}
                  onClick={() => selectTab('customers')}
                >
                  <Users size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Customers (360)</span>
                    <span className="erp-dd-desc">Customer profiles & history</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'deliveries' ? 'active' : ''}`}
                  onClick={() => selectTab('deliveries')}
                >
                  <Truck size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Delivery & Dispatch</span>
                    <span className="erp-dd-desc">Fleet routing & logistics</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'payments' ? 'active' : ''}`}
                  onClick={() => selectTab('payments')}
                >
                  <CreditCard size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Payments & Ledger</span>
                    <span className="erp-dd-desc">Transactions & invoices</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="erp-nav-pipe">|</span>

          {/* Catalogue Dropdown */}
          <div className="erp-dropdown-container">
            <button
              type="button"
              className={`erp-dropdown-trigger ${isCatalogueActive ? 'active' : ''} ${openNavDropdown === 'catalogue' ? 'open' : ''}`}
              onClick={() => toggleDropdown('catalogue')}
            >
              <Package size={16} />
              <span>Catalogue</span>
              <ChevronDown size={14} className={`erp-chevron ${openNavDropdown === 'catalogue' ? 'rotated' : ''}`} />
            </button>

            {openNavDropdown === 'catalogue' && (
              <div className="erp-nav-dropdown-menu">
                <div className="erp-dropdown-header">Inventory & Stock</div>
                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'products' ? 'active' : ''}`}
                  onClick={() => selectTab('products')}
                >
                  <Package size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Products & Stock</span>
                    <span className="erp-dd-desc">Machine packages & detergents</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="erp-nav-pipe">|</span>

          {/* Growth Dropdown */}
          <div className="erp-dropdown-container">
            <button
              type="button"
              className={`erp-dropdown-trigger ${isGrowthActive ? 'active' : ''} ${openNavDropdown === 'growth' ? 'open' : ''}`}
              onClick={() => toggleDropdown('growth')}
            >
              <HeartHandshake size={16} />
              <span>Growth</span>
              <ChevronDown size={14} className={`erp-chevron ${openNavDropdown === 'growth' ? 'rotated' : ''}`} />
            </button>

            {openNavDropdown === 'growth' && (
              <div className="erp-nav-dropdown-menu">
                <div className="erp-dropdown-header">Customer Retention & Tasks</div>
                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'crm' ? 'active' : ''}`}
                  onClick={() => selectTab('crm')}
                >
                  <HeartHandshake size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">CRM & Retention</span>
                    <span className="erp-dd-desc">Follow-ups & campaigns</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => selectTab('tasks')}
                >
                  <CheckSquare size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Internal Tasks</span>
                    <span className="erp-dd-desc">Staff assignments & todos</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'expenses' ? 'active' : ''}`}
                  onClick={() => selectTab('expenses')}
                >
                  <Receipt size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Expense Tracker</span>
                    <span className="erp-dd-desc">Daily branch expenditures</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="erp-nav-pipe">|</span>

          {/* Analytics Dropdown */}
          <div className="erp-dropdown-container">
            <button
              type="button"
              className={`erp-dropdown-trigger ${isAnalyticsActive ? 'active' : ''} ${openNavDropdown === 'analytics' ? 'open' : ''}`}
              onClick={() => toggleDropdown('analytics')}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
              <ChevronDown size={14} className={`erp-chevron ${openNavDropdown === 'analytics' ? 'rotated' : ''}`} />
            </button>

            {openNavDropdown === 'analytics' && (
              <div className="erp-nav-dropdown-menu">
                <div className="erp-dropdown-header">Business Intelligence</div>
                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => selectTab('reports')}
                >
                  <BarChart3 size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Business Reports</span>
                    <span className="erp-dd-desc">Revenue, profits & performance</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => selectTab('audit')}
                >
                  <History size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Audit Trail</span>
                    <span className="erp-dd-desc">Security & system change logs</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <span className="erp-nav-pipe">|</span>

          {/* System Dropdown */}
          <div className="erp-dropdown-container">
            <button
              type="button"
              className={`erp-dropdown-trigger ${isSystemActive ? 'active' : ''} ${openNavDropdown === 'system' ? 'open' : ''}`}
              onClick={() => toggleDropdown('system')}
            >
              <Sliders size={16} />
              <span>System</span>
              {unreadNotificationsCount > 0 && <span className="erp-nav-dot" />}
              <ChevronDown size={14} className={`erp-chevron ${openNavDropdown === 'system' ? 'rotated' : ''}`} />
            </button>

            {openNavDropdown === 'system' && (
              <div className="erp-nav-dropdown-menu">
                <div className="erp-dropdown-header">Administration & Config</div>
                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => selectTab('notifications')}
                >
                  <Bell size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Notifications</span>
                    <span className="erp-dd-desc">System alerts & updates</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <span className="erp-nav-badge">{unreadNotificationsCount}</span>
                  )}
                </button>

                {can('EMPLOYEE_VIEW') && (
                  <button
                    type="button"
                    className={`erp-dropdown-item ${activeTab === 'employees' ? 'active' : ''}`}
                    onClick={() => selectTab('employees')}
                  >
                    <ShieldAlert size={16} />
                    <div className="erp-dd-item-text">
                      <span className="erp-dd-title">Employees & RBAC</span>
                      <span className="erp-dd-desc">Roles, users & permissions</span>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  className={`erp-dropdown-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => selectTab('settings')}
                >
                  <Sliders size={16} />
                  <div className="erp-dd-item-text">
                    <span className="erp-dd-title">Branch & Settings</span>
                    <span className="erp-dd-desc">Store preferences & branches</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* 3. Right: 🔍 🔔 👤 Controls */}
        <div className="erp-nav-right-actions">
          {/* 🔍 Search Toggle Button & Popover */}
          <div className="erp-search-popover-container">
            <button
              type="button"
              className={`erp-nav-action-btn ${isSearchExpanded ? 'active' : ''}`}
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              title="Search (Customers, Orders, Delivery)"
            >
              <Search size={18} />
            </button>

            {isSearchExpanded && (
              <div className="erp-search-flyout" onMouseLeave={() => setShowSearchDropdown(false)}>
                <div className="erp-search-input-wrap">
                  <Search size={16} className="erp-search-icon" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search orders, customers, deliveries..."
                    value={globalSearchQuery}
                    onChange={(e) => handleGlobalSearch(e.target.value)}
                  />
                  <button
                    type="button"
                    className="erp-close-search"
                    onClick={() => { setIsSearchExpanded(false); setSearchResults(null); }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {searchResults && (
                  <div className="erp-search-results-drawer" style={{ position: 'static', marginTop: '8px' }}>
                    {searchResults.orders?.length > 0 && (
                      <>
                        <div className="erp-search-cat-title">Orders</div>
                        {searchResults.orders.map(o => (
                          <div key={o.orderId} className="erp-search-result-row" onClick={() => { setSelectedOrder(o); selectTab('orders'); setIsSearchExpanded(false); }}>
                            <span>📦 <strong>{o.orderId}</strong> - {o.customerName}</span>
                            <span className="erp-badge badge-info">₹{o.totalAmount}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {searchResults.customers?.length > 0 && (
                      <>
                        <div className="erp-search-cat-title">Customers</div>
                        {searchResults.customers.map(c => (
                          <div key={c._id} className="erp-search-result-row" onClick={() => { setSelectedCustomer(c); selectTab('customers'); setIsSearchExpanded(false); }}>
                            <span>👤 {c.firstName} {c.lastName} ({c.mobileNumber})</span>
                            <span className="erp-badge badge-success">{c.customerType || 'Customer'}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {searchResults.deliveries?.length > 0 && (
                      <>
                        <div className="erp-search-cat-title">Deliveries</div>
                        {searchResults.deliveries.map(d => (
                          <div key={d.deliveryId} className="erp-search-result-row" onClick={() => { selectTab('deliveries'); setIsSearchExpanded(false); }}>
                            <span>🚚 <strong>{d.deliveryId}</strong> - {d.customerName}</span>
                            <span className="erp-badge badge-warning">{d.status}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🔔 Notifications Button */}
          <button
            type="button"
            className={`erp-nav-action-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => selectTab('notifications')}
            title="Notifications & Alerts"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && <span className="erp-bell-dot" />}
          </button>

          {/* 👤 Employee Profile Capsule */}
          <div
            className="erp-nav-profile-capsule"
            onClick={() => setIsProfileModal(true)}
            title="User Profile & Settings"
          >
            <div className="erp-emp-avatar">
              {employee?.name ? employee.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="erp-emp-info">
              <span className="erp-emp-name">{employee?.name?.split(' ')[0] || 'Executive'}</span>
              <span className="erp-emp-role-tag">{employee?.role?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            className="erp-logout-btn"
            onClick={handleLogout}
            title="Sign Out of Reach ERP"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────
          FULL-WIDTH MAIN VIEWPORT
          ─────────────────────────────────────────────────────────── */}
      <div className="erp-main-container erp-full-width">

        {/* ───────────────────────────────────────────────────────────
            3. TAB WORKSPACES
            ─────────────────────────────────────────────────────────── */}
        <main className="erp-content-viewport">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>{employee?.role?.replace('_', ' ')} Command Center</h2>
                  <p>Real-time telemetry and operational statistics for {currentBranch}</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(orders, 'Orders_Summary')}>
                    <Download size={15} /> Export Ledger
                  </button>
                  <button type="button" className="erp-primary-btn" onClick={() => setIsAddOrderModal(true)}>
                    <Plus size={16} /> New Counter Order
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="erp-kpi-grid">
                <div className="erp-kpi-card kpi-blue">
                  <div className="erp-kpi-icon-wrap"><ShoppingBag size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Today's Orders</span>
                    <span className="erp-kpi-value">{dashboardMetrics?.todayOrders ?? orders.length}</span>
                    <span className="erp-kpi-sub">Total: {dashboardMetrics?.totalOrders ?? orders.length} lifetime</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-green">
                  <div className="erp-kpi-icon-wrap"><DollarSign size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Today's Revenue</span>
                    <span className="erp-kpi-value">₹{(dashboardMetrics?.todayRevenue ?? 0).toLocaleString('en-IN')}</span>
                    <span className="erp-kpi-sub">Gross: ₹{(dashboardMetrics?.totalRevenue ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-amber">
                  <div className="erp-kpi-icon-wrap"><Clock size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Pending Orders</span>
                    <span className="erp-kpi-value">{dashboardMetrics?.pendingOrders ?? 0}</span>
                    <span className="erp-kpi-sub">Requires staff fulfillment</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-red">
                  <div className="erp-kpi-icon-wrap"><AlertTriangle size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Outstanding Balance</span>
                    <span className="erp-kpi-value">₹{(dashboardMetrics?.outstandingAmount ?? 0).toLocaleString('en-IN')}</span>
                    <span className="erp-kpi-sub">Pending COD / unpaid invoices</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-cyan">
                  <div className="erp-kpi-icon-wrap"><Truck size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Deliveries En Route</span>
                    <span className="erp-kpi-value">{dashboardMetrics?.deliveries?.pending ?? deliveries.filter(d => d.status !== 'DELIVERED').length}</span>
                    <span className="erp-kpi-sub">{dashboardMetrics?.deliveries?.completed ?? 0} successfully delivered</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-purple">
                  <div className="erp-kpi-icon-wrap"><Users size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Total Customers</span>
                    <span className="erp-kpi-value">{dashboardMetrics?.totalCustomers ?? customers.length}</span>
                    <span className="erp-kpi-sub">+{dashboardMetrics?.newCustomersToday ?? 0} registered today</span>
                  </div>
                </div>
              </div>

              {/* Stream of Recent Activity & Quick Lists */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                <div className="erp-card-panel">
                  <div className="erp-panel-header">
                    <div className="erp-panel-title"><ShoppingBag size={18} /> Live E-Commerce Order Stream</div>
                    <button type="button" className="erp-secondary-btn" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  <div className="erp-table-responsive">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardMetrics?.recentOrders || orders).slice(0, 5).map(ord => (
                          <tr key={ord.orderId || ord._id}>
                            <td><strong>{ord.orderId}</strong></td>
                            <td>{ord.customerName}</td>
                            <td>₹{ord.totalAmount?.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`erp-badge ${ord.status === 'DELIVERED' || ord.status === 'COMPLETED' ? 'badge-success' : ord.status === 'CANCELLED' ? 'badge-danger' : 'badge-info'}`}>
                                {ord.status}
                              </span>
                            </td>
                            <td>
                              <button type="button" className="erp-secondary-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { setSelectedOrder(ord); setActiveTab('orders'); }}>
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="erp-card-panel">
                  <div className="erp-panel-header">
                    <div className="erp-panel-title"><CheckSquare size={18} /> My Active Assigned Tasks</div>
                    <button type="button" className="erp-secondary-btn" onClick={() => setActiveTab('tasks')}>All Tasks</button>
                  </div>
                  {dashboardMetrics?.myTasks?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {dashboardMetrics.myTasks.map(tsk => (
                        <div key={tsk._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{tsk.title}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Due: {new Date(tsk.dueDate).toLocaleDateString()} • {tsk.priority} Priority</div>
                          </div>
                          <span className="erp-badge badge-warning">{tsk.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      No pending tasks assigned to you. All clear!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: QUOTATIONS & PROPOSALS */}
          {activeTab === 'quotes' && (
            <QuotesManagement
              employee={employee}
              onConvertSuccess={(target) => {
                if (target === 'Invoice') setActiveTab('payments');
                else if (target === 'Sales Order') setActiveTab('orders');
                else setActiveTab('orders');
              }}
            />
          )}

          {/* TAB 2: CUSTOMERS & 360 PROFILE */}
          {activeTab === 'customers' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Customer Relationship Directory</h2>
                  <p>Manage customer accounts, lifetime order history, outstanding dues & profiles</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(customers, 'Customers_Directory')}>
                    <Download size={15} /> Export CSV
                  </button>
                  {can('CUSTOMER_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAddCustomerModal(true)}>
                      <UserPlus size={16} /> Add New Customer
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-panel-header">
                  <div className="erp-filter-bar">
                    <input
                      type="text"
                      className="erp-search-filter-input"
                      placeholder="Search name, phone, email, company..."
                      value={customerFilterSearch}
                      onChange={(e) => setCustomerFilterSearch(e.target.value)}
                    />
                    <select
                      className="erp-select-filter"
                      value={customerFilterType}
                      onChange={(e) => setCustomerFilterType(e.target.value)}
                    >
                      <option value="All">All Customer Types</option>
                      <option value="VIP">VIP</option>
                      <option value="High-Value">High-Value</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Regular">Regular</option>
                      <option value="New">New</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total: {customers.length} accounts</span>
                </div>

                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Total Orders</th>
                        <th>Total Spent</th>
                        <th>Outstanding</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(c => (
                        <tr key={c._id}>
                          <td><strong>{c.customerId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.email}</div>
                          </td>
                          <td>{c.mobile}</td>
                          <td><strong>{c.totalOrders}</strong></td>
                          <td>₹{(c.totalSpending || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span style={{ color: c.outstanding > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                              ₹{(c.outstanding || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td>
                            <span className={`erp-badge ${c.customerType === 'VIP' ? 'badge-purple' : c.customerType === 'High-Value' ? 'badge-success' : 'badge-info'}`}>
                              {c.customerType}
                            </span>
                          </td>
                          <td>
                            <span className={`erp-badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="erp-secondary-btn"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={async () => {
                                const details = await erpGetCustomerById(c._id);
                                setSelectedCustomer(details || c);
                              }}
                            >
                              <Eye size={13} /> View 360
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER MANAGEMENT & 9-STAGE WORKFLOW */}
          {activeTab === 'orders' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Order Lifecycle & Workflow Management</h2>
                  <p>Manage customer orders across the 9-stage fulfillment cycle with audit history</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(orders, 'Orders_Detailed')}>
                    <Download size={15} /> Export Orders
                  </button>
                  {can('ORDER_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAddOrderModal(true)}>
                      <Plus size={16} /> Create Manual Order
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-panel-header">
                  <div className="erp-filter-bar">
                    <input
                      type="text"
                      className="erp-search-filter-input"
                      placeholder="Search Order #, customer name, mobile..."
                      value={orderFilterSearch}
                      onChange={(e) => setOrderFilterSearch(e.target.value)}
                    />
                    <select
                      className="erp-select-filter"
                      value={orderFilterStatus}
                      onChange={(e) => setOrderFilterStatus(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="READY">READY</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total: {orders.length} orders</span>
                </div>

                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Payment Status</th>
                        <th>Order Status</th>
                        <th>Assigned Staff</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.orderId || o._id}>
                          <td><strong>{o.orderId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{o.customerName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{o.phone}</div>
                          </td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td><strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong></td>
                          <td>
                            <span className={`erp-badge ${o.paymentStatus === 'Paid' || o.paymentStatus === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                              {o.paymentStatus || 'Pending'} ({o.paymentMethod || 'Cash'})
                            </span>
                          </td>
                          <td>
                            <span className={`erp-badge ${
                              o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'badge-success' :
                              o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY' ? 'badge-cyan' :
                              o.status === 'PROCESSING' || o.status === 'CONFIRMED' ? 'badge-info' :
                              o.status === 'CANCELLED' || o.status === 'REFUNDED' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td>{o.assignedDeliveryExecutiveName || 'Unassigned'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="erp-secondary-btn"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={() => setSelectedOrder(o)}
                              >
                                Manage Workflow
                              </button>
                              <button
                                type="button"
                                className="erp-secondary-btn"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={() => { setSelectedOrder(o); setIsInvoicePreviewModal(true); }}
                                title="Print Invoice"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS & STOCK */}
          {activeTab === 'products' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Equipment & Inventory Catalog</h2>
                  <p>Commercial laundry equipment, genuine spare parts, and laundry chemicals</p>
                </div>
                <div className="erp-page-actions">
                  {can('PRODUCT_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAddProductModal(true)}>
                      <Plus size={16} /> Add Product / SKU
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Unit Price</th>
                        <th>Stock Level</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id || p._id}>
                          <td><code>{p.sku || p.id}</code></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                          </td>
                          <td>{p.category}</td>
                          <td><strong>₹{p.price?.toLocaleString('en-IN')}</strong></td>
                          <td>
                            <strong>{p.stock !== undefined ? p.stock : 50}</strong> units
                          </td>
                          <td>
                            <span className={`erp-badge ${p.stock <= 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                              {p.stockStatus || (p.stock <= 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock')}
                            </span>
                          </td>
                          <td>
                            {can('PRODUCT_EDIT') && (
                              <button
                                type="button"
                                className="erp-secondary-btn"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={async () => {
                                  const newPrice = prompt(`Enter new price for ${p.name}:`, p.price);
                                  if (newPrice !== null && !isNaN(newPrice)) {
                                    await erpUpdateProduct(p.id, { price: Number(newPrice) });
                                    refreshActiveTab('products');
                                  }
                                }}
                              >
                                Edit Price
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS & LEDGER */}
          {activeTab === 'payments' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Financial Transactions & Payment Ledger</h2>
                  <p>Immutable audit of all online payments, manual cash/UPI receipts, and refund records</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(payments, 'Payment_Ledger')}>
                    <Download size={15} /> Export Ledger
                  </button>
                  {can('PAYMENT_REFUND') && (
                    <button type="button" className="erp-secondary-btn" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }} onClick={() => setIsRefundModal(true)}>
                      Issue Refund
                    </button>
                  )}
                  {can('PAYMENT_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsRecordPaymentModal(true)}>
                      <Plus size={16} /> Record Manual Payment
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-panel-header">
                  <div className="erp-filter-bar">
                    <select
                      className="erp-select-filter"
                      value={paymentFilterMethod}
                      onChange={(e) => setPaymentFilterMethod(e.target.value)}
                    >
                      <option value="All">All Methods</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Razorpay">Razorpay / Online</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total: {payments.length} ledger transactions</span>
                </div>

                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Type</th>
                        <th>Processed By</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p._id}>
                          <td><code>{p.transactionId}</code></td>
                          <td><strong>{p.orderNumber}</strong></td>
                          <td>{p.customerName}</td>
                          <td>
                            <strong style={{ color: p.type === 'REFUND' ? '#f87171' : '#34d399' }}>
                              {p.type === 'REFUND' ? '-' : '+'}₹{p.amount?.toLocaleString('en-IN')}
                            </strong>
                          </td>
                          <td><span className="erp-badge badge-gray">{p.paymentMethod}</span></td>
                          <td>
                            <span className={`erp-badge ${p.type === 'REFUND' ? 'badge-danger' : 'badge-success'}`}>
                              {p.type}
                            </span>
                          </td>
                          <td>{p.processedByName}</td>
                          <td>{new Date(p.createdAt || p.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DELIVERY & DISPATCH */}
          {activeTab === 'deliveries' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Delivery & Dispatch Operations</h2>
                  <p>Assign drivers, track delivery time slots, and update doorstep completion status</p>
                </div>
                <div className="erp-page-actions">
                  {can('DELIVERY_ASSIGN') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAssignDeliveryModal(true)}>
                      <Plus size={16} /> Schedule Dispatch
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Dispatch ID</th>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Date / Slot</th>
                        <th>Driver Assigned</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map(d => (
                        <tr key={d._id}>
                          <td><strong>{d.deliveryId}</strong></td>
                          <td>{d.orderNumber}</td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{d.customerName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.phone}</div>
                          </td>
                          <td>{d.address?.address || d.address?.city || 'Doorstep Delivery'}</td>
                          <td>
                            <div>{new Date(d.deliveryDate).toLocaleDateString()}</div>
                            <div style={{ fontSize: '11px', color: '#38bdf8' }}>{d.timeSlot}</div>
                          </td>
                          <td><strong>{d.assignedEmployeeName}</strong></td>
                          <td>
                            <span className={`erp-badge ${d.status === 'DELIVERED' ? 'badge-success' : d.status === 'OUT_FOR_DELIVERY' ? 'badge-cyan' : 'badge-warning'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td>
                            {can('DELIVERY_UPDATE') && (
                              <select
                                className="erp-select-filter"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                value={d.status}
                                onChange={async (e) => {
                                  await erpUpdateDeliveryStatus(d._id, e.target.value, `Status updated by ${employee?.name}`);
                                  refreshActiveTab('deliveries');
                                }}
                              >
                                <option value="READY">READY</option>
                                <option value="ASSIGNED">ASSIGNED</option>
                                <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="FAILED">FAILED</option>
                                <option value="RESCHEDULED">RESCHEDULED</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CRM & RETENTION */}
          {activeTab === 'crm' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>CRM Customer Retention & Outreach</h2>
                  <p>Customer lifecycle segmentation, scheduled follow-up tasks, and WhatsApp/Email messaging</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => setIsRetentionModal(true)}>
                    <Send size={15} /> Send Retention Campaign
                  </button>
                  <button type="button" className="erp-primary-btn" onClick={() => setIsAddFollowUpModal(true)}>
                    <Plus size={16} /> Add Follow-Up Task
                  </button>
                </div>
              </div>

              {/* Segmentation Highlights */}
              <div className="erp-kpi-grid">
                <div className="erp-kpi-card kpi-purple" style={{ cursor: 'pointer' }} onClick={() => setCustomerFilterType('VIP')}>
                  <div className="erp-kpi-icon-wrap"><Sparkles size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">VIP High Value</span>
                    <span className="erp-kpi-value">{customers.filter(c => c.customerType === 'VIP' || c.totalSpending > 50000).length}</span>
                    <span className="erp-kpi-sub">Priority care required</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-green" style={{ cursor: 'pointer' }} onClick={() => setCustomerFilterType('Regular')}>
                  <div className="erp-kpi-icon-wrap"><Users size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Repeat Customers</span>
                    <span className="erp-kpi-value">{customers.filter(c => c.totalOrders > 2).length}</span>
                    <span className="erp-kpi-sub">Regular monthly volume</span>
                  </div>
                </div>

                <div className="erp-kpi-card kpi-amber" style={{ cursor: 'pointer' }} onClick={() => setCustomerFilterType('Inactive')}>
                  <div className="erp-kpi-icon-wrap"><Clock size={24} /></div>
                  <div className="erp-kpi-info">
                    <span className="erp-kpi-label">Inactive Win-Back</span>
                    <span className="erp-kpi-value">{customers.filter(c => c.customerType === 'Inactive' || c.totalOrders === 1).length}</span>
                    <span className="erp-kpi-sub">Eligible for win-back discount</span>
                  </div>
                </div>
              </div>

              {/* Follow-up tasks table */}
              <div className="erp-card-panel">
                <div className="erp-panel-header">
                  <div className="erp-panel-title"><HeartHandshake size={18} /> Active Follow-Up Task Register</div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total: {crmFollowUps.length} follow-ups</span>
                </div>
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Task / Campaign</th>
                        <th>Channel</th>
                        <th>Due Date</th>
                        <th>Assigned To</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crmFollowUps.map(f => (
                        <tr key={f._id}>
                          <td><strong>{f.followUpId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{f.customerName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.customerPhone}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{f.title}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.taskDetails}</div>
                          </td>
                          <td><span className="erp-badge badge-cyan">{f.channel}</span></td>
                          <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                          <td>{f.assignedEmployeeName}</td>
                          <td>
                            <span className={`erp-badge ${f.priority === 'URGENT' || f.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                              {f.priority}
                            </span>
                          </td>
                          <td>
                            <select
                              className="erp-select-filter"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              value={f.status}
                              onChange={async (e) => {
                                await erpUpdateCrmFollowUp(f._id, { status: e.target.value });
                                refreshActiveTab('crm');
                              }}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: INTERNAL TASKS */}
          {activeTab === 'tasks' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Internal Employee Task Board</h2>
                  <p>Manage team operations, machine preventive checks, and service tickets</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-primary-btn" onClick={() => setIsAddTaskModal(true)}>
                    <Plus size={16} /> Create Task
                  </button>
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Task ID</th>
                        <th>Title & Details</th>
                        <th>Assigned Staff</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(t => (
                        <tr key={t._id}>
                          <td><strong>{t.taskId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{t.title}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.description}</div>
                          </td>
                          <td>{t.assignedToName}</td>
                          <td>
                            <span className={`erp-badge ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`erp-badge ${t.status === 'COMPLETED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="erp-secondary-btn"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={async () => {
                                const nextStatus = t.status === 'TODO' ? 'IN_PROGRESS' : t.status === 'IN_PROGRESS' ? 'COMPLETED' : 'TODO';
                                await erpUpdateTask(t._id, { status: nextStatus });
                                refreshActiveTab('tasks');
                              }}
                            >
                              Toggle Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: EXPENSE MANAGEMENT */}
          {activeTab === 'expenses' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Operating Expense Ledger & Approvals</h2>
                  <p>Record facility rent, electricity, transport, salary, packaging, and chemical supplies</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(expenses, 'Expense_Ledger')}>
                    <Download size={15} /> Export Expenses
                  </button>
                  {can('EXPENSE_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAddExpenseModal(true)}>
                      <Plus size={16} /> Record Expense
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-panel-header">
                  <div className="erp-filter-bar">
                    <select
                      className="erp-select-filter"
                      value={expenseFilterCat}
                      onChange={(e) => setExpenseFilterCat(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      <option value="Rent">Rent</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Transport">Transport</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total: {expenses.length} expense claims</span>
                </div>

                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Expense ID</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Branch</th>
                        <th>Method</th>
                        <th>Recorded By</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Approvals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(e => (
                        <tr key={e._id}>
                          <td><strong>{e.expenseId}</strong></td>
                          <td><span className="erp-badge badge-gray">{e.category}</span></td>
                          <td><strong>₹{e.amount?.toLocaleString('en-IN')}</strong></td>
                          <td>{e.branch}</td>
                          <td>{e.paymentMethod}</td>
                          <td>{e.employeeName}</td>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`erp-badge ${e.approvalStatus === 'APPROVED' ? 'badge-success' : e.approvalStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                              {e.approvalStatus}
                            </span>
                          </td>
                          <td>
                            {can('EXPENSE_APPROVE') && e.approvalStatus === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="erp-primary-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px', background: '#10b981' }}
                                  onClick={async () => {
                                    await erpApproveExpense(e._id, 'APPROVED', 'Approved by accountant');
                                    refreshActiveTab('expenses');
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  className="erp-secondary-btn"
                                  style={{ padding: '4px 8px', fontSize: '11px', color: '#f87171' }}
                                  onClick={async () => {
                                    await erpApproveExpense(e._id, 'REJECTED', 'Rejected');
                                    refreshActiveTab('expenses');
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>{e.approvedByName || 'Processed'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: BUSINESS REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Dynamic Business Intelligence Reports</h2>
                  <p>Aggregate sales, gross margin, tax, delivery metrics, and employee productivity</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-primary-btn" onClick={() => window.print()}>
                    <Printer size={16} /> Print Full Business Report
                  </button>
                </div>
              </div>

              {reportsData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                  {/* Sales Report Card */}
                  <div className="erp-card-panel">
                    <div className="erp-panel-title" style={{ marginBottom: '14px' }}>
                      <BarChart3 size={18} /> Sales & Tax Computation
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span>Total Paid Orders</span>
                        <strong>{reportsData.sales?.totalOrders}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span>Gross Revenue</span>
                        <strong style={{ color: '#34d399' }}>₹{reportsData.sales?.grossRevenue?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span>Estimated GST (18%)</span>
                        <span>₹{reportsData.sales?.tax?.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                        <span>Net Operating Revenue</span>
                        <strong style={{ fontSize: '16px', color: '#38bdf8' }}>₹{reportsData.sales?.netRevenue?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Employee Measurable Productivity */}
                  <div className="erp-card-panel">
                    <div className="erp-panel-title" style={{ marginBottom: '14px' }}>
                      <ShieldCheck size={18} /> Employee Performance & Work Metrics
                    </div>
                    <div className="erp-table-responsive">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>Staff</th>
                            <th>Role</th>
                            <th>Deliveries</th>
                            <th>Tasks Done</th>
                            <th>Follow-ups</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportsData.employeeMetrics?.map(em => (
                            <tr key={em.employeeId}>
                              <td><strong>{em.name}</strong></td>
                              <td>{em.role}</td>
                              <td>{em.deliveriesCompleted}</td>
                              <td>{em.tasksDone}</td>
                              <td>{em.followUpsDone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 12: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>System Notifications & Operational Alerts</h2>
                  <p>Real-time notifications for incoming orders, payments, assignments, and reminders</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={async () => { await erpMarkNotificationsRead(); refreshActiveTab('notifications'); }}>
                    <Check size={15} /> Mark All as Read
                  </button>
                </div>
              </div>

              <div className="erp-card-panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.map(n => (
                    <div key={n._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="erp-kpi-icon-wrap" style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                          <Bell size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{n.message}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <span className="erp-badge badge-info">{n.type}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      No notifications right now.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: EMPLOYEES & RBAC */}
          {activeTab === 'employees' && can('EMPLOYEE_VIEW') && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Employee Master Directory & RBAC</h2>
                  <p>Manage staff profiles, department roles, branch permissions, and access controls</p>
                </div>
                <div className="erp-page-actions">
                  {can('EMPLOYEE_CREATE') && (
                    <button type="button" className="erp-primary-btn" onClick={() => setIsAddEmployeeModal(true)}>
                      <UserPlus size={16} /> Add Employee
                    </button>
                  )}
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Branches</th>
                        <th>Mobile & Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList.map(emp => (
                        <tr key={emp._id}>
                          <td><strong>{emp.employeeId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{emp.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.designation}</div>
                          </td>
                          <td>{emp.department}</td>
                          <td>
                            <span className="erp-badge badge-purple">{emp.role}</span>
                          </td>
                          <td>{emp.branches?.join(', ') || 'All'}</td>
                          <td>
                            <div>{emp.mobile}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.email}</div>
                          </td>
                          <td>
                            <span className={`erp-badge ${emp.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {can('EMPLOYEE_EDIT') && (
                                <button
                                  type="button"
                                  className="erp-secondary-btn"
                                  style={{ padding: '6px 10px', fontSize: '11px' }}
                                  onClick={() => { setSelectedEmployeeToEdit(emp); setIsEditEmployeeModal(true); }}
                                >
                                  Edit
                                </button>
                              )}
                              {can('EMPLOYEE_DELETE') && emp.role !== 'SUPER_ADMIN' && (
                                <button
                                  type="button"
                                  className="erp-secondary-btn"
                                  style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171' }}
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete employee ${emp.name}?`)) {
                                      await erpDeleteEmployee(emp._id);
                                      refreshActiveTab('employees');
                                    }
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Immutable Activity & Audit Log</h2>
                  <p>Comprehensive operational logs recording all employee actions, timestamps, and IP addresses</p>
                </div>
                <div className="erp-page-actions">
                  <button type="button" className="erp-secondary-btn" onClick={() => exportToCSV(auditLogs, 'Audit_Trail')}>
                    <Download size={15} /> Export Audit Log
                  </button>
                </div>
              </div>

              <div className="erp-card-panel">
                <div className="erp-table-responsive">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Employee</th>
                        <th>Action</th>
                        <th>Module</th>
                        <th>Record ID</th>
                        <th>Description</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                          <td><strong>{log.employeeName}</strong></td>
                          <td><code>{log.action}</code></td>
                          <td><span className="erp-badge badge-cyan">{log.module}</span></td>
                          <td>{log.recordId}</td>
                          <td>{log.description}</td>
                          <td><small style={{ color: '#64748b' }}>{log.ipAddress}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 15: BRANCH & SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div className="erp-page-header">
                <div className="erp-page-title-group">
                  <h2>Enterprise Multi-Branch & Business Settings</h2>
                  <p>Manage branch facilities, GST settings, and employee profile</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                <div className="erp-card-panel">
                  <div className="erp-panel-title" style={{ marginBottom: '14px' }}>
                    <Building2 size={18} /> Active Branch Facilities
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {branches.map(b => (
                      <div key={b.branchId} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '14px' }}>{b.name}</strong>
                          <span className="erp-badge badge-success">{b.code}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{b.address}, {b.city}</div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>📞 {b.phone} • Mgr: {b.managerName}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="erp-card-panel">
                  <div className="erp-panel-title" style={{ marginBottom: '14px' }}>
                    <Sliders size={18} /> Business Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>Business Name</span>
                      <strong>Kleider Care Laundry Systems</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>GST Rate</span>
                      <strong>18% (Standard Commercial Equipment & Care)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>Primary Currency</span>
                      <strong>INR (₹ - Indian Rupee)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span>ERP Engine</span>
                      <strong>Reach ERP Architecture v2.0</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. INTERACTIVE MODALS & DRAWERS
          ─────────────────────────────────────────────────────────── */}

      {/* ORDER DETAILS & 9-STAGE WORKFLOW MODAL */}
      {selectedOrder && !isInvoicePreviewModal && (
        <div className="erp-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="erp-modal-window" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Order Workflow: {selectedOrder.orderId}</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setSelectedOrder(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="erp-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Customer Name</div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>{selectedOrder.customerName}</div>
                  <div style={{ fontSize: '12px', color: '#38bdf8' }}>📞 {selectedOrder.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Payment: {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</div>
                </div>
              </div>

              {/* Status transition dropdown & remarks */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700 }}>Transition Order Status</h4>
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Target Status</label>
                    <select
                      id="workflow-status-select"
                      className="erp-form-select"
                      defaultValue={selectedOrder.status}
                    >
                      <option value="PENDING">1. PENDING</option>
                      <option value="CONFIRMED">2. CONFIRMED</option>
                      <option value="PROCESSING">3. PROCESSING</option>
                      <option value="READY">4. READY</option>
                      <option value="OUT_FOR_DELIVERY">5. OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">6. DELIVERED</option>
                      <option value="COMPLETED">7. COMPLETED</option>
                      <option value="CANCELLED">8. CANCELLED</option>
                      <option value="REFUNDED">9. REFUNDED</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Audit Remarks</label>
                    <input
                      type="text"
                      className="erp-form-input"
                      placeholder="e.g. Garments cleaned and ready for dispatch"
                      value={statusUpdateRemark}
                      onChange={(e) => setStatusUpdateRemark(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="erp-primary-btn"
                  style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                  onClick={async () => {
                    const selectEl = document.getElementById('workflow-status-select');
                    const targetStatus = selectEl?.value;
                    if (targetStatus) {
                      await erpUpdateOrderStatus(selectedOrder.orderId, targetStatus, statusUpdateRemark);
                      setStatusUpdateRemark('');
                      setSelectedOrder(null);
                      refreshActiveTab('orders');
                    }
                  }}
                >
                  <Check size={16} /> Commit Status Change & Record Audit Log
                </button>
              </div>

              {/* Status Timeline History */}
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700 }}>Audit Timeline History</h4>
              <div className="erp-timeline">
                {selectedOrder.timeline?.length > 0 ? (
                  selectedOrder.timeline.map((step, idx) => (
                    <div key={idx} className="erp-timeline-step">
                      <div className="erp-timeline-node"><Check size={14} /></div>
                      <div className="erp-timeline-content">
                        <div className="erp-timeline-title">{step.status}</div>
                        <div className="erp-timeline-meta">By {step.employeeName} on {new Date(step.timestamp).toLocaleString()}</div>
                        {step.remarks && <div style={{ fontSize: '12px', marginTop: '4px', color: '#e2e8f0' }}>&quot;{step.remarks}&quot;</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="erp-timeline-step">
                    <div className="erp-timeline-node"><Clock size={14} /></div>
                    <div className="erp-timeline-content">
                      <div className="erp-timeline-title">{selectedOrder.status}</div>
                      <div className="erp-timeline-meta">Initial order logged on {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="erp-modal-footer">
              <button type="button" className="erp-secondary-btn" onClick={() => setIsInvoicePreviewModal(true)}>
                <Printer size={15} /> Print Invoice
              </button>
              <button type="button" className="erp-secondary-btn" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {isInvoicePreviewModal && selectedOrder && (
        <div className="erp-modal-overlay" onClick={() => setIsInvoicePreviewModal(false)}>
          <div className="erp-modal-window" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Tax Invoice #{selectedOrder.orderId}</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsInvoicePreviewModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="erp-modal-body" id="printable-invoice">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>KLEIDER CARE</h2>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Reach ERP Commercial Care Systems</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>GSTIN: 27AABCK9900K1Z5</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>TAX INVOICE</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Inv: <strong>{selectedOrder.orderId}</strong></div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Billed To:</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{selectedOrder.phone} • {selectedOrder.userEmail}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</div>
              </div>

              <table className="erp-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.name}</td>
                      <td>{it.quantity}</td>
                      <td>₹{it.price?.toLocaleString('en-IN')}</td>
                      <td>₹{((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Amount:</span>
                    <strong>₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment Status:</span>
                    <span className="erp-badge badge-success">{selectedOrder.paymentStatus}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="erp-modal-footer">
              <button type="button" className="erp-primary-btn" onClick={() => window.print()}>
                <Printer size={15} /> Print / Save PDF
              </button>
              <button type="button" className="erp-secondary-btn" onClick={() => setIsInvoicePreviewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER 360 PROFILE DRAWER */}
      {selectedCustomer && (
        <div className="erp-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="erp-modal-window" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Customer 360: {selectedCustomer.name || selectedCustomer.firstName}</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setSelectedCustomer(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="erp-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Spending</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>₹{(selectedCustomer.totalSpending || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Orders</div>
                  <div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedCustomer.totalOrders || 0}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Outstanding Dues</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: selectedCustomer.outstanding > 0 ? '#f87171' : '#34d399' }}>
                    ₹{(selectedCustomer.outstanding || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                <div>📞 <strong>Phone:</strong> {selectedCustomer.mobile || selectedCustomer.mobileNumber}</div>
                <div>✉️ <strong>Email:</strong> {selectedCustomer.email}</div>
                <div>🏢 <strong>Company:</strong> {selectedCustomer.companyName || 'Individual Customer'}</div>
                <div>🏷️ <strong>GST:</strong> {selectedCustomer.gstNumber || 'N/A'}</div>
                <div>📝 <strong>Notes:</strong> {selectedCustomer.notes || 'No notes added'}</div>
              </div>
            </div>
            <div className="erp-modal-footer">
              <button type="button" className="erp-secondary-btn" onClick={() => setSelectedCustomer(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL ORDER MODAL */}
      {isAddOrderModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddOrderModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Create Manual / Counter Order</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddOrderModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateOrder({
                customerName: fd.get('customerName'),
                phone: fd.get('phone'),
                userEmail: fd.get('userEmail'),
                items: [{ name: fd.get('itemName'), price: Number(fd.get('itemPrice')), quantity: Number(fd.get('itemQty') || 1) }],
                totalAmount: Number(fd.get('itemPrice')) * Number(fd.get('itemQty') || 1),
                paymentMethod: fd.get('paymentMethod'),
                paymentStatus: fd.get('paymentStatus')
              });
              setIsAddOrderModal(false);
              refreshActiveTab('orders');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Customer Name *</label>
                    <input name="customerName" required className="erp-form-input" placeholder="e.g. Ramesh Shah" />
                  </div>
                  <div>
                    <label className="erp-field-label">Mobile Number *</label>
                    <input name="phone" required className="erp-form-input" placeholder="e.g. 9820098200" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Item / Service Name *</label>
                    <input name="itemName" required className="erp-form-input" placeholder="e.g. Wash & Steam Iron 10kg or LG Machine" />
                  </div>
                  <div>
                    <label className="erp-field-label">Item Price (₹) *</label>
                    <input name="itemPrice" type="number" required className="erp-form-input" placeholder="990" />
                  </div>
                  <div>
                    <label className="erp-field-label">Quantity</label>
                    <input name="itemQty" type="number" defaultValue="1" className="erp-form-input" />
                  </div>
                  <div>
                    <label className="erp-field-label">Payment Method</label>
                    <select name="paymentMethod" className="erp-form-select">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Payment Status</label>
                    <select name="paymentStatus" className="erp-form-select">
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddOrderModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {isAddEmployeeModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddEmployeeModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Create Employee & Assign Role</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddEmployeeModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateEmployee({
                name: fd.get('name'),
                email: fd.get('email'),
                mobile: fd.get('mobile'),
                password: fd.get('password'),
                department: fd.get('department'),
                designation: fd.get('designation'),
                role: fd.get('role')
              });
              setIsAddEmployeeModal(false);
              refreshActiveTab('employees');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Full Name *</label>
                    <input name="name" required className="erp-form-input" placeholder="e.g. Anand Kumar" />
                  </div>
                  <div>
                    <label className="erp-field-label">Mobile Number *</label>
                    <input name="mobile" required className="erp-form-input" placeholder="e.g. 9876543210" />
                  </div>
                  <div>
                    <label className="erp-field-label">Official Email *</label>
                    <input name="email" type="email" required className="erp-form-input" placeholder="anand@kleidercare.com" />
                  </div>
                  <div>
                    <label className="erp-field-label">Password *</label>
                    <input name="password" type="password" required className="erp-form-input" placeholder="Security Password" />
                  </div>
                  <div>
                    <label className="erp-field-label">Department</label>
                    <input name="department" defaultValue="Operations" className="erp-form-input" />
                  </div>
                  <div>
                    <label className="erp-field-label">Designation</label>
                    <input name="designation" defaultValue="Supervisor" className="erp-form-input" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Role & Permissions</label>
                    <select name="role" className="erp-form-select">
                      <option value="MANAGER">MANAGER (Operations & Approvals)</option>
                      <option value="ADMIN">ADMIN (Full Admin Access)</option>
                      <option value="ACCOUNTANT">ACCOUNTANT (Financial & Expenses)</option>
                      <option value="DELIVERY_MANAGER">DELIVERY_MANAGER (Dispatch Board)</option>
                      <option value="DELIVERY_EXECUTIVE">DELIVERY_EXECUTIVE (Driver Route)</option>
                      <option value="SALES_EXECUTIVE">SALES_EXECUTIVE (Sales & CRM)</option>
                      <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (Ticketing & Care)</option>
                      <option value="RECEPTIONIST">RECEPTIONIST (Front-Desk & Booking)</option>
                      <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock & Supplies)</option>
                      <option value="MARKETING_EXECUTIVE">MARKETING_EXECUTIVE (Retention Outreach)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddEmployeeModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isRecordPaymentModal && (
        <div className="erp-modal-overlay" onClick={() => setIsRecordPaymentModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Record Manual Payment Transaction</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsRecordPaymentModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpRecordPayment({
                orderNumber: fd.get('orderNumber'),
                customerName: fd.get('customerName'),
                amount: Number(fd.get('amount')),
                paymentMethod: fd.get('paymentMethod'),
                referenceId: fd.get('referenceId'),
                notes: fd.get('notes')
              });
              setIsRecordPaymentModal(false);
              refreshActiveTab('payments');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Order # (Optional)</label>
                    <input name="orderNumber" className="erp-form-input" placeholder="e.g. ORD123456" />
                  </div>
                  <div>
                    <label className="erp-field-label">Customer Name *</label>
                    <input name="customerName" required className="erp-form-input" placeholder="e.g. Rajesh Patil" />
                  </div>
                  <div>
                    <label className="erp-field-label">Amount Collected (₹) *</label>
                    <input name="amount" type="number" required className="erp-form-input" placeholder="1500" />
                  </div>
                  <div>
                    <label className="erp-field-label">Payment Method *</label>
                    <select name="paymentMethod" className="erp-form-select">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">NEFT / Bank Transfer</option>
                    </select>
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Reference ID / UPI UTR #</label>
                    <input name="referenceId" className="erp-form-input" placeholder="e.g. UTR-987654321" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsRecordPaymentModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Record Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isAddExpenseModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddExpenseModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Record Operating Expense Claim</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddExpenseModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateExpense({
                category: fd.get('category'),
                amount: Number(fd.get('amount')),
                description: fd.get('description'),
                paymentMethod: fd.get('paymentMethod'),
                branch: currentBranch
              });
              setIsAddExpenseModal(false);
              refreshActiveTab('expenses');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Category *</label>
                    <select name="category" className="erp-form-select">
                      <option value="Rent">Rent</option>
                      <option value="Electricity">Electricity</option>
                      <option value="Water">Water</option>
                      <option value="Transport">Transport</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Salary">Salary</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Amount (₹) *</label>
                    <input name="amount" type="number" required className="erp-form-input" placeholder="2500" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Description / Remarks</label>
                    <input name="description" className="erp-form-input" placeholder="e.g. Monthly diesel fuel for dispatch van" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddExpenseModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddCustomerModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddCustomerModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Add New Customer Account</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddCustomerModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateCustomer({
                firstName: fd.get('firstName'),
                lastName: fd.get('lastName'),
                email: fd.get('email'),
                mobileNumber: fd.get('mobileNumber'),
                companyName: fd.get('companyName'),
                gstNumber: fd.get('gstNumber'),
                customerType: fd.get('customerType'),
                addresses: [{ address: fd.get('address') || 'Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }]
              });
              setIsAddCustomerModal(false);
              refreshActiveTab('customers');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">First Name *</label>
                    <input name="firstName" required className="erp-form-input" placeholder="e.g. Rahul" />
                  </div>
                  <div>
                    <label className="erp-field-label">Last Name</label>
                    <input name="lastName" className="erp-form-input" placeholder="e.g. Sharma" />
                  </div>
                  <div>
                    <label className="erp-field-label">Mobile Number *</label>
                    <input name="mobileNumber" required className="erp-form-input" placeholder="e.g. 9820098200" />
                  </div>
                  <div>
                    <label className="erp-field-label">Email Address *</label>
                    <input name="email" type="email" required className="erp-form-input" placeholder="e.g. rahul@gmail.com" />
                  </div>
                  <div>
                    <label className="erp-field-label">Company / Hotel Name</label>
                    <input name="companyName" className="erp-form-input" placeholder="e.g. Grand Palace Hotel" />
                  </div>
                  <div>
                    <label className="erp-field-label">Customer Tier</label>
                    <select name="customerType" className="erp-form-select">
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="High-Value">High-Value</option>
                      <option value="Corporate">Corporate</option>
                      <option value="New">New</option>
                    </select>
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Delivery Address</label>
                    <input name="address" className="erp-form-input" placeholder="Full street address, building, floor" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddCustomerModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ADD PRODUCT MODAL */}
      {isAddProductModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddProductModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Add Equipment / Supply Product</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddProductModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateProduct({
                name: fd.get('name'),
                category: fd.get('category'),
                price: Number(fd.get('price')),
                sku: fd.get('sku'),
                stock: Number(fd.get('stock') || 50),
                description: fd.get('description')
              });
              setIsAddProductModal(false);
              refreshActiveTab('products');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Product / Machine Name *</label>
                    <input name="name" required className="erp-form-input" placeholder="e.g. Commercial Washer Titan 15kg" />
                  </div>
                  <div>
                    <label className="erp-field-label">Category *</label>
                    <select name="category" className="erp-form-select">
                      <option value="LG Commercial Laundry Machines">LG Commercial Laundry Machines</option>
                      <option value="Speed Queen Commercial Laundry Machines">Speed Queen Commercial Laundry Machines</option>
                      <option value="PONY Finishing Equipments">PONY Finishing Equipments</option>
                      <option value="LG Genuine Spare Parts">LG Genuine Spare Parts</option>
                      <option value="Laundry Chemicals">Laundry Chemicals</option>
                      <option value="Stacker">Stacker</option>
                      <option value="Packages">Packages</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Unit Price (₹) *</label>
                    <input name="price" type="number" required className="erp-form-input" placeholder="185000" />
                  </div>
                  <div>
                    <label className="erp-field-label">SKU / Model Number</label>
                    <input name="sku" className="erp-form-input" placeholder="e.g. LG-TITAN-15KG" />
                  </div>
                  <div>
                    <label className="erp-field-label">Initial Stock Quantity</label>
                    <input name="stock" type="number" defaultValue="20" className="erp-form-input" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Technical Description</label>
                    <textarea name="description" rows={2} className="erp-form-textarea" placeholder="Commercial drum volume, warranty and voltage requirements" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddProductModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE DISPATCH / DELIVERY MODAL */}
      {isAssignDeliveryModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAssignDeliveryModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Schedule Logistics Dispatch</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAssignDeliveryModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateDelivery({
                orderNumber: fd.get('orderNumber') || `ORD-${Date.now().toString().slice(-6)}`,
                customerName: fd.get('customerName'),
                phone: fd.get('phone'),
                address: { address: fd.get('address'), city: 'Mumbai' },
                amount: Number(fd.get('amount') || 0),
                paymentStatus: fd.get('paymentStatus'),
                timeSlot: fd.get('timeSlot'),
                assignedEmployeeName: fd.get('assignedDriver') || 'Rajesh Delivery'
              });
              setIsAssignDeliveryModal(false);
              refreshActiveTab('deliveries');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Order # (Optional)</label>
                    <input name="orderNumber" className="erp-form-input" placeholder="e.g. ORD123456" />
                  </div>
                  <div>
                    <label className="erp-field-label">Customer Name *</label>
                    <input name="customerName" required className="erp-form-input" placeholder="e.g. Anita Desai" />
                  </div>
                  <div>
                    <label className="erp-field-label">Customer Mobile *</label>
                    <input name="phone" required className="erp-form-input" placeholder="e.g. 9820011223" />
                  </div>
                  <div>
                    <label className="erp-field-label">Delivery Time Slot</label>
                    <select name="timeSlot" className="erp-form-select">
                      <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                      <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                      <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Assign Delivery Driver</label>
                    <input name="assignedDriver" className="erp-form-input" placeholder="e.g. Vikram Executive" />
                  </div>
                  <div>
                    <label className="erp-field-label">Payment Collection Mode</label>
                    <select name="paymentStatus" className="erp-form-select">
                      <option value="Paid">Pre-Paid Online</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </select>
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Delivery Address *</label>
                    <input name="address" required className="erp-form-input" placeholder="Flat / Building, Area, Landmark" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAssignDeliveryModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Schedule Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FOLLOW-UP TASK MODAL */}
      {isAddFollowUpModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddFollowUpModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Schedule CRM Follow-Up Task</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddFollowUpModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateCrmFollowUp({
                customerName: fd.get('customerName'),
                customerPhone: fd.get('customerPhone'),
                title: fd.get('title'),
                taskDetails: fd.get('taskDetails'),
                channel: fd.get('channel'),
                priority: fd.get('priority')
              });
              setIsAddFollowUpModal(false);
              refreshActiveTab('crm');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Customer Name *</label>
                    <input name="customerName" required className="erp-form-input" placeholder="e.g. Dr. Kulkarni" />
                  </div>
                  <div>
                    <label className="erp-field-label">Mobile Number</label>
                    <input name="customerPhone" className="erp-form-input" placeholder="e.g. 9820055443" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Follow-up Objective *</label>
                    <input name="title" required className="erp-form-input" placeholder="e.g. Pitch Commercial 40kg Monthly Laundry Package" />
                  </div>
                  <div>
                    <label className="erp-field-label">Communication Channel</label>
                    <select name="channel" className="erp-form-select">
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Email">Email</option>
                      <option value="In-Person">In-Person Visit</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Priority</label>
                    <select name="priority" className="erp-form-select">
                      <option value="HIGH">HIGH Priority</option>
                      <option value="URGENT">URGENT</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Notes & Details</label>
                    <textarea name="taskDetails" rows={2} className="erp-form-textarea" placeholder="Customer inquired about bulk towel washing rates last week" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddFollowUpModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Schedule Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INTERNAL TASK MODAL */}
      {isAddTaskModal && (
        <div className="erp-modal-overlay" onClick={() => setIsAddTaskModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Create Internal Operation Task</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsAddTaskModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpCreateTask({
                title: fd.get('title'),
                description: fd.get('description'),
                priority: fd.get('priority'),
                assignedToName: fd.get('assignedToName') || employee?.name
              });
              setIsAddTaskModal(false);
              refreshActiveTab('tasks');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div className="erp-field-full">
                    <label className="erp-field-label">Task Title *</label>
                    <input name="title" required className="erp-form-input" placeholder="e.g. Inspect Chemical Dosing Pumps on Machine #2" />
                  </div>
                  <div>
                    <label className="erp-field-label">Priority</label>
                    <select name="priority" className="erp-form-select">
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Assign To</label>
                    <input name="assignedToName" className="erp-form-input" placeholder="e.g. Rajesh Kumar" defaultValue={employee?.name} />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Task Description</label>
                    <textarea name="description" rows={2} className="erp-form-textarea" placeholder="Check water pressure valves and clean fluff filters" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsAddTaskModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE REFUND MODAL */}
      {isRefundModal && (
        <div className="erp-modal-overlay" onClick={() => setIsRefundModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Process Customer Refund</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsRefundModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpProcessRefund({
                orderNumber: fd.get('orderNumber'),
                customerName: fd.get('customerName'),
                amount: Number(fd.get('amount')),
                refundReason: fd.get('refundReason')
              });
              setIsRefundModal(false);
              refreshActiveTab('payments');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Order # *</label>
                    <input name="orderNumber" required className="erp-form-input" placeholder="e.g. ORD123456" />
                  </div>
                  <div>
                    <label className="erp-field-label">Customer Name</label>
                    <input name="customerName" required className="erp-form-input" placeholder="e.g. Priya Nair" />
                  </div>
                  <div>
                    <label className="erp-field-label">Refund Amount (₹) *</label>
                    <input name="amount" type="number" required className="erp-form-input" placeholder="1200" />
                  </div>
                  <div>
                    <label className="erp-field-label">Refund Method</label>
                    <select name="method" className="erp-form-select">
                      <option value="Bank Transfer">Bank Transfer / UPI</option>
                      <option value="Cash">Cash Return</option>
                      <option value="Original Payment Gateway">Original Gateway</option>
                    </select>
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Mandatory Audit Refund Reason *</label>
                    <input name="refundReason" required className="erp-form-input" placeholder="e.g. Order cancelled prior to machine processing" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsRefundModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn" style={{ background: '#ef4444' }}>Process Immutable Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {isEditEmployeeModal && selectedEmployeeToEdit && (
        <div className="erp-modal-overlay" onClick={() => setIsEditEmployeeModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">Edit Employee: {selectedEmployeeToEdit.name}</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsEditEmployeeModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpUpdateEmployee(selectedEmployeeToEdit._id, {
                department: fd.get('department'),
                designation: fd.get('designation'),
                role: fd.get('role'),
                status: fd.get('status')
              });
              setIsEditEmployeeModal(false);
              refreshActiveTab('employees');
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Department</label>
                    <input name="department" defaultValue={selectedEmployeeToEdit.department} className="erp-form-input" />
                  </div>
                  <div>
                    <label className="erp-field-label">Designation</label>
                    <input name="designation" defaultValue={selectedEmployeeToEdit.designation} className="erp-form-input" />
                  </div>
                  <div>
                    <label className="erp-field-label">Role</label>
                    <select name="role" defaultValue={selectedEmployeeToEdit.role} className="erp-form-select">
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="ACCOUNTANT">ACCOUNTANT</option>
                      <option value="DELIVERY_MANAGER">DELIVERY_MANAGER</option>
                      <option value="DELIVERY_EXECUTIVE">DELIVERY_EXECUTIVE</option>
                      <option value="SALES_EXECUTIVE">SALES_EXECUTIVE</option>
                      <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
                      <option value="RECEPTIONIST">RECEPTIONIST</option>
                      <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                      <option value="MARKETING_EXECUTIVE">MARKETING_EXECUTIVE</option>
                    </select>
                  </div>
                  <div>
                    <label className="erp-field-label">Status</label>
                    <select name="status" defaultValue={selectedEmployeeToEdit.status} className="erp-form-select">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsEditEmployeeModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Update Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE PROFILE & NOTIFICATION PREFERENCES MODAL */}
      {isProfileModal && (
        <div className="erp-modal-overlay" onClick={() => setIsProfileModal(false)}>
          <div className="erp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h3 className="erp-modal-title">My Employee Profile</h3>
              <button type="button" className="erp-sidebar-toggle" onClick={() => setIsProfileModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              await erpUpdateProfile({
                name: fd.get('name'),
                mobile: fd.get('mobile'),
                newPassword: fd.get('newPassword') || undefined
              });
              alert('Profile updated successfully!');
              setIsProfileModal(false);
            }}>
              <div className="erp-modal-body">
                <div className="erp-form-grid">
                  <div>
                    <label className="erp-field-label">Full Name</label>
                    <input name="name" defaultValue={employee?.name} className="erp-form-input" />
                  </div>
                  <div>
                    <label className="erp-field-label">Mobile</label>
                    <input name="mobile" defaultValue={employee?.mobile} className="erp-form-input" />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Email Address (Read-only)</label>
                    <input value={employee?.email || ''} readOnly className="erp-form-input" style={{ opacity: 0.7 }} />
                  </div>
                  <div className="erp-field-full">
                    <label className="erp-field-label">Reset Password (Optional)</label>
                    <input name="newPassword" type="password" placeholder="Enter new password if updating" className="erp-form-input" />
                  </div>
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" className="erp-secondary-btn" onClick={() => setIsProfileModal(false)}>Cancel</button>
                <button type="submit" className="erp-primary-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
