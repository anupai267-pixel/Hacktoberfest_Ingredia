import type { NormalizedProduct } from '../types/product';
import type { UserProfile, CommonAllergen } from '../types/user';
import type { 
  AnalysisResult, 
  AnalysisFlag, 
  ProductVerdict, 
  NutritionAssessment 
} from '../types/analysis';

// Illustrative prototype screening thresholds per 100g/ml
export const PROTOTYPE_THRESHOLDS = {
  sugars: {
    cautionG: 12.5,
    highG: 22.5,
  },
  sodium: {
    cautionMg: 400, // 0.4g sodium (~1.0g salt)
    highMg: 600,    // 0.6g sodium (~1.5g salt)
  },
  saturatedFat: {
    cautionG: 3.0,
    highG: 5.0,
  },
};

// Allergen term mappings for cross-referencing ingredients
const ALLERGEN_KEYWORD_MAP: Record<CommonAllergen, string[]> = {
  milk: [
    'milk', 'lait', 'leche', 'milch', 'whey', 'casein', 'caseinate', 'butter', 'cream', 
    'dairy', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'lactalbumin', 'curd', 'buttermilk', 'lactose'
  ],
  eggs: [
    'egg', 'eggs', 'oeuf', 'huevo', 'ei', 'albumin', 'albumen', 'ovalbumin', 
    'lysozyme', 'mayonnaise', 'meringue'
  ],
  peanuts: [
    'peanut', 'peanuts', 'arachis', 'groundnut', 'groundnuts', 'arachide', 'erdnuss', 'cacahuate'
  ],
  tree_nuts: [
    'tree nut', 'tree nuts', 'nut', 'nuts', 'almond', 'almonds', 'walnut', 'walnuts', 
    'cashew', 'cashews', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 
    'macadamia', 'brazil nut', 'chestnut', 'praline', 'marzipan', 'noisette', 'nuez'
  ],
  soy: [
    'soy', 'soya', 'soybean', 'soybeans', 'edamame', 'tofu', 'tempeh', 'miso', 'tamari', 
    'soja', 'soy lecithin'
  ],
  wheat_gluten: [
    'wheat', 'gluten', 'barley', 'rye', 'spelt', 'kamut', 'triticale', 'malt', 
    'semolina', 'couscous', 'durum', 'farina', 'ble', 'trigo', 'seitan'
  ],
  fish: [
    'fish', 'poisson', 'pescado', 'cod', 'salmon', 'tuna', 'anchovy', 'anchovies', 'halibut', 
    'haddock', 'bass', 'tilapia', 'mackerel', 'sardine', 'sardines', 'fish sauce', 'gelatine de poisson'
  ],
  shellfish: [
    'shellfish', 'crustacean', 'crustaceans', 'mollusc', 'molluscs', 'mollusk', 'mollusks', 
    'shrimp', 'shrimps', 'crab', 'crabs', 'lobster', 'lobsters', 'prawn', 'prawns', 
    'crayfish', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'squid', 
    'calamari', 'octopus', 'scallop', 'scallops'
  ],
  sesame: [
    'sesame', 'tahini', 'tahina', 'sesamum', 'sesamo'
  ]
};

// Non-vegetarian / non-vegan ingredient keywords
const NON_VEGAN_KEYWORDS = [
  'gelatin', 'gelatine', 'carmine', 'cochineal', 'e120', 'shellac', 'e904', 
  'lard', 'tallow', 'bone char', 'isinglass', 'rennet', 'whey', 'casein', 
  'milk', 'butter', 'cheese', 'egg', 'eggs', 'honey', 'beeswax', 'e901'
];

const NON_VEGETARIAN_KEYWORDS = [
  'meat', 'beef', 'pork', 'chicken', 'poultry', 'lamb', 'gelatin', 'gelatine', 
  'carmine', 'cochineal', 'e120', 'lard', 'tallow', 'bone char', 'isinglass', 
  'rennet', 'fish', 'anchovy', 'shrimp', 'crab', 'lobster'
];

export function analyzeProduct(
  product: NormalizedProduct,
  profile: UserProfile
): AnalysisResult {
  const flags: AnalysisFlag[] = [];
  const matchedAllergens: string[] = [];
  const matchedTraces: string[] = [];
  const ingredientsOfConcern: string[] = [];
  const nutritionalObservations: NutritionAssessment[] = [];
  const missingDataNotes: string[] = [];
  const triggeredRules: string[] = [];

  const textToScan = [
    product.name,
    product.ingredientsText,
    ...(product.parsedIngredients || []),
    ...(product.declaredAllergens || []),
  ].join(' ').toLowerCase();

  const tracesToScan = (product.traceWarnings || []).join(' ').toLowerCase();

  // -------------------------------------------------------------
  // RULE SET 0: Missing Critical Data Checks
  // -------------------------------------------------------------
  const isIngredientsMissing = 
    product.missingDataFlags.ingredientsMissing || 
    !product.ingredientsText || 
    product.ingredientsText.trim().length === 0;

  const isNutritionMissing = 
    product.missingDataFlags.nutritionMissing ||
    (!product.nutrition.sugars && !product.nutrition.energyKcal && !product.nutrition.sodium && !product.nutrition.salt);

  if (isIngredientsMissing) {
    missingDataNotes.push('Complete ingredient list is missing from the product data.');
    flags.push({
      id: 'missing-ingredients',
      category: 'missing_data',
      severity: 'warning',
      title: 'Missing Ingredient List',
      description: 'Product ingredients were not provided or could not be detected. Ingredient safety and allergen presence cannot be verified.',
      ruleCode: 'RULE_DATA_ING_MISSING'
    });
    triggeredRules.push('RULE_DATA_ING_MISSING');
  }

  if (isNutritionMissing) {
    missingDataNotes.push('Nutrition information is unavailable.');
    flags.push({
      id: 'missing-nutrition',
      category: 'missing_data',
      severity: 'info',
      title: 'Nutrition Facts Unavailable',
      description: 'No nutritional values (sugar, sodium, fat, calories) were provided for this product.',
      ruleCode: 'RULE_DATA_NUT_MISSING'
    });
    triggeredRules.push('RULE_DATA_NUT_MISSING');
  }

  // -------------------------------------------------------------
  // RULE SET 1: Declared Allergens (Confirmed Match -> AVOID)
  // -------------------------------------------------------------
  if (profile.allergies && profile.allergies.length > 0) {
    profile.allergies.forEach((allergy) => {
      const keywords = ALLERGEN_KEYWORD_MAP[allergy] || [allergy];
      let confirmedFound = false;
      let matchedWord = '';

      // Check declared allergens list first
      if (product.declaredAllergens && product.declaredAllergens.length > 0) {
        for (const declared of product.declaredAllergens) {
          const lowerDeclared = declared.toLowerCase();
          for (const kw of keywords) {
            if (lowerDeclared.includes(kw)) {
              confirmedFound = true;
              matchedWord = declared;
              break;
            }
          }
          if (confirmedFound) break;
        }
      }

      // If not in declared tags, inspect full ingredients text
      if (!confirmedFound && !isIngredientsMissing) {
        for (const kw of keywords) {
          // Use word boundary regex to avoid partial false matches
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(textToScan)) {
            confirmedFound = true;
            matchedWord = kw;
            break;
          }
        }
      }

      if (confirmedFound) {
        matchedAllergens.push(allergy);
        ingredientsOfConcern.push(matchedWord);
        flags.push({
          id: `allergen-${allergy}`,
          category: 'allergen',
          severity: 'danger',
          title: `Confirmed Allergen: ${allergy.replace('_', ' ').toUpperCase()}`,
          description: `Product contains or declares ${matchedWord}, which directly conflicts with your declared ${allergy.replace('_', ' ')} allergy.`,
          matchedTerm: matchedWord,
          ruleCode: 'RULE_ALLERGEN_CONFIRMED'
        });
        triggeredRules.push(`RULE_ALLERGEN_CONFIRMED_${allergy.toUpperCase()}`);
      } else {
        // Check for Trace / May Contain warnings
        let traceFound = false;
        let matchedTraceWord = '';
        for (const kw of keywords) {
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(tracesToScan)) {
            traceFound = true;
            matchedTraceWord = kw;
            break;
          }
        }

        if (traceFound) {
          matchedTraces.push(allergy);
          flags.push({
            id: `trace-${allergy}`,
            category: 'trace',
            severity: 'warning',
            title: `Cross-Contact Warning: ${allergy.replace('_', ' ').toUpperCase()}`,
            description: `Product manufacturer indicates this item may contain traces of ${matchedTraceWord} or is made in a facility handling it.`,
            matchedTerm: matchedTraceWord,
            ruleCode: 'RULE_ALLERGEN_TRACE'
          });
          triggeredRules.push(`RULE_ALLERGEN_TRACE_${allergy.toUpperCase()}`);
        }
      }
    });
  }

  // Check Custom "Other" Allergies
  if (profile.otherAllergies && profile.otherAllergies.trim().length > 0) {
    const customList = profile.otherAllergies.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    customList.forEach(customAllergy => {
      if (customAllergy.length >= 2) {
        const regex = new RegExp(`\\b${customAllergy}\\b`, 'i');
        if (regex.test(textToScan)) {
          matchedAllergens.push(customAllergy);
          ingredientsOfConcern.push(customAllergy);
          flags.push({
            id: `allergen-custom-${customAllergy}`,
            category: 'allergen',
            severity: 'danger',
            title: `Custom Allergen Match: ${customAllergy.toUpperCase()}`,
            description: `Product ingredients match your custom allergen "${customAllergy}".`,
            matchedTerm: customAllergy,
            ruleCode: 'RULE_ALLERGEN_CUSTOM'
          });
          triggeredRules.push('RULE_ALLERGEN_CUSTOM');
        } else if (regex.test(tracesToScan)) {
          matchedTraces.push(customAllergy);
          flags.push({
            id: `trace-custom-${customAllergy}`,
            category: 'trace',
            severity: 'warning',
            title: `Trace Warning: ${customAllergy.toUpperCase()}`,
            description: `Product mentions traces or potential cross-contact with "${customAllergy}".`,
            matchedTerm: customAllergy,
            ruleCode: 'RULE_TRACE_CUSTOM'
          });
          triggeredRules.push('RULE_TRACE_CUSTOM');
        }
      }
    });
  }

  // -------------------------------------------------------------
  // RULE SET 2: Lactose Intolerance vs Milk Allergy Distinction
  // -------------------------------------------------------------
  if (profile.lactoseIntolerance === 'yes') {
    const dairyKeywords = ALLERGEN_KEYWORD_MAP.milk;
    let containsDairy = false;
    let dairyItem = '';
    
    for (const kw of dairyKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(textToScan)) {
        containsDairy = true;
        dairyItem = kw;
        break;
      }
    }

    if (containsDairy) {
      // If user does NOT have a milk allergy, explain it is lactose intolerance
      if (!profile.allergies.includes('milk')) {
        flags.push({
          id: 'lactose-intolerance-flag',
          category: 'dietary',
          severity: 'warning',
          title: 'Contains Dairy / Lactose Sources',
          description: `Product contains "${dairyItem}". While distinct from a milk protein allergy, this may trigger digestive discomfort for lactose intolerance.`,
          matchedTerm: dairyItem,
          ruleCode: 'RULE_LACTOSE_INTOLERANCE'
        });
        triggeredRules.push('RULE_LACTOSE_INTOLERANCE');
      }
    }
  }

  // -------------------------------------------------------------
  // RULE SET 3: Dietary Preferences (Vegan / Vegetarian / Custom Avoid)
  // -------------------------------------------------------------
  if (profile.preferences.isVegan && !isIngredientsMissing) {
    const detectedNonVegan: string[] = [];
    for (const kw of NON_VEGAN_KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(textToScan)) {
        detectedNonVegan.push(kw);
      }
    }
    if (detectedNonVegan.length > 0) {
      ingredientsOfConcern.push(...detectedNonVegan);
      flags.push({
        id: 'dietary-vegan',
        category: 'dietary',
        severity: 'warning',
        title: 'Not Suitable for Vegans',
        description: `Contains animal-derived ingredients: ${detectedNonVegan.slice(0, 3).join(', ')}.`,
        matchedTerm: detectedNonVegan.join(', '),
        ruleCode: 'RULE_VEGAN_VIOLATION'
      });
      triggeredRules.push('RULE_VEGAN_VIOLATION');
    }
  } else if (profile.preferences.isVegetarian && !isIngredientsMissing) {
    const detectedNonVeg: string[] = [];
    for (const kw of NON_VEGETARIAN_KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(textToScan)) {
        detectedNonVeg.push(kw);
      }
    }
    if (detectedNonVeg.length > 0) {
      ingredientsOfConcern.push(...detectedNonVeg);
      flags.push({
        id: 'dietary-vegetarian',
        category: 'dietary',
        severity: 'warning',
        title: 'Not Suitable for Vegetarians',
        description: `Contains meat, fish, or gelatin-derived ingredients: ${detectedNonVeg.slice(0, 3).join(', ')}.`,
        matchedTerm: detectedNonVeg.join(', '),
        ruleCode: 'RULE_VEGETARIAN_VIOLATION'
      });
      triggeredRules.push('RULE_VEGETARIAN_VIOLATION');
    }
  }

  // Palm oil avoidance
  if (profile.preferences.avoidPalmOil && !isIngredientsMissing) {
    if (/palm\s?oil|huile de palme|palmitate/i.test(textToScan)) {
      ingredientsOfConcern.push('palm oil');
      flags.push({
        id: 'pref-palm-oil',
        category: 'dietary',
        severity: 'warning',
        title: 'Contains Palm Oil',
        description: 'Product ingredients include palm oil or palm derivatives.',
        matchedTerm: 'palm oil',
        ruleCode: 'RULE_PREF_PALM_OIL'
      });
      triggeredRules.push('RULE_PREF_PALM_OIL');
    }
  }

  // High Fructose Corn Syrup avoidance
  if (profile.preferences.avoidHighFructoseCornSyrup && !isIngredientsMissing) {
    if (/high fructose corn syrup|hfcs|glucose-fructose/i.test(textToScan)) {
      ingredientsOfConcern.push('high fructose corn syrup');
      flags.push({
        id: 'pref-hfcs',
        category: 'dietary',
        severity: 'warning',
        title: 'Contains High Fructose Corn Syrup',
        description: 'Contains HFCS or glucose-fructose syrup according to ingredient list.',
        matchedTerm: 'high fructose corn syrup',
        ruleCode: 'RULE_PREF_HFCS'
      });
      triggeredRules.push('RULE_PREF_HFCS');
    }
  }

  // Artificial Sweeteners avoidance
  if (profile.preferences.avoidArtificialSweeteners && !isIngredientsMissing) {
    const sweeteners = ['aspartame', 'sucralose', 'acesulfame', 'saccharin', 'neotame', 'cyclamate'];
    for (const sw of sweeteners) {
      if (textToScan.includes(sw)) {
        ingredientsOfConcern.push(sw);
        flags.push({
          id: `pref-sweetener-${sw}`,
          category: 'dietary',
          severity: 'warning',
          title: 'Contains Artificial Sweetener',
          description: `Product contains "${sw}".`,
          matchedTerm: sw,
          ruleCode: 'RULE_PREF_SWEETENER'
        });
        triggeredRules.push('RULE_PREF_SWEETENER');
        break;
      }
    }
  }

  // Custom user avoid list
  if (profile.preferences.customAvoidIngredients && profile.preferences.customAvoidIngredients.length > 0) {
    profile.preferences.customAvoidIngredients.forEach((item) => {
      const trimmed = item.trim().toLowerCase();
      if (trimmed.length > 2 && textToScan.includes(trimmed)) {
        ingredientsOfConcern.push(trimmed);
        flags.push({
          id: `pref-custom-${trimmed}`,
          category: 'dietary',
          severity: 'warning',
          title: `Avoided Ingredient: ${trimmed}`,
          description: `Product contains "${trimmed}", which is in your custom avoidance list.`,
          matchedTerm: trimmed,
          ruleCode: 'RULE_PREF_CUSTOM'
        });
        triggeredRules.push('RULE_PREF_CUSTOM');
      }
    });
  }

  // -------------------------------------------------------------
  // RULE SET 4: Nutrition Screening (Illustrative Prototype Thresholds)
  // -------------------------------------------------------------
  const nut = product.nutrition;
  const basis = nut.basis || '100g';

  // Sugar
  if (nut.sugars && nut.sugars.value !== null && !nut.sugars.isMissing) {
    const sugarVal = nut.sugars.value;
    let status: 'low' | 'moderate' | 'high' = 'low';
    
    if (sugarVal > PROTOTYPE_THRESHOLDS.sugars.highG) {
      status = 'high';
      flags.push({
        id: 'nut-sugar-high',
        category: 'nutrition',
        severity: 'warning',
        title: 'High Sugar Content',
        description: `${sugarVal}g sugar per ${basis} exceeds screening threshold (${PROTOTYPE_THRESHOLDS.sugars.highG}g).`,
        ruleCode: 'RULE_NUT_SUGAR_HIGH'
      });
      triggeredRules.push('RULE_NUT_SUGAR_HIGH');
    } else if (sugarVal > PROTOTYPE_THRESHOLDS.sugars.cautionG) {
      status = 'moderate';
      flags.push({
        id: 'nut-sugar-caution',
        category: 'nutrition',
        severity: 'info',
        title: 'Moderate Sugar Content',
        description: `${sugarVal}g sugar per ${basis} is above the caution threshold (${PROTOTYPE_THRESHOLDS.sugars.cautionG}g).`,
        ruleCode: 'RULE_NUT_SUGAR_CAUTION'
      });
      triggeredRules.push('RULE_NUT_SUGAR_CAUTION');
    }

    nutritionalObservations.push({
      metric: 'Sugars',
      value: sugarVal,
      unit: 'g',
      basis,
      status,
      thresholdUsed: `> ${PROTOTYPE_THRESHOLDS.sugars.cautionG}g moderate, > ${PROTOTYPE_THRESHOLDS.sugars.highG}g high`
    });

    // Special Diabetes check
    if (profile.diabetesStatus !== 'none') {
      if (status === 'high') {
        flags.push({
          id: 'dia-sugar-flag',
          category: 'lifestage',
          severity: 'warning',
          title: 'High Sugar Consideration (Diabetes Profile)',
          description: `Given your ${profile.diabetesStatus.replace('_', ' ')} profile, high sugar content (${sugarVal}g/${basis}) may warrant awareness or portion management. Consult your clinician.`,
          ruleCode: 'RULE_DIABETES_SUGAR_HIGH'
        });
        triggeredRules.push('RULE_DIABETES_SUGAR_HIGH');
      }
    }
  } else {
    nutritionalObservations.push({
      metric: 'Sugars',
      value: null,
      unit: 'g',
      basis,
      status: 'unknown',
      note: 'Value not reported'
    });
  }

  // Sodium / Salt normalization check
  let effectiveSodiumMg: number | null = null;
  if (nut.sodium && nut.sodium.value !== null && !nut.sodium.isMissing) {
    effectiveSodiumMg = nut.sodium.unit === 'g' ? nut.sodium.value * 1000 : nut.sodium.value;
  } else if (nut.salt && nut.salt.value !== null && !nut.salt.isMissing) {
    // 1g salt ~ 400mg sodium (salt / 2.5)
    effectiveSodiumMg = (nut.salt.value / 2.5) * 1000;
  }

  if (effectiveSodiumMg !== null) {
    let status: 'low' | 'moderate' | 'high' = 'low';
    const roundedSodium = Math.round(effectiveSodiumMg);

    if (effectiveSodiumMg > PROTOTYPE_THRESHOLDS.sodium.highMg) {
      status = 'high';
      flags.push({
        id: 'nut-sodium-high',
        category: 'nutrition',
        severity: 'warning',
        title: 'High Sodium / Salt Content',
        description: `${roundedSodium}mg sodium per ${basis} exceeds threshold (${PROTOTYPE_THRESHOLDS.sodium.highMg}mg).`,
        ruleCode: 'RULE_NUT_SODIUM_HIGH'
      });
      triggeredRules.push('RULE_NUT_SODIUM_HIGH');
    } else if (effectiveSodiumMg > PROTOTYPE_THRESHOLDS.sodium.cautionMg) {
      status = 'moderate';
      flags.push({
        id: 'nut-sodium-caution',
        category: 'nutrition',
        severity: 'info',
        title: 'Moderate Sodium Content',
        description: `${roundedSodium}mg sodium per ${basis} is above caution threshold (${PROTOTYPE_THRESHOLDS.sodium.cautionMg}mg).`,
        ruleCode: 'RULE_NUT_SODIUM_CAUTION'
      });
      triggeredRules.push('RULE_NUT_SODIUM_CAUTION');
    }

    nutritionalObservations.push({
      metric: 'Sodium',
      value: roundedSodium,
      unit: 'mg',
      basis,
      status,
      thresholdUsed: `> ${PROTOTYPE_THRESHOLDS.sodium.cautionMg}mg moderate, > ${PROTOTYPE_THRESHOLDS.sodium.highMg}mg high`
    });
  } else {
    nutritionalObservations.push({
      metric: 'Sodium',
      value: null,
      unit: 'mg',
      basis,
      status: 'unknown',
      note: 'Value not reported'
    });
  }

  // Saturated Fat
  if (nut.saturatedFat && nut.saturatedFat.value !== null && !nut.saturatedFat.isMissing) {
    const satFatVal = nut.saturatedFat.value;
    let status: 'low' | 'moderate' | 'high' = 'low';

    if (satFatVal > PROTOTYPE_THRESHOLDS.saturatedFat.highG) {
      status = 'high';
      flags.push({
        id: 'nut-satfat-high',
        category: 'nutrition',
        severity: 'warning',
        title: 'High Saturated Fat',
        description: `${satFatVal}g saturated fat per ${basis} exceeds screening threshold (${PROTOTYPE_THRESHOLDS.saturatedFat.highG}g).`,
        ruleCode: 'RULE_NUT_SATFAT_HIGH'
      });
      triggeredRules.push('RULE_NUT_SATFAT_HIGH');
    } else if (satFatVal > PROTOTYPE_THRESHOLDS.saturatedFat.cautionG) {
      status = 'moderate';
      flags.push({
        id: 'nut-satfat-caution',
        category: 'nutrition',
        severity: 'info',
        title: 'Moderate Saturated Fat',
        description: `${satFatVal}g saturated fat per ${basis} is above caution threshold (${PROTOTYPE_THRESHOLDS.saturatedFat.cautionG}g).`,
        ruleCode: 'RULE_NUT_SATFAT_CAUTION'
      });
      triggeredRules.push('RULE_NUT_SATFAT_CAUTION');
    }

    nutritionalObservations.push({
      metric: 'Saturated Fat',
      value: satFatVal,
      unit: 'g',
      basis,
      status,
      thresholdUsed: `> ${PROTOTYPE_THRESHOLDS.saturatedFat.cautionG}g moderate, > ${PROTOTYPE_THRESHOLDS.saturatedFat.highG}g high`
    });
  } else {
    nutritionalObservations.push({
      metric: 'Saturated Fat',
      value: null,
      unit: 'g',
      basis,
      status: 'unknown',
      note: 'Value not reported'
    });
  }

  // -------------------------------------------------------------
  // RULE SET 5: Life-Stage Considerations (Informational Only)
  // -------------------------------------------------------------
  if (profile.lifeStages && profile.lifeStages.length > 0) {
    const activeStages = profile.lifeStages.filter(s => s !== 'none');
    if (activeStages.includes('pregnancy')) {
      if (/unpasteurised|unpasteurized|raw milk|caffeine/i.test(textToScan)) {
        flags.push({
          id: 'lifestage-pregnancy',
          category: 'lifestage',
          severity: 'warning',
          title: 'Pregnancy Dietary Flag',
          description: 'Contains unpasteurized ingredients or elevated stimulants. Verify safety with your obstetric provider.',
          ruleCode: 'RULE_LIFESTAGE_PREGNANCY'
        });
        triggeredRules.push('RULE_LIFESTAGE_PREGNANCY');
      }
    }
  }

  // -------------------------------------------------------------
  // RULE SET 6: Deterministic Final Verdict Determination
  // -------------------------------------------------------------
  // 1. Any confirmed allergen match = AVOID
  // 2. If ingredients are missing entirely = INSUFFICIENT DATA
  // 3. Any trace warnings or severe nutrition flags / dietary clash = CAUTION
  // 4. Otherwise = SUITABLE

  let verdict: ProductVerdict = 'suitable';
  let verdictReason = 'No conflicting allergens or high-concern ingredients were detected based on your active profile.';

  const hasConfirmedAllergen = matchedAllergens.length > 0;
  const hasTraceMatch = matchedTraces.length > 0;
  const hasDietaryWarning = flags.some(f => f.category === 'dietary' && f.severity === 'warning');
  const hasHighNutritionFlag = flags.some(f => f.category === 'nutrition' && f.severity === 'warning');

  if (hasConfirmedAllergen) {
    verdict = 'avoid';
    verdictReason = `Avoid: Product contains confirmed allergen(s) matching your profile: ${matchedAllergens.join(', ')}.`;
  } else if (isIngredientsMissing && (product.declaredAllergens?.length ?? 0) === 0) {
    verdict = 'insufficient_data';
    verdictReason = 'Insufficient data: Product ingredients and allergen declarations are missing or incomplete. Safety cannot be determined.';
  } else if (hasTraceMatch || hasDietaryWarning || hasHighNutritionFlag) {
    verdict = 'caution';
    const reasons: string[] = [];
    if (hasTraceMatch) reasons.push(`potential traces of ${matchedTraces.join(', ')}`);
    if (hasDietaryWarning) reasons.push('ingredient dietary preferences');
    if (hasHighNutritionFlag) reasons.push('elevated nutrition thresholds');
    verdictReason = `Caution: Product warrants attention due to ${reasons.join(', ')}.`;
  } else {
    verdict = 'suitable';
    verdictReason = 'Suitable: Product ingredients and nutrition align with your current preferences and no declared allergens were matched.';
  }

  return {
    productId: product.id,
    barcode: product.barcode,
    productName: product.name || 'Unnamed Product',
    verdict,
    verdictReason,
    flags,
    matchedAllergens,
    matchedTraces,
    ingredientsOfConcern: Array.from(new Set(ingredientsOfConcern)),
    nutritionalObservations,
    missingDataNotes,
    triggeredRules,
    analyzedAt: new Date().toISOString(),
    evaluatedProfileSnapshot: {
      allergies: [...profile.allergies],
      otherAllergies: profile.otherAllergies || '',
      lactoseIntolerance: profile.lactoseIntolerance,
      isVegan: profile.preferences.isVegan,
      isVegetarian: profile.preferences.isVegetarian,
      diabetesStatus: profile.diabetesStatus,
      lifeStages: [...profile.lifeStages],
    }
  };
}
