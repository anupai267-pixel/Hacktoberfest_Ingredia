import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Copy 
} from 'lucide-react';
import type { NormalizedProduct } from '../../types/product';

interface LabelUploadOCRProps {
  onProductReady: (product: NormalizedProduct) => void;
}

/**
 * Preprocesses an uploaded food label image on an offscreen canvas:
 * 1. Downscales excessively large images (max dimension 1600px) to prevent worker OOM crashes.
 * 2. Enhances contrast and converts to high-contrast grayscale to dramatically improve OCR accuracy.
 */
async function preprocessImageForOCR(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // 1. Constrain dimensions
      const maxDim = 1600;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        // Fallback to raw file if canvas context unavailable
        resolve(file);
        return;
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 2. Grayscale & Contrast enhancement
        // Contrast multiplier: 1.25 gives crisp letter edges without blowing out highlights
        const contrast = 1.25;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R luminance weights
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const adjusted = factor * (gray - 128) + 128;
          const clamped = Math.max(0, Math.min(255, adjusted));

          data[i] = clamped;
          data[i + 1] = clamped;
          data[i + 2] = clamped;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.92);
      } catch (e) {
        console.warn('Canvas filter failed, falling back to original image:', e);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export const LabelUploadOCR: React.FC<LabelUploadOCRProps> = ({ onProductReady }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Raw OCR debug state
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);

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

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image file is too large (maximum 15MB).');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setHasExtracted(false);
    setRawOcrText('');
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
    setRawOcrText('');
  };

  const runOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressStatus('Preprocessing and optimizing label photo...');
    setProgressPercent(15);

    try {
      // 1. Optimize image resolution & contrast before feeding to Tesseract
      const processedBlob = await preprocessImageForOCR(selectedFile);

      setProgressStatus('Loading OCR recognition models...');
      setProgressPercent(30);

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgressStatus('Scanning text lines & recognizing food label details...');
            const p = Math.round((m.progress || 0) * 100);
            setProgressPercent(30 + Math.round(p * 0.65));
          } else if (m.status) {
            setProgressStatus(m.status);
          }
        },
      });

      const ret = await worker.recognize(processedBlob);
      await worker.terminate();

      const fullText = (ret.data.text || '').trim();
      setRawOcrText(fullText);

      if (!fullText) {
        throw new Error('No legible text could be recognized in this image. Please verify lighting, orient the packaging right side up, or type details in manually.');
      }

      setProgressStatus('Parsing ingredients and nutritional tables...');
      setProgressPercent(100);

      // Heuristic Information Extraction
      parseExtractedText(fullText);
      setHasExtracted(true);
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('OCR extraction error:', e);
      setErrorMessage(e.message || 'Failed to read image. You can type in the ingredients manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Robust multi-pass heuristic extractor for packaging text
   */
  const parseExtractedText = (text: string) => {
    // Clean up OCR character artifacts: normalize quotes, bullets, and dashes
    const normalized = text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[•·*]/g, ', ');

    // 1. Ingredients section extraction
    // Match INGREDIENTS or COMPOSITION until allergen statement, nutrition header, manufacturer address, or end
    const ingPattern = /(?:ingredients?|ingr[eé]dients?|composition|list\s*of\s*ingredients?)[:\s-]([\s\S]+?)(?=(?:allergen\s*info(?:rmation)?|contains?|may\s*contain|nutrition\s*facts?|nutritional\s*info|mfd\s*by|marketed\s*by|net\s*wt|storage|batch\s*no|fssai|\n\s*\n\s*[A-Z\s]{4,}:|$))/i;
    const ingMatch = normalized.match(ingPattern);

    if (ingMatch && ingMatch[1] && ingMatch[1].trim().length > 5) {
      // Clean up extracted block
      const cleaned = ingMatch[1]
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      setIngredientsText(cleaned);
    } else {
      // Fallback: If no explicit INGREDIENTS header was detected, find lines with commas or common food words
      const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
      const foodLines = lines.filter(l => 
        /flour|oil|sugar|salt|wheat|water|milk|seasoning|spice|preservative|emulsifier|flavor|starch|syrup|acid/i.test(l)
      );

      if (foodLines.length > 0) {
        setIngredientsText(foodLines.join(', '));
      } else {
        // Last resort: provide the raw text
        setIngredientsText(normalized.replace(/\n+/g, ' ').slice(0, 1000).trim());
      }
    }

    // 2. Contains / Declared Allergens extraction
    // Common formats: "CONTAINS: WHEAT, MILK", "ALLERGEN INFORMATION: CONTAINS SOY"
    const containsPattern = /(?:contains?|allergen\s*info(?:rmation)?|allergen\s*declaration)[:\s-]*([^.\n]+(?:\n[^\n]+)?)/i;
    const containsMatch = normalized.match(containsPattern);
    if (containsMatch && containsMatch[1]) {
      const allText = containsMatch[1]
        .replace(/may\s*contain[\s\S]*/i, '') // don't bleed into may contain
        .replace(/\n+/g, ' ')
        .replace(/\.$/, '')
        .trim();
      setDeclaredAllergensText(allText);
    }

    // 3. Traces / May Contain extraction
    const tracePattern = /(?:may\s*contain(?:\s*traces\s*of)?|cross[- ]contact|produced\s*in\s*a\s*facility\s*that\s*also\s*processes)[:\s-]*([^.\n]+(?:\n[^\n]+)?)/i;
    const traceMatch = normalized.match(tracePattern);
    if (traceMatch && traceMatch[1]) {
      const trText = traceMatch[1]
        .replace(/\n+/g, ' ')
        .replace(/\.$/, '')
        .trim();
      setTraceWarningsText(trText);
    }

    // 4. Robust Nutritional Table Parser
    // Sugars (Total Sugars, Sugars, of which sugars)
    const sugarMatch = normalized.match(/(?:total\s+sugars?|added\s+sugars?|of\s+which\s+sugars?|sugars?)[^\d\n]*?(\d+(?:[.,]\d+)?)/i);
    if (sugarMatch && sugarMatch[1]) setSugarsVal(sugarMatch[1].replace(',', '.'));

    // Saturated Fat
    const satFatMatch = normalized.match(/(?:saturated\s*(?:fatty\s*acids?|fat|fats?)|sat(?:\.|\s*)fat)[^\d\n]*?(\d+(?:[.,]\d+)?)/i);
    if (satFatMatch && satFatMatch[1]) setSatFatVal(satFatMatch[1].replace(',', '.'));

    // Sodium
    const sodiumMatch = normalized.match(/sodium[^\d\n]*?(\d+(?:[.,]\d+)?)\s*(mg|g|milligrams)?/i);
    if (sodiumMatch && sodiumMatch[1]) {
      let num = parseFloat(sodiumMatch[1].replace(',', '.'));
      if (sodiumMatch[2] && sodiumMatch[2].toLowerCase().startsWith('g')) {
        num *= 1000;
      }
      setSodiumVal(num.toString());
    }

    // Salt
    const saltMatch = normalized.match(/(?:salt|equivalent\s*as\s*salt)[^\d\n]*?(\d+(?:[.,]\d+)?)/i);
    if (saltMatch && saltMatch[1]) setSaltVal(saltMatch[1].replace(',', '.'));

    // Energy / Calories: prioritize kcal to avoid capturing 2200 kJ as calories!
    const kcalMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*kcal/i);
    if (kcalMatch && kcalMatch[1]) {
      setCaloriesVal(kcalMatch[1].replace(',', '.'));
    } else {
      const calMatch = normalized.match(/(?:calories|calorie|energy)[^\d\n]*?(\d+(?:[.,]\d+)?)/i);
      if (calMatch && calMatch[1]) {
        setCaloriesVal(calMatch[1].replace(',', '.'));
      }
    }
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
                PNG, JPG or WebP up to 15MB
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color="var(--status-suitable)" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Review & Correct Extracted Label</h3>
            </div>

            {rawOcrText && (
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
              >
                <span>{showRawText ? 'Hide Raw OCR Text' : 'View Full Extracted Text'}</span>
                {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Raw Text Drawer */}
          {showRawText && rawOcrText && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.875rem',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                <span>RAW OCR CAPTURE ({rawOcrText.length} characters)</span>
                <button
                  type="button"
                  onClick={() => setIngredientsText(rawOcrText.replace(/\n+/g, ' ').trim())}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-berry)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Copy size={12} />
                  <span>Copy to Ingredients</span>
                </button>
              </div>
              {rawOcrText}
            </div>
          )}

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            OCR text extraction can contain small character flaws. Please verify the detected fields and adjust any numbers or ingredients before proceeding.
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
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

          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '1.25rem 0 0.75rem 0' }}>
            Nutrition Facts per 100g (Leave blank if not on package)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
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

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
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
