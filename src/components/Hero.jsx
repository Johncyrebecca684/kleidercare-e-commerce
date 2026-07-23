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
    image: '/lg_commercial_laundry_new.png',
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
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <section id="home" className="hero animate-fade-in">
      <div className="heroInner">
        <div className="carouselBanner" aria-roledescription="carousel" aria-label="Highlighted Products" style={(slide.isBackgroundImage || slide.isFullBannerImage) ? { background: 'none' } : {}}>
          {(slide.isBackgroundImage || slide.isFullBannerImage) && (
            <div className="carouselBackground animate-fade-in" key={`bg-${slide.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, borderRadius: '12px', overflow: 'hidden' }}>
              <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              {slide.isBackgroundImage && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(4, 22, 50, 0.98) 0%, rgba(4, 22, 50, 0.85) 45%, rgba(4, 22, 50, 0.1) 100%)' }}></div>
              )}
            </div>
          )}
          <button className="carouselNavBtn prevBtn" aria-label="Previous slide" onClick={prevSlide} style={{ zIndex: 2 }}>
            <ChevronLeft size={24} className="navIcon" />
          </button>

          <div className="carouselContent" style={{ position: 'relative', zIndex: 1 }}>
            <div className="carouselText animate-slide-up" key={`text-${slide.id}`} style={slide.isBackgroundImage ? { zIndex: 2, position: 'relative' } : {}}>
              <div className="carouselKicker">{slide.kicker}</div>
              <h1 className="carouselTitle">{slide.title}</h1>
              <div className="carouselSubtitle">{slide.subtitle}</div>

              {!slide.isFullBannerImage && (
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
              )}
            </div>
            {!(slide.isBackgroundImage || slide.isFullBannerImage) && (
              <div className="carouselImage animate-fade-in" key={`img-${slide.id}`}>
                <img src={slide.image} alt={slide.title} />
              </div>
            )}
          </div>

          <button className="carouselNavBtn nextBtn" aria-label="Next slide" onClick={nextSlide} style={{ zIndex: 2 }}>
            <ChevronRight size={24} className="navIcon" />
          </button>
        </div>
      </div>
    </section>
  );
}
