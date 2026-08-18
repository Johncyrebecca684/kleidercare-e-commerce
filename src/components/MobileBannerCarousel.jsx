import { useNavigate } from 'react-router-dom';
import './MobileBannerCarousel.css';

const MOBILE_BANNERS = [
  {
    id: 1,
    image: '/c1.jpeg',
    alt: 'LG Machine Stacker 15kg',
    // Links directly to Titan Electric 15kg Stacker (id: 121) or category
    productId: 121,
    category: 'Stacker'
  },
  {
    id: 2,
    image: '/c2.jpeg',
    alt: 'Speed Queen Commercial Laundry Machines',
    category: 'Speed Queen Commercial Laundry Machines'
  },
  {
    id: 3,
    image: '/c3.jpeg',
    alt: 'Speed Queen Commercial Laundry Machines',
    category: 'Speed Queen Commercial Laundry Machines'
  },
  {
    id: 4,
    image: '/c4.jpeg',
    alt: 'PONY Finishing Equipments',
    category: 'PONY Finishing Equipments'
  },
  {
    id: 5,
    image: '/c5.jpeg',
    alt: 'Genuine Spare Parts',
    category: 'Genuine Spare Parts'
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

  const handleBannerClick = (banner) => {
    if (banner.productId) {
      navigate(`/product/${banner.productId}`);
    } else if (banner.category) {
      if (onCategoryChange) {
        onCategoryChange(banner.category);
      }
      const productSection = document.getElementById('products');
      if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="amazon-mobile-banners-section" aria-label="Featured Offers">
      <div className="amazon-banner-scroll-container">
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
            />
          </div>
        ))}
      </div>
    </section>
  );
}
