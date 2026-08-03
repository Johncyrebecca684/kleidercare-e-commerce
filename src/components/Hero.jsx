import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Hero.css';

const slides = [
  {
    id: 0,
    kicker: '',
    title: '',
    subtitle: null,
    image: '/emi_banner.png',
    isFullBannerImage: true
  },
  {
    id: 1,
    kicker: 'Genuine Quality & Fast Delivery',
    title: 'Genuine Spare Parts for Commercial Laundry Machines',
    subtitle: (
      <div style={{ fontSize: '1rem', lineHeight: '1.5', marginTop: '15px', fontWeight: '400', maxWidth: '600px' }}>
        <p style={{ marginBottom: '10px' }}>
          <strong>Commercial Laundry Spare Parts:</strong> We provide a comprehensive range of genuine spare parts, ensuring the longevity and optimal performance of your laundry machines.
        </p>
        <p>
          With expert advice and prompt service, Kleider care laundry ecommerce is your trusted source for keeping your laundry operations running smoothly and efficiently.
        </p>
      </div>
    ),
    image: '/spare_carousal.png',
    isBackgroundImage: true
  },
  {
    id: 2,
    kicker: 'Powerful & Reliable',
    title: 'LG Commercial Laundry Machines',
    subtitle: (
      <div style={{ fontSize: '1rem', lineHeight: '1.5', marginTop: '15px', fontWeight: '400', maxWidth: '600px' }}>
        <p>
          Deliver powerful performance, exceptional reliability, and energy-efficient operation for high-volume laundry needs. Built with advanced technology, they provide superior washing and drying results while reducing water, energy, and operating costs—making them the ideal choice for laundromats, hotels, hospitals, and other commercial facilities.
        </p>
      </div>
    ),
    image: '/lg_commercial_laundry_new.jpeg',
    isBackgroundImage: true
  },
  {
    id: 3,
    kicker: 'Unmatched Durability',
    title: 'Speed Queen Commercial Laundry Machines',
    subtitle: (
      <div style={{ fontSize: '1rem', lineHeight: '1.5', marginTop: '15px', fontWeight: '400', maxWidth: '600px' }}>
        <p>
          Deliver powerful performance, unmatched durability, and energy-efficient operation for high-volume laundry needs. Designed for commercial environments, they provide reliable washing and drying solutions with advanced technology and user-friendly controls.
        </p>
      </div>
    ),
    image: '/speedqueen_carousal.png',
    isBackgroundImage: true
  },
  {
    id: 4,
    kicker: 'Professional Finishing',
    title: 'PONY Commercial Ironing Tables',
    subtitle: (
      <div style={{ fontSize: '1rem', lineHeight: '1.5', marginTop: '15px', fontWeight: '400', maxWidth: '600px' }}>
        <p style={{ marginBottom: '10px' }}>
          Solid and reliable ironing tables designed for professional laundry operations. Offering an excellent quality-to-price ratio, these entry-level air-blowing tables deliver efficient, consistent, and high-quality finishing.
        </p>
        <p>
          Available in multiple models with advanced features to suit a wide range of ironing and finishing applications, including garments, curtains, knitwear, and other textiles.
        </p>
      </div>
    ),
    image: '/pony_carousal.png',
    isBackgroundImage: true
  },
  {
    id: 5,
    kicker: '',
    title: '',
    subtitle: null,
    image: '/slms_banner.png',
    isFullBannerImage: true
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <section id="home" className="hero animate-fade-in">
      <div className="heroInner">
        <div className="carouselBanner" aria-roledescription="carousel" aria-label="Highlighted Products">
          {(slide.isBackgroundImage || slide.isFullBannerImage) && (
            <div className="carouselBackground animate-fade-in" key={`bg-${slide.id}`}>
              <img src={slide.image} alt={slide.title || 'Banner'} className="banner-hero-img" />
              {slide.isBackgroundImage && (
                <div className="banner-dark-overlay"></div>
              )}
            </div>
          )}

          <button className="carouselNavBtn prevBtn" aria-label="Previous slide" onClick={prevSlide}>
            <ChevronLeft size={22} />
          </button>

          {!slide.isFullBannerImage && (
            <div className="carouselContent">
              <div className="carouselText animate-slide-up" key={`text-${slide.id}`}>
                {slide.kicker && <div className="carouselKicker">{slide.kicker}</div>}
                {slide.title && <h1 className="carouselTitle">{slide.title}</h1>}
                {slide.subtitle && <div className="carouselSubtitle">{slide.subtitle}</div>}
              </div>
            </div>
          )}

          <button className="carouselNavBtn nextBtn" aria-label="Next slide" onClick={nextSlide}>
            <ChevronRight size={22} />
          </button>

          <div className="carouselIndicators" role="tablist">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                style={{ cursor: 'pointer' }}
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Slide ${index + 1}`}
              ></span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
