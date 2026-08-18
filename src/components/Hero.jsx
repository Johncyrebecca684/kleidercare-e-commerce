import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Hero.css';

const slides = [
  {
    id: 0,
    image: '/emi_banner.jpg',
    alt: 'Kleider Care EMI Offers'
  },
  {
    id: 1,
    image: '/spare_carousal.jpg',
    alt: 'Genuine spare parts for commercial laundry machine'
  },
  {
    id: 2,
    image: '/lg_commercial_laundry_new.jpg',
    alt: 'LG Commercial Laundry'
  },
  {
    id: 3,
    image: '/speedqueen_carousal.jpg',
    alt: 'Speed Queen Commercial Laundry'
  },
  {
    id: 4,
    image: '/pony_carousal.jpg',
    alt: 'Pony Finishing Equipment'
  },
  {
    id: 5,
    image: '/slms_banner.jpeg',
    alt: 'Smart Laundry Management System'
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Minimum touch distance required to trigger swipe
  const minSwipeDistance = 40;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const slide = slides[currentSlide];

  return (
    <section id="home" className="hero animate-fade-in">
      <div className="heroInner">
        <div
          className="carouselBanner"
          aria-roledescription="carousel"
          aria-label="Highlighted Products"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="carouselBackground animate-fade-in" key={`bg-${slide.id}`}>
            <img src={slide.image} alt={slide.alt || 'Banner'} className="banner-hero-img" />
          </div>

          <button
            className="carouselNavBtn prevBtn"
            aria-label="Previous slide"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className="carouselNavBtn nextBtn"
            aria-label="Next slide"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
          >
            <ChevronRight size={20} />
          </button>

          <div className="carouselIndicators" role="tablist">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
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

