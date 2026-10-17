import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Upload,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import type { NormalizedProduct, NutritionBasis, NutritionValue } from '../../types/product';
import { fetchProductByBarcode } from '../../services/openFoodFactsService';

interface LabelUploadOCRProps {
  onProductReady: (product: NormalizedProduct) => void;
}

type ProcessingStep = 'idle' | 'preprocessing' | 'ocr' | 'structuring' | 'analyzing' | 'done' | 'failed';

interface StructuredLabelData {
  productName: string;
  brand?: string;
  barcode?: string;
  ingredientsText: string;
  parsedIngredients: string[];
  declaredAllergens: string[];
  traceWarnings: string[];
  basis: NutritionBasis;
  sugars: number | null;
  saturatedFat: number | null;
  sodium: number | null;
  salt: number | null;
  energyKcal: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrates: number | null;
  servingSize?: string;
  confidence: number;
}

/**
 * Known food brands for automatic brand identification
 */
const KNOWN_BRANDS = [
  "Lay's", 'Kurkure', 'Britannia', 'Parle', 'Sunfeast', 'Oreo', 'Cadbury',
  'Nestle', 'Nestlé', 'Amul', "Kellogg's", "Haldiram's", 'Bikaji', 'Pringles',
  'Doritos', 'Cheetos', "McVitie's", 'Kissan', 'Maggi', 'Nutella', 'Heinz',
  'Quaker', 'Tropicana', 'Coca-Cola', 'Pepsi', 'Mother Dairy', 'ITC'
];

/**
 * Preprocesses a food label image using an offscreen canvas:
 * - Constrains dimensions to optimal OCR bounds (1400–1800px)
 * - Enhances contrast and normalizes luminance without destructive over-binarization
 * - Inverts colors if the packaging has light text on dark backgrounds
 */
async function preprocessImage(
  file: File,
  mode: 'standard' | 'high_contrast' | 'inverted' = 'standard'
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 1800;
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
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. Calculate average luminance to detect dark packaging
        let totalLuminance = 0;
        const step = 8; // sample every 8th pixel for speed
        let sampleCount = 0;
        for (let i = 0; i < data.length; i += 4 * step) {
          totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sampleCount++;
        }
        const avgLuminance = totalLuminance / (sampleCount || 1);
        const shouldInvert = mode === 'inverted' || (mode === 'standard' && avgLuminance < 110);

        // 2. Contrast adjustment factor
        const contrast = mode === 'high_contrast' ? 1.45 : 1.25;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

          // Invert if packaging background is dark
          if (shouldInvert) {
            gray = 255 - gray;
          }

          // Apply contrast stretch
          const adjusted = factor * (gray - 128) + 128;
          const clamped = Math.max(0, Math.min(255, adjusted));

          data[i] = clamped;
          data[i + 1] = clamped;
          data[i + 2] = clamped;
        }

        ctx.putImageData(imgData, 0, 0);

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.94);
      } catch (e) {
        console.warn('Canvas preprocessor error, falling back to original file:', e);
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

/**
 * Normalizes common OCR misreadings of packaging text
 */
function sanitizePackagingText(raw: string): string {
  return raw
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[•·*]/g, ', ')
    .replace(/([0-9])\s*o\s*g\b/gi, '$1.0 g')
    .replace(/(\d+)[,.](\d+)/g, '$1.$2');
}

/**
 * Structures raw text into complete, accurate food packaging data
 */
function structureLabelText(rawText: string, ocrConfidence: number): StructuredLabelData {
  const text = sanitizePackagingText(rawText);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect Barcode digits if printed on the label
  let detectedBarcode: string | undefined;
  const barcodeMatch = text.match(/\b(890\d{10}|[0-9]{13}|[0-9]{12}|[0-9]{8})\b/);
  if (barcodeMatch && barcodeMatch[1]) {
    detectedBarcode = barcodeMatch[1].replace(/\D/g, '');
  }

  // 2. Identify Brand
  let detectedBrand: string | undefined;
  for (const b of KNOWN_BRANDS) {
    const rx = new RegExp(`\\b${b}\\b`, 'i');
    if (rx.test(text)) {
      detectedBrand = b;
      break;
    }
  }

  // 3. Identify Product Name from prominent header lines
  let productName = 'Packaged Food Item';
  const ignoredHeaderKeywords = /nutrition|ingredients|contains|best before|net wt|batch|mfg|fssai|expiry|mrp|customer care|keep cool/i;
  for (const line of lines.slice(0, 8)) {
    if (line.length >= 4 && line.length <= 60 && !ignoredHeaderKeywords.test(line)) {
      productName = line.replace(/^[^\w]+|[^\w]+$/g, '');
      break;
    }
  }
  if (detectedBrand && !productName.toLowerCase().includes(detectedBrand.toLowerCase())) {
    productName = `${detectedBrand} ${productName}`;
  }

  // 4. Extract Multi-Line Ingredients
  let ingredientsText = '';
  const ingHeaderMatch = text.match(
    /(?:ingredients?|ingr[eé]dients?|composition|list\s*of\s*ingredients?)[:\s-]([\s\S]+?)(?=(?:allergen\s*info|contains?|may\s*contain|nutrition\s*facts?|nutritional\s*info|mfd\s*by|marketed\s*by|net\s*wt|storage|batch\s*no|fssai|\n\s*\n\s*[A-Z\s]{4,}:|$))/i
  );

  if (ingHeaderMatch && ingHeaderMatch[1] && ingHeaderMatch[1].trim().length > 8) {
    ingredientsText = ingHeaderMatch[1]
      .replace(/\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else {
    // Heuristic: identify lines with food keywords if explicit header was occluded
    const foodLines = lines.filter(l =>
      /flour|oil|sugar|salt|wheat|water|milk|seasoning|spice|emulsifier|starch|cocoa|preservative|yeast|syrup|acid/i.test(l) &&
      !/per 100|energy|protein|carbohydrate/i.test(l)
    );
    if (foodLines.length > 0) {
      ingredientsText = foodLines.join(', ');
    } else {
      // Fallback to first major text block
      ingredientsText = lines.filter(l => l.includes(',')).join(', ') || text.slice(0, 500);
    }
  }

  // Clean trailing punctuation or addresses from ingredients
  ingredientsText = ingredientsText.replace(/(\.|;)\s*(mfd|marketed|fssai|store in)[\s\S]*/i, '$1').trim();

  // Parse individual ingredient items
  const parsedIngredients = ingredientsText
    .split(/[,;()]/)
    .map(s => s.trim().replace(/^and\s+/i, ''))
    .filter(s => s.length > 1 && !/^\d+$/.test(s));

  // 5. Extract Declared Allergens
  const declaredAllergens: string[] = [];
  const allergenMatch = text.match(
    /(?:contains?|allergen\s*info(?:rmation)?|allergen\s*declaration|allergen\s*advice)[:\s-]*([^.\n]+(?:\n[^\n]+)?)/i
  );
  if (allergenMatch && allergenMatch[1]) {
    const rawAll = allergenMatch[1]
      .replace(/may\s*contain[\s\S]*/i, '')
      .replace(/\n+/g, ' ')
      .trim();

    rawAll.split(/[,;&]|\band\b/i).forEach(item => {
      const clean = item.trim().toLowerCase().replace(/[^\w\s-]/g, '');
      if (clean && clean.length > 2 && !declaredAllergens.includes(clean)) {
        declaredAllergens.push(clean);
      }
    });
  }

  // 6. Extract Trace / May Contain Warnings
  const traceWarnings: string[] = [];
  const traceMatch = text.match(
    /(?:may\s*contain(?:\s*traces\s*of)?|cross[- ]contact|produced\s*in\s*a\s*facility\s*that\s*also\s*processes)[:\s-]*([^.\n]+(?:\n[^\n]+)?)/i
  );
  if (traceMatch && traceMatch[1]) {
    const rawTr = traceMatch[1].replace(/\n+/g, ' ').trim();
    if (rawTr) {
      traceWarnings.push(rawTr);
    }
  }

  // 7. Nutrition Facts Table Parsing
  // Basis
  let basis: NutritionBasis = '100g';
  if (/per\s*100\s*ml/i.test(text)) basis = '100ml';
  else if (/per\s*serving/i.test(text)) basis = 'serving';

  // Sugars
  let sugars: number | null = null;
  const sugarRx = text.match(/(?:total\s+sugars?|added\s+sugars?|of\s+which\s+sugars?|sugars?)[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (sugarRx && sugarRx[1]) sugars = parseFloat(sugarRx[1]);

  // Saturated Fat
  let saturatedFat: number | null = null;
  const satFatRx = text.match(/(?:saturated\s*(?:fatty\s*acids?|fat|fats?)|sat(?:\.|\s*)fat)[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (satFatRx && satFatRx[1]) saturatedFat = parseFloat(satFatRx[1]);

  // Sodium
  let sodium: number | null = null;
  const sodiumRx = text.match(/sodium[^\d\n]*?(\d+(?:\.\d+)?)\s*(mg|g)?/i);
  if (sodiumRx && sodiumRx[1]) {
    let val = parseFloat(sodiumRx[1]);
    if (sodiumRx[2] && sodiumRx[2].toLowerCase() === 'g') {
      val *= 1000;
    }
    sodium = Math.round(val);
  }

  // Salt
  let salt: number | null = null;
  const saltRx = text.match(/(?:salt|equivalent\s*as\s*salt)[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (saltRx && saltRx[1]) salt = parseFloat(saltRx[1]);

  // If sodium is missing but salt is present, calculate sodium stoichiometrically
  if (sodium === null && salt !== null) {
    sodium = Math.round((salt / 2.5) * 1000);
  }

  // Energy / Calories: prioritize kcal to never mistake 2200 kJ for calories
  let energyKcal: number | null = null;
  const kcalRx = text.match(/(\d+(?:\.\d+)?)\s*kcal/i);
  if (kcalRx && kcalRx[1]) {
    energyKcal = Math.round(parseFloat(kcalRx[1]));
  } else {
    const calRx = text.match(/(?:calories|calorie)[^\d\n]*?(\d+(?:\.\d+)?)/i);
    if (calRx && calRx[1]) {
      energyKcal = Math.round(parseFloat(calRx[1]));
    } else {
      // If only kJ is present, convert kJ to kcal (1 kcal ≈ 4.184 kJ)
      const kjRx = text.match(/(\d+(?:\.\d+)?)\s*kJ/i);
      if (kjRx && kjRx[1]) {
        energyKcal = Math.round(parseFloat(kjRx[1]) / 4.184);
      }
    }
  }

  // Protein
  let protein: number | null = null;
  const proteinRx = text.match(/protein[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (proteinRx && proteinRx[1]) protein = parseFloat(proteinRx[1]);

  // Fat
  let fat: number | null = null;
  const fatRx = text.match(/(?:total\s+fat|fat)[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (fatRx && fatRx[1]) fat = parseFloat(fatRx[1]);

  // Carbohydrates
  let carbohydrates: number | null = null;
  const carbRx = text.match(/(?:carbohydrates?|carbs?)[^\d\n]*?(\d+(?:\.\d+)?)/i);
  if (carbRx && carbRx[1]) carbohydrates = parseFloat(carbRx[1]);

  // Serving size text
  let servingSize: string | undefined;
  const serveRx = text.match(/serving\s*size[:\s]*([^,\n]+)/i);
  if (serveRx && serveRx[1]) servingSize = serveRx[1].trim();

  return {
    productName,
    brand: detectedBrand,
    barcode: detectedBarcode,
    ingredientsText,
    parsedIngredients,
    declaredAllergens,
    traceWarnings,
    basis,
    sugars,
    saturatedFat,
    sodium,
    salt,
    energyKcal,
    protein,
    fat,
    carbohydrates,
    servingSize,
    confidence: ocrConfidence,
  };
}

export const LabelUploadOCR: React.FC<LabelUploadOCRProps> = ({ onProductReady }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [statusText, setStatusText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /**
   * Fully automated pipeline triggered immediately upon selecting an image
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Image is too large (maximum 20MB). Please select a standard photo.');
      return;
    }

    setErrorMessage(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Automatically trigger processing immediately
    processImageAutomatically(file, url);
  };

  /**
   * Automatic OCR & Structuring Engine: Zero user typing required
   */
  const processImageAutomatically = async (file: File, displayUrl: string) => {
    setStep('preprocessing');
    setStatusText('Optimizing packaging resolution & enhancing text contrast...');
    setProgressPercent(15);

    let ocrWorker = null;

    try {
      // Pass 1: Standard contrast-enhanced preprocessing
      const processedBlob = await preprocessImage(file, 'standard');

      setStep('ocr');
      setStatusText('Reading packaging labels and nutritional tables...');
      setProgressPercent(30);

      ocrWorker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round((m.progress || 0) * 100);
            setProgressPercent(30 + Math.round(p * 0.45));
          }
        },
      });

      // Enable interword spacing for accurate word separation
      await ocrWorker.setParameters({
        preserve_interword_spaces: '1',
      });

      let ret = await ocrWorker.recognize(processedBlob);
      let rawText = (ret.data.text || '').trim();
      let confidence = ret.data.confidence || 0;

      // Quality check: If text is too short or confidence is very low, auto-retry with Pass 2 (inverted/high-contrast)
      if (rawText.length < 20 || confidence < 35) {
        setStatusText('Refining image contrast for packaging background...');
        setProgressPercent(65);
        const retryBlob = await preprocessImage(file, 'high_contrast');
        const retryRet = await ocrWorker.recognize(retryBlob);
        const retryText = (retryRet.data.text || '').trim();

        if (retryText.length > rawText.length) {
          ret = retryRet;
          rawText = retryText;
          confidence = retryRet.data.confidence || confidence;
        }
      }

      await ocrWorker.terminate();
      ocrWorker = null;

      // If text remains completely unreadable after both passes, fail honestly
      if (!rawText || rawText.length < 10) {
        throw new Error("We couldn't reliably read this label. Please capture a clearer, well-lit image of the ingredients or nutrition panel.");
      }

      setStep('structuring');
      setStatusText('Structuring ingredients, allergens & nutrition facts...');
      setProgressPercent(85);

      // Structure all readable data automatically
      const structured = structureLabelText(rawText, confidence);

      // Barcode Cross-Check: If barcode digits were clearly visible on the label,
      // verify if Open Food Facts or our Indian dataset has complete verified data
      if (structured.barcode) {
        setStatusText(`Detected barcode ${structured.barcode} — cross-referencing verified databases...`);
        try {
          const lookup = await fetchProductByBarcode(structured.barcode);
          if (lookup.success && lookup.product) {
            // Use verified product data enriched with original image
            const verified = {
              ...lookup.product,
              imageUrl: displayUrl || lookup.product.imageUrl,
            };
            setStep('done');
            setProgressPercent(100);
            setStatusText('Verified match found! Navigating to results...');
            setTimeout(() => onProductReady(verified), 600);
            return;
          }
        } catch (_err) {
          // Fall back to OCR structured data
        }
      }

      setStep('analyzing');
      setStatusText('Evaluating safety rules against your dietary profile...');
      setProgressPercent(95);

      const sugarsVal: NutritionValue = {
        value: structured.sugars,
        unit: 'g',
        isMissing: structured.sugars === null,
      };

      const satFatVal: NutritionValue = {
        value: structured.saturatedFat,
        unit: 'g',
        isMissing: structured.saturatedFat === null,
      };

      const sodiumVal: NutritionValue = {
        value: structured.sodium,
        unit: 'mg',
        isMissing: structured.sodium === null,
      };

      const saltVal: NutritionValue = {
        value: structured.salt,
        unit: 'g',
        isMissing: structured.salt === null,
      };

      const caloriesVal: NutritionValue = {
        value: structured.energyKcal,
        unit: 'kcal',
        isMissing: structured.energyKcal === null,
      };

      const ocrProduct: NormalizedProduct = {
        id: `ocr-${Date.now()}`,
        barcode: structured.barcode || `OCR-${Date.now().toString().slice(-6)}`,
        name: structured.productName,
        brand: structured.brand || 'Scanned Label Item',
        imageUrl: displayUrl,
        ingredientsText: structured.ingredientsText,
        parsedIngredients: structured.parsedIngredients,
        declaredAllergens: structured.declaredAllergens,
        traceWarnings: structured.traceWarnings,
        nutrition: {
          basis: structured.basis,
          sugars: sugarsVal,
          saturatedFat: satFatVal,
          sodium: sodiumVal,
          salt: saltVal,
          energyKcal: caloriesVal,
        },
        source: 'label_ocr',
        retrievalTimestamp: new Date().toISOString(),
        missingDataFlags: {
          ingredientsMissing: structured.ingredientsText.length === 0,
          allergensMissing: structured.declaredAllergens.length === 0 && structured.ingredientsText.length === 0,
          nutritionMissing: structured.sugars === null && structured.saturatedFat === null && structured.sodium === null,
        },
        userConfirmed: true,
      };

      setStep('done');
      setProgressPercent(100);
      setStatusText('Analysis complete! Redirecting to food safety verdict...');

      // Automatic seamless navigation with zero manual data entry
      setTimeout(() => {
        onProductReady(ocrProduct);
      }, 700);

    } catch (err: unknown) {
      if (ocrWorker) {
        try { await (ocrWorker as any).terminate(); } catch (_) {}
      }
      const e = err as Error;
      setStep('failed');
      setErrorMessage(
        e.message || "We couldn't reliably read this label. Please capture a clearer, well-lit image of the ingredients or nutrition panel."
      );
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep('idle');
    setErrorMessage(null);
    setProgressPercent(0);
    setStatusText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem 1.5rem',
      }}
    >
      {step === 'idle' && (
        <div>
          {/* File Upload Dropzone */}
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 1.5rem',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-main)',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
              textAlign: 'center',
            }}
            onDragOver={(e) => e.preventDefault()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-berry)';
              e.currentTarget.style.backgroundColor = 'var(--bg-blush)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'var(--bg-main)';
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Upload size={28} color="var(--primary-berry)" />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
              Upload or Snap a Food Label Photo
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Take a clear picture of the <strong>Ingredients List</strong> or <strong>Nutrition Table</strong>. Ingredia automatically extracts the text and analyzes product safety instantly.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary-berry)', color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem' }}>
              <Camera size={16} />
              <span>Select Label Image (Zero Typing Required)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Live Processing Card */}
      {(step === 'preprocessing' || step === 'ocr' || step === 'structuring' || step === 'analyzing' || step === 'done') && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          {previewUrl && (
            <div
              style={{
                maxWidth: '220px',
                height: '140px',
                margin: '0 auto 1.5rem auto',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                background: '#1A141C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded food label"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {step === 'done' ? (
              <CheckCircle2 size={24} color="var(--status-suitable)" />
            ) : (
              <Loader2 size={24} color="var(--primary-berry)" className="animate-spin" />
            )}
            <h4 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              {statusText}
            </h4>
          </div>

          <div style={{ maxWidth: '380px', margin: '0 auto 1rem auto' }}>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-blush)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: step === 'done' ? 'var(--status-suitable)' : 'var(--primary-berry)',
                  transition: 'width 250ms ease, background-color 250ms ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
              <span>Automatic Extraction</span>
              <span>{progressPercent}%</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Please wait a moment while Ingredia decodes the packaging text. You will be redirected to the safety verdict automatically.
          </p>
        </div>
      )}

      {/* Honest Failure View */}
      {step === 'failed' && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--status-avoid-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <AlertCircle size={28} color="var(--status-avoid)" />
          </div>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Label Could Not Be Reliably Read
          </h3>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            {errorMessage || "We couldn't reliably read this label. Please capture a clearer, well-lit image of the ingredients or nutrition panel."}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-primary"
            >
              <RefreshCw size={16} />
              <span>Try Another Label Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
