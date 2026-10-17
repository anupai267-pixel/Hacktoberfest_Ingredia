import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { fetchProductByBarcode } from '../services/openFoodFactsService';
import { analyzeProduct } from '../services/foodAnalysisEngine';
import { saveScanRecord } from '../services/historyService';
import { requestAIExplanation } from '../services/aiExplanationService';
import type { NormalizedProduct } from '../types/product';
import type { AnalysisResult } from '../types/analysis';
import { VerdictBadge } from '../components/common/VerdictBadge';
import { NutritionMetricCard } from '../components/common/NutritionMetricCard';
import { 
  Camera, 
  Upload, 
  Clock, 
  User, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Info, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export const ProductResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI explanation state
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<'groq' | 'gemini' | 'template'>('template');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showRuleTriggers, setShowRuleTriggers] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAndAnalyze() {
      if (!id) return;
      setIsLoading(true);
      setErrorMessage(null);

      let targetProduct: NormalizedProduct | null = null;

      // 1. Check if stored in sessionStorage from OCR flow
      const cached = sessionStorage.getItem(`ingredia_product_${id}`);
      if (cached) {
        try {
          targetProduct = JSON.parse(cached);
        } catch (e) {
          console.warn('Failed parsing cached OCR product:', e);
        }
      }

      // 2. If not OCR, fetch from Open Food Facts / supplemental dataset
      if (!targetProduct) {
        const lookup = await fetchProductByBarcode(id);
        if (lookup.success && lookup.product) {
          targetProduct = lookup.product;
        } else {
          if (isMounted) {
            setErrorMessage(lookup.errorMessage || `Product ${id} could not be retrieved.`);
            setIsLoading(false);
          }
          return;
        }
      }

      if (!isMounted || !targetProduct) return;

      setProduct(targetProduct);

      // 3. Run Deterministic Food Analysis Engine
      const result = analyzeProduct(targetProduct, profile);
      setAnalysis(result);

      // 4. Save to Scan History
      const historyRecord = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: user?.id || 'demo-user-1',
        productId: targetProduct.id,
        barcode: targetProduct.barcode,
        productName: targetProduct.name,
        brand: targetProduct.brand,
        imageUrl: targetProduct.imageUrl,
        verdict: result.verdict,
        source: targetProduct.source,
        scannedAt: new Date().toISOString(),
        analysisSnapshot: result,
        productSnapshot: targetProduct,
      };

      saveScanRecord(historyRecord);

      // 5. Generate AI / Template Explanation
      setIsGeneratingAI(true);
      requestAIExplanation(result, targetProduct).then((aiRes) => {
        if (isMounted) {
          setAiText(aiRes.text);
          setAiSource(aiRes.source);
          setIsGeneratingAI(false);
        }
      });

      setIsLoading(false);
    }

    loadAndAnalyze();

    return () => {
      isMounted = false;
    };
  }, [id, profile]);

  if (isLoading) {
    return (
      <div className="app-container-narrow" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary-berry)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.25rem auto',
          }}
        />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Analyzing Food Data...
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Normalizing nutrition units, checking declared allergens, and evaluating screening rules.
        </p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMessage || !product || !analysis) {
    return (
      <div className="app-container-narrow" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          <AlertTriangle size={48} color="var(--status-caution)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Product Not Found</h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {errorMessage || 'We could not locate this barcode in Open Food Facts or the test dataset.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/scan" className="btn btn-primary">
              <Camera size={16} />
              <span>Try Another Barcode</span>
            </Link>
            <Link to="/upload-label" className="btn btn-secondary">
              <Upload size={16} />
              <span>Upload Label Photo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sourceLabels = {
    open_food_facts: 'Open Food Facts Live API',
    label_ocr: 'Client-Side Label OCR',
    supplemental_dataset: 'Ingredia Supplemental Test Dataset',
    manual_entry: 'Manual Entry',
  };

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Product Summary Header Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem',
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                background: 'var(--bg-blush)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={36} color="var(--primary-berry)" />
            </div>
          )}

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {product.brand || 'Packaged Grocery'}
                </span>
                <h1 style={{ fontSize: '1.625rem', fontWeight: 700, margin: '0.125rem 0 0.375rem 0' }}>
                  {product.name}
                </h1>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Barcode: {product.barcode} • Source: {sourceLabels[product.source] || product.source}
                </span>
              </div>

              <VerdictBadge verdict={analysis.verdict} size="lg" />
            </div>

            <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', marginTop: '0.75rem', lineHeight: 1.5, background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>Summary:</strong> {analysis.verdictReason}
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Allergen Alerts Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={20} color="var(--primary-berry)" />
          <span>Allergens & Safety Warnings</span>
        </h3>

        {/* Confirmed Allergens */}
        {analysis.matchedAllergens.length > 0 && (
          <div className="alert-banner alert-banner-error" style={{ marginBottom: '1rem' }}>
            <XCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9375rem' }}>
                Confirmed Allergen Match Detected: {analysis.matchedAllergens.join(', ').toUpperCase()}
              </strong>
              <span style={{ fontSize: '0.875rem' }}>
                The ingredients declare or contain: <em>{analysis.ingredientsOfConcern.join(', ')}</em>. This product directly conflicts with your profile. Avoid consumption.
              </span>
            </div>
          </div>
        )}

        {/* Trace Warnings */}
        {analysis.matchedTraces.length > 0 && (
          <div className="alert-banner alert-banner-warning" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9375rem' }}>
                Trace / Cross-Contact Warning: {analysis.matchedTraces.join(', ').toUpperCase()}
              </strong>
              <span style={{ fontSize: '0.875rem' }}>
                The manufacturer indicates potential shared facility lines or trace contact. Review packaging details if you have severe sensitivity.
              </span>
            </div>
          </div>
        )}

        {/* Non-allergen safety flags (vegan, lactose, sugar, pregnancy) */}
        {analysis.flags.filter(f => f.category !== 'allergen' && f.category !== 'trace').length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
            {analysis.flags
              .filter(f => f.category !== 'allergen' && f.category !== 'trace')
              .map((flag) => (
                <div
                  key={flag.id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: flag.severity === 'warning' ? 'var(--status-caution-bg)' : 'var(--bg-main)',
                    border: `1px solid ${flag.severity === 'warning' ? 'var(--status-caution-border)' : 'var(--border-color)'}`,
                    fontSize: '0.875rem',
                  }}
                >
                  <strong style={{ color: flag.severity === 'warning' ? 'var(--status-caution)' : 'var(--text-main)', display: 'block', marginBottom: '0.2rem' }}>
                    {flag.title}
                  </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{flag.description}</span>
                </div>
              ))}
          </div>
        )}

        {/* Clean status if no flags */}
        {analysis.matchedAllergens.length === 0 && analysis.matchedTraces.length === 0 && analysis.flags.length === 0 && (
          <div className="alert-banner alert-banner-success">
            <CheckCircle2 size={18} />
            <span>No declared allergens or dietary clashes were matched against your active profile.</span>
          </div>
        )}

        {/* Incomplete / Missing data notes */}
        {analysis.missingDataNotes.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Info size={14} />
            <span>{analysis.missingDataNotes.join(' ')}</span>
          </div>
        )}
      </div>

      {/* AI & Plain-Language Explanation Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="var(--primary-berry)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Safety Explanation</h3>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-blush)',
              color: 'var(--primary-berry)',
              fontWeight: 600,
            }}
          >
            {aiSource === 'groq'
              ? 'Groq Open-Weight AI'
              : aiSource === 'gemini'
              ? 'Gemini AI Explanation'
              : 'Transparent Rule Synthesis'}
          </span>
        </div>

        <div
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            whiteSpace: 'pre-line',
          }}
        >
          {isGeneratingAI ? 'Synthesizing explanation...' : (aiText || analysis.verdictReason)}
        </div>

        {/* Triggered Rules inspection accordion */}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowRuleTriggers(!showRuleTriggers)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <span>Inspect Triggered Rules ({analysis.triggeredRules.length})</span>
            {showRuleTriggers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showRuleTriggers && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-blush)',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
              }}
            >
              {analysis.triggeredRules.length > 0 ? (
                analysis.triggeredRules.map((rule) => <div key={rule}>• {rule}</div>)
              ) : (
                <div>• RULE_DEFAULT_SUITABLE</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nutrition Facts Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Nutrition Facts per {product.nutrition.basis || '100g'}
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Evaluated against prototype screening thresholds (Sugars: 12.5g/22.5g; Sodium: 400mg/600mg; Saturated Fat: 3g/5g).
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          {analysis.nutritionalObservations.map((obs) => (
            <NutritionMetricCard key={obs.metric} assessment={obs} />
          ))}
        </div>

        {/* Detailed Macronutrients Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0' }}>Nutrient</th>
                <th style={{ padding: '0.5rem 0' }}>Reported Value</th>
                <th style={{ padding: '0.5rem 0' }}>Screening Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.625rem 0' }}>Energy / Calories</td>
                <td style={{ padding: '0.625rem 0' }}>
                  {product.nutrition.energyKcal?.value !== null && product.nutrition.energyKcal?.value !== undefined
                    ? `${product.nutrition.energyKcal.value} kcal`
                    : 'Not reported'}
                </td>
                <td style={{ padding: '0.625rem 0', color: 'var(--text-muted)' }}>Informational</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.625rem 0' }}>Sugars</td>
                <td style={{ padding: '0.625rem 0' }}>
                  {product.nutrition.sugars?.value !== null && product.nutrition.sugars?.value !== undefined
                    ? `${product.nutrition.sugars.value} g`
                    : 'Not reported'}
                </td>
                <td style={{ padding: '0.625rem 0' }}>
                  {analysis.nutritionalObservations.find(o => o.metric === 'Sugars')?.status || 'Unknown'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.625rem 0' }}>Saturated Fat</td>
                <td style={{ padding: '0.625rem 0' }}>
                  {product.nutrition.saturatedFat?.value !== null && product.nutrition.saturatedFat?.value !== undefined
                    ? `${product.nutrition.saturatedFat.value} g`
                    : 'Not reported'}
                </td>
                <td style={{ padding: '0.625rem 0' }}>
                  {analysis.nutritionalObservations.find(o => o.metric === 'Saturated Fat')?.status || 'Unknown'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.625rem 0' }}>Sodium</td>
                <td style={{ padding: '0.625rem 0' }}>
                  {product.nutrition.sodium?.value !== null && product.nutrition.sodium?.value !== undefined
                    ? `${product.nutrition.sodium.value} mg`
                    : 'Not reported'}
                </td>
                <td style={{ padding: '0.625rem 0' }}>
                  {analysis.nutritionalObservations.find(o => o.metric === 'Sodium')?.status || 'Unknown'}
                </td>
              </tr>
              {product.nutrition.salt?.value !== null && product.nutrition.salt?.value !== undefined && (
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.625rem 0' }}>Equivalent Salt</td>
                  <td style={{ padding: '0.625rem 0' }}>{product.nutrition.salt.value} g</td>
                  <td style={{ padding: '0.625rem 0', color: 'var(--text-muted)' }}>Converted to sodium</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Ingredients Text Panel */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Ingredient Statement
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          {product.ingredientsText || 'No ingredient statement provided for this product.'}
        </p>

        {product.traceWarnings && product.traceWarnings.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <strong>Declared Traces:</strong> {product.traceWarnings.join(', ')}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 0',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/scan" className="btn btn-primary">
            <Camera size={16} />
            <span>Scan Another</span>
          </Link>
          <Link to="/upload-label" className="btn btn-secondary">
            <Upload size={16} />
            <span>Upload Label</span>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/history" className="btn btn-ghost btn-sm">
            <Clock size={15} />
            <span>View Scan History</span>
          </Link>
          <Link to="/profile" className="btn btn-ghost btn-sm">
            <User size={15} />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
