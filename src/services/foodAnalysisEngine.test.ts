import { describe, it, expect } from 'vitest';
import { analyzeProduct } from './foodAnalysisEngine';
import type { NormalizedProduct } from '../types/product';
import type { UserProfile } from '../types/user';

function createMockProduct(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  return {
    id: 'test-prod-1',
    barcode: '1234567890123',
    name: 'Sample Food Product',
    brand: 'Ingredia Test Brands',
    ingredientsText: 'Rolled oats, sunflower seeds, chia seeds, dried apples, cinnamon.',
    parsedIngredients: ['Rolled oats', 'sunflower seeds', 'chia seeds', 'dried apples', 'cinnamon'],
    declaredAllergens: [],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 350, unit: 'kcal', isMissing: false },
      sugars: { value: 4.5, unit: 'g', isMissing: false },
      saturatedFat: { value: 1.2, unit: 'g', isMissing: false },
      sodium: { value: 15, unit: 'mg', isMissing: false },
      salt: { value: 0.04, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    ...overrides,
  };
}

function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-user-1',
    lifeStages: ['none'],
    diabetesStatus: 'none',
    lactoseIntolerance: 'no',
    allergies: [],
    otherAllergies: '',
    preferences: {
      isVegetarian: false,
      isVegan: false,
      avoidPalmOil: false,
      avoidHighFructoseCornSyrup: false,
      avoidArtificialSweeteners: false,
      avoidArtificialColors: false,
      customAvoidIngredients: [],
    },
    informedConsentGiven: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Deterministic Food Analysis Engine', () => {
  it('returns SUITABLE when a product has clean ingredients and no profile conflicts', () => {
    const product = createMockProduct();
    const profile = createMockProfile({ allergies: ['peanuts', 'milk'] });

    const result = analyzeProduct(product, profile);
    expect(result.verdict).toBe('suitable');
    expect(result.matchedAllergens).toHaveLength(0);
    expect(result.flags.filter(f => f.severity === 'danger')).toHaveLength(0);
  });

  it('returns AVOID on confirmed allergen match in ingredients', () => {
    const product = createMockProduct({
      ingredientsText: 'Roasted peanuts, vegetable oil, salt.',
      declaredAllergens: ['en:peanuts'],
    });
    const profile = createMockProfile({ allergies: ['peanuts'] });

    const result = analyzeProduct(product, profile);
    expect(result.verdict).toBe('avoid');
    expect(result.matchedAllergens).toContain('peanuts');
    expect(result.triggeredRules).toContain('RULE_ALLERGEN_CONFIRMED_PEANUTS');
  });

  it('returns CAUTION on trace / cross-contact warning without confirmed ingredient match', () => {
    const product = createMockProduct({
      ingredientsText: 'Dark cocoa, cane sugar, cocoa butter.',
      traceWarnings: ['May contain traces of tree nuts and almonds'],
    });
    const profile = createMockProfile({ allergies: ['tree_nuts'] });

    const result = analyzeProduct(product, profile);
    expect(result.verdict).toBe('caution');
    expect(result.matchedTraces).toContain('tree_nuts');
    expect(result.matchedAllergens).toHaveLength(0);
  });

  it('accurately distinguishes milk allergy from lactose intolerance', () => {
    const dairyProduct = createMockProduct({
      ingredientsText: 'Pasteurized whole milk, live cultures.',
      declaredAllergens: ['en:milk'],
    });

    // 1. Milk allergic user => AVOID (immune reaction)
    const allergicProfile = createMockProfile({
      allergies: ['milk'],
      lactoseIntolerance: 'no',
    });
    const allergicResult = analyzeProduct(dairyProduct, allergicProfile);
    expect(allergicResult.verdict).toBe('avoid');
    expect(allergicResult.matchedAllergens).toContain('milk');

    // 2. Lactose intolerant user (without milk protein allergy) => CAUTION (digestive discomfort)
    const intolerantProfile = createMockProfile({
      allergies: [],
      lactoseIntolerance: 'yes',
    });
    const intolerantResult = analyzeProduct(dairyProduct, intolerantProfile);
    expect(intolerantResult.verdict).toBe('caution');
    expect(intolerantResult.triggeredRules).toContain('RULE_LACTOSE_INTOLERANCE');
    expect(intolerantResult.matchedAllergens).toHaveLength(0);
  });

  it('flags high sugar content above prototype threshold (> 22.5g/100g) as CAUTION', () => {
    const sweetProduct = createMockProduct({
      nutrition: {
        basis: '100g',
        sugars: { value: 34.0, unit: 'g', isMissing: false },
      },
    });
    const profile = createMockProfile();

    const result = analyzeProduct(sweetProduct, profile);
    expect(result.verdict).toBe('caution');
    expect(result.triggeredRules).toContain('RULE_NUT_SUGAR_HIGH');
    const sugarObs = result.nutritionalObservations.find(o => o.metric === 'Sugars');
    expect(sugarObs?.status).toBe('high');
  });

  it('flags high sodium and converts salt correctly (1g salt ~ 400mg sodium)', () => {
    // 2.0g salt = 800mg sodium > 600mg threshold => high
    const saltyProduct = createMockProduct({
      nutrition: {
        basis: '100g',
        salt: { value: 2.0, unit: 'g', isMissing: false },
        sodium: { value: null, unit: 'mg', isMissing: true },
      },
    });
    const profile = createMockProfile();

    const result = analyzeProduct(saltyProduct, profile);
    expect(result.verdict).toBe('caution');
    expect(result.triggeredRules).toContain('RULE_NUT_SODIUM_HIGH');
    const sodiumObs = result.nutritionalObservations.find(o => o.metric === 'Sodium');
    expect(sodiumObs?.value).toBe(800);
    expect(sodiumObs?.status).toBe('high');
  });

  it('returns INSUFFICIENT DATA when critical safety information is missing', () => {
    const emptyProduct = createMockProduct({
      ingredientsText: '',
      parsedIngredients: [],
      declaredAllergens: [],
      missingDataFlags: {
        ingredientsMissing: true,
        allergensMissing: true,
        nutritionMissing: true,
      },
    });
    const profile = createMockProfile({ allergies: ['peanuts'] });

    const result = analyzeProduct(emptyProduct, profile);
    expect(result.verdict).toBe('insufficient_data');
    expect(result.triggeredRules).toContain('RULE_DATA_ING_MISSING');
  });

  it('respects Vegan preferences and flags gelatin or animal products', () => {
    const gelatinCandy = createMockProduct({
      ingredientsText: 'Corn syrup, sugar, beef gelatin, natural colors.',
    });
    const veganProfile = createMockProfile({
      preferences: {
        ...createMockProfile().preferences,
        isVegan: true,
      },
    });

    const result = analyzeProduct(gelatinCandy, veganProfile);
    expect(result.verdict).toBe('caution');
    expect(result.triggeredRules).toContain('RULE_VEGAN_VIOLATION');
    expect(result.ingredientsOfConcern).toContain('gelatin');
  });

  it('handles OCR derived text inputs with realistic spacing or minor noise', () => {
    const ocrProduct = createMockProduct({
      name: 'Extracted OCR Biscuit',
      ingredientsText: 'INGREDIENTS: Wheat flour, palm oil, sugar, soy lecithin, salt.',
      source: 'label_ocr',
    });
    const profile = createMockProfile({
      allergies: ['soy'],
      preferences: {
        ...createMockProfile().preferences,
        avoidPalmOil: true,
      },
    });

    const result = analyzeProduct(ocrProduct, profile);
    expect(result.verdict).toBe('avoid'); // Soy allergy overrides
    expect(result.matchedAllergens).toContain('soy');
    expect(result.triggeredRules).toContain('RULE_PREF_PALM_OIL');
  });

  it('handles custom user avoid ingredients correctly', () => {
    const product = createMockProduct({
      ingredientsText: 'Water, citric acid, aspartame, natural lemon flavoring.',
    });
    const profile = createMockProfile({
      preferences: {
        ...createMockProfile().preferences,
        customAvoidIngredients: ['aspartame', 'red 40'],
      },
    });

    const result = analyzeProduct(product, profile);
    expect(result.verdict).toBe('caution');
    expect(result.ingredientsOfConcern).toContain('aspartame');
  });
});
