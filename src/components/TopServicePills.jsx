import { useState, useEffect } from 'react';
import {
  Sparkles,
  Handshake,
  Waves,
  Store,
  Crown,
  MonitorCheck,
  Megaphone,
  X,
  ExternalLink,
  RotateCw,
  Lock,
  Globe
} from 'lucide-react';
import { API_URL } from '../config';
import './TopServicePills.css';

const SERVICE_BOXES = [
  {
    id: 1,
    title: 'The Salavai Laundry',
    shortTitle: 'The Salavai Laundry',
    url: 'https://thesalavailaundry.com/',
    image: '/WhatsApp Image 2026-08-18 at 15.40.03.jpeg',
    color: '#0284c7'
  },
  {
    id: 2,
    title: 'Business Partner Program',
    shortTitle: 'Business Partner Program',
    url: 'https://thesalavailaundry.com/business-partner.html',
    image: '/image 3.png',
    color: '#059669'
  },
  {
    id: 3,
    title: 'Nammude Laundry',
    shortTitle: 'Nammude Laundry',
    url: 'https://nammudelaundry.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.20.53.jpeg',
    color: '#0891b2'
  },
  {
    id: 4,
    title: 'The Salavai Laundry Store',
    shortTitle: 'The Salavai Laundry Store',
    url: 'https://thesalavailaundry.com/our-stores.html',
    image: '/WhatsApp Image 2026-08-18 at 17.19.51.jpeg',
    color: '#ea580c'
  },
  {
    id: 6,
    title: 'Salavai Laundry Management System',
    shortTitle: 'Salavai Laundry Management System',
    url: 'https://lms.systemcaresolutions.com/',
    image: '/Untitled design.png',
    color: '#0284c7'
  },
  {
    id: 7,
    title: 'System Cares IT Solutions',
    shortTitle: 'System Cares IT Solutions',
    url: 'https://systemcaresitsolutions.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.24.29.jpeg',
    color: '#0f2b5c'
  },
  {
    id: 8,
    title: 'Digital Marketing -> SCS',
    shortTitle: 'Digital Marketing (SCS)',
    url: 'https://systemcaresolutions.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.22.01.jpeg',
    color: '#e11d48'
  },
  {
    id: 5,
    title: 'The Amlan Laundry',
    shortTitle: 'The Amlan Laundry',
    url: 'https://www.theamlanlaundry.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.20.27.jpeg',
    color: '#7c3aed',
    directNavigate: true
  }
];

export default function TopServicePills({ onCategoryChange, selectedCategory }) {
  const [inAppModal, setInAppModal] = useState(null); // { url, embedUrl, title }
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Prevent background scrolling when in-app modal is open
  useEffect(() => {
    if (inAppModal) {
      document.body.style.overflow = 'hidden';
      // Setup a timer: if iframe takes too long to trigger onLoad due to browser blocking sameorigin frames
      const timer = setTimeout(() => {
        setIframeLoading(false);
      }, 3000);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [inAppModal]);

  const handleClick = (item) => {
    if (item.directNavigate && item.url) {
      window.location.href = item.url;
      return;
    }
    if (item.url) {
      setIframeBlocked(false);
      setIframeLoading(true);
      setInAppModal({
        url: item.url,
        title: item.title
      });
      return;
    }
    if (onCategoryChange && item.category) {
      onCategoryChange(item.category);
    }
    const targetSection = document.getElementById('products');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCloseModal = () => {
    setInAppModal(null);
    setIframeBlocked(false);
  };

  const handleReload = () => {
    setIframeBlocked(false);
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (inAppModal?.url) {
      window.open(inAppModal.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className="top-service-pills-bar" role="navigation" aria-label="Partner & Brand Services">
        <div className="top-service-pills-scroll">
          {SERVICE_BOXES.map((box) => {
            const Icon = box.icon;
            const isActive = selectedCategory === box.category && box.id === 1;

            return (
              <button
                type="button"
                key={box.id}
                className={`service-pill-box ${isActive ? 'active' : ''}`}
                onClick={() => handleClick(box)}
                title={box.title}
                aria-label={box.title}
              >
                <div className="service-pill-icon-container">
                  {box.image ? (
                    <img
                      src={box.image}
                      alt={box.title}
                      loading="lazy"
                      decoding="async"
                      className="service-pill-img"
                    />
                  ) : (
                    <div className="service-pill-icon-inner" style={{ color: box.color }}>
                      {Icon && <Icon size={18} strokeWidth={2.2} />}
                    </div>
                  )}
                </div>
                <span className="service-pill-title">{box.shortTitle || box.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* In-App Browser Modal */}
      {inAppModal && (
        <div className="inapp-browser-backdrop" onClick={handleCloseModal}>
          <div className="inapp-browser-modal" onClick={(e) => e.stopPropagation()}>
            {/* Browser Header Bar */}
            <div className="inapp-browser-header">
              <div className="inapp-browser-header-left">
                <button
                  type="button"
                  className="inapp-browser-btn inapp-browser-close-btn"
                  onClick={handleCloseModal}
                  aria-label="Close in-app browser"
                >
                  <X size={20} />
                </button>
                <div className="inapp-browser-info">
                  <span className="inapp-browser-title">{inAppModal.title}</span>
                  <span className="inapp-browser-url">
                    <Lock size={10} className="inapp-browser-lock" />
                    {inAppModal.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </div>
              </div>

              <div className="inapp-browser-header-actions">
                <button
                  type="button"
                  className="inapp-browser-btn"
                  onClick={handleReload}
                  title="Reload page"
                  aria-label="Reload"
                >
                  <RotateCw size={18} />
                </button>
                <button
                  type="button"
                  className="inapp-browser-btn inapp-browser-open-ext-btn"
                  onClick={handleOpenExternal}
                  title="Open in new window"
                  aria-label="Open in new window"
                >
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>

            {/* Browser Content Area */}
            <div className="inapp-browser-body">
              {iframeLoading && (
                <div className="inapp-browser-loader">
                  <div className="inapp-browser-spinner"></div>
                  <span>Connecting to {inAppModal.title}...</span>
                </div>
              )}

              <iframe
                key={iframeKey}
                src={inAppModal.url}
                title={inAppModal.title}
                className="inapp-browser-iframe"
                onLoad={() => setIframeLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
