import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  return (
    <section id="home" className="hero">
      <div className="heroInner">
        <div className="heroBanner">
          <div className="heroCopy">
            <div className="heroKicker">Season Deals • Laundry Essentials</div>
            <h1 className="heroTitle">Clean clothes. Fresh feels. Smarter prices.</h1>
            <p className="heroSubtitle">
              Shop premium detergents, stain removers, and fabric care — curated for
              daily washes and special fabrics.
            </p>

            <div className="heroCtas">
              <a className="ctaPrimary" href="#products">
                Shop laundry products
                <ArrowRight size={18} />
              </a>
              <a className="ctaSecondary" href="#products">View best sellers</a>
            </div>

            <div className="heroMeta">
              <div className="metaItem">
                <Truck size={18} />
                Free delivery above ₹500
              </div>
              <div className="metaItem">
                <ShieldCheck size={18} />
                7-day returns
              </div>
              <div className="metaItem">
                <Sparkles size={18} />
                Fabric-safe formulas
              </div>
            </div>
          </div>

          <div className="heroVisual" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&h=700&fit=crop"
              alt=""
              loading="eager"
            />
          </div>
        </div>

        <div className="promoRow">
          <a className="promoCard" href="#products">
            <div className="promoTop">Bundle & Save</div>
            <div className="promoTitle">Value packs for family laundry</div>
            <div className="promoFoot">Shop offers →</div>
          </a>
          <a className="promoCard" href="#products">
            <div className="promoTop">Everyday Stains</div>
            <div className="promoTitle">Sprays & boosters for tough spots</div>
            <div className="promoFoot">Explore stain care →</div>
          </a>
          <a className="promoCard" href="#products">
            <div className="promoTop">Freshness</div>
            <div className="promoTitle">Softeners & scents that last</div>
            <div className="promoFoot">Browse fragrances →</div>
          </a>
        </div>
      </div>
    </section>
  );
}
