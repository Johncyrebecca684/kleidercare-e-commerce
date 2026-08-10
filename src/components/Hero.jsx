import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Hero.css';

const slides = [
  {
    id: 0,
    image: '/emi_banner.jpg'
  },
  {
    id: 1,
    image: '/spare_carousal.jpg'
  },
  {
    id: 2,
    image: '/lg_commercial_laundry_new.jpg'
  },
  {
    id: 3,
    image: '/speedqueen_carousal.jpg'
  },
  {
    id: 4,
    image: '/pony_carousal.jpg'
  },
  {
    id: 5,
    image: '/slms_banner.jpeg'
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
          <div className="carouselBackground animate-fade-in" key={`bg-${slide.id}`}>
            <img src={slide.image} alt="Banner" className="banner-hero-img" />
          </div>

          <button className="carouselNavBtn prevBtn" aria-label="Previous slide" onClick={prevSlide}>
            <ChevronLeft size={22} />
          </button>

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
