import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LabelUploadOCR } from '../components/ocr/LabelUploadOCR';
import { SampleProductPicker } from '../components/common/SampleProductPicker';
import type { NormalizedProduct } from '../types/product';
import { Camera } from 'lucide-react';

export const UploadLabelPage: React.FC = () => {
  const navigate = useNavigate();

  const handleProductExtracted = (product: NormalizedProduct) => {
    // Save to sessionStorage and localStorage so ProductResultPage can retrieve custom OCR products
    sessionStorage.setItem(`ingredia_product_${product.id}`, JSON.stringify(product));
    localStorage.setItem(`ingredia_product_${product.id}`, JSON.stringify(product));
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
          Food Label Image & OCR
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          Upload a clear photo of an ingredient panel or nutrition facts table. Ingredia extracts the text and lets you review it before running safety analysis.
        </p>
      </div>

      <LabelUploadOCR onProductReady={handleProductExtracted} />

      <div
        style={{
          background: '#FFFFFF',
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
            Prefer scanning the retail barcode?
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Look up manufacturer data automatically with your camera.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/scan')}
          className="btn btn-secondary btn-sm"
        >
          <Camera size={15} />
          <span>Switch to Barcode Scanner</span>
        </button>
      </div>

      <SampleProductPicker />
    </div>
  );
};
