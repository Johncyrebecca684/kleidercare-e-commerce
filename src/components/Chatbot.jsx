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
  { id: 'order', label: '📦 Where is my order?', icon: Package },
  { id: 'return', label: '🔄 Return & Refund Policy', icon: RotateCcw },
  { id: 'warranty', label: '🛠️ Installation & Warranty', icon: Wrench },
  { id: 'gst', label: '📄 GST Invoice & Business', icon: FileText },
  { id: 'human', label: '🎧 Talk to Human Support', icon: Headphones }
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
        ? `Hello ${loggedInUser.firstName || 'there'}! 👋 Welcome to KleiderCare Support. How can I assist you with your commercial laundry equipment today?`
        : 'Hello! 👋 Welcome to KleiderCare Support. How can I help you today?',
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
        addMessage('agent', 'A support specialist has reviewed your note and will reply shortly. You can also view your support tickets anytime.');
        return;
      }

      // ORDER TRACKING INTENT
      if (lower.includes('order') || lower.includes('track') || lower.includes('where is')) {
        if (userOrders && userOrders.length > 0) {
          const latest = userOrders[0];
          addMessage(
            'bot',
            `📦 Your latest order (#${latest.orderId || latest.id}) is currently [${latest.status || 'Order Confirmed'}].\n\nTotal: ₹${(latest.total || latest.totalAmount || 0).toLocaleString('en-IN')}\nDate: ${latest.date || 'Recent'}`
          );
        } else {
          addMessage(
            'bot',
            '📦 To track your order, please log in to your account or visit our dedicated Track Order page using your Order ID and Email.'
          );
        }
        return;
      }

      // RETURN & REFUND INTENT
      if (lower.includes('return') || lower.includes('refund') || lower.includes('replace') || lower.includes('damage')) {
        addMessage(
          'bot',
          '🔄 **Return & Replacement Policy**:\n• We offer a 7-day hassle-free replacement policy for defective or transit-damaged equipment.\n• Free on-site inspection by a certified engineer is arranged within 24-48 hours.\n• Refunds are processed back to your original payment method within 3-5 business days.'
        );
        return;
      }

      // WARRANTY & INSTALLATION INTENT
      if (lower.includes('warranty') || lower.includes('install') || lower.includes('engineer') || lower.includes('service')) {
        addMessage(
          'bot',
          '🛠️ **Installation & Warranty**:\n• All commercial machines come with a 2-Year Official KleiderCare Commercial Warranty.\n• On-site installation is carried out free of cost by authorized technical engineers.\n• You can request an engineer visit anytime via our Support page.'
        );
        return;
      }

      // GST INVOICE INTENT
      if (lower.includes('gst') || lower.includes('invoice') || lower.includes('tax') || lower.includes('business')) {
        addMessage(
          'bot',
          '📄 **GST & Commercial Invoicing**:\n• Input GST credit is available for all registered business purchases.\n• Enter your GSTIN during checkout to receive an automated B2B GST tax invoice.'
        );
        return;
      }

      // HUMAN HANDOFF INTENT
      if (lower.includes('human') || lower.includes('agent') || lower.includes('person') || lower.includes('talk') || lower.includes('call') || lower.includes('escalate')) {
        triggerHumanHandoff();
        return;
      }

      // FALLBACK RESPONSOE WITH HUMAN HANDOFF SUGGESTION
      addMessage(
        'bot',
        'I’m here to help with order tracking, commercial warranty, returns, or technical specs. If your issue is complex, click "Talk to Human Support" below to connect directly with a support agent!'
      );
    }, 1000);
  };

  const triggerHumanHandoff = () => {
    setIsHumanAgent(true);
    const ticketId = 'KC-SUP-' + Math.floor(100000 + Math.random() * 900000);
    addMessage(
      'agent',
      `🎧 **Connected to Human Agent** (Ticket #${ticketId})\n\nHello! I am Rajesh from KleiderCare Senior Technical Support. I have received your request. How can I assist with your commercial setup today?`
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
                  <div className="msg-text">{msg.text}</div>
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
