import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="app-container-narrow" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div className="card" style={{ padding: '3rem 1.5rem', maxWidth: '480px', margin: '0 auto' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--bg-blush)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          <HelpCircle size={28} color="var(--primary-berry)" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          The page or product you are looking for does not exist or may have been moved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn btn-primary">
            <Home size={16} />
            <span>Go to Dashboard</span>
          </Link>
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Home Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
