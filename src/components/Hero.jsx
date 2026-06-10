import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  return (
    <section id="home" className="hero animate-fade-in">
      <div className="heroInner">
        <div className="heroBanner">
          <div className="heroCopy">
            <div className="heroKicker">Complete Laundry Solutions</div>
            <h1 className="heroTitle">Clean clothes. Fresh feels. Smarter prices.</h1>
            <p className="heroSubtitle">
              Shop LG machines, Speed Queen washers, PONY equipments, and genuine spare parts — everything you need for spotless results.
            </p>

            <div className="heroCtas">
              <a className="ctaPrimary" href="#products">
                Shop all products
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
                Premium quality products
              </div>
            </div>
          </div>

          <div className="heroVisual" aria-hidden="true">
            <img
              src="/washing-machine.png.png"
              alt=""
              loading="eager"
            />
          </div>
        </div>

        <div className="promoRow">
          <a className="promoCard" href="#products">
            <div className="promoTop">Laundry Machines</div>
            <div className="promoTitle">LG & Speed Queen Commercial Washers</div>
            <div className="promoFoot">Shop all →</div>
          </a>
          <a className="promoCard" href="#products">
            <div className="promoTop">Finishing Equipments</div>
            <div className="promoTitle">PONY ironing & finishing solutions</div>
            <div className="promoFoot">Explore equipments →</div>
          </a>
          <a className="promoCard" href="#products">
            <div className="promoTop">Genuine Parts</div>
            <div className="promoTitle">Authentic spare parts for all machines</div>
            <div className="promoFoot">Browse parts →</div>
          </a>
        </div>
      </div>
    </section>
  );
}
