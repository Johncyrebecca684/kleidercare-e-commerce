import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Hero.css';

const slides = [
  {
    id: 1,
    kicker: 'Best Deal',
    title: '15KG LG TITAN WASHER',
    subtitle: 'UP TO 15% OFF',
    image: '/titanwasher.png'
  },
  {
    id: 2,
    kicker: 'New Arrival',
    title: 'SPEED QUEEN QUANTUM TOUCH WASHER EXTRACTOR 18KG',
    subtitle: 'PREMIUM WASHING SOLUTION',
    image: '/queen-washer-transparent.png'
  },
  {
    id: 3,
    kicker: 'Top Quality',
    title: 'PONY FINISHING EQUIPMENTS',
    subtitle: 'EXPLORE NOW',
    image: '/PONY FVC Utility Ironing Tables.png'
  },
  {
    id: 4,
    kicker: 'Essential',
    title: 'KC PRO CP COLOR INHIBITOR',
    subtitle: 'SHOP CHEMICALS',
    image: '/chemicals-group-transparent.png'
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
        <div className="carouselBanner" aria-roledescription="carousel" aria-label="Highlighted Products">
          <button className="carouselNavBtn prevBtn" aria-label="Previous slide" onClick={prevSlide}>
            <ChevronLeft size={24} className="navIcon" />
          </button>
          
          <div className="carouselContent">
            <div className="carouselText animate-slide-up" key={`text-${slide.id}`}>
              <div className="carouselKicker">{slide.kicker}</div>
              <h1 className="carouselTitle">{slide.title}</h1>
              <p className="carouselSubtitle">{slide.subtitle}</p>
              
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
            <div className="carouselImage animate-fade-in" key={`img-${slide.id}`}>
              <img src={slide.image} alt={slide.title} />
            </div>
          </div>
          
          <button className="carouselNavBtn nextBtn" aria-label="Next slide" onClick={nextSlide}>
            <ChevronRight size={24} className="navIcon" />
          </button>
        </div>
      </div>
    </section>
  );
}
