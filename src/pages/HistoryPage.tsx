import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getScanHistory, deleteScanRecord, clearAllHistory } from '../services/historyService';
import type { ScanHistoryRecord } from '../types/analysis';
import { VerdictBadge } from '../components/common/VerdictBadge';
import { 
  Clock, 
  Trash2, 
  Sparkles, 
  Camera, 
  AlertCircle 
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    const records = await getScanHistory(user?.id);
    setHistory(records);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteScanRecord(id, user?.id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllHistory(user?.id);
    setHistory([]);
    setShowClearConfirm(false);
  };

  const filteredHistory = history.filter((record) => {
    if (selectedVerdictFilter === 'all') return true;
    return record.verdict === selectedVerdictFilter;
  });

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Scan History
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review past packaged-food scans and safety evaluations ({history.length} total).
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-danger btn-sm"
          >
            <Trash2 size={15} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          {[
            { id: 'all', label: `All (${history.length})` },
            { id: 'suitable', label: `Suitable (${history.filter(h => h.verdict === 'suitable').length})` },
            { id: 'caution', label: `Caution (${history.filter(h => h.verdict === 'caution').length})` },
            { id: 'avoid', label: `Avoid (${history.filter(h => h.verdict === 'avoid').length})` },
            { id: 'insufficient_data', label: `Insufficient (${history.filter(h => h.verdict === 'insufficient_data').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedVerdictFilter(tab.id)}
              className={`btn btn-sm ${selectedVerdictFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            background: 'var(--status-avoid-bg)',
            border: '1px solid var(--status-avoid-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-avoid)', fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>Are you sure you want to delete all scan history?</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            This will permanently remove all stored scan snapshots from this device.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={handleClearAll} className="btn btn-danger btn-sm">
              Yes, Delete Everything
            </button>
            <button type="button" onClick={() => setShowClearConfirm(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scans List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading scan records...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Clock size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {history.length === 0 ? 'No Scans Recorded Yet' : 'No Scans Match this Filter'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {history.length === 0
              ? 'Scan barcodes with your camera or test our sample products to see results here.'
              : 'Try selecting a different filter tab above.'}
          </p>
          {history.length === 0 && (
            <Link to="/scan" className="btn btn-primary">
              <Camera size={16} />
              <span>Start Scanning</span>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/product/${item.barcode || item.productId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-berry)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-blush)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={20} color="var(--primary-berry)" />
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.125rem' }}>
                    {item.productName}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {item.brand && <span>{item.brand}</span>}
                    <span>•</span>
                    <span>Barcode: {item.barcode}</span>
                    <span>•</span>
                    <span>{new Date(item.scannedAt).toLocaleDateString()} at {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <VerdictBadge verdict={item.verdict} size="md" />
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                  }}
                  title="Delete scan"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-avoid)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
