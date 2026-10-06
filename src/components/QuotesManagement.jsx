import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Printer,
  Download,
  ArrowUp,
  ArrowDown,
  Clock,
  Send,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Mail,
  MessageCircle,
  Copy,
  Paperclip,
  Receipt,
  ShoppingBag,
  FileDown,
  CheckCircle2,
  MoreVertical,
  Calendar,
  Building,
  User,
  Hash,
  Layers,
  Percent,
  UploadCloud,
  File,
  CornerDownRight,
  Home
} from 'lucide-react';
import {
  QUOTE_CUSTOMERS,
  QUOTE_EXECUTIVES,
  QUOTE_PRODUCTS,
  QUOTE_UNITS,
  QUOTE_TAX_OPTIONS,
  QUOTE_SALES_TYPES,
  QUOTE_SUPPLY_TYPES,
  QUOTE_SETTING_IDS,
  QUOTE_PRICELISTS,
  INITIAL_QUOTES
} from '../data/quotesData';
import {
  erpGetQuotes,
  erpCreateQuote,
  erpUpdateQuote,
  erpConvertQuote,
  erpDeleteQuote,
  erpGetCustomers,
  erpGetEmployees,
  erpGetProducts
} from '../services/erpService';
import './QuotesManagement.css';

export default function QuotesManagement({ employee, onConvertSuccess }) {
  // ─── View Mode: 'list' | 'create' | 'edit' ─────────────────────────────────
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'

  // ─── Real Master Data States (Dynamically populated from backend database) ─
  const [customersList, setCustomersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Fetch real master data from backend on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [cRes, eRes, pRes] = await Promise.allSettled([
          erpGetCustomers({ limit: 500 }),
          erpGetEmployees({ limit: 500 }),
          erpGetProducts()
        ]);
        if (cRes.status === 'fulfilled' && cRes.value?.customers) {
          setCustomersList(cRes.value.customers.map(c => ({
            name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.companyName || c.email || 'Customer',
            phone: c.mobileNumber || '',
            email: c.email || '',
            gstn: c.gstin || ''
          })));
        }
        if (eRes.status === 'fulfilled' && eRes.value?.employees) {
          setEmployeesList(eRes.value.employees.map(e => e.name || e.email));
        }
        if (pRes.status === 'fulfilled' && pRes.value?.products) {
          setProductsList(pRes.value.products.map(p => typeof p === 'string' ? p : p.name));
        }
      } catch (err) {
        console.warn('Error fetching ERP master records:', err);
      }
    };
    fetchMasterData();
  }, []);

  // ─── Filter States (for List View) ────────────────────────────────────────
  const [quoteIdFilter, setQuoteIdFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [probFromFilter, setProbFromFilter] = useState('');
  const [probToFilter, setProbToFilter] = useState('');
  const [quoteTypeFilter, setQuoteTypeFilter] = useState('All Quotes');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('All Quotes');
  const [convertStatusFilter, setConvertStatusFilter] = useState('All Quotes');
  const [settingTypeFilter, setSettingTypeFilter] = useState('-Select Setting Type-');
  const [amountOpFilter, setAmountOpFilter] = useState('-Select-');
  const [amountValFilter, setAmountValFilter] = useState('');
  const [executiveFilter, setExecutiveFilter] = useState('-Select-');
  const [productFilter, setProductFilter] = useState('Select a Product');
  const [showAdvanceSearch, setShowAdvanceSearch] = useState(false);

  // Compute active advanced filters count
  const activeAdvanceFiltersCount = useMemo(() => {
    let count = 0;
    if (dateFromFilter || dateToFilter) count++;
    if (customerFilter && customerFilter !== 'All') count++;
    if (probFromFilter !== '' || probToFilter !== '') count++;
    if (quoteTypeFilter && quoteTypeFilter !== 'All Quotes') count++;
    if (quoteStatusFilter && quoteStatusFilter !== 'All Quotes') count++;
    if (convertStatusFilter && convertStatusFilter !== 'All Quotes') count++;
    if (settingTypeFilter && settingTypeFilter !== '-Select Setting Type-') count++;
    if (amountOpFilter && amountOpFilter !== '-Select-' && amountValFilter !== '') count++;
    if (executiveFilter && executiveFilter !== '-Select-') count++;
    if (productFilter && productFilter !== 'Select a Product') count++;
    return count;
  }, [
    dateFromFilter,
    dateToFilter,
    customerFilter,
    probFromFilter,
    probToFilter,
    quoteTypeFilter,
    quoteStatusFilter,
    convertStatusFilter,
    settingTypeFilter,
    amountOpFilter,
    amountValFilter,
    executiveFilter,
    productFilter
  ]);

  // ─── Data & Pagination States ─────────────────────────────────────────────
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('quoteDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(INITIAL_QUOTES.length);

  // ─── Action Dropdown & Modals State ────────────────────────────────────────
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [viewingQuote, setViewingQuote] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [mailingQuote, setMailingQuote] = useState(null);
  const [mailForm, setMailForm] = useState({ to: '', subject: '', body: '' });
  const [toastMessage, setToastMessage] = useState('');

  const dropdownRef = useRef(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedQuoteIds(quotes.map(q => q._id || q.quoteId));
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedQuoteIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQuoteIds.length === 0) {
      alert('Please select at least one quotation from the table to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedQuoteIds.length} selected quotation(s)?`)) return;
    try {
      for (const id of selectedQuoteIds) {
        await erpDeleteQuote(id);
      }
      showToast(`🗑️ ${selectedQuoteIds.length} quotation(s) deleted.`);
      setSelectedQuoteIds([]);
      fetchQuotes();
    } catch (err) {
      alert(`Error deleting selected quotes: ${err.message}`);
    }
  };

  // Calculate Age in Days (Integer)
  const calculateAgeDays = (quoteDateStr) => {
    if (!quoteDateStr) return 0;
    const quoteDate = new Date(quoteDateStr);
    const now = new Date();
    const diffTime = now.getTime() - quoteDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // ─── CREATE / EDIT QUOTE FORM STATE (Enterprise Specification) ────────────
  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getNextQuoteSeq = () => {
    return quotes.length + 1;
  };

  const initialCreateForm = {
    settingId: 'GST Quote', // Setting Id: GST Quote | SCS
    customerName: '',
    customerPhone: '',
    customerGstn: '',
    customerEmail: '',
    executive: employee?.name || 'Staff',
    receiverGstn: '',
    salesType: 'B2B', // B2B, B2C, EXPORT, ADV PAYMENT
    supplyType: 'Intra-State', // Select a Supply Type, Inter-State, Intra-State, Export Exempted
    reverseCharge: 'NO', // NO, YES
    pointOfSupply: '',
    provisionalAssessment: 'NO', // NO, YES
    pricelist: 'Default Sale Price', // Default Sale Price, Cost Price
    quotePrefix: 'RA',
    quoteLastNum: '1',
    quoteSuffix: 'RT',
    quoteDate: getTodayString(),
    closureProbability: '0%', // 0%, 10%, ... 100%
    items: [
      {
        productName: '',
        description: '',
        qty: 1,
        units: 'NOS',
        price: 0,
        discount: 0,
        discountType: '%',
        tax: 'OUTPUT SGST - 9 :9%',
        taxRate: 18,
        inclTax: false
      }
    ],
    roundoff: 0,
    inDateTime: '',
    outDateTime: '',
    setReminder: '',
    showDeliveryDetails: false,
    packingDetails: '',
    deliverTo: '',
    attachments: [],
    notes: '',
    termsAndConditions: '1. Quotation valid for 15 days.\n2. 100% payment upon delivery/acceptance.\n3. Standard OEM warranty applicable.'
  };

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for F4: Add line item when in create view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode === 'create' && (e.key === 'F4' || e.code === 'F4')) {
        e.preventDefault();
        handleAddLineItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Calculate Age of Quote helper
  const calculateAge = (quoteDateStr) => {
    if (!quoteDateStr) return '0 days';
    const quoteDate = new Date(quoteDateStr);
    const now = new Date();
    const diffTime = Math.abs(now - quoteDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  // ─── Fetch / Filter Quotes ────────────────────────────────────────────────
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = {
        quoteId: quoteIdFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
        customerName: customerFilter !== 'All' ? customerFilter : '',
        probFrom: probFromFilter,
        probTo: probToFilter,
        quoteType: quoteTypeFilter !== 'All Quotes' ? quoteTypeFilter : '',
        quoteStatus: quoteStatusFilter !== 'All Quotes' ? quoteStatusFilter : '',
        convertStatus: convertStatusFilter !== 'All Quotes' ? convertStatusFilter : '',
        settingType: settingTypeFilter !== '-Select Setting Type-' ? settingTypeFilter : '',
        amountOp: amountOpFilter !== '-Select-' ? amountOpFilter : '',
        amountVal: amountValFilter,
        executive: executiveFilter !== '-Select-' ? executiveFilter : '',
        product: productFilter !== 'Select a Product' ? productFilter : '',
        sortBy,
        sortOrder,
        page: currentPage,
        limit: pageSize
      };

      const res = await erpGetQuotes(params);
      if (res?.success && res.quotes) {
        setQuotes(res.quotes);
        setTotalCount(res.pagination?.totalCount || res.quotes.length);
      }
    } catch (err) {
      console.warn('Backend quotes fetch fallback to client-side filtering:', err.message);
      let list = [...INITIAL_QUOTES];

      if (quoteIdFilter.trim()) {
        list = list.filter(q => q.quoteId.toLowerCase().includes(quoteIdFilter.trim().toLowerCase()));
      }
      if (customerFilter && customerFilter !== 'All') {
        list = list.filter(q => q.customerName.toLowerCase().includes(customerFilter.toLowerCase()));
      }
      if (executiveFilter && executiveFilter !== '-Select-') {
        list = list.filter(q => q.executive.toLowerCase().includes(executiveFilter.toLowerCase()));
      }
      if (quoteTypeFilter && quoteTypeFilter !== 'All Quotes') {
        list = list.filter(q => q.quoteType === quoteTypeFilter);
      }
      if (quoteStatusFilter && quoteStatusFilter !== 'All Quotes') {
        if (quoteStatusFilter === 'Pending Quotes') list = list.filter(q => q.status === 'Pending');
        else if (quoteStatusFilter === 'Closed Quotes') list = list.filter(q => ['Closed', 'Approved'].includes(q.status));
        else list = list.filter(q => q.status === quoteStatusFilter);
      }
      if (convertStatusFilter && convertStatusFilter !== 'All Quotes') {
        list = list.filter(q => q.convertedTo === convertStatusFilter);
      }
      if (settingTypeFilter && settingTypeFilter !== '-Select Setting Type-') {
        list = list.filter(q => q.settingType === settingTypeFilter);
      }
      if (probFromFilter !== '') {
        list = list.filter(q => q.closureProbability >= Number(probFromFilter));
      }
      if (probToFilter !== '') {
        list = list.filter(q => q.closureProbability <= Number(probToFilter));
      }
      if (amountOpFilter && amountOpFilter !== '-Select-' && amountValFilter !== '') {
        const val = Number(amountValFilter);
        if (amountOpFilter === '=') list = list.filter(q => q.totalAmount === val);
        else if (amountOpFilter === '<') list = list.filter(q => q.totalAmount < val);
        else if (amountOpFilter === '<=') list = list.filter(q => q.totalAmount <= val);
        else if (amountOpFilter === '>') list = list.filter(q => q.totalAmount > val);
        else if (amountOpFilter === '>=') list = list.filter(q => q.totalAmount >= val);
      }
      if (productFilter && productFilter !== 'Select a Product') {
        list = list.filter(q => q.items?.some(i => i.productName.toLowerCase().includes(productFilter.toLowerCase())));
      }

      list.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (sortBy === 'quoteAmt') {
          valA = a.totalAmount;
          valB = b.totalAmount;
        }
        if (sortBy === 'custName') {
          valA = a.customerName;
          valB = b.customerName;
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      setTotalCount(list.length);
      const start = (currentPage - 1) * pageSize;
      setQuotes(list.slice(start, start + pageSize));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    quoteTypeFilter,
    quoteStatusFilter,
    convertStatusFilter
  ]);

  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    fetchQuotes();
  };

  const handleResetFilters = () => {
    setQuoteIdFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setCustomerFilter('All');
    setProbFromFilter('');
    setProbToFilter('');
    setQuoteTypeFilter('All Quotes');
    setQuoteStatusFilter('All Quotes');
    setConvertStatusFilter('All Quotes');
    setSettingTypeFilter('-Select Setting Type-');
    setAmountOpFilter('-Select-');
    setAmountValFilter('');
    setExecutiveFilter('-Select-');
    setProductFilter('Select a Product');
    setCurrentPage(1);
    setTimeout(() => {
      fetchQuotes();
    }, 50);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // ─── SPECIFIC ACTION HANDLERS (12 ACTIONS) ─────────────────────────────────
  const handleViewQuote = (quote) => {
    setOpenDropdownId(null);
    setViewingQuote(quote);
  };

  const handlePdfQuote = (quote) => {
    setOpenDropdownId(null);
    setViewingQuote(quote);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleMailQuote = (quote) => {
    setOpenDropdownId(null);
    setMailingQuote(quote);
    setMailForm({
      to: quote.customerEmail || (quote.customerPhone ? `${quote.customerPhone}@customer.com` : 'customer@example.com'),
      subject: `Quotation Proposal #${quote.quoteId} from Kleider Care ERP`,
      body: `Dear ${quote.customerName},\n\nPlease find attached the quotation #${quote.quoteId} for total amount of ₹${Number(quote.totalAmount || 0).toLocaleString('en-IN')}.\n\nItems Quoted:\n${quote.items?.map((item, idx) => `${idx + 1}. ${item.productName} (Qty: ${item.quantity || item.qty}) - ₹${item.totalPrice || item.price}`).join('\n')}\n\nAssigned Executive: ${quote.executive}\nValidity: 15 Days\n\nBest Regards,\nKleider Care ERP Solutions`
    });
  };

  const handleSendMail = (e) => {
    e.preventDefault();
    showToast(`✉️ Quotation #${mailingQuote.quoteId} successfully emailed to ${mailForm.to}`);
    setMailingQuote(null);
  };

  const handlePrintQuote = (quote) => {
    setOpenDropdownId(null);
    setViewingQuote(quote);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleUpdateQuote = (quote) => {
    setOpenDropdownId(null);
    setEditingQuote(quote);
    setCreateForm({
      settingId: quote.settingType || 'GST Quote',
      customerName: quote.customerName || '',
      customerPhone: quote.customerPhone || '',
      customerGstn: quote.receiverGstn || '',
      customerEmail: quote.customerEmail || '',
      executive: quote.executive || 'Approval Pending',
      receiverGstn: quote.receiverGstn || '',
      salesType: quote.salesType || 'B2B',
      supplyType: quote.supplyType || 'Intra-State',
      reverseCharge: quote.reverseCharge || 'NO',
      pointOfSupply: quote.pointOfSupply || '',
      provisionalAssessment: quote.provisionalAssessment || 'NO',
      pricelist: quote.pricelist || 'Default Sale Price',
      quotePrefix: quote.quotePrefix || 'RA',
      quoteLastNum: quote.quoteLastNum || '1',
      quoteSuffix: quote.quoteSuffix || 'RT',
      quoteDate: quote.quoteDate ? new Date(quote.quoteDate).toISOString().split('T')[0] : getTodayString(),
      closureProbability: `${quote.closureProbability || 0}%`,
      items: quote.items?.length > 0 ? quote.items.map(item => ({
        productName: item.productName || item.name || '',
        description: item.description || '',
        qty: item.quantity || item.qty || 1,
        units: item.units || 'NOS',
        price: item.unitPrice || item.price || 0,
        discount: item.discount || 0,
        discountType: item.discountType || '%',
        tax: item.tax || 'OUTPUT SGST - 9 :9%',
        taxRate: item.taxRate || 18,
        inclTax: item.inclTax || false
      })) : initialCreateForm.items,
      roundoff: quote.roundoff || 0,
      inDateTime: quote.inDateTime || '',
      outDateTime: quote.outDateTime || '',
      setReminder: quote.setReminder || '',
      showDeliveryDetails: !!(quote.packingDetails || quote.deliverTo),
      packingDetails: quote.packingDetails || '',
      deliverTo: quote.deliverTo || '',
      attachments: quote.attachments || [],
      notes: quote.notes || '',
      termsAndConditions: quote.termsAndConditions || initialCreateForm.termsAndConditions
    });
    setCustomerSearchQuery(quote.customerName || '');
    setViewMode('create');
  };

  const handleDeleteQuote = async (id, quoteId) => {
    setOpenDropdownId(null);
    if (!window.confirm(`Are you sure you want to delete quotation ${quoteId}?`)) return;
    try {
      await erpDeleteQuote(id);
      showToast(`🗑️ Quotation ${quoteId} deleted.`);
      fetchQuotes();
    } catch (err) {
      alert(`Error deleting quote: ${err.message}`);
    }
  };

  const handleConvertAsInvoice = async (quote) => {
    setOpenDropdownId(null);
    try {
      await erpConvertQuote(quote._id, {
        convertedTo: 'Invoice',
        status: 'Approved'
      });
      showToast(`🧾 Quotation #${quote.quoteId} converted to Tax Invoice!`);
      fetchQuotes();
      if (onConvertSuccess) onConvertSuccess('Invoice');
    } catch (err) {
      alert(`Error converting quote: ${err.message}`);
    }
  };

  const handleConvertAsProforma = async (quote) => {
    setOpenDropdownId(null);
    try {
      await erpConvertQuote(quote._id, {
        convertedTo: 'Proforma Invoice',
        status: 'Approved'
      });
      showToast(`📑 Quotation #${quote.quoteId} converted to Proforma Invoice!`);
      fetchQuotes();
      if (onConvertSuccess) onConvertSuccess('Proforma Invoice');
    } catch (err) {
      alert(`Error converting quote: ${err.message}`);
    }
  };

  const handleConvertAsSalesOrder = async (quote) => {
    setOpenDropdownId(null);
    try {
      await erpConvertQuote(quote._id, {
        convertedTo: 'Sales Order',
        status: 'Approved'
      });
      showToast(`📦 Quotation #${quote.quoteId} converted to Sales Order!`);
      fetchQuotes();
      if (onConvertSuccess) onConvertSuccess('Sales Order');
    } catch (err) {
      alert(`Error converting quote: ${err.message}`);
    }
  };

  const handleWhatsappQuote = (quote) => {
    setOpenDropdownId(null);
    const cleanPhone = (quote.customerPhone || '').replace(/[^0-9]/g, '');
    const phoneNum = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${quote.customerName},\n\nHere is your official Quotation *#${quote.quoteId}* from Kleider Care ERP.\n\n*Amount:* ₹${Number(quote.totalAmount || 0).toLocaleString('en-IN')}\n*Items:* ${quote.items?.map(i => i.productName).join(', ')}\n*Executive:* ${quote.executive}\n\nPlease let us know if you need any adjustments or wish to proceed!`
    );
    const waUrl = phoneNum ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
    showToast(`💬 WhatsApp window launched for ${quote.customerName}`);
  };

  const handleDuplicateQuote = async (quote) => {
    setOpenDropdownId(null);
    try {
      const newQuoteData = {
        ...quote,
        _id: undefined,
        quoteId: `QC-${new Date().getFullYear()}-${String(totalCount + Math.floor(Math.random() * 900) + 100)}`,
        quoteDate: new Date(),
        status: 'Pending',
        convertedTo: 'Pending',
        notes: `[Duplicated from ${quote.quoteId}] ${quote.notes || ''}`
      };
      await erpCreateQuote(newQuoteData);
      showToast(`📋 Quotation cloned as new Proposal #${newQuoteData.quoteId}`);
      fetchQuotes();
    } catch (err) {
      alert(`Error duplicating quote: ${err.message}`);
    }
  };

  const handleDownloadAttachments = (quote) => {
    setOpenDropdownId(null);
    const textContent = `ATTACHMENTS & SPECIFICATIONS FOR QUOTATION #${quote.quoteId}\n` +
      `Customer: ${quote.customerName}\n` +
      `Phone: ${quote.customerPhone || 'N/A'}\n` +
      `Date: ${new Date(quote.quoteDate).toLocaleDateString()}\n` +
      `Total Amount: ₹${quote.totalAmount}\n\n` +
      `ITEMS DETAILED SPECIFICATIONS:\n` +
      quote.items?.map((item, i) => `${i + 1}. [${item.productName}] Qty: ${item.quantity || item.qty} | Unit: ₹${item.unitPrice || item.price} | Tax: ${item.taxRate || 18}%\n   Notes: ${item.description || 'Standard OEM Specs'}`).join('\n\n') +
      `\n\nTerms:\n${quote.termsAndConditions || 'Standard'}\n`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quote_Attachments_${quote.quoteId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`📎 Attachments bundle downloaded for #${quote.quoteId}`);
  };

  // ─── CREATE VIEW HANDLERS ──────────────────────────────────────────────────
  const handleOpenCreatePage = () => {
    setEditingQuote(null);
    setCreateForm({
      ...initialCreateForm,
      quoteLastNum: String(getNextQuoteSeq()),
      quoteDate: getTodayString()
    });
    setCustomerSearchQuery('');
    setViewMode('create');
  };

  const handleSelectCustomer = (cust) => {
    setCustomerSearchQuery(cust.name || '');
    setCreateForm(prev => ({
      ...prev,
      customerName: cust.name || '',
      customerPhone: cust.phone || prev.customerPhone,
      customerEmail: cust.email || prev.customerEmail,
      receiverGstn: cust.gstn || prev.receiverGstn,
      pointOfSupply: cust.state || cust.city || prev.pointOfSupply
    }));
    setShowCustomerDropdown(false);
  };

  const handleAddLineItem = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productName: '',
          description: '',
          qty: 1,
          units: 'NOS',
          price: 0,
          discount: 0,
          discountType: '%',
          tax: 'OUTPUT SGST - 9 :9%',
          taxRate: 18,
          inclTax: false
        }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (createForm.items.length <= 1) return;
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...createForm.items];
    let row = { ...updated[index], [field]: value };

    // Automatically parse tax rate if tax option changes
    if (field === 'tax') {
      const match = value.match(/(\d+(\.\d+)?)%/);
      if (match) {
        row.taxRate = Number(match[1]);
      } else if (value.includes('NIL') || value.includes('EXEMPTED') || value.includes('NON GST') || value.includes('- 0')) {
        row.taxRate = 0;
      }
    }

    updated[index] = row;
    setCreateForm(prev => ({ ...prev, items: updated }));
  };

  // Compute Line Item Amounts & Overall Summary
  const { lineCalculations, subtotal, taxTotal, calculatedTotal, roundoffValue, grandTotal } = useMemo(() => {
    let sub = 0;
    let taxSum = 0;

    const calculations = createForm.items.map(item => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const gross = qty * price;

      const discountVal = Number(item.discount) || 0;
      const discountAmt = item.discountType === '%'
        ? (gross * discountVal) / 100
        : discountVal;

      const taxableAmount = Math.max(0, gross - discountAmt);
      const taxRate = Number(item.taxRate) || 0;

      let lineTax = 0;
      let lineTotal = 0;

      if (item.inclTax) {
        lineTax = taxableAmount - (taxableAmount / (1 + taxRate / 100));
        lineTotal = taxableAmount;
      } else {
        lineTax = (taxableAmount * taxRate) / 100;
        lineTotal = taxableAmount + lineTax;
      }

      sub += taxableAmount;
      taxSum += lineTax;

      return {
        gross,
        discountAmt,
        taxableAmount,
        lineTax,
        lineTotal
      };
    });

    const unroundedTotal = sub + taxSum;
    const rounded = Math.round(unroundedTotal);
    const calculatedRoundoff = +(rounded - unroundedTotal).toFixed(2);

    return {
      lineCalculations: calculations,
      subtotal: sub,
      taxTotal: taxSum,
      calculatedTotal: unroundedTotal,
      roundoffValue: calculatedRoundoff,
      grandTotal: rounded
    };
  }, [createForm.items]);

  // Handle File Uploads
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 2 * 1024 * 1024); // 2MB limit
    if (files.length > validFiles.length) {
      alert('Some files exceed the maximum allowed size of 2MB.');
    }
    const mapped = validFiles.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type
    }));
    setCreateForm(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...mapped]
    }));
  };

  const handleRemoveAttachment = (idx) => {
    setCreateForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  // Submit Create / Edit Quote
  const handleSaveQuote = async (andSend = false) => {
    if (!createForm.customerName.trim()) {
      alert('Please select or specify a Customer Name.');
      return;
    }

    const cleanProbability = parseInt(createForm.closureProbability, 10) || 0;
    const computedQuoteId = `${createForm.quotePrefix || 'RA'}-${String(createForm.quoteLastNum || '1').padStart(4, '0')}-${createForm.quoteSuffix || 'RT'}`;

    const quotePayload = {
      quoteId: editingQuote ? editingQuote.quoteId : computedQuoteId,
      customerName: createForm.customerName.trim(),
      customerPhone: createForm.customerPhone || '',
      customerEmail: createForm.customerEmail || '',
      receiverGstn: createForm.receiverGstn || '',
      executive: createForm.executive || 'Approval Pending',
      quoteType: 'Sample Products',
      settingType: createForm.settingId || 'GST Quote',
      salesType: createForm.salesType || 'B2B',
      supplyType: createForm.supplyType || 'Intra-State',
      reverseCharge: createForm.reverseCharge || 'NO',
      pointOfSupply: createForm.pointOfSupply || '',
      provisionalAssessment: createForm.provisionalAssessment || 'NO',
      pricelist: createForm.pricelist || 'Default Sale Price',
      quotePrefix: createForm.quotePrefix,
      quoteLastNum: createForm.quoteLastNum,
      quoteSuffix: createForm.quoteSuffix,
      quoteDate: new Date(createForm.quoteDate || Date.now()),
      closureProbability: cleanProbability,
      status: 'Pending',
      convertedTo: 'Pending',
      items: createForm.items.map((it, idx) => ({
        productName: it.productName,
        description: it.description || '',
        quantity: Number(it.qty) || 1,
        units: it.units || 'NOS',
        unitPrice: Number(it.price) || 0,
        discount: Number(it.discount) || 0,
        discountType: it.discountType || '%',
        tax: it.tax,
        taxRate: Number(it.taxRate) || 18,
        inclTax: it.inclTax || false,
        totalPrice: lineCalculations[idx]?.lineTotal || 0
      })),
      subTotal: subtotal,
      taxAmount: taxTotal,
      roundoff: roundoffValue,
      totalAmount: grandTotal,
      inDateTime: createForm.inDateTime,
      outDateTime: createForm.outDateTime,
      setReminder: createForm.setReminder,
      packingDetails: createForm.packingDetails,
      deliverTo: createForm.deliverTo,
      attachments: createForm.attachments,
      notes: createForm.notes,
      termsAndConditions: createForm.termsAndConditions
    };

    try {
      if (editingQuote) {
        await erpUpdateQuote(editingQuote._id, quotePayload);
        showToast(`✅ Quotation #${quotePayload.quoteId} updated successfully!`);
      } else {
        await erpCreateQuote(quotePayload);
        showToast(`🎉 Quotation #${quotePayload.quoteId} created successfully!`);
      }

      setViewMode('list');
      setEditingQuote(null);
      fetchQuotes();

      if (andSend) {
        setTimeout(() => {
          handleMailQuote(quotePayload);
        }, 400);
      }
    } catch (err) {
      alert(`Error saving quotation: ${err.message}`);
    }
  };

  // Filtered Customer Search (uses live customer database records)
  const filteredCustomers = useMemo(() => {
    const list = customersList.length > 0 ? customersList : QUOTE_CUSTOMERS;
    if (!customerSearchQuery.trim()) return list;
    const q = customerSearchQuery.toLowerCase();
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customerSearchQuery, customersList]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CREATE / EDIT QUOTE PAGE VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'create') {
    return (
      <div className="quotes-container create-quote-page-view">
        {/* ─── Breadcrumb Navigation ────────────────────────────────────── */}
        <div className="quote-breadcrumb-bar">
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => setViewMode('list')}
          >
            <Home size={14} />
            <span>Home</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => setViewMode('list')}
          >
            <span>Quotes</span>
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">
            {editingQuote ? 'Edit Quote' : 'Create Quote'}
          </span>
        </div>

        {/* ─── Page Title Bar ────────────────────────────────────────────── */}
        <div className="quotes-header">
          <div className="quotes-header-left">
            <h2>
              <Receipt size={24} color="#1e3a8a" />
              {editingQuote ? `Edit Quote #${editingQuote.quoteId}` : 'Create Quote'}
            </h2>
            <p>Generate professional GST-compliant quote proposal with line item tax rules & instant attachments.</p>
          </div>
          <div className="quotes-header-actions">
            <button
              type="button"
              className="btn-secondary-outline"
              onClick={() => {
                if (window.confirm('Discard unsaved quote changes and return to Quotes list?')) {
                  setViewMode('list');
                }
              }}
            >
              <X size={15} />
              Cancel
            </button>
            <button
              type="button"
              className="btn-secondary-outline"
              onClick={() => handleSaveQuote(true)}
            >
              <Send size={15} />
              Save & Send
            </button>
            <button
              type="button"
              className="btn-primary-gradient"
              onClick={() => handleSaveQuote(false)}
            >
              <Check size={16} />
              Save Quote
            </button>
          </div>
        </div>

        {/* ─── Main Form Structure ────────────────────────────────────────── */}
        <div className="create-quote-card">
          {/* Section 1: General & Quotation Information */}
          <div className="quote-form-section">
            <div className="quote-section-header">
              <div className="quote-section-title">
                <Hash size={16} className="quote-section-icon" />
                <span>Quotation Details</span>
              </div>
            </div>
            <div className="quote-grid-4col">
              {/* Quote # (Prefix, Last #, Suffix) */}
              <div className="form-field-box">
                <label className="field-label required">Quote #</label>
                <div className="quote-unified-input-row">
                  <div className="quote-part-wrapper prefix-part">
                    <span className="quote-part-tag">Prefix</span>
                    <input
                      type="text"
                      className="quote-part-input"
                      placeholder="RA"
                      value={createForm.quotePrefix}
                      onChange={(e) => setCreateForm({ ...createForm, quotePrefix: e.target.value })}
                    />
                  </div>
                  <span className="quote-part-slash">/</span>
                  <div className="quote-part-wrapper num-part">
                    <span className="quote-part-tag">Last #</span>
                    <input
                      type="text"
                      className="quote-part-input"
                      placeholder="1"
                      value={createForm.quoteLastNum}
                      onChange={(e) => setCreateForm({ ...createForm, quoteLastNum: e.target.value })}
                    />
                  </div>
                  <span className="quote-part-slash">/</span>
                  <div className="quote-part-wrapper suffix-part">
                    <span className="quote-part-tag">Suffix</span>
                    <input
                      type="text"
                      className="quote-part-input"
                      placeholder="RT"
                      value={createForm.quoteSuffix}
                      onChange={(e) => setCreateForm({ ...createForm, quoteSuffix: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="form-field-box">
                <label className="field-label required">Date *</label>
                <div className="input-with-icon-wrapper">
                  <Calendar size={15} className="input-field-icon" />
                  <input
                    type="date"
                    required
                    className="form-control-styled with-icon"
                    value={createForm.quoteDate}
                    onChange={(e) => setCreateForm({ ...createForm, quoteDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Setting ID */}
              <div className="form-field-box">
                <label className="field-label">Setting Id</label>
                <div className="segmented-pill-container">
                  {QUOTE_SETTING_IDS.map((sid) => (
                    <button
                      type="button"
                      key={sid}
                      className={`segmented-pill-item ${createForm.settingId === sid ? 'active' : ''}`}
                      onClick={() => setCreateForm({ ...createForm, settingId: sid })}
                    >
                      {sid}
                    </button>
                  ))}
                </div>
              </div>

              {/* Executive */}
              <div className="form-field-box">
                <label className="field-label">Executive</label>
                <select
                  className="form-control-styled"
                  value={createForm.executive}
                  onChange={(e) => setCreateForm({ ...createForm, executive: e.target.value })}
                >
                  {employeesList.length > 0 ? (
                    employeesList.map((exec, idx) => (
                      <option key={idx} value={exec}>{exec}</option>
                    ))
                  ) : (
                    <>
                      <option value={employee?.name || 'Staff'}>{employee?.name || 'Staff'}</option>
                      <option value="Approval Pending">Approval Pending</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Customer & Tax Details */}
          <div className="quote-form-section">
            <div className="quote-section-header">
              <div className="quote-section-title">
                <Building size={16} className="quote-section-icon" />
                <span>Customer & Billing Information</span>
              </div>
            </div>
            <div className="quote-grid-4col">
              {/* Customer Name (2-columns wide) */}
              <div className="form-field-box col-span-2 customer-select-box" ref={customerDropdownRef}>
                <label className="field-label required">Customer Name *</label>
                <div className="customer-input-wrapper">
                  <User size={15} className="input-field-icon" />
                  <input
                    type="text"
                    placeholder="Search or enter customer name..."
                    value={customerSearchQuery}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setCreateForm(prev => ({ ...prev, customerName: e.target.value }));
                      setShowCustomerDropdown(true);
                    }}
                    className="form-control-styled with-icon customer-search-input"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      className="clear-input-btn"
                      title="Clear customer"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setCreateForm(prev => ({ ...prev, customerName: '', receiverGstn: '' }));
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="dropdown-trigger-btn"
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Customer Dropdown Menu */}
                {showCustomerDropdown && (
                  <div className="customer-autocomplete-menu">
                    <div className="customer-menu-header">
                      <span>{filteredCustomers.length} Customers Available</span>
                      <button type="button" onClick={() => setShowCustomerDropdown(false)}>
                        <X size={13} />
                      </button>
                    </div>
                    <div className="customer-menu-list">
                      {filteredCustomers.map((cust, idx) => (
                        <div
                          key={idx}
                          className={`customer-menu-item ${createForm.customerName === cust.name ? 'selected' : ''}`}
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <div className="customer-item-main">
                            <span className="customer-item-name">{cust.name}</span>
                            {cust.gstn && <span className="customer-item-gstn">GST: {cust.gstn}</span>}
                          </div>
                          <div className="customer-item-sub">
                            {cust.phone && <span className="customer-item-phone">📞 {cust.phone}</span>}
                            {cust.email && <span className="customer-item-email">✉️ {cust.email}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Receiver GSTN / UID */}
              <div className="form-field-box">
                <label className="field-label">Receiver GSTN/ UID</label>
                <input
                  type="text"
                  placeholder="e.g. 33AAAAA0000A1Z5"
                  className="form-control-styled uppercase-input"
                  value={createForm.receiverGstn}
                  onChange={(e) => setCreateForm({ ...createForm, receiverGstn: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Sales Type */}
              <div className="form-field-box">
                <label className="field-label">Sales Type</label>
                <div className="segmented-pill-container sales-type-group">
                  {QUOTE_SALES_TYPES.map((st) => (
                    <button
                      type="button"
                      key={st}
                      className={`segmented-pill-item ${createForm.salesType === st ? 'active' : ''}`}
                      onClick={() => setCreateForm({ ...createForm, salesType: st })}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supply Type */}
              <div className="form-field-box">
                <label className="field-label">Supply Type</label>
                <select
                  className="form-control-styled"
                  value={createForm.supplyType}
                  onChange={(e) => setCreateForm({ ...createForm, supplyType: e.target.value })}
                >
                  {QUOTE_SUPPLY_TYPES.map((sup, idx) => (
                    <option key={idx} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>

              {/* Point of Supply */}
              <div className="form-field-box">
                <label className="field-label">
                  Point of Supply
                  <span className="field-label-hint">(if diff from recipient)</span>
                </label>
                <input
                  type="text"
                  placeholder="State / City / Place of supply"
                  className="form-control-styled"
                  value={createForm.pointOfSupply}
                  onChange={(e) => setCreateForm({ ...createForm, pointOfSupply: e.target.value })}
                />
              </div>

              {/* Pricelist */}
              <div className="form-field-box">
                <label className="field-label">Pricelist</label>
                <select
                  className="form-control-styled"
                  value={createForm.pricelist}
                  onChange={(e) => setCreateForm({ ...createForm, pricelist: e.target.value })}
                >
                  {QUOTE_PRICELISTS.map((pl, idx) => (
                    <option key={idx} value={pl}>{pl}</option>
                  ))}
                </select>
              </div>

              {/* Closure probability */}
              <div className="form-field-box">
                <label className="field-label">Closure Probability</label>
                <select
                  className="form-control-styled"
                  value={createForm.closureProbability}
                  onChange={(e) => setCreateForm({ ...createForm, closureProbability: e.target.value })}
                >
                  {['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'].map((prob) => (
                    <option key={prob} value={prob}>{prob}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Tax & Compliance Controls */}
          <div className="quote-compliance-strip">
            {/* Reverse Charge Card */}
            <div className="compliance-banner-card">
              <div className="compliance-banner-text">
                <div className="compliance-banner-title">Supply Attracts Reverse Charge</div>
                <div className="compliance-banner-desc">Tax on this supply is payable by recipient under RCM</div>
              </div>
              <div className="segmented-pill-container yes-no-pill">
                {['NO', 'YES'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`segmented-pill-item ${createForm.reverseCharge === opt ? (opt === 'YES' ? 'active-warning' : 'active') : ''}`}
                    onClick={() => setCreateForm({ ...createForm, reverseCharge: opt })}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Provisional Assessment Card */}
            <div className="compliance-banner-card">
              <div className="compliance-banner-text">
                <div className="compliance-banner-title">Provisional Tax Assessment</div>
                <div className="compliance-banner-desc">Is tax on this invoice paid under provisional assessment</div>
              </div>
              <div className="segmented-pill-container yes-no-pill">
                {['NO', 'YES'].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className={`segmented-pill-item ${createForm.provisionalAssessment === opt ? (opt === 'YES' ? 'active-warning' : 'active') : ''}`}
                    onClick={() => setCreateForm({ ...createForm, provisionalAssessment: opt })}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Product Line Items Table ─────────────────────────────────── */}
          <div className="create-quote-items-section">
            <div className="items-section-header">
              <h3>Line Items & Quotation Catalog</h3>
              <button
                type="button"
                className="btn-add-line"
                onClick={handleAddLineItem}
                title="Shortcut: Press F4"
              >
                <Plus size={16} />
                Add a line (F4)
              </button>
            </div>

            <div className="items-table-responsive-wrapper">
              <table className="create-quote-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '280px' }}>Product *</th>
                    <th style={{ width: '180px' }}>Description</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '110px' }}>Units</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Price (₹)</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Discount</th>
                    <th style={{ width: '200px' }}>Tax</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Incl_Tax</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {createForm.items.map((item, idx) => {
                    const calc = lineCalculations[idx] || {};
                    return (
                      <tr key={idx} className="quote-item-row">
                        {/* Product * */}
                        <td>
                          <input
                            list={`product-list-${idx}`}
                            type="text"
                            placeholder="Type or select product..."
                            className="table-input-text"
                            value={item.productName}
                            onChange={(e) => handleLineItemChange(idx, 'productName', e.target.value)}
                          />
                          <datalist id={`product-list-${idx}`}>
                            {productsList.map((prod, pIdx) => (
                              <option key={pIdx} value={typeof prod === 'string' ? prod : prod.name} />
                            ))}
                          </datalist>
                        </td>

                        {/* Description */}
                        <td>
                          <input
                            type="text"
                            placeholder="Line notes / specs..."
                            className="table-input-text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                          />
                        </td>

                        {/* Qty */}
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="table-input-number text-center"
                            value={item.qty}
                            onChange={(e) => handleLineItemChange(idx, 'qty', e.target.value)}
                          />
                        </td>

                        {/* Units */}
                        <td>
                          <select
                            className="table-input-select"
                            value={item.units}
                            onChange={(e) => handleLineItemChange(idx, 'units', e.target.value)}
                          >
                            {QUOTE_UNITS.map((u, uIdx) => (
                              <option key={uIdx} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>

                        {/* Price */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="table-input-number text-right"
                            value={item.price}
                            onChange={(e) => handleLineItemChange(idx, 'price', e.target.value)}
                          />
                        </td>

                        {/* Discount */}
                        <td>
                          <div className="discount-inline-group">
                            <input
                              type="number"
                              min="0"
                              className="table-input-number text-center discount-val-input"
                              value={item.discount}
                              onChange={(e) => handleLineItemChange(idx, 'discount', e.target.value)}
                            />
                            <button
                              type="button"
                              className="discount-toggle-btn"
                              onClick={() => handleLineItemChange(idx, 'discountType', item.discountType === '%' ? 'Flat' : '%')}
                              title="Toggle % or Flat"
                            >
                              {item.discountType}
                            </button>
                          </div>
                        </td>

                        {/* Tax */}
                        <td>
                          <select
                            className="table-input-select"
                            value={item.tax}
                            onChange={(e) => handleLineItemChange(idx, 'tax', e.target.value)}
                          >
                            {QUOTE_TAX_OPTIONS.map((t, tIdx) => (
                              <option key={tIdx} value={t.label}>{t.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Incl_Tax */}
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="table-checkbox"
                            checked={item.inclTax}
                            onChange={(e) => handleLineItemChange(idx, 'inclTax', e.target.checked)}
                          />
                        </td>

                        {/* Amount */}
                        <td className="text-right font-bold amount-cell">
                          ₹{Number(calc.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Delete Row */}
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn-trash-row"
                            disabled={createForm.items.length <= 1}
                            onClick={() => handleRemoveLineItem(idx)}
                            title="Remove line item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Add Line Bar */}
            <div className="items-table-footer-bar">
              <button
                type="button"
                className="btn-add-line-bottom"
                onClick={handleAddLineItem}
              >
                <Plus size={15} />
                Add a line (F4)
              </button>
            </div>
          </div>

          {/* ─── Financial Summary Box ────────────────────────────────────── */}
          <div className="create-quote-summary-panel">
            <div className="summary-card-inner">
              <div className="summary-row">
                <span className="summary-title">Subtotal:</span>
                <span className="summary-value">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-title">Taxes (GST/IGST):</span>
                <span className="summary-value">
                  ₹{taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-title">Add: Roundoff</span>
                <span className="summary-value">
                  {roundoffValue >= 0 ? `+₹${roundoffValue.toFixed(2)}` : `-₹${Math.abs(roundoffValue).toFixed(2)}`}
                </span>
              </div>

              <div className="summary-row grand-total-row">
                <span className="summary-title">Total (INR):</span>
                <span className="summary-value highlight-grand-total">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Other Details Section ────────────────────────────────────── */}
          <div className="create-quote-other-details-section">
            <h3 className="section-title">
              <Layers size={18} color="#1e3a8a" />
              Other Details
            </h3>

            <div className="other-details-grid">
              {/* In Date Time */}
              <div className="form-field-box">
                <label className="field-label">In Date Time</label>
                <input
                  type="datetime-local"
                  className="form-control-styled"
                  value={createForm.inDateTime}
                  onChange={(e) => setCreateForm({ ...createForm, inDateTime: e.target.value })}
                />
              </div>

              {/* Out Date Time */}
              <div className="form-field-box">
                <label className="field-label">Out Date Time</label>
                <input
                  type="datetime-local"
                  className="form-control-styled"
                  value={createForm.outDateTime}
                  onChange={(e) => setCreateForm({ ...createForm, outDateTime: e.target.value })}
                />
              </div>

              {/* Set Reminder */}
              <div className="form-field-box">
                <label className="field-label">Set Reminder</label>
                <input
                  type="datetime-local"
                  className="form-control-styled"
                  value={createForm.setReminder}
                  onChange={(e) => setCreateForm({ ...createForm, setReminder: e.target.value })}
                />
              </div>
            </div>

            {/* Add Delivery Details Checkbox / Expander */}
            <div className="delivery-details-toggle-box">
              <label className="delivery-checkbox-label">
                <input
                  type="checkbox"
                  checked={createForm.showDeliveryDetails}
                  onChange={(e) => setCreateForm({ ...createForm, showDeliveryDetails: e.target.checked })}
                />
                <span>Add Delivery Details?</span>
              </label>

              {createForm.showDeliveryDetails && (
                <div className="delivery-fields-box">
                  <div className="form-field-box">
                    <label className="field-label">Packing Details</label>
                    <textarea
                      rows={2}
                      placeholder="Enter packaging instructions, box counts, barcode notes..."
                      className="form-control-styled"
                      value={createForm.packingDetails}
                      onChange={(e) => setCreateForm({ ...createForm, packingDetails: e.target.value })}
                    />
                  </div>

                  <div className="form-field-box">
                    <label className="field-label">Deliver To?</label>
                    <textarea
                      rows={2}
                      placeholder="Specific delivery destination, contact person, warehouse floor..."
                      className="form-control-styled"
                      value={createForm.deliverTo}
                      onChange={(e) => setCreateForm({ ...createForm, deliverTo: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Attach Documents Section */}
            <div className="documents-attachment-section">
              <div className="attachment-header">
                <div>
                  <h4 className="attachment-title">Attach Documents</h4>
                  <p className="attachment-hint">
                    Allowed File Formats <code>*.jpg, *.png, *.gif, *.txt, *.xls, *.doc, *.xlsx</code> (Allowed Size 2M)
                  </p>
                </div>
                <div>
                  <label className="btn-add-attachment">
                    <UploadCloud size={15} />
                    Add new
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded files badges */}
              {createForm.attachments.length > 0 && (
                <div className="attachments-list-badges">
                  {createForm.attachments.map((att, aIdx) => (
                    <div key={aIdx} className="attachment-badge">
                      <File size={14} color="#1e3a8a" />
                      <span className="attachment-name">{att.name}</span>
                      <span className="attachment-size">({att.size})</span>
                      <button
                        type="button"
                        className="btn-remove-att"
                        onClick={() => handleRemoveAttachment(aIdx)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks & Terms */}
            <div className="create-quote-notes-grid">
              <div className="form-field-box">
                <label className="field-label">Remarks / Internal Notes</label>
                <textarea
                  rows={3}
                  placeholder="Quotation remarks, special customer instructions..."
                  className="form-control-styled"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>

              <div className="form-field-box">
                <label className="field-label">Terms & Conditions</label>
                <textarea
                  rows={3}
                  className="form-control-styled"
                  value={createForm.termsAndConditions}
                  onChange={(e) => setCreateForm({ ...createForm, termsAndConditions: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* ─── Bottom Actions Bar ────────────────────────────────────────── */}
          <div className="create-quote-footer-actions">
            <button
              type="button"
              className="btn-secondary-outline"
              onClick={() => {
                if (window.confirm('Discard unsaved quote changes and return to Quotes list?')) {
                  setViewMode('list');
                }
              }}
            >
              <X size={16} />
              Cancel
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary-outline"
                onClick={() => handleSaveQuote(true)}
              >
                <Send size={16} />
                Save & Send
              </button>
              <button
                type="button"
                className="btn-primary-gradient"
                onClick={() => handleSaveQuote(false)}
              >
                <Check size={18} />
                {editingQuote ? 'Update Quotation' : 'Save Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: QUOTES LIST VIEW (DEFAULT)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="quotes-container">
      {/* Toast */}
      {toastMessage && (
        <div className="quote-toast-notification">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          1. HEADER WITH ACTIONS
          ─────────────────────────────────────────────────────────── */}
      <div className="quotes-header">
        <div className="quotes-header-left">
          <h2>
            <Receipt size={24} color="#1e3a8a" />
            Quotations Management
          </h2>
          <p>Create, track, print, convert, and manage enterprise client quotations & proposals.</p>
        </div>

        <div className="quotes-header-actions">
          <button
            type="button"
            className="btn-secondary-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print Report
          </button>
          <button
            type="button"
            className="btn-primary-gradient"
            onClick={handleOpenCreatePage}
          >
            <Plus size={16} />
            Create Quote
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. SEARCH & ADVANCE FILTERS PANEL
          ─────────────────────────────────────────────────────────── */}
      <div className="quotes-filter-card">
        {/* Primary Search Bar with Quote ID & Advance Search Toggle */}
        <form onSubmit={handleApplyFilter} className="quotes-primary-search-bar">
          <div className="quote-id-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Quote Id (e.g. QC-2024-001)..."
              value={quoteIdFilter}
              onChange={(e) => setQuoteIdFilter(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary-gradient"
            style={{ height: '42px', padding: '0 20px' }}
          >
            <Search size={16} />
            Search
          </button>

          <button
            type="button"
            className={`btn-advance-search ${showAdvanceSearch ? 'active' : ''}`}
            onClick={() => setShowAdvanceSearch(!showAdvanceSearch)}
            title="Toggle Advance Search Filters"
          >
            <SlidersHorizontal size={16} />
            Advance Search
            {activeAdvanceFiltersCount > 0 && (
              <span className="advance-filter-badge">{activeAdvanceFiltersCount}</span>
            )}
            {showAdvanceSearch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            type="button"
            className="btn-secondary-outline"
            style={{ height: '42px' }}
            onClick={handleResetFilters}
            title="Reset All Filters"
          >
            <RotateCcw size={15} />
            Reset
          </button>
        </form>

        {/* Advance Search Filters - Rendered ONLY when showAdvanceSearch is true */}
        {showAdvanceSearch && (
          <div className="quotes-advance-panel">
            <div className="filter-card-header">
              <span className="filter-card-title">
                <Filter size={16} color="#0284c7" />
                Advance Filter Criteria
              </span>
              <div className="filter-actions-top">
                <button
                  type="button"
                  className="btn-secondary-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={13} />
                  Clear All
                </button>
              </div>
            </div>

            <form onSubmit={handleApplyFilter} className="quotes-filter-grid">
              {/* 1. Date Range *to */}
              <div className="filter-group">
                <label>Date Range *to</label>
                <div className="filter-input-row">
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    title="From Date (dd-mm-yyyy)"
                    placeholder="dd-mm-yyyy"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    title="To Date (dd-mm-yyyy)"
                    placeholder="dd-mm-yyyy"
                  />
                </div>
              </div>

              {/* 2. Customer */}
              <div className="filter-group">
                <label>Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                >
                  <option value="All">Select a Customer</option>
                  {customersList.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name} {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Closure Probability (%) */}
              <div className="filter-group">
                <label>Closure Probability (%)</label>
                <div className="filter-input-row">
                  <input
                    type="number"
                    placeholder="From %"
                    min="0"
                    max="100"
                    value={probFromFilter}
                    onChange={(e) => setProbFromFilter(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="To %"
                    min="0"
                    max="100"
                    value={probToFilter}
                    onChange={(e) => setProbToFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* 4. Quote Type */}
              <div className="filter-group">
                <label>Quote Type</label>
                <select
                  value={quoteTypeFilter}
                  onChange={(e) => setQuoteTypeFilter(e.target.value)}
                >
                  <option value="All Quotes">All Quotes</option>
                  <option value="Sample Products">Sample Products</option>
                </select>
              </div>

              {/* 5. Quote Status */}
              <div className="filter-group">
                <label>Quote Status</label>
                <select
                  value={quoteStatusFilter}
                  onChange={(e) => setQuoteStatusFilter(e.target.value)}
                >
                  <option value="All Quotes">All Quotes</option>
                  <option value="Pending Quotes">Pending Quotes</option>
                  <option value="Closed Quotes">Closed Quotes</option>
                </select>
              </div>

              {/* 6. Convert Status */}
              <div className="filter-group">
                <label>Convert Status</label>
                <select
                  value={convertStatusFilter}
                  onChange={(e) => setConvertStatusFilter(e.target.value)}
                >
                  <option value="All Quotes">All Quotes</option>
                  <option value="Pending">Pending</option>
                  <option value="Proforma Invoice">Proforma Invoice</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Sales Order">Sales Order</option>
                </select>
              </div>

              {/* 7. Setting Type */}
              <div className="filter-group">
                <label>Setting Type</label>
                <select
                  value={settingTypeFilter}
                  onChange={(e) => setSettingTypeFilter(e.target.value)}
                >
                  <option value="-Select Setting Type-">-Select Setting Type-</option>
                  <option value="GST Quote">GST Quote</option>
                  <option value="KC">KC</option>
                </select>
              </div>

              {/* 8. Total Amount */}
              <div className="filter-group">
                <label>Total Amount</label>
                <div className="filter-input-row">
                  <select
                    value={amountOpFilter}
                    onChange={(e) => setAmountOpFilter(e.target.value)}
                    style={{ minWidth: '95px' }}
                  >
                    <option value="-Select-">-Select-</option>
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                  </select>
                  <span>with</span>
                  <input
                    type="number"
                    placeholder="Amount ₹"
                    value={amountValFilter}
                    onChange={(e) => setAmountValFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* 9. Executives */}
              <div className="filter-group">
                <label>Executives</label>
                <select
                  value={executiveFilter}
                  onChange={(e) => setExecutiveFilter(e.target.value)}
                >
                  <option value="-Select-">-Select-</option>
                  {employeesList.map((exec, i) => (
                    <option key={i} value={exec}>{exec}</option>
                  ))}
                </select>
              </div>

              {/* 10. Product */}
              <div className="filter-group">
                <label>Product</label>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="Select a Product">Select a Product</option>
                  {productsList.map((prod, i) => (
                    <option key={i} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>

              {/* Bottom Buttons */}
              <div className="filter-submit-group">
                <button type="submit" className="btn-primary-gradient">
                  <Search size={15} />
                  Apply Advance Filters
                </button>
                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. QUOTES DATA TABLE (Enterprise Grid Layout)
          ─────────────────────────────────────────────────────────── */}
      <div className="quotes-table-container">
        {/* Top Action Bar */}
        <div className="quotes-table-topbar">
          <div className="topbar-left-actions">
            <button
              type="button"
              className="btn-delete-bulk"
              onClick={handleBulkDelete}
              title={selectedQuoteIds.length > 0 ? `Delete (${selectedQuoteIds.length}) selected quotes` : 'Select quotes to delete'}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
          <div className="topbar-right-actions">
            <button type="button" className="btn-table-settings" title="Table Settings">
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Displaying Results Count */}
        <div className="results-displaying-text">
          Displaying {quotes.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount} results.
        </div>

        <div className="quotes-table-responsive">
          <table className="enterprise-quotes-table">
            <thead>
              <tr>
                <th style={{ width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={quotes.length > 0 && selectedQuoteIds.length === quotes.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('quoteId')} className="sortable-th">
                  Quote # {sortBy === 'quoteId' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('quoteAmt')} className="sortable-th" style={{ textAlign: 'right' }}>
                  Amount {sortBy === 'quoteAmt' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('custName')} className="sortable-th">
                  Customer Name {sortBy === 'custName' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th>Executive</th>
                <th onClick={() => handleSort('quoteDate')} className="sortable-th">
                  Date {sortBy === 'quoteDate' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'center' }}>Age of Quote</th>
                <th style={{ textAlign: 'center' }}>Closure Probability(%)</th>
                <th>Status</th>
                <th>Converted To</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: '10px', color: '#64748b' }}>Loading quotation records...</p>
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '50px 20px' }}>
                    <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                    <h4 style={{ margin: 0, color: '#334155' }}>No quotations found</h4>
                    <p style={{ margin: '6px 0 16px', color: '#64748b', fontSize: '0.875rem' }}>
                      Try adjusting your filter criteria or create a new quote proposal.
                    </p>
                    <button
                      type="button"
                      className="btn-primary-gradient"
                      onClick={handleOpenCreatePage}
                    >
                      <Plus size={16} /> Create Quote
                    </button>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const qId = quote._id || quote.quoteId;
                  const isSelected = selectedQuoteIds.includes(qId);
                  const isDropdownOpen = openDropdownId === qId;

                  const formattedDate = quote.quoteDate
                    ? new Date(quote.quoteDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'N/A';

                  const ageDays = calculateAgeDays(quote.quoteDate);
                  const probPercent = parseInt(quote.closureProbability, 10) || 0;

                  return (
                    <tr key={qId} className={`table-row ${isSelected ? 'row-selected' : ''}`}>
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(qId)}
                        />
                      </td>

                      {/* Quote # */}
                      <td className="cell-quote-id">
                        {quote.quoteId}
                      </td>

                      {/* Amount */}
                      <td className="cell-amount" style={{ textAlign: 'right' }}>
                        {Number(quote.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Customer Name */}
                      <td className="cell-customer">
                        {quote.customerName}
                      </td>

                      {/* Executive */}
                      <td className="cell-executive">
                        {quote.executive && quote.executive !== 'Approval Pending' ? quote.executive : ''}
                      </td>

                      {/* Date */}
                      <td className="cell-date">
                        {formattedDate}
                      </td>

                      {/* Age of Quote */}
                      <td className="cell-age" style={{ textAlign: 'center' }}>
                        {ageDays}
                      </td>

                      {/* Closure Probability(%) */}
                      <td className="cell-prob" style={{ textAlign: 'center' }}>
                        {probPercent}
                      </td>

                      {/* Status */}
                      <td className="cell-status">
                        {quote.status || 'Pending'}
                      </td>

                      {/* Converted To */}
                      <td className="cell-converted">
                        {quote.convertedTo || 'Pending'}
                      </td>

                      {/* Action Dropdown (12 Actions) */}
                      <td className="cell-action" ref={isDropdownOpen ? dropdownRef : null} style={{ textAlign: 'center' }}>
                        <div className="action-dropdown-container">
                          <button
                            type="button"
                            className={`btn-table-action ${isDropdownOpen ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(isDropdownOpen ? null : qId);
                            }}
                          >
                            <span>Action</span>
                            <span className="action-caret">▼</span>
                          </button>

                          {isDropdownOpen && (
                            <div className="action-floating-menu">
                              {/* 1. View */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleViewQuote(quote)}
                              >
                                <Eye size={13} color="#2563eb" />
                                <span>View Quote</span>
                              </button>

                              {/* 2. PDF */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handlePdfQuote(quote)}
                              >
                                <FileDown size={13} color="#dc2626" />
                                <span>PDF Quote</span>
                              </button>

                              {/* 3. Mail */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleMailQuote(quote)}
                              >
                                <Mail size={13} color="#0284c7" />
                                <span>Mail Quote</span>
                              </button>

                              {/* 4. Print */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handlePrintQuote(quote)}
                              >
                                <Printer size={13} color="#475569" />
                                <span>Print Quote</span>
                              </button>

                              <div className="action-floating-divider" />

                              {/* 5. Update */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleUpdateQuote(quote)}
                              >
                                <Edit2 size={13} color="#16a34a" />
                                <span>Update Quote</span>
                              </button>

                              {/* 6. Delete */}
                              <button
                                type="button"
                                className="action-floating-item danger"
                                onClick={() => handleDeleteQuote(quote._id, quote.quoteId)}
                              >
                                <X size={13} color="#dc2626" />
                                <span>Delete Quote</span>
                              </button>

                              <div className="action-floating-divider" />

                              {/* 7. Convert as Invoice */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleConvertAsInvoice(quote)}
                              >
                                <Receipt size={13} color="#0284c7" />
                                <span>Convert as Invoice</span>
                              </button>

                              {/* 8. Convert as Proforma */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleConvertAsProforma(quote)}
                              >
                                <FileText size={13} color="#b45309" />
                                <span>Convert as Proforma</span>
                              </button>

                              {/* 9. Convert as Sales Order */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleConvertAsSalesOrder(quote)}
                              >
                                <ShoppingBag size={13} color="#7c3aed" />
                                <span>Convert as Sales Order</span>
                              </button>

                              <div className="action-floating-divider" />

                              {/* 10. Whatsapp */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleWhatsappQuote(quote)}
                              >
                                <MessageCircle size={13} color="#16a34a" />
                                <span>Whatsapp Quote</span>
                              </button>

                              {/* 11. Duplicate */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleDuplicateQuote(quote)}
                              >
                                <Copy size={13} color="#475569" />
                                <span>Duplicate Quote</span>
                              </button>

                              {/* 12. Attachments */}
                              <button
                                type="button"
                                className="action-floating-item"
                                onClick={() => handleDownloadAttachments(quote)}
                              >
                                <Paperclip size={13} color="#64748b" />
                                <span>Download Attachments</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination Bar */}
        <div className="table-pagination-wrapper">
          <div className="table-pagination-group">
            <button
              type="button"
              className="pagination-step-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              «
            </button>
            {Array.from({ length: Math.max(1, Math.min(10, Math.ceil(totalCount / pageSize))) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`pagination-num-btn ${currentPage === pg ? 'active' : ''}`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              className="pagination-step-btn"
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. VIEW / PRINT QUOTATION MODAL
          ─────────────────────────────────────────────────────────── */}
      {viewingQuote && (
        <div className="quote-modal-overlay">
          <div className="quote-modal-content" style={{ maxWidth: '900px' }}>
            <div className="quote-modal-header">
              <h3>
                <FileText size={20} color="#0284c7" />
                Quotation Preview - {viewingQuote.quoteId}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print
                </button>
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={() => setViewingQuote(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="quote-modal-body">
              <div className="printable-quote-paper">
                {/* Header */}
                <div className="quote-company-header">
                  <div className="company-branding">
                    <h2>KLEIDER CARE ERP</h2>
                    <p>Enterprise Laundry & IT Infrastructure Services</p>
                    <p>GSTIN: 33AAACK9821Q1Z4 | Email: contact@kleidercare.com</p>
                  </div>
                  <div className="quote-doc-title">
                    <h1>QUOTATION</h1>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0284c7' }}>#{viewingQuote.quoteId}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Date: {new Date(viewingQuote.quoteDate || Date.now()).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                {/* Customer & Quote Meta */}
                <div className="quote-meta-grid">
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#334155' }}>Quote To (Customer):</h4>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#0f172a' }}>{viewingQuote.customerName}</p>
                    {viewingQuote.customerPhone && (
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#475569' }}>Phone: {viewingQuote.customerPhone}</p>
                    )}
                    {viewingQuote.customerEmail && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Email: {viewingQuote.customerEmail}</p>
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#334155' }}>Proposal Details:</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Executive:</strong> {viewingQuote.executive}</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Setting Type:</strong> {viewingQuote.settingType || 'GST Quote'}</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>Closure Probability:</strong> {viewingQuote.closureProbability}%</p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Status:</strong> {viewingQuote.status} | <strong>Converted:</strong> {viewingQuote.convertedTo || 'Pending'}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="quote-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>GST Rate</th>
                      <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuote.items?.map((item, idx) => {
                      const itemSub = (item.quantity || item.qty || 1) * (item.unitPrice || item.price || 0);
                      const itemTax = (itemSub * (item.taxRate || 18)) / 100;
                      const itemTotal = itemSub + itemTax;
                      return (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{item.productName}</strong>
                            {item.description && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.description}</div>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity || item.qty}</td>
                          <td style={{ textAlign: 'right' }}>₹{Number(item.unitPrice || item.price).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right' }}>{item.taxRate || 18}%</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Math.round(itemTotal).toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="quote-summary-box">
                  <div className="summary-rows">
                    <div className="summary-line">
                      <span>Subtotal:</span>
                      <span>₹{Number(viewingQuote.subTotal || viewingQuote.totalAmount * 0.84).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-line">
                      <span>Estimated GST (18%):</span>
                      <span>₹{Number(viewingQuote.taxAmount || viewingQuote.totalAmount * 0.16).toLocaleString('en-IN')}</span>
                    </div>
                    {viewingQuote.discountAmount > 0 && (
                      <div className="summary-line" style={{ color: '#16a34a' }}>
                        <span>Discount Applied:</span>
                        <span>-₹{Number(viewingQuote.discountAmount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="summary-line total-line">
                      <span>Grand Total:</span>
                      <span>₹{Number(viewingQuote.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Terms */}
                {viewingQuote.notes && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Remarks: </strong>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>{viewingQuote.notes}</span>
                  </div>
                )}
                {viewingQuote.termsAndConditions && (
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'pre-line' }}>
                    <strong>Terms & Conditions:</strong><br />
                    {viewingQuote.termsAndConditions}
                  </div>
                )}
              </div>
            </div>

            <div className="quote-modal-footer">
              <button
                type="button"
                className="btn-secondary-outline"
                onClick={() => setViewingQuote(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary-gradient"
                onClick={() => {
                  const q = viewingQuote;
                  setViewingQuote(null);
                  handleMailQuote(q);
                }}
              >
                <Mail size={15} /> Email to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          5. MAIL QUOTE MODAL
          ─────────────────────────────────────────────────────────── */}
      {mailingQuote && (
        <div className="quote-modal-overlay">
          <div className="quote-modal-content" style={{ maxWidth: '600px' }}>
            <div className="quote-modal-header">
              <h3>
                <Mail size={18} color="#0284c7" />
                Mail Quotation #{mailingQuote.quoteId}
              </h3>
              <button
                type="button"
                className="action-icon-btn"
                onClick={() => setMailingQuote(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMail}>
              <div className="quote-modal-body">
                <div className="filter-group">
                  <label>Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={mailForm.to}
                    onChange={(e) => setMailForm({ ...mailForm, to: e.target.value })}
                  />
                </div>

                <div className="filter-group">
                  <label>Email Subject</label>
                  <input
                    type="text"
                    required
                    value={mailForm.subject}
                    onChange={(e) => setMailForm({ ...mailForm, subject: e.target.value })}
                  />
                </div>

                <div className="filter-group">
                  <label>Message / Body</label>
                  <textarea
                    rows={6}
                    required
                    style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', lineHeight: '1.4' }}
                    value={mailForm.body}
                    onChange={(e) => setMailForm({ ...mailForm, body: e.target.value })}
                  />
                </div>
              </div>

              <div className="quote-modal-footer">
                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={() => setMailingQuote(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gradient"
                >
                  <Send size={15} />
                  Send Quote Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
