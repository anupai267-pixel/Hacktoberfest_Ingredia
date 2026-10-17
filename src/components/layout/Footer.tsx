import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border-color)',
        marginTop: 'auto',
        padding: '3rem 0 2rem 0',
      }}
    >
      <div className="app-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <img src="/ingredia-icon.svg" alt="Ingredia Icon" style={{ width: 28, height: 28 }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Ingred<span style={{ color: 'var(--primary-berry)' }}>ia</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.5 }}>
              Know what’s in your food. Transparent packaged-food ingredient screening, allergen alerts, and dietary insights powered by clear rules.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.875rem' }}>
              Application
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/scan">Barcode Scanner</Link></li>
              <li><Link to="/upload-label">Food Label OCR</Link></li>
              <li><Link to="/history">Scan History</Link></li>
              <li><Link to="/profile">Dietary Preferences</Link></li>
            </ul>
          </div>

          {/* Privacy & Safety Statement */}
          <div>
            <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="var(--primary-berry)" />
              <span>Privacy & Safety</span>
            </h5>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Your dietary profile and allergy selections remain private. When in local demo mode, data is kept strictly inside your browser.
            </p>
            <Link to="/settings" style={{ fontSize: '0.8125rem', color: 'var(--primary-berry)', fontWeight: 500 }}>
              Manage Data & Privacy Settings →
            </Link>
          </div>
        </div>

        {/* Mandatory Health & Food Disclaimer Box */}
        <div
          style={{
            background: 'var(--bg-blush)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.25rem' }}>
            Health & Food Information Disclaimer
          </strong>
          Ingredia is an educational food-label analysis tool. It does not provide medical diagnoses, treatment, or clinical nutrition guarantees. Product formulations, manufacturing lines, and ingredient lists may change without notice. Always inspect the physical label and consult your healthcare provider or allergist for individual medical advice.
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
          }}
        >
          <span>© {new Date().getFullYear()} Ingredia. Know What’s in Your Food. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Built for health-conscious food transparency <Heart size={13} color="var(--primary-berry)" />
          </span>
        </div>
      </div>
    </footer>
  );
};
