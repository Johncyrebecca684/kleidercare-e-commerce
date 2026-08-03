import { useNavigate } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { X, ArrowRight, GitCompareArrows } from 'lucide-react';
import './CompareBar.css';

export default function CompareBar() {
  const navigate = useNavigate();
  const { compareItems, removeFromCompare, clearCompare, maxCompare } = useCompare();

  if (compareItems.length === 0) return null;

  const emptySlots = maxCompare - compareItems.length;

  return (
    <div className="compare-bar">
      <div className="compare-bar-inner">
        <div className="compare-bar-header">
          <GitCompareArrows size={18} />
          <span className="compare-bar-title">
            Compare Products ({compareItems.length}/{maxCompare})
          </span>
          <button className="compare-bar-clear" onClick={clearCompare}>
            Clear All
          </button>
        </div>

        <div className="compare-bar-items">
          {compareItems.map(item => (
            <div key={item.id} className="compare-bar-chip">
              <img src={item.image} alt={item.name} className="compare-bar-chip-img" />
              <div className="compare-bar-chip-info">
                <span className="compare-bar-chip-name">{item.name}</span>
                <span className="compare-bar-chip-price">₹{item.price.toLocaleString('en-IN')}</span>
              </div>
              <button
                className="compare-bar-chip-remove"
                onClick={() => removeFromCompare(item.id)}
                aria-label={`Remove ${item.name} from compare`}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="compare-bar-chip compare-bar-chip-empty">
              <span>+ Add Product</span>
            </div>
          ))}
        </div>

        <button
          className="compare-bar-action"
          disabled={compareItems.length < 2}
          onClick={() => navigate('/compare')}
        >
          Compare Now <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
