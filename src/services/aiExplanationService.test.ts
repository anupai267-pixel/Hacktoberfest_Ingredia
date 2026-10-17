import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTemplateExplanation, requestAIExplanation } from './aiExplanationService';
import type { AnalysisResult } from '../types/analysis';
import type { NormalizedProduct } from '../types/product';

// Hoist mock references for Supabase
const mockInvoke = vi.fn();
let mockIsSupabaseConfigured = false;

vi.mock('./supabaseClient', () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured;
  },
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

function createSampleProduct(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  return {
    id: 'prod-test-1',
    barcode: '1122334455',
    name: 'Organic Oat Clusters',
    brand: 'Nature Choice',
    ingredientsText: 'Rolled oats, maple syrup, coconut oil.',
    parsedIngredients: ['Rolled oats', 'maple syrup', 'coconut oil'],
    declaredAllergens: [],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 380, unit: 'kcal', isMissing: false },
    },
    source: 'open_food_facts',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    ...overrides,
  };
}

function createSampleAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    productId: 'prod-test-1',
    barcode: '1122334455',
    productName: 'Organic Oat Clusters',
    verdict: 'suitable',
    verdictReason: 'No conflicting allergens or high-concern ingredients detected.',
    flags: [],
    matchedAllergens: [],
    matchedTraces: [],
    ingredientsOfConcern: [],
    nutritionalObservations: [],
    missingDataNotes: [],
    triggeredRules: ['RULE_BASE_SUITABLE'],
    analyzedAt: new Date().toISOString(),
    evaluatedProfileSnapshot: {
      allergies: [],
      otherAllergies: '',
      lactoseIntolerance: 'no',
      isVegan: false,
      isVegetarian: false,
      diabetesStatus: 'none',
      lifeStages: ['none'],
    },
    ...overrides,
  };
}

describe('AI Explanation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupabaseConfigured = false;
  });

  describe('generateTemplateExplanation() deterministic engine', () => {
    it('generates an AVOID explanation when allergens are matched', () => {
      const analysis = createSampleAnalysis({
        verdict: 'avoid',
        matchedAllergens: ['Peanuts'],
        ingredientsOfConcern: ['Roasted Peanuts'],
      });
      const text = generateTemplateExplanation(analysis);

      expect(text).toContain('Avoid Recommended');
      expect(text).toContain('Peanuts');
      expect(text).toContain('Strict avoidance is recommended');
    });

    it('generates a CAUTION explanation with trace warnings', () => {
      const analysis = createSampleAnalysis({
        verdict: 'caution',
        matchedTraces: ['Tree nuts'],
      });
      const text = generateTemplateExplanation(analysis);

      expect(text).toContain('Caution Advised');
      expect(text).toContain('Cross-Contact Risk');
      expect(text).toContain('Tree nuts');
    });

    it('generates an INSUFFICIENT DATA explanation when critical data is missing', () => {
      const analysis = createSampleAnalysis({
        verdict: 'insufficient_data',
        missingDataNotes: ['Ingredients list missing.'],
      });
      const text = generateTemplateExplanation(analysis);

      expect(text).toContain('Insufficient Data');
      expect(text).toContain('Data Completeness');
    });

    it('generates a SUITABLE explanation when no conflicts exist', () => {
      const analysis = createSampleAnalysis({
        verdict: 'suitable',
      });
      const text = generateTemplateExplanation(analysis);

      expect(text).toContain('Suitable');
      expect(text).toContain('Always verify physical packaging before consuming');
    });

    it('includes nutritional threshold warnings when high metrics are flagged', () => {
      const analysis = createSampleAnalysis({
        verdict: 'caution',
        nutritionalObservations: [
          {
            metric: 'Sugars',
            value: 28,
            unit: 'g',
            basis: '100g',
            status: 'high',
          },
        ],
      });
      const text = generateTemplateExplanation(analysis);

      expect(text).toContain('Nutrition Flags');
      expect(text).toContain('Sugars (28g / 100g)');
    });
  });

  describe('requestAIExplanation() with Supabase Edge Function & Groq', () => {
    it('falls back to template explanation when Supabase is not configured', async () => {
      mockIsSupabaseConfigured = false;
      const product = createSampleProduct();
      const analysis = createSampleAnalysis({ verdict: 'suitable' });

      const result = await requestAIExplanation(analysis, product);

      expect(result.source).toBe('template');
      expect(result.text).toContain('Suitable');
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('returns Groq explanation when Supabase Edge Function succeeds', async () => {
      mockIsSupabaseConfigured = true;
      mockInvoke.mockResolvedValueOnce({
        data: {
          status: 'success',
          explanation: 'This product is suitable for your diet as it contains only oats and seeds with no allergens.',
          model: 'openai/gpt-oss-20b',
        },
        error: null,
      });

      const product = createSampleProduct();
      const analysis = createSampleAnalysis({ verdict: 'suitable' });

      const result = await requestAIExplanation(analysis, product);

      expect(mockInvoke).toHaveBeenCalledWith('ingredia-ai', expect.objectContaining({
        body: expect.objectContaining({
          product: expect.objectContaining({ name: product.name }),
          analysis: expect.objectContaining({ verdict: 'suitable' }),
        }),
      }));
      expect(result.source).toBe('groq');
      expect(result.text).toBe('This product is suitable for your diet as it contains only oats and seeds with no allergens.');
      expect(result.modelUsed).toBe('openai/gpt-oss-20b');
    });

    it('gracefully falls back to template explanation if Edge Function returns an error', async () => {
      mockIsSupabaseConfigured = true;
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'GROQ_API_KEY is not configured on the Supabase Edge Function.' },
      });

      const product = createSampleProduct();
      const analysis = createSampleAnalysis({ verdict: 'avoid', matchedAllergens: ['Peanuts'] });

      const result = await requestAIExplanation(analysis, product);

      expect(result.source).toBe('template');
      expect(result.text).toContain('Avoid Recommended');
      expect(result.text).toContain('Peanuts');
    });

    it('gracefully falls back to template explanation if Edge Function call throws network exception', async () => {
      mockIsSupabaseConfigured = true;
      mockInvoke.mockRejectedValueOnce(new Error('Network offline'));

      const product = createSampleProduct();
      const analysis = createSampleAnalysis({ verdict: 'caution' });

      const result = await requestAIExplanation(analysis, product);

      expect(result.source).toBe('template');
      expect(result.text).toContain('Caution Advised');
    });
  });
});
