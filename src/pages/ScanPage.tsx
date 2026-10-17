import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '../components/scanner/BarcodeScanner';
import { SampleProductPicker } from '../components/common/SampleProductPicker';
import { Barcode, Search, AlertCircle, Upload } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBarcodeSubmit = async (code: string) => {
    const clean = code.trim().replace(/\D/g, '');
    if (!clean) {
      setErrorMessage('Please enter a valid numeric barcode.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Direct navigate to product view which performs full fetch & rule analysis
    navigate(`/product/${clean}`);
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeSubmit(manualBarcode);
  };

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
          Scan Product Barcode
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Scan package barcodes in real-time using your camera or enter the number below.
        </p>
      </div>

      {errorMessage && (
        <div className="alert-banner alert-banner-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Real-Time Camera Scanner */}
      <BarcodeScanner onBarcodeDetected={handleBarcodeSubmit} isLoading={isLoading} />

      {/* Manual Barcode Input Fallback */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Barcode size={18} color="var(--primary-berry)" />
          <span>Manual Barcode Entry</span>
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          If your camera is unavailable or the barcode is damaged, type the numbers printed below the barcode lines:
        </p>

        <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            className="form-input"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="e.g. 3017620422003 or 8000500179864"
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={isLoading || !manualBarcode.trim()}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            <Search size={16} />
            <span>{isLoading ? 'Searching...' : 'Look Up'}</span>
          </button>
        </form>
      </div>

      {/* Don't have a barcode? Label upload link */}
      <div
        style={{
          background: 'var(--bg-blush)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            No barcode on the packaging?
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            You can take a photo of the ingredients list or nutrition table and extract the text with OCR.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload-label')}
          className="btn btn-secondary btn-sm"
        >
          <Upload size={15} />
          <span>Upload Food Label</span>
        </button>
      </div>

      {/* Instant Demo Samples Picker */}
      <SampleProductPicker
        title="Or Test With Instant Product Fixtures"
        onSelectSample={handleBarcodeSubmit}
      />
    </div>
  );
};
