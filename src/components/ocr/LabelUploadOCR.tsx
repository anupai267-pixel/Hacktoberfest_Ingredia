import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight } from 'lucide-react';
import type { NormalizedProduct } from '../../types/product';

interface LabelUploadOCRProps {
  onProductReady: (product: NormalizedProduct) => void;
}

export const LabelUploadOCR: React.FC<LabelUploadOCRProps> = ({ onProductReady }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable Review Form state after OCR
  const [hasExtracted, setHasExtracted] = useState(false);
  const [productName, setProductName] = useState('Scanned Packaged Item');
  const [ingredientsText, setIngredientsText] = useState('');
  const [declaredAllergensText, setDeclaredAllergensText] = useState('');
  const [traceWarningsText, setTraceWarningsText] = useState('');
  const [sugarsVal, setSugarsVal] = useState<string>('');
  const [satFatVal, setSatFatVal] = useState<string>('');
  const [sodiumVal, setSodiumVal] = useState<string>('');
  const [saltVal, setSaltVal] = useState<string>('');
  const [caloriesVal, setCaloriesVal] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large (maximum 10MB).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasExtracted(false);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setHasExtracted(false);
    setProgressPercent(0);
    setProgressStatus('');
  };

  const runOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressStatus('Initializing OCR engine...');
    setProgressPercent(10);

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgressStatus('Scanning and extracting label text...');
            setProgressPercent(Math.round((m.progress || 0) * 100));
          } else {
            setProgressStatus(m.status || 'Processing...');
          }
        },
      });

      const ret = await worker.recognize(selectedFile);
      await worker.terminate();

      const fullText = ret.data.text || '';
      if (!fullText.trim()) {
        throw new Error('No legible text could be extracted from this image. Please ensure good lighting or enter details manually.');
      }

      // Heuristic Information Extraction
      parseExtractedText(fullText);
      setHasExtracted(true);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to read image. You can type in the ingredients manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExtractedText = (text: string) => {
    // 1. Ingredients section extraction
    const ingMatch = text.match(/ingredients?[:\s]([\s\S]+?)(?=(nutrition|contains|allergens|distributed|manufactured|\n\n|$))/i);
    if (ingMatch && ingMatch[1]) {
      setIngredientsText(ingMatch[1].replace(/\n+/g, ' ').trim());
    } else {
      setIngredientsText(text.replace(/\n+/g, ' ').trim());
    }

    // 2. Contains / Allergens extraction
    const containsMatch = text.match(/contains?[:\s]([\s\S]+?)(?=(may contain|nutrition|\n|$))/i);
    if (containsMatch && containsMatch[1]) {
      setDeclaredAllergensText(containsMatch[1].replace(/\n+/g, ' ').trim());
    }

    // 3. Traces extraction
    const traceMatch = text.match(/may contain[:\s]([\s\S]+?)(?=(nutrition|\n|$))/i);
    if (traceMatch && traceMatch[1]) {
      setTraceWarningsText(traceMatch[1].replace(/\n+/g, ' ').trim());
    }

    // 4. Nutrition numbers
    const sugarMatch = text.match(/sugars?[:\s]*(\d+(\.\d+)?)\s*g/i);
    if (sugarMatch && sugarMatch[1]) setSugarsVal(sugarMatch[1]);

    const satFatMatch = text.match(/saturated\s*fat[:\s]*(\d+(\.\d+)?)\s*g/i);
    if (satFatMatch && satFatMatch[1]) setSatFatVal(satFatMatch[1]);

    const sodiumMatch = text.match(/sodium[:\s]*(\d+(\.\d+)?)\s*(mg|g)/i);
    if (sodiumMatch && sodiumMatch[1]) {
      const num = parseFloat(sodiumMatch[1]);
      setSodiumVal(sodiumMatch[3].toLowerCase() === 'g' ? (num * 1000).toString() : num.toString());
    }

    const saltMatch = text.match(/salt[:\s]*(\d+(\.\d+)?)\s*g/i);
    if (saltMatch && saltMatch[1]) setSaltVal(saltMatch[1]);

    const calMatch = text.match(/(calories|energy)[:\s]*(\d+)/i);
    if (calMatch && calMatch[2]) setCaloriesVal(calMatch[2]);
  };

  const handleConfirmAndAnalyze = () => {
    const cleanIngredients = ingredientsText.trim();
    const parsedSugars = sugarsVal ? parseFloat(sugarsVal) : null;
    const parsedSatFat = satFatVal ? parseFloat(satFatVal) : null;
    const parsedSodium = sodiumVal ? parseFloat(sodiumVal) : null;
    const parsedSalt = saltVal ? parseFloat(saltVal) : null;
    const parsedCalories = caloriesVal ? parseFloat(caloriesVal) : null;

    const declaredAllergens = declaredAllergensText
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const traceWarnings = traceWarningsText
      ? [traceWarningsText.trim()]
      : [];

    const isIngMissing = cleanIngredients.length === 0;
    const isNutMissing = parsedSugars === null && parsedSatFat === null && parsedSodium === null && parsedSalt === null;

    const ocrProduct: NormalizedProduct = {
      id: `ocr-${Date.now()}`,
      barcode: `OCR-${Date.now().toString().slice(-6)}`,
      name: productName.trim() || 'Label Scanned Food',
      brand: 'Scanned from Label',
      imageUrl: previewUrl || undefined,
      ingredientsText: cleanIngredients,
      parsedIngredients: cleanIngredients.split(/[,;()]/).map((s) => s.trim()).filter(Boolean),
      declaredAllergens,
      traceWarnings,
      nutrition: {
        basis: '100g',
        sugars: { value: parsedSugars, unit: 'g', isMissing: parsedSugars === null },
        saturatedFat: { value: parsedSatFat, unit: 'g', isMissing: parsedSatFat === null },
        sodium: { value: parsedSodium, unit: 'mg', isMissing: parsedSodium === null },
        salt: { value: parsedSalt, unit: 'g', isMissing: parsedSalt === null },
        energyKcal: { value: parsedCalories, unit: 'kcal', isMissing: parsedCalories === null },
      },
      source: 'label_ocr',
      retrievalTimestamp: new Date().toISOString(),
      missingDataFlags: {
        ingredientsMissing: isIngMissing,
        allergensMissing: declaredAllergens.length === 0 && isIngMissing,
        nutritionMissing: isNutMissing,
      },
      userConfirmed: true,
    };

    onProductReady(ocrProduct);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.75rem',
      }}
    >
      {!hasExtracted ? (
        <div>
          {/* File Upload Dropzone */}
          {!previewUrl ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem 1.5rem',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)',
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--bg-blush)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Upload size={24} color="var(--primary-berry)" />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Upload or take a photo of the food label
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                PNG, JPG or WebP up to 10MB
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div>
              {/* Image Preview & Controls */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: '360px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#1A141C',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Food label preview"
                  style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  title="Remove image"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress bar during OCR */}
              {isProcessing && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{progressStatus}</span>
                    <span style={{ color: 'var(--primary-berry)', fontWeight: 600 }}>{progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-blush)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        background: 'var(--primary-berry)',
                        transition: 'width 200ms ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={runOCR}
                  disabled={isProcessing}
                  className="btn btn-primary"
                >
                  <FileText size={18} />
                  <span>{isProcessing ? 'Reading Label...' : 'Extract Text with OCR'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={isProcessing}
                  className="btn btn-secondary"
                >
                  Replace Image
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="alert-banner alert-banner-error" style={{ marginTop: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        /* Editable Review Form */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={20} color="var(--status-suitable)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Review & Correct Extracted Label</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            OCR text extraction can contain imperfections. Please inspect the detected fields and adjust any numbers or ingredients before proceeding with analysis.
          </p>

          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              className="form-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Granola Cereal"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ingredients List</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="e.g. Rolled oats, sugar, canola oil, dried cranberries..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Declared Allergens (if listed)</label>
              <input
                type="text"
                className="form-input"
                value={declaredAllergensText}
                onChange={(e) => setDeclaredAllergensText(e.target.value)}
                placeholder="e.g. Wheat, Milk, Soy"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Trace / May Contain Warnings</label>
              <input
                type="text"
                className="form-input"
                value={traceWarningsText}
                onChange={(e) => setTraceWarningsText(e.target.value)}
                placeholder="e.g. May contain tree nuts"
              />
            </div>
          </div>

          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '1rem 0 0.75rem 0' }}>
            Nutrition Facts per 100g (Leave blank if not on package)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Sugars (g)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={sugarsVal}
                onChange={(e) => setSugarsVal(e.target.value)}
                placeholder="e.g. 14.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sat. Fat (g)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={satFatVal}
                onChange={(e) => setSatFatVal(e.target.value)}
                placeholder="e.g. 2.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sodium (mg)</label>
              <input
                type="number"
                step="1"
                className="form-input"
                value={sodiumVal}
                onChange={(e) => setSodiumVal(e.target.value)}
                placeholder="e.g. 350"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salt (g)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={saltVal}
                onChange={(e) => setSaltVal(e.target.value)}
                placeholder="e.g. 0.8"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Energy (kcal)</label>
              <input
                type="number"
                step="1"
                className="form-input"
                value={caloriesVal}
                onChange={(e) => setCaloriesVal(e.target.value)}
                placeholder="e.g. 320"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleConfirmAndAnalyze}
              className="btn btn-primary"
            >
              <span>Confirm & Run Analysis</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setHasExtracted(false)}
              className="btn btn-secondary"
            >
              <RefreshCw size={15} />
              <span>Re-scan Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
