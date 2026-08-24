import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  Package,
  RotateCcw,
  Wrench,
  FileText,
  UserCheck,
  Bot,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import './Chatbot.css';

const QUICK_CHIPS = [
  { id: 'order', label: 'Where is my order?', icon: Package },
  { id: 'return', label: 'Return & Refund Policy', icon: RotateCcw },
  { id: 'warranty', label: 'Installation & Warranty', icon: Wrench },
  { id: 'gst', label: 'GST Invoice & Business', icon: FileText },
  { id: 'human', label: 'Talk to Human Support', icon: Headphones }
];

export default function Chatbot({ loggedInUser, userOrders = [], embedded = false }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [unreadBadge, setUnreadBadge] = useState(true);
  const [isHumanAgent, setIsHumanAgent] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: loggedInUser
        ? `Hello ${loggedInUser.firstName || 'there'}! Welcome to KleiderCare Support. How can I assist you with your commercial laundry equipment today?`
        : 'Hello! Welcome to KleiderCare Support. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadBadge(false);
      scrollToBottom();
    }
  }, [isOpen, messages]);

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
          className={`msg-line ${isBullet ? 'bullet-line' : ''}`}
          style={{
            minHeight: line.trim() === '' ? '6px' : 'auto',
            marginBottom: line.trim() === '' ? '4px' : '2px',
            paddingLeft: isBullet ? '10px' : '0px'
          }}
        >
          {formattedLine}
        </div>
      );
    });
  };

  const addMessage = (sender, text) => {
    const newMsg = {
      id: Date.now() + Math.random(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleBotResponse = (query) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const lower = query.toLowerCase();

      if (isHumanAgent) {
        addMessage('agent', 'A support specialist has received your note and will reply shortly to your registered email or phone hotline.');
        return;
      }

      // EMPATHETIC DELAY / COMPLAINT / SEVERE ISSUE ESCALATION PROTOCOL
      const isComplaint = lower.includes('missing') || lower.includes('damaged') || lower.includes('defective') || lower.includes('broken') || lower.includes('failed') || lower.includes('wrong item') || lower.includes('angry') || lower.includes('delay');
      if (isComplaint) {
        addMessage(
          'bot',
          'I am truly sorry for the inconvenience this issue has caused you. We take customer satisfaction very seriously.'
        );
        setTimeout(() => {
          triggerHumanHandoff('[ACTION: ESCALATE_TO_HUMAN]');
        }, 800);
        return;
      }

      // ORDER TRACKING INTENT
      if (lower.includes('order') || lower.includes('track') || lower.includes('where is') || lower.includes('status') || lower.includes('ship')) {
        if (loggedInUser && userOrders && userOrders.length > 0) {
          const latest = userOrders[0];
          const trackingLink = latest.trackingLink || `https://kleidercare.com/track/${latest.orderId || latest.id}`;
          addMessage(
            'bot',
            `Hi ${loggedInUser.firstName || 'there'}! I see your recent **Order #${latest.orderId || latest.id}** placed on ${latest.date || 'recently'}.\n\n• **Status**: ${latest.status || 'Shipped'}\n• **Total**: ₹${(latest.total || 0).toLocaleString('en-IN')}\n• **Tracking Link**: ${trackingLink}\n\nDoes that help, or do you need me to look into another order?`
          );
        } else if (!loggedInUser) {
          addMessage(
            'bot',
            'Hello! To view your order details, please provide your **Order ID** and the email address used for purchase, or sign in to your account.\n\nWould you like me to guide you to the login page?'
          );
        } else {
          addMessage(
            'bot',
            'Hello! I couldn’t find any active orders linked to your profile yet. If you recently placed an order, please provide your **Order ID**.\n\nIs there anything else I can check for you?'
          );
        }
        return;
      }

      // RETURN & REFUND INTENT
      if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange') || lower.includes('policy')) {
        addMessage(
          'bot',
          'According to our store return policy, items can be returned within **30 days** of delivery:\n\n1. Go to your **My Profile > Support / Orders**.\n2. Select the order item and click **Return/Exchange**.\n3. Print the generated return label & schedule pickup.\n\nRefunds are credited to your original payment method within **3-5 business days** after inspection.\n\nDoes that help, or do you need further assistance with your return?'
        );
        return;
      }

      // WARRANTY & INSTALLATION INTENT
      if (lower.includes('warranty') || lower.includes('install') || lower.includes('engineer') || lower.includes('service') || lower.includes('amc') || lower.includes('namc') || lower.includes('maintenance')) {
        addMessage(
          'bot',
          '**Regional Installation & AMC Policy**:\n\n• **Installation**: For all LG Commercial Laundry Machines, installation is **FREE in South India**. For North India and other regions, installation charges apply based on the location.\n\n• **Kleider Care AMC Plan (LG Commercial Machines)**:\n  - 3 Preventive Visits / year\n  - 24–48 Hours Emergency Response\n  - Safety & Performance Check\n  - Vent Cleaning & Drum Disinfection\n\n**AMC Pricing**:\n• LG 10 kg Machines: ₹15,000 / year\n• LG 15 kg Machines: ₹18,000 / year\n\nYou can review full contract details on our **Terms & Conditions** page.'
        );
        return;
      }

      // GST & BUSINESS INTENT
      if (lower.includes('gst') || lower.includes('invoice') || lower.includes('tax') || lower.includes('business')) {
        addMessage(
          'bot',
          '**GST Invoice & Business Claims**:\n• Input GST credit is available for all registered commercial purchases.\n• Automated GST tax invoices are issued immediately upon order confirmation.\n\nDo you need help downloading an invoice or updating your GST details?'
        );
        return;
      }

      // HUMAN HANDOFF INTENT
      if (lower.includes('human') || lower.includes('agent') || lower.includes('person') || lower.includes('talk') || lower.includes('call') || lower.includes('escalate')) {
        triggerHumanHandoff('[ACTION: ESCALATE_TO_HUMAN]');
        return;
      }

      // FALLBACK RESPONSE WITH HUMAN HANDOFF SUGGESTION
      addMessage(
        'bot',
        'I am here to assist with order tracking, store return policy, commercial warranty, or GST invoices. If your question is complex, I can connect you to a human support representative right away!\n\nWould you like me to escalate this to a live support agent?'
      );
    }, 800);
  };

  const triggerHumanHandoff = (actionTag = '[ACTION: ESCALATE_TO_HUMAN]') => {
    setIsHumanAgent(true);
    const ticketId = 'KC-SUP-' + Math.floor(100000 + Math.random() * 900000);
    addMessage(
      'agent',
      `${actionTag}\n**Connected to Senior Support Agent** (Ticket #${ticketId})\n\nHello! I am Rajesh from KleiderCare Senior Technical Support. I have reviewed your query and am here to assist you directly. How can I help resolve your issue today?`
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const query = inputMessage;
    addMessage('user', query);
    setInputMessage('');

    handleBotResponse(query);
  };

  const handleChipClick = (chip) => {
    addMessage('user', chip.label);

    if (chip.id === 'human') {
      setTimeout(() => triggerHumanHandoff(), 600);
    } else {
      handleBotResponse(chip.label);
    }
  };

  return (
    <div className={embedded ? 'chatbot-embedded-container' : 'chatbot-widget-container'}>
      {/* FLOATING CHAT TRIGGER BUTTON */}
      {!isOpen && !embedded && (
        <button className="chatbot-trigger-btn animate-bounce-subtle" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span>Live Support Chat</span>
          {unreadBadge && <span className="chatbot-unread-dot" />}
        </button>
      )}

      {/* CHATBOT WINDOW */}
      {isOpen && (
        <div className={`chatbot-window ${embedded ? 'embedded-window' : 'animate-slide-up'}`}>
          {/* CHAT HEADER */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="bot-avatar-box">
                {isHumanAgent ? <Headphones size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <h4>{isHumanAgent ? 'Senior Support Agent' : 'KleiderCare Assistant'}</h4>
                <div className="status-indicator">
                  <span className="green-dot" />
                  <span>{isHumanAgent ? 'Agent Active' : 'AI Assistant Online'}</span>
                </div>
              </div>
            </div>

            <div className="header-actions">
              {!isHumanAgent && (
                <button
                  className="handoff-btn"
                  onClick={triggerHumanHandoff}
                  title="Hand off to Human Agent"
                >
                  <Headphones size={16} /> Human Agent
                </button>
              )}

              {!embedded && (
                <button className="close-chat-btn" onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="chatbot-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-row ${msg.sender === 'user' ? 'user-side' : msg.sender === 'agent' ? 'agent-side' : 'bot-side'}`}
              >
                {msg.sender !== 'user' && (
                  <div className="msg-avatar">
                    {msg.sender === 'agent' ? <UserCheck size={16} /> : <Sparkles size={16} />}
                  </div>
                )}

                <div className="msg-bubble-content">
                  <div className="msg-text">{renderFormattedText(msg.text)}</div>
                  <span className="msg-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble-row bot-side">
                <div className="msg-avatar"><Sparkles size={16} /></div>
                <div className="msg-bubble-content typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK SUGGESTION CHIPS */}
          {!isHumanAgent && (
            <div className="chatbot-quick-chips">
              {QUICK_CHIPS.map((chip) => (
                <button key={chip.id} className="chip-btn" onClick={() => handleChipClick(chip)}>
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* INPUT FORM */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={isHumanAgent ? 'Message Support Agent...' : 'Ask AI Assistant...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" disabled={!inputMessage.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
