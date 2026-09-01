import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MobileBannerCarousel.css';

const MOBILE_BANNERS = [
  {
    id: 1,
    image: '/c7.jpeg',
    alt: 'Upgrade your laundry with LG Washer-Dryer stacker',
    category: 'Stacker'
  },
  {
    id: 2,
    image: '/c2.jpeg',
    alt: 'SPEED QUEEN SOFT-MOUNT Washer-Extractors & Tumble Dryers',
    category: 'Speed Queen Commercial Laundry Machines'
  },
  {
    id: 3,
    image: '/c3.jpeg',
    alt: 'Take your laundry business to the next level - Speed Queen',
    category: 'Speed Queen Commercial Laundry Machines'
  },
  {
    id: 4,
    image: '/c4.jpeg',
    alt: 'Kerala Business Partner Program',
    category: 'Packages'
  },
  {
    id: 5,
    image: '/c8.jpeg',
    alt: 'LG Genuine Spare Parts',
    category: 'LG Genuine Spare Parts'
  },
  {
    id: 6,
    image: '/c6.jpeg',
    alt: 'Commercial Laundry Packages',
    category: 'Packages'
  },
];

export default function MobileBannerCarousel({ onCategoryChange }) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const scrollToResults = () => {
    const targetElement = document.getElementById('category-results-bar') || document.getElementById('products');
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.productId) {
      navigate(`/product/${banner.productId}`);
    } else if (banner.category) {
      if (onCategoryChange) {
        onCategoryChange(banner.category);
      }
      setTimeout(() => {
        scrollToResults();
      }, 50);
    } else {
      setTimeout(() => {
        scrollToResults();
      }, 50);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="amazon-mobile-banners-section" aria-label="Featured Offers">
      <div className="amazon-banners-wrapper">
        <button
          type="button"
          className="banner-nav-btn banner-prev-btn"
          onClick={() => scroll('left')}
          aria-label="Previous banners"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="amazon-banner-scroll-container" ref={scrollContainerRef}>
          {MOBILE_BANNERS.map((banner, index) => (
            <div
              className="amazon-banner-card"
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              role="button"
              tabIndex={0}
              aria-label={`View ${banner.alt}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBannerClick(banner);
                }
              }}
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className="amazon-banner-image"
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="banner-nav-btn banner-next-btn"
          onClick={() => scroll('right')}
          aria-label="Next banners"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}

