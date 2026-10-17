import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SampleProductPickerProps {
  onSelectSample?: (barcode: string) => void;
  title?: string;
}

export const SampleProductPicker: React.FC<SampleProductPickerProps> = ({
  onSelectSample,
  title = 'Quick Test: Try a Demonstration Product',
}) => {
  const navigate = useNavigate();

  const handleSelect = (barcode: string) => {
    if (onSelectSample) {
      onSelectSample(barcode);
    } else {
      navigate(`/product/${barcode}`);
    }
  };

  const scenarios: { barcode: string; label: string; badge: string }[] = [
    { barcode: '3017620422003', label: 'Organic Rolled Oats', badge: 'Suitable / Clean' },
    { barcode: '8000500179864', label: 'Cocoa Hazelnut Spread', badge: 'High Sugar Flag' },
    { barcode: '5201051001078', label: 'Whole Milk Greek Yogurt', badge: 'Milk Allergen' },
    { barcode: '0040000004123', label: 'Crunchy Peanut Butter', badge: 'Peanut Allergen' },
    { barcode: '7622210449283', label: '70% Dark Chocolate', badge: 'Tree Nut Trace' },
    { barcode: '5012345678900', label: 'Alpine Herbal Tea', badge: 'Missing Data' },
    { barcode: '8801043003001', label: 'Instant Spicy Ramen', badge: 'High Sodium' },
    { barcode: '4001686301524', label: 'Fruit Gummy Bears', badge: 'Gelatin / Non-Vegan' },
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <Sparkles size={16} color="var(--primary-berry)" />
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {title}
        </h4>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Click any verified test fixture to evaluate safety rules, allergen detection, and missing-data logic:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.625rem',
        }}
      >
        {scenarios.map((item) => (
          <button
            key={item.barcode}
            type="button"
            onClick={() => handleSelect(item.barcode)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.625rem 0.75rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-berry)';
              e.currentTarget.style.backgroundColor = 'var(--bg-blush)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'var(--bg-main)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--primary-berry)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {item.badge}
              </span>
              <ArrowRight size={13} color="var(--text-muted)" />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
