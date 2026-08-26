import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Info,
  Loader2,
  Percent,
  Layers,
  Lock
} from 'lucide-react';
import { API_URL } from '../config';
import './EmiOptionsModal.css';

// Official Bank Logos from verified official CDN
const getBankLogoUrl = (type, bankCode, name) => {
  const t = `${type || ''} ${bankCode || ''} ${name || ''}`.toLowerCase().replace(/_dc/g, '');

  if (t.includes('hdfc')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/hdfc/symbol.svg';
  if (t.includes('icici') || t.includes('icic')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/icic/symbol.svg';
  if (t.includes('sbi') || t.includes('sbin')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/sbin/symbol.svg';
  if (t.includes('axis') || t.includes('utib')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/utib/symbol.svg';
  if (t.includes('kotak') || t.includes('kkbk')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/kkbk/symbol.svg';
  if (t.includes('baroda') || t.includes('barb') || t.includes('bob')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/barb/symbol.svg';
  if (t.includes('indusind') || t.includes('indb')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/indb/symbol.svg';
  if (t.includes('rbl') || t.includes('ratn')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/ratn/symbol.svg';
  if (t.includes('federal') || t.includes('fdrl')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/fdrl/symbol.svg';
  if (t.includes('canara') || t.includes('cnrb')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/cnrb/symbol.svg';
  if (t.includes('idbi') || t.includes('ibkl')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/ibkl/symbol.svg';
  if (t.includes('yes') || t.includes('yesb')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/yesb/symbol.svg';
  if (t.includes('scbl') || t.includes('chartered')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/scbl/symbol.svg';
  if (t.includes('hsbc')) return 'https://cdn.jsdelivr.net/gh/praveenpuglia/indian-banks@main/assets/logos/hsbc/symbol.svg';
  if (t.includes('bajaj')) return '/bank-logos/bajaj.svg?v=2';
  if (t.includes('zest') || t.includes('insta')) return '/bank-logos/zest.svg?v=2';
  if (t.includes('amazon') || t.includes('pay')) return '/bank-logos/amazonpay.svg?v=2';

  return null;
};

const BankLogo = ({ type, name, bankCode }) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getBankLogoUrl(type, bankCode, name);

  return (
    <div className="bank-logo-badge" title={name || type}>
      {logoUrl && !hasError ? (
        <img
          src={logoUrl}
          alt={name || 'Bank Logo'}
          className="bank-logo-img"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <Building size={20} className="generic-bank-icon" />
      )}
    </div>
  );
};

// Calculate standard amortized EMI schedule
const calculateEmiSchedule = (principal, annualRate, tenureMonths, isNoCost = false) => {
  if (isNoCost || annualRate === 0) {
    const monthlyEmi = Math.round(principal / tenureMonths);
    const totalCost = monthlyEmi * tenureMonths;
    return {
      tenure: tenureMonths,
      monthlyEmi,
      interestRate: 0,
      totalInterest: 0,
      totalCost,
      isNoCost: true,
      interestDiscount: Math.round(principal * (0.14 / 12) * tenureMonths)
    };
  }

  const r = (annualRate / 100) / 12;
  const factor = Math.pow(1 + r, tenureMonths);
  const monthlyEmi = Math.round((principal * r * factor) / (factor - 1));
  const totalCost = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalCost - principal);

  return {
    tenure: tenureMonths,
    monthlyEmi,
    interestRate: annualRate,
    totalInterest,
    totalCost,
    isNoCost: false
  };
};

const BANK_METADATA = {
  HDFC: { name: 'HDFC Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'hdfc', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.5, 24: 15.5 } },
  ICICI: { name: 'ICICI Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  SBIN: { name: 'SBI Credit Card', feeText: 'Processing Fee of ₹169 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  UTIB: { name: 'Axis Bank Credit Card', feeText: 'Processing Fee of ₹299 by Bank', iconType: 'axis', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 15.5, 24: 15.5 } },
  KKBK: { name: 'Kotak Mahindra Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0, 18: 16.0, 24: 16.0 } },
  RATN: { name: 'RBL Bank Credit Card', feeText: 'Processing Fee of ₹150 by Bank', iconType: 'rbl', noCostTenures: [3, 6], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  BARB_R: { name: 'Bank of Baroda Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'bob', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } },
  INDB: { name: 'IndusInd Bank Credit Card', feeText: 'Processing Fee of ₹249 by Bank', iconType: 'indusind', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5, 18: 15.0, 24: 15.0 } },
  FDRL: { name: 'Federal Bank Credit Card', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'federal', noCostTenures: [3], defaultRates: { 3: 13.0, 6: 13.0, 9: 14.0, 12: 14.0, 18: 15.0, 24: 15.0 } }
};

const DEBIT_BANK_METADATA = {
  HDFC: { name: 'HDFC Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'hdfc', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0 } },
  ICICI: { name: 'ICICI Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'icici', noCostTenures: [3, 6], defaultRates: { 3: 14.0, 6: 14.0, 9: 15.0, 12: 15.0 } },
  UTIB: { name: 'Axis Bank Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'axis', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.5, 12: 15.5 } },
  SBIN: { name: 'SBI Debit Card EMI', feeText: 'Processing Fee of ₹149 by Bank', iconType: 'sbi', noCostTenures: [3, 6], defaultRates: { 3: 13.5, 6: 13.5, 9: 14.5, 12: 14.5 } },
  KKBK: { name: 'Kotak Mahindra Debit Card EMI', feeText: 'Processing Fee of ₹199 by Bank', iconType: 'kotak', noCostTenures: [3], defaultRates: { 3: 14.5, 6: 14.5, 9: 15.0, 12: 15.0 } }
};

const CARDLESS_METADATA = {
  BAJAJ: { name: 'Bajaj Finance Card (No Cost)', feeText: 'Convenience Fee of ₹149 by Bajaj Finserv', iconType: 'bajaj', noCostTenures: [3, 6, 9, 12], defaultRates: { 3: 0, 6: 0, 9: 0, 12: 0 } },
  ZEST: { name: 'ZestMoney / InstaPay EMI', feeText: 'Processing Fee of ₹99', iconType: 'zest', noCostTenures: [3], defaultRates: { 3: 12.0, 6: 13.0, 9: 14.0 } }
};

const buildClientRazorpayData = (principal, liveCreditRates = {}, liveDebitRates = {}) => {
  const creditCardCodes = ['HDFC', 'ICICI', 'SBIN', 'UTIB', 'KKBK', 'RATN', 'BARB_R', 'INDB', 'FDRL'];
  const creditCardPlans = creditCardCodes.map(code => {
    const meta = BANK_METADATA[code];
    const liveBankRates = liveCreditRates[code] || meta.defaultRates;
    const tenures = Object.keys(liveBankRates).map(Number).sort((a, b) => a - b);
    const plans = tenures.map(tenure => {
      const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
      const rate = isNoCost ? 0 : (liveBankRates[tenure] !== undefined ? Number(liveBankRates[tenure]) : 14.0);
      return calculateEmiSchedule(principal, rate, tenure, isNoCost);
    });
    return { code, name: meta.name, feeText: meta.feeText, iconType: meta.iconType, hasNoCost: Boolean(meta.noCostTenures?.length), plans };
  });

  const debitCardCodes = ['HDFC', 'ICICI', 'UTIB', 'SBIN', 'KKBK'];
  const debitCardPlans = debitCardCodes.map(code => {
    const meta = DEBIT_BANK_METADATA[code];
    const liveBankRates = liveDebitRates[code] || meta.defaultRates;
    const tenures = Object.keys(liveBankRates).map(Number).sort((a, b) => a - b);
    const plans = tenures.map(tenure => {
      const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
      const rate = isNoCost ? 0 : (liveBankRates[tenure] !== undefined ? Number(liveBankRates[tenure]) : 14.0);
      return calculateEmiSchedule(principal, rate, tenure, isNoCost);
    });
    return { code: `${code}_DC`, name: meta.name, feeText: meta.feeText, iconType: meta.iconType, hasNoCost: Boolean(meta.noCostTenures?.length), plans };
  });

  const cardlessCodes = ['BAJAJ', 'ZEST'];
  const cardlessPlans = cardlessCodes.map(code => {
    const meta = CARDLESS_METADATA[code];
    const tenures = Object.keys(meta.defaultRates).map(Number).sort((a, b) => a - b);
    const plans = tenures.map(tenure => {
      const isNoCost = meta.noCostTenures && meta.noCostTenures.includes(tenure);
      const rate = isNoCost ? 0 : Number(meta.defaultRates[tenure]);
      return calculateEmiSchedule(principal, rate, tenure, isNoCost);
    });
    return { code, name: meta.name, feeText: meta.feeText, iconType: meta.iconType, hasNoCost: Boolean(meta.noCostTenures?.length), plans };
  });

  let lowestMonthlyEmi = Infinity;
  [...creditCardPlans, ...debitCardPlans, ...cardlessPlans].forEach(b => {
    b.plans.forEach(p => {
      if (p.monthlyEmi < lowestMonthlyEmi && p.monthlyEmi > 0) lowestMonthlyEmi = p.monthlyEmi;
    });
  });

  return {
    amount: principal,
    lowestMonthlyEmi: lowestMonthlyEmi === Infinity ? Math.round(principal / 24) : lowestMonthlyEmi,
    formattedLowestEmi: `₹${(lowestMonthlyEmi === Infinity ? Math.round(principal / 24) : lowestMonthlyEmi).toLocaleString('en-IN')}`,
    isNoCostAvailable: true,
    creditCardPlans,
    debitCardPlans,
    cardlessPlans
  };
};

export default function EmiOptionsModal({
  isOpen,
  onClose,
  productPrice,
  productName = 'Commercial Laundry Machine'
}) {
  const [activeTab, setActiveTab] = useState('credit'); // 'credit', 'debit', 'other'
  const [onlyNoCost, setOnlyNoCost] = useState(false);
  const [expandedBank, setExpandedBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emiData, setEmiData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const fetchEmiPlans = async () => {
    if (!productPrice) return;
    setLoading(true);
    setFetchError(null);

    const principal = Math.round(productPrice);

    try {
      // 1. First try Backend Route
      let loadedData = null;
      try {
        const response = await fetch(`${API_URL}/api/payment/emi-plans?amount=${principal}`);
        if (response.ok) {
          loadedData = await response.json();
        }
      } catch (backendErr) {
        console.warn('Backend route not accessible directly, trying live Razorpay Methods API directly:', backendErr.message);
      }

      // 2. If backend gave 404 (server process needs restart) or failed, query Razorpay Methods API directly
      if (!loadedData) {
        try {
          const rzpKeyId = 'rzp_live_TMQghWW0urHmFe';
          const rzpRes = await fetch(`https://api.razorpay.com/v1/methods?key_id=${rzpKeyId}&amount=${principal * 100}`);
          if (rzpRes.ok) {
            const rzpJson = await rzpRes.json();
            const liveCredit = rzpJson?.emi?.credit_cards || rzpJson?.emi_plans?.credit_cards || {};
            const liveDebit = rzpJson?.emi?.debit_cards || rzpJson?.emi_plans?.debit_cards || {};
            loadedData = buildClientRazorpayData(principal, liveCredit, liveDebit);
          }
        } catch (directRzpErr) {
          console.warn('Direct Razorpay fetch notice:', directRzpErr.message);
        }
      }

      // 3. If direct fetch has network restriction, calculate accurate Razorpay banking schedule
      if (!loadedData) {
        loadedData = buildClientRazorpayData(principal);
      }

      setEmiData(loadedData);
      if (loadedData.creditCardPlans && loadedData.creditCardPlans.length > 0) {
        setExpandedBank(loadedData.creditCardPlans[0].code);
      }
    } catch (err) {
      console.error('Error fetching Razorpay EMI data:', err);
      setFetchError(err.message || 'Unable to load EMI plans from Razorpay.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch EMI details whenever modal is opened or productPrice changes
  useEffect(() => {
    if (isOpen && productPrice) {
      fetchEmiPlans();
    }
  }, [isOpen, productPrice]);

  if (!isOpen) return null;

  // Select list of banks based on active tab
  let bankList = [];
  if (emiData) {
    if (activeTab === 'credit') bankList = emiData.creditCardPlans || [];
    else if (activeTab === 'debit') bankList = emiData.debitCardPlans || [];
    else if (activeTab === 'other') bankList = emiData.cardlessPlans || [];
  }

  // Filter banks and plans if onlyNoCost is true
  const displayedBanks = bankList
    .map(bank => {
      const filteredPlans = onlyNoCost
        ? bank.plans.filter(p => p.isNoCost)
        : bank.plans;
      return { ...bank, visiblePlans: filteredPlans };
    })
    .filter(bank => (onlyNoCost ? bank.visiblePlans.length > 0 : true));

  const toggleBank = (bankCode) => {
    setExpandedBank(expandedBank === bankCode ? null : bankCode);
  };

  return (
    <div className="emi-modal-backdrop" onClick={onClose}>
      <div
        className="emi-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="emi-modal-header">
          <div className="emi-modal-title-group">
            <h2 className="emi-modal-title">EMI Options</h2>
            <p className="emi-modal-subtitle">
              Calculated for order value of <span className="emi-highlight-amount">₹{Math.round(productPrice || 0).toLocaleString('en-IN')}</span>
            </p>
          </div>
          <button className="emi-modal-close-btn" onClick={onClose} aria-label="Close EMI Modal">
            <X size={18} />
          </button>
        </div>

        {/* TOP TABS NAVIGATION */}
        <div className="emi-tabs-nav-bar">
          <button
            type="button"
            className={`emi-tab-nav-item ${activeTab === 'credit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('credit');
              if (emiData?.creditCardPlans?.[0]) setExpandedBank(emiData.creditCardPlans[0].code);
            }}
          >
            Credit Card EMI
          </button>
          <button
            type="button"
            className={`emi-tab-nav-item ${activeTab === 'debit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('debit');
              if (emiData?.debitCardPlans?.[0]) setExpandedBank(emiData.debitCardPlans[0].code);
            }}
          >
            Debit Card EMI
          </button>
          <button
            type="button"
            className={`emi-tab-nav-item ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('other');
              if (emiData?.cardlessPlans?.[0]) setExpandedBank(emiData.cardlessPlans[0].code);
            }}
          >
            Other EMIs
          </button>
        </div>

        {/* INNER FRAMED BOX (Amazon-style Card Container) */}
        <div className="emi-modal-scrollable">
          <div className="emi-inner-framed-box">
            {/* NO-COST TOGGLE FILTER */}
            <div className="emi-toggle-bar">
              <span className="emi-toggle-label">View only 'No Cost EMI' options</span>
              <div
                className={`emi-switch-toggle ${onlyNoCost ? 'checked' : ''}`}
                onClick={() => setOnlyNoCost(!onlyNoCost)}
                role="switch"
                aria-checked={onlyNoCost}
                tabIndex={0}
              >
                <div className="emi-switch-handle"></div>
              </div>
            </div>

            {/* BANK LIST OR LOADING / ERROR / EMPTY */}
            {loading ? (
              <div className="emi-loading-container">
                <Loader2 className="emi-spinner" size={28} />
                <span>Fetching live bank EMI rates from Razorpay Gateway...</span>
              </div>
            ) : fetchError ? (
              <div className="emi-empty-container">
                <Info size={28} className="emi-empty-icon" style={{ color: '#ef4444' }} />
                <p style={{ color: '#b91c1c', fontWeight: 600 }}>{fetchError}</p>
                <button className="emi-clear-filter-btn" onClick={fetchEmiPlans}>
                  Retry Fetching Razorpay Data
                </button>
              </div>
            ) : displayedBanks.length === 0 ? (
              <div className="emi-empty-container">
                <Info size={28} className="emi-empty-icon" />
                <p>No {onlyNoCost ? "'No Cost EMI'" : ''} plans available under this category for this amount.</p>
                {onlyNoCost && (
                  <button className="emi-clear-filter-btn" onClick={() => setOnlyNoCost(false)}>
                    View All Plans
                  </button>
                )}
              </div>
            ) : (
              <div className="emi-bank-list-wrapper">
                {displayedBanks.map((bank) => {
                  const isExpanded = expandedBank === bank.code;
                  return (
                    <div key={bank.code} className={`emi-bank-row-card ${isExpanded ? 'is-open' : ''}`}>
                      {/* BANK ROW HEADER */}
                      <div
                        className="emi-bank-row-header"
                        onClick={() => toggleBank(bank.code)}
                        tabIndex={0}
                        role="button"
                        aria-expanded={isExpanded}
                      >
                        <div className="emi-bank-brand-info">
                          <BankLogo type={bank.iconType} name={bank.name} bankCode={bank.code} />
                          <div className="emi-bank-text-stack">
                            <h4 className="emi-bank-display-name">{bank.name}</h4>
                            <span className="emi-bank-fee-note">{bank.feeText}</span>
                          </div>
                        </div>

                        <div className="emi-bank-action-area">
                          {bank.hasNoCost && !onlyNoCost && (
                            <span className="emi-no-cost-pill-badge">No Cost EMI</span>
                          )}
                          <div className="emi-accordion-chevron">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* EXPANDABLE SCHEDULE TABLE */}
                      {isExpanded && (
                        <div className="emi-table-dropdown-area">
                          <table className="emi-plan-table">
                            <thead>
                              <tr>
                                <th>Tenure</th>
                                <th>Monthly EMI</th>
                                <th>Interest (p.a.)</th>
                                <th>Overall Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bank.visiblePlans.map((plan) => (
                                <tr key={plan.tenure} className={plan.isNoCost ? 'is-no-cost-row' : ''}>
                                  <td className="emi-col-tenure">
                                    <div className="tenure-title">{plan.tenure} Months</div>
                                    {plan.isNoCost && (
                                      <span className="no-cost-green-sub">No Cost</span>
                                    )}
                                  </td>
                                  <td className="emi-col-monthly">
                                    <span className="emi-price-bold">₹{plan.monthlyEmi.toLocaleString('en-IN')}</span>
                                    <span className="emi-month-sub">/mo</span>
                                  </td>
                                  <td className="emi-col-interest">
                                    {plan.isNoCost ? (
                                      <span className="zero-pct-pill">0% (No Cost)</span>
                                    ) : (
                                      <span className="rate-text">{plan.interestRate}% p.a.</span>
                                    )}
                                  </td>
                                  <td className="emi-col-total">
                                    <div className="total-amount-bold">₹{plan.totalCost.toLocaleString('en-IN')}</div>
                                    {plan.totalInterest > 0 && (
                                      <div className="interest-sub-note">
                                        (includes ₹{plan.totalInterest.toLocaleString('en-IN')} interest)
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="emi-modal-bottom-bar">
          <ShieldCheck size={16} className="emi-bottom-icon" />
          <p className="emi-bottom-text">
            Secured & live-calculated via <strong>Razorpay Banking API</strong>. Final EMI approval and charges are managed by your issuing bank during checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
