import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getScanHistory } from '../services/historyService';
import type { ScanHistoryRecord } from '../types/analysis';
import { VerdictBadge } from '../components/common/VerdictBadge';
import { SampleProductPicker } from '../components/common/SampleProductPicker';
import { 
  Camera, 
  Upload, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getScanHistory(user?.id).then((records) => {
      setHistory(records);
      setIsLoading(false);
    });
  }, [user?.id]);

  // Compute distribution
  const suitableCount = history.filter((h) => h.verdict === 'suitable').length;
  const cautionCount = history.filter((h) => h.verdict === 'caution').length;
  const avoidCount = history.filter((h) => h.verdict === 'avoid').length;
  const insufficientCount = history.filter((h) => h.verdict === 'insufficient_data').length;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome & Primary Actions Banner */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--primary-berry)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Dashboard Overview
          </span>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>
            Welcome back{profile.fullName ? `, ${profile.fullName}` : ''}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '540px' }}>
            Scan retail barcodes or upload package labels to screen ingredients against your configured allergy and dietary preferences.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/scan" className="btn btn-primary btn-lg" style={{ gap: '0.625rem' }}>
            <Camera size={20} />
            <span>Scan a Product</span>
          </Link>
          <Link to="/upload-label" className="btn btn-secondary btn-lg" style={{ gap: '0.625rem' }}>
            <Upload size={18} />
            <span>Upload Label</span>
          </Link>
        </div>
      </div>

      {/* Stats & Saved Profile Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Active Profile Snapshot Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="var(--primary-berry)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Profile Rules</h3>
            </div>
            <Link to="/profile" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              Edit Preferences →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Declared Allergies:</span>
              <span style={{ fontWeight: 500, color: profile.allergies?.length ? 'var(--status-avoid)' : 'var(--text-main)' }}>
                {profile.allergies?.length
                  ? profile.allergies.map((a) => a.replace('_', ' ')).join(', ')
                  : 'None declared'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Lactose Intolerance:</span>
              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                {profile.lactoseIntolerance || 'No'}
              </span>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Dietary Lifestyle:</span>
              <span style={{ fontWeight: 500 }}>
                {profile.preferences?.isVegan
                  ? 'Vegan'
                  : profile.preferences?.isVegetarian
                  ? 'Vegetarian'
                  : 'Standard Omnivore'}
              </span>
            </div>

            {profile.diabetesStatus && profile.diabetesStatus !== 'none' && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Diabetes Context:</span>
                <span style={{ fontWeight: 500, color: 'var(--status-caution)' }}>
                  {profile.diabetesStatus.replace('_', ' ').toUpperCase()} Screening Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verdict Distribution Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Total Scans: {history.length}</h3>
            <Link to="/history" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
              Full History →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: 'var(--status-suitable-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-suitable-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-suitable)', fontWeight: 600 }}>SUITABLE</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-suitable)' }}>{suitableCount}</div>
            </div>

            <div style={{ background: 'var(--status-caution-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-caution-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-caution)', fontWeight: 600 }}>CAUTION</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-caution)' }}>{cautionCount}</div>
            </div>

            <div style={{ background: 'var(--status-avoid-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-avoid-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-avoid)', fontWeight: 600 }}>AVOID</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-avoid)' }}>{avoidCount}</div>
            </div>

            <div style={{ background: 'var(--status-insufficient-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-insufficient-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-insufficient)', fontWeight: 600 }}>INSUFFICIENT</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-insufficient)' }}>{insufficientCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Test Sampler */}
      <SampleProductPicker title="Quick Barcode Demonstrations & Edge Cases" />

      {/* Recent Scans Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--primary-berry)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Scans</h3>
          </div>
          {history.length > 0 && (
            <Link to="/history" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              View all ({history.length}) →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading recent scans...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--bg-blush)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <Camera size={22} color="var(--primary-berry)" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No products scanned yet</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
              Your scan history will appear here. Try scanning a barcode or clicking one of the sample test fixtures above.
            </p>
            <Link to="/scan" className="btn btn-primary btn-sm">
              Scan First Product
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.slice(0, 5).map((record) => (
              <div
                key={record.id}
                onClick={() => navigate(`/product/${record.barcode || record.productId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-berry)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {record.imageUrl ? (
                    <img
                      src={record.imageUrl}
                      alt={record.productName}
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-blush)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={18} color="var(--primary-berry)" />
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.125rem' }}>
                      {record.productName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {record.brand ? `${record.brand} • ` : ''}
                      Barcode: {record.barcode} • {new Date(record.scannedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <VerdictBadge verdict={record.verdict} size="sm" />
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
