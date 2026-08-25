import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Hero.css';

const desktopSlides = [
  {
    id: 0,
    image: '/emi_banner.png',
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

const mobileSlides = [
  {
    id: 0,
    image: '/ecom-slider.png',
    alt: 'Kleider Care EMI Offers'
  },
  {
    id: 1,
    image: '/ecom-slider (1).png',
    alt: 'Genuine spare parts for commercial laundry machine'
  },
  {
    id: 2,
    image: '/ecom-slider (2).png',
    alt: 'LG Commercial Laundry Machines'
  },
  {
    id: 3,
    image: '/ecom-slider (3).png',
    alt: 'Speed Queen Commercial Laundry Machines'
  },
  {
    id: 4,
    image: '/ecom-slider (4).png',
    alt: 'Pony Commercial Ironing Tables'
  },
  {
    id: 5,
    image: '/ecom-slider (5).png',
    alt: 'Salavai Laundry Management System (SLMS)'
  }
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Desktop touch swipe
  const [desktopTouchStart, setDesktopTouchStart] = useState(null);
  const [desktopTouchEnd, setDesktopTouchEnd] = useState(null);

  // Mobile real-time touch drag state
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const minSwipeDistance = 40;

  // Auto-play for desktop carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % desktopSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Auto-play for mobile carousel (pauses during active touch)
  useEffect(() => {
    if (isPaused || isSwiping) return;
    const timer = setInterval(() => {
      setCurrentMobileSlide((prev) => (prev + 1) % mobileSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, isSwiping]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % desktopSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + desktopSlides.length) % desktopSlides.length);

  const nextMobileSlide = () => setCurrentMobileSlide((prev) => (prev + 1) % mobileSlides.length);
  const prevMobileSlide = () => setCurrentMobileSlide((prev) => (prev - 1 + mobileSlides.length) % mobileSlides.length);

  // Desktop Touch Handlers
  const onDesktopTouchStart = (e) => {
    setDesktopTouchEnd(null);
    setDesktopTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onDesktopTouchMove = (e) => {
    setDesktopTouchEnd(e.targetTouches[0].clientX);
  };

  const onDesktopTouchEnd = () => {
    setIsPaused(false);
    if (!desktopTouchStart || !desktopTouchEnd) return;
    const distance = desktopTouchStart - desktopTouchEnd;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  // Mobile Touch Handlers with continuous swipe feel
  const onMobileTouchStart = (e) => {
    setIsSwiping(true);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchDeltaX(0);
  };

  const onMobileTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX;
    setTouchDeltaX(diff);
  };

  const onMobileTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (Math.abs(touchDeltaX) > minSwipeDistance) {
      if (touchDeltaX < 0) {
        // Swiped Left -> Move to Next
        nextMobileSlide();
      } else {
        // Swiped Right -> Move to Previous
        prevMobileSlide();
      }
    }
    setTouchDeltaX(0);
  };

  const slide = desktopSlides[currentSlide];

  return (
    <section id="home" className="hero animate-fade-in">
      {/* Mobile view carousel: full screen width continuous sliding track */}
      <div className="heroMobileWrapper">
        <div
          className="heroMobileBanner"
          onTouchStart={onMobileTouchStart}
          onTouchMove={onMobileTouchMove}
          onTouchEnd={onMobileTouchEnd}
          onTouchCancel={onMobileTouchEnd}
        >
          <div
            className="heroMobileTrack"
            style={{
              transform: `translateX(calc(-${currentMobileSlide * 100}% + ${touchDeltaX}px))`,
              transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          >
            {mobileSlides.map((item, idx) => (
              <div className="heroMobileSlideItem" key={item.id}>
                <img
                  src={item.image}
                  alt={item.alt}
                  className="hero-mobile-img"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          <div className="heroMobileIndicators" role="tablist">
            {mobileSlides.map((_, index) => (
              <span
                key={index}
                className={`mobileDot ${index === currentMobileSlide ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMobileSlide(index);
                }}
                role="tab"
                aria-selected={index === currentMobileSlide}
                aria-label={`Slide ${index + 1}`}
              ></span>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop view carousel */}
      <div className="heroInner heroDesktopWrapper">
        <div
          className="carouselBanner"
          aria-roledescription="carousel"
          aria-label="Highlighted Products"
          onTouchStart={onDesktopTouchStart}
          onTouchMove={onDesktopTouchMove}
          onTouchEnd={onDesktopTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="carouselBackground animate-fade-in" key={`bg-${slide.id}`}>
            <img
              src={slide.image}
              alt={slide.alt || 'Banner'}
              className="banner-hero-img"
              loading={currentSlide === 0 ? 'eager' : 'lazy'}
              fetchPriority={currentSlide === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>

          <button
            type="button"
            className="carouselNavBtn prevBtn"
            aria-label="Previous slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevSlide();
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            className="carouselNavBtn nextBtn"
            aria-label="Next slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextSlide();
            }}
          >
            <ChevronRight size={20} />
          </button>

          <div className="carouselIndicators" role="tablist">
            {desktopSlides.map((_, index) => (
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

