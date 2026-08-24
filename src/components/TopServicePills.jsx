import {
  Sparkles,
  Handshake,
  Waves,
  Store,
  Crown,
  MonitorCheck,
  Megaphone
} from 'lucide-react';
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
    id: 5,
    title: 'The Amlan Laundry',
    shortTitle: 'The Amlan Laundry',
    url: 'https://www.theamlanlaundry.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.20.27.jpeg',
    color: '#7c3aed'
  },
  {
    id: 6,
    title: 'System Cares IT Solutions',
    shortTitle: 'System Cares IT Solutions',
    url: 'https://systemcaresitsolutions.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.24.29.jpeg',
    color: '#0f2b5c'
  },
  {
    id: 7,
    title: 'Digital Marketing -> SCS',
    shortTitle: 'Digital Marketing (SCS)',
    url: 'https://systemcaresolutions.com/',
    image: '/WhatsApp Image 2026-08-18 at 17.22.01.jpeg',
    color: '#e11d48'
  }
];

export default function TopServicePills({ onCategoryChange, selectedCategory }) {
  const handleClick = (item) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
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

  return (
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
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                )}
              </div>
              <span className="service-pill-title">{box.shortTitle || box.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
