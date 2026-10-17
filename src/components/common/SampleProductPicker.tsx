import React, { useState } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SampleProductPickerProps {
  onSelectSample?: (barcode: string) => void;
  title?: string;
}

interface ProductScenario {
  barcode: string;
  label: string;
  badge: string;
  category: 'indian_snacks' | 'indian_biscuits' | 'test_fixtures';
  brand?: string;
}

export const SampleProductPicker: React.FC<SampleProductPickerProps> = ({
  onSelectSample,
  title = 'Quick Test: Try a Verified Food Product',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'indian' | 'test'>('indian');

  const handleSelect = (barcode: string) => {
    if (onSelectSample) {
      onSelectSample(barcode);
    } else {
      navigate(`/product/${barcode}`);
    }
  };

  const scenarios: ProductScenario[] = [
    // Popular Indian Snacks
    { barcode: '8901491101837', label: "Lay's Classic Salted", brand: "Lay's", badge: 'Indian Snack', category: 'indian_snacks' },
    { barcode: '8901491000789', label: "Lay's India's Magic Masala", brand: "Lay's", badge: 'Indian Snack', category: 'indian_snacks' },
    { barcode: '8901491001038', label: "Lay's Spanish Tomato Tango", brand: "Lay's", badge: 'Indian Snack', category: 'indian_snacks' },
    { barcode: '8901491361026', label: 'Kurkure Masala Munch', brand: 'Kurkure', badge: 'Indian Snack', category: 'indian_snacks' },
    { barcode: '8901491366229', label: 'Kurkure Solid Masti', brand: 'Kurkure', badge: 'Indian Snack', category: 'indian_snacks' },
    { barcode: '8901491103046', label: 'Kurkure Green Chutney Rajasthani', brand: 'Kurkure', badge: 'Indian Snack', category: 'indian_snacks' },

    // Popular Indian Biscuits
    { barcode: '8901719134845', label: 'Parle-G Original Gluco', brand: 'Parle', badge: 'Indian Biscuit', category: 'indian_biscuits' },
    { barcode: '8901063092617', label: 'Britannia Good Day Butter', brand: 'Britannia', badge: 'Indian Biscuit', category: 'indian_biscuits' },
    { barcode: '8901063093522', label: 'Britannia Good Day Cashew', brand: 'Britannia', badge: 'Indian Biscuit', category: 'indian_biscuits' },
    { barcode: '8901063162648', label: 'Britannia Marie Gold', brand: 'Britannia', badge: 'Indian Biscuit', category: 'indian_biscuits' },
    { barcode: '8901725015275', label: 'Sunfeast Dark Fantasy Choco Fills', brand: 'ITC Sunfeast', badge: 'Indian Biscuit', category: 'indian_biscuits' },
    { barcode: '7622300336738', label: 'Oreo Original Vanilla Creme', brand: 'Cadbury Oreo', badge: 'Popular Biscuit', category: 'indian_biscuits' },
    { barcode: '5000396015935', label: "McVitie's Digestive Original", brand: "McVitie's", badge: 'Digestive Biscuit', category: 'indian_biscuits' },

    // Edge Case Test Scenarios
    { barcode: '3017620422003', label: 'Organic Rolled Oats', brand: 'Whole Grains', badge: 'Suitable / Clean', category: 'test_fixtures' },
    { barcode: '8000500179864', label: 'Cocoa Hazelnut Spread', brand: 'Sweet Spreads', badge: 'High Sugar Flag', category: 'test_fixtures' },
    { barcode: '5201051001078', label: 'Whole Milk Greek Yogurt', brand: 'Dairy Fresh', badge: 'Milk Allergen', category: 'test_fixtures' },
    { barcode: '0040000004123', label: 'Crunchy Peanut Butter', brand: 'Classic Nut', badge: 'Peanut Allergen', category: 'test_fixtures' },
    { barcode: '7622210449283', label: '70% Dark Chocolate', brand: 'Fine Cocoa', badge: 'Tree Nut Trace', category: 'test_fixtures' },
    { barcode: '5012345678900', label: 'Alpine Herbal Tea', brand: 'Herbal Infusions', badge: 'Missing Data', category: 'test_fixtures' },
    { barcode: '8801043003001', label: 'Instant Spicy Ramen', brand: 'Noodle Works', badge: 'High Sodium', category: 'test_fixtures' },
    { barcode: '4001686301524', label: 'Fruit Gummy Bears', brand: 'Confectionery', badge: 'Gelatin / Non-Vegan', category: 'test_fixtures' },
  ];

  const filteredScenarios = scenarios.filter((s) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'indian') return s.category === 'indian_snacks' || s.category === 'indian_biscuits';
    if (activeTab === 'test') return s.category === 'test_fixtures';
    return true;
  });

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} color="var(--primary-berry)" />
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {title}
          </h4>
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-main)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('indian')}
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'indian' ? 600 : 500,
              background: activeTab === 'indian' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'indian' ? 'var(--primary-berry)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: activeTab === 'indian' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Indian Snacks & Biscuits (13)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'test' ? 600 : 500,
              background: activeTab === 'test' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'test' ? 'var(--primary-berry)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: activeTab === 'test' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Safety Rule Fixtures (8)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'all' ? 600 : 500,
              background: activeTab === 'all' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'all' ? 'var(--primary-berry)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: activeTab === 'all' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            All Products
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Select any verified product barcode to test real Open Food Facts data, transparent allergen rules, and nutrition analysis:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.625rem',
        }}
      >
        {filteredScenarios.map((item) => (
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {item.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              {item.brand ? `${item.brand} • ` : ''}Barcode: {item.barcode}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
