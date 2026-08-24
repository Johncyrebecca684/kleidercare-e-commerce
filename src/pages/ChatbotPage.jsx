import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Bot,
  User,
  Send,
  Headphones,
  Wrench,
  Package,
  RotateCcw,
  FileText,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Phone,
  HelpCircle,
  Cpu,
  Flame,
  Zap,
  X,
  MoreHorizontal,
  Mic,
  ThumbsUp,
  ThumbsDown,
  Share2
} from 'lucide-react';
import './ChatbotPage.css';

export default function ChatbotPage({
  loggedInUser,
  userOrders = [],
  cartCount = 0,
  wishlistCount = 0,
  searchTerm,
  onSearchChange,
  onSigninClick,
  selectedCategory,
  onCategoryChange
}) {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('technical');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHumanAgent, setIsHumanAgent] = useState(false);

  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: loggedInUser
        ? `Hello ${loggedInUser.firstName || 'there'}! Welcome to Kleider Care Full-Screen Technical Support. I am your AI Equipment Assistant. How can I help resolve your industrial washer or commercial dryer issue today?`
        : 'Hello! Welcome to Kleider Care Full-Screen Technical Support. How can I assist you with your commercial laundry equipment today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const TECHNICAL_TOPICS = [
    { id: 'technical', title: 'Washer & Dryer Diagnostics', icon: Wrench, prompt: 'I need help diagnosing an issue with my commercial laundry machine.' },
    { id: 'amc', title: 'AMC Extended Warranty', icon: ShieldCheck, prompt: 'Tell me about Kleider Care AMC plans, preventive maintenance visits, and coverage.' },
    { id: 'orders', title: 'Order & Shipment Tracking', icon: Package, prompt: 'How do I track my commercial equipment shipment?' },
    { id: 'invoice', title: 'GST Invoice & SAC Codes', icon: FileText, prompt: 'I need assistance with my GST Tax Invoice and business claims.' },
    { id: 'engineer', title: 'Connect to Live Engineer', icon: Headphones, prompt: 'Please connect me directly to a Kleider Care certified service engineer.' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (sender, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleTopicClick = (topic) => {
    setInputMessage(topic.prompt);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim());

      return (
        <div
          key={idx}
          className={`cb-msg-line ${isBullet ? 'bullet-line' : ''}`}
          style={{
            minHeight: line.trim() === '' ? '6px' : 'auto',
            marginBottom: line.trim() === '' ? '4px' : '3px',
            paddingLeft: isBullet ? '12px' : '0px',
            lineHeight: '1.55'
          }}
        >
          {formattedLine}
        </div>
      );
    });
  };

  const handleSendMessage = (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend) return;

    addMessage('user', textToSend);
    if (!customText) setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lower = textToSend.toLowerCase();

      if (isHumanAgent) {
        addMessage(
          'agent',
          'Engineer Rajesh: Thank you for the details. I am cross-referencing your query with our technical service dispatch database for your equipment model. One moment please...'
        );
        return;
      }

      if (lower.includes('engineer') || lower.includes('human') || lower.includes('connect') || lower.includes('live') || lower.includes('talk')) {
        setIsHumanAgent(true);
        addMessage(
          'agent',
          '🎧 **Connected to Senior Technical Support Engineer** (Ref #KC-ENG-8492)\n\nHello! I am Senior Service Engineer Rajesh from Kleider Care Technical Hub. I have reviewed your request and am here to assist with your commercial equipment diagnostics directly.'
        );
        return;
      }

      if (lower.includes('track') || lower.includes('order') || lower.includes('shipment') || lower.includes('delivery')) {
        if (userOrders && userOrders.length > 0) {
          const latest = userOrders[0];
          addMessage(
            'bot',
            `📦 **Latest Kleider Care Order Status**:\n\n• **Order ID**: #${latest.id}\n• **Items**: ${latest.items?.map(i => i.name).join(', ') || 'Commercial Laundry Equipment'}\n• **Status**: **${latest.status || 'Processing & Dispatch'}**\n• **Payment Method**: ${latest.paymentMethod || 'Online Payment'}\n• **Est. Delivery**: 3–5 Business Days via Freight Logistics.\n\nYou can track step-by-step progress anytime in **Track Your Order**.`
          );
        } else {
          addMessage(
            'bot',
            '📦 **Kleider Care Order Tracking & Shipping Policy**:\n\n• **Pay Freight Upon Delivery**: Delivery/freight charges are NOT collected online. Customers pay the transport charges directly to the courier/transport partner upon delivery.\n• **Dispatch SLA**: Commercial machines are dispatched within 24–48 hours from regional warehouse hubs.\n• **Tracking**: Enter your Order ID on our **Track Order** page to view live GPS logistics updates.'
          );
        }
        return;
      }

      if (lower.includes('amc') || lower.includes('warranty') || lower.includes('coverage') || lower.includes('preventive') || lower.includes('namc') || lower.includes('agreement') || lower.includes('contract')) {
        addMessage(
          'bot',
          '🛡️ **Kleider Care Extended Warranty & AMC Plan (LG Machines Only)**:\n\nKleider Care AMC is exclusively available for LG commercial laundry equipment and includes:\n\n• **3 Preventive Visits / year**\n• **24–48 Hours Emergency Response**\n• **Safety & Performance Check**\n• **Vent Cleaning & Drum Disinfection**\n\n**Official LG AMC Pricing**:\n• **LG 10 kg Commercial Machines**: ₹15,000 / year (excl. GST)\n• **LG 15 kg Commercial Machines**: ₹18,000 / year (excl. GST)\n\nYou can review full details on our product pages and Terms & Conditions.'
        );
        return;
      }

      if (lower.includes('setup') || lower.includes('program') || lower.includes('parameter') || lower.includes('18000') || lower.includes('3500')) {
        addMessage(
          'bot',
          '⚙️ **Machine Program Setup Add-On (+₹18,000)**:\n\n• **Customized Programming**: Up to 10 customized wash/dry cycle parameters configured directly on LG commercial controls.\n• **Pricing**: ₹18,000 for full setup (up to 10 programs @ ₹1,800/program).\n• **Itemized Invoice**: Displayed under **SAC Code 998313** with 18% IGST tax credit benefit.'
        );
        return;
      }

      if (lower.includes('gst') || lower.includes('invoice') || lower.includes('tax') || lower.includes('sac') || lower.includes('b2b')) {
        addMessage(
          'bot',
          '📄 **Kleider Care GST Tax Invoice & SAC Codes**:\n\n• **Equipment & Spares**: B2B Tax Invoice generated with 18% IGST.\n• **AMC Warranty Contracts**: **SAC Code 998721** (Maintenance & Repair Services).\n• **Machine Program Setup**: **SAC Code 998313** (IT / Technical Parameter Configuration Services).\n• **Tax Input Credit**: Enter your company GSTIN during checkout or in your User Profile for instant B2B tax invoice generation.'
        );
        return;
      }

      if (lower.includes('washer') || lower.includes('spin') || lower.includes('vibration') || lower.includes('noise') || lower.includes('error') || lower.includes('leak')) {
        addMessage(
          'bot',
          '🛠️ **Industrial Washer Technical Diagnostics**:\n\n1. **Unbalanced Drum (Error UE)**: Ensure heavy laundry is distributed evenly in the drum & anti-vibration leveling feet are locked.\n2. **Drain / Inlet Issues (Error OE / IE)**: Inspect lint trap assembly, water inlet solenoid valves & pressure sensor hoses.\n3. **Hotline Assistance**: Emergency breakdown support available at **+91 93848 14933**.'
        );
        return;
      }

      if (lower.includes('dryer') || lower.includes('heat') || lower.includes('vent') || lower.includes('gas') || lower.includes('airflow')) {
        addMessage(
          'bot',
          '🔥 **Commercial Dryer Technical Support**:\n\n1. **No Heating / Reduced Airflow**: Inspect and clear lint screen & external exhaust ducting quarterly to prevent thermal trip.\n2. **Igniter / Gas Valve**: Verify gas inlet supply valves and electrical breaker switches.\n3. **Technician Dispatch**: Call **+91 97890 20311** for priority breakdown technician dispatch.'
        );
        return;
      }

      if (lower.includes('return') || lower.includes('refund') || lower.includes('replace') || lower.includes('damage')) {
        addMessage(
          'bot',
          '🔄 **Kleider Care Commercial Return & Replacement Policy**:\n\n• **7-Day Replacement**: Transit damage or manufacturing defects are covered under instant 7-day replacement.\n• **Verification**: Our service technician inspects commercial machinery on-site before initiating approval.\n• **Refund SLA**: Approved refunds are credited back to original payment account within 3–5 business days.'
        );
        return;
      }

      addMessage(
        'bot',
        'Thank you for contacting Kleider Care E-Commerce Support! 🧺\n\nI can assist with commercial equipment orders, GST tax invoices, AMC extended warranties, machine programming, or technical troubleshooting.\n\nNeed immediate help? Call our hotline **+91 93848 14933** or email **support@kleidercare.com**.'
      );
    }, 900);
  };

  return (
    <div className="chatbot-page-wrapper">
      {/* DESKTOP GLOBAL HEADER (Hidden on mobile via CSS) */}
      <div className="chatbot-desktop-header-wrap">
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSigninClick={onSigninClick}
          loggedInUser={loggedInUser}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </div>

      <main className="chatbot-page-main">
        {/* DESKTOP TOP BAR (Hidden on mobile) */}
        <div className="cb-top-bar desktop-only">
          <button className="cb-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="cb-header-title">
            <h2>Kleider Care Technical Support Chatbot</h2>
          </div>
        </div>

        {/* MOBILE RUFUS AI STYLE TOP APP BAR */}
        <div className="mobile-rufus-top-bar">
          <button
            type="button"
            className="mobile-rufus-close-btn"
            onClick={() => navigate(-1)}
            aria-label="Close Support Chat"
          >
            <X size={24} />
          </button>

          <div className="mobile-rufus-brand-title">
            <span className="rufus-name">Kleider</span>
            <span className="rufus-ai-badge">
              ai <Sparkles size={11} style={{ display: 'inline', marginLeft: '3px' }} />
            </span>
            <span className="rufus-beta-sub">beta</span>
          </div>

          <button
            type="button"
            className="mobile-rufus-more-btn"
            aria-label="Chat options"
          >
            <MoreHorizontal size={22} />
          </button>
        </div>

        {/* FULL SCREEN CHAT CONTAINER */}
        <div className="cb-fullscreen-grid full-width">
          {/* MAIN CHAT PANEL */}
          <section className="cb-chat-panel">
            {/* DESKTOP CHAT HEADER */}
            <div className="cb-chat-header desktop-only">
              <div className="cb-agent-info">
                <div className="cb-avatar-circle">
                  {isHumanAgent ? <Headphones size={20} color="#fff" /> : <Bot size={20} color="#fff" />}
                </div>
                <div>
                  <h4>{isHumanAgent ? 'Senior Technical Service Engineer (Rajesh)' : 'Kleider Care Technical AI Assistant'}</h4>
                  <span className="online-indicator">
                    <span className="dot"></span> {isHumanAgent ? 'Live Engineer Connected' : 'Online • 24/7 Equipment Support'}
                  </span>
                </div>
              </div>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="cb-chat-body">
              {/* MOBILE SUPPORT INTRO SCREEN (shown when few messages) */}
              {messages.length <= 1 && (
                <div className="mobile-rufus-intro-block">
                  <div className="mobile-support-hero">
                    <div className="mobile-support-icon-ring">
                      <Bot size={28} />
                    </div>
                    <h3 className="mobile-rufus-greeting">How can we help you?</h3>
                    <p className="mobile-rufus-subtext">Ask about commercial washers, dryers, AMC plans, error codes, or shipping</p>
                  </div>

                  <div className="mobile-rufus-prompts-list">
                    {[
                      'How do I track my equipment shipment?',
                      'Tell me about AMC extended warranty',
                      'Washer / Dryer error code diagnostics',
                      'GST Tax Invoice & SAC Codes',
                      'Machine Program Setup on LG',
                      'Connect with certified service engineer'
                    ].map((promptText, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        className="mobile-rufus-pill-prompt"
                        onClick={() => handleSendMessage({ preventDefault: () => {} }, promptText)}
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>

                  <div className="mobile-support-emergency-box">
                    <Phone size={15} />
                    <span>Emergency Breakdown Hotline: <strong>+91 93848 14933</strong></span>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`cb-msg-row ${msg.sender === 'user' ? 'user' : msg.sender === 'agent' ? 'agent' : 'bot'}`}
                >
                  {msg.sender !== 'user' && (
                    <div className="cb-msg-avatar">
                      {msg.sender === 'agent' ? <Headphones size={15} /> : <Bot size={15} />}
                    </div>
                  )}

                  <div className="cb-msg-content">
                    <div className="cb-msg-text">{renderFormattedText(msg.text)}</div>
                    <span className="cb-msg-time">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="cb-msg-row bot">
                  <div className="cb-msg-avatar"><Bot size={15} /></div>
                  <div className="cb-msg-content typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* E-COMMERCE SUGGESTION QUERY CHIPS (DESKTOP) */}
            <div className="cb-suggestion-chips-container desktop-only">
              <div className="chips-scroll-row">
                {[
                  { label: 'Track Order & Shipment', prompt: 'How do I track my commercial equipment shipment?' },
                  { label: 'AMC Plans & Coverage', prompt: 'Tell me about Kleider Care AMC plans, preventive maintenance visits, and coverage.' },
                  { label: 'Machine Program Setup', prompt: 'How do I configure 10-program parameter setup on LG machines?' },
                  { label: 'GST Invoice & Business Claims', prompt: 'I need assistance with my GST Tax Invoice and business claims.' },
                  { label: 'Washer & Dryer Diagnostics', prompt: 'I need help diagnosing an issue with my commercial laundry machine.' },
                  { label: 'Talk to Certified Engineer', prompt: 'Please connect me directly to a Kleider Care certified service engineer.' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="cb-chip-btn"
                    onClick={() => {
                      setInputMessage(chip.prompt);
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHAT INPUT FORM (MOBILE SUPPORT CHAT STYLE) */}
            <form className="cb-chat-input-form mobile-rufus-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={isHumanAgent ? 'Type message to certified engineer...' : 'Ask a question or describe your issue...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button
                type="button"
                className="mobile-rufus-mic-btn"
                title="Voice input"
                onClick={() => {
                  alert('Listening... Ask your question about machines or equipment.');
                }}
              >
                <Mic size={20} />
              </button>
              <button type="submit" disabled={!inputMessage.trim()} className="cb-send-btn">
                <Send size={18} />
                <span>Send</span>
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* DESKTOP FOOTER (Hidden on mobile via CSS) */}
      <div className="chatbot-desktop-footer-wrap">
        <Footer />
      </div>
    </div>
  );
}
