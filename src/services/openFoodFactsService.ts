import type { NormalizedProduct, NutritionBasis, NutritionValue } from '../types/product';
import { getSupplementalProductByBarcode } from '../data/supplementalProducts';

export interface ProductLookupResult {
  success: boolean;
  product?: NormalizedProduct;
  errorMessage?: string;
  source: 'open_food_facts' | 'supplemental_dataset' | 'none';
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

export async function fetchProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  if (!cleanBarcode) {
    return {
      success: false,
      source: 'none',
      errorMessage: 'Please provide a valid numeric barcode.'
    };
  }

  // First check if it matches our supplemental demo dataset
  const localMatch = getSupplementalProductByBarcode(cleanBarcode);
  if (localMatch) {
    return {
      success: true,
      product: localMatch,
      source: 'supplemental_dataset',
    };
  }

  // Otherwise, query live Open Food Facts API v2
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Ingredia - Web - Version 1.0 (https://ingredia.app; contact@ingredia.app)',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          source: 'none',
          errorMessage: `Barcode ${cleanBarcode} was not found in the Open Food Facts global database.`
        };
      }
      throw new Error(`Open Food Facts API error: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return {
        success: false,
        source: 'none',
        errorMessage: `Product with barcode ${cleanBarcode} is not cataloged in Open Food Facts.`
      };
    }

    const raw = data.product;
    const nut = raw.nutriments || {};

    // Determine Nutrition Basis
    const basis: NutritionBasis = raw.nutrition_data_per === '100g' ? '100g' 
      : raw.nutrition_data_per === '100ml' ? '100ml' 
      : raw.nutrition_data_per === 'serving' ? 'serving' 
      : '100g';

    // Parse nutrition safely without replacing missing values with 0
    const rawSugars = parseNumber(nut['sugars_100g'] ?? nut['sugars_value'] ?? nut['sugars']);
    const sugars: NutritionValue = {
      value: rawSugars,
      unit: 'g',
      isMissing: rawSugars === null,
    };

    const rawSatFat = parseNumber(nut['saturated-fat_100g'] ?? nut['saturated-fat_value'] ?? nut['saturated-fat']);
    const saturatedFat: NutritionValue = {
      value: rawSatFat,
      unit: 'g',
      isMissing: rawSatFat === null,
    };

    const rawSodium = parseNumber(nut['sodium_100g'] ?? nut['sodium_value'] ?? nut['sodium']);
    const rawSalt = parseNumber(nut['salt_100g'] ?? nut['salt_value'] ?? nut['salt']);

    let sodiumVal = rawSodium !== null ? rawSodium * 1000 : null; // in mg
    if (sodiumVal === null && rawSalt !== null) {
      // 1g salt = 0.4g sodium = 400mg sodium
      sodiumVal = (rawSalt / 2.5) * 1000;
    }

    const sodium: NutritionValue = {
      value: sodiumVal,
      unit: 'mg',
      isMissing: sodiumVal === null,
    };

    const salt: NutritionValue = {
      value: rawSalt,
      unit: 'g',
      isMissing: rawSalt === null,
    };

    const rawEnergy = parseNumber(nut['energy-kcal_100g'] ?? nut['energy-kcal_value'] ?? nut['energy-kcal']);
    const energyKcal: NutritionValue = {
      value: rawEnergy,
      unit: 'kcal',
      isMissing: rawEnergy === null,
    };

    const rawCarbs = parseNumber(nut['carbohydrates_100g'] ?? nut['carbohydrates_value'] ?? nut['carbohydrates']);
    const carbohydrates: NutritionValue = {
      value: rawCarbs,
      unit: 'g',
      isMissing: rawCarbs === null,
    };

    const rawProteins = parseNumber(nut['proteins_100g'] ?? nut['proteins_value'] ?? nut['proteins']);
    const proteins: NutritionValue = {
      value: rawProteins,
      unit: 'g',
      isMissing: rawProteins === null,
    };

    const rawFat = parseNumber(nut['fat_100g'] ?? nut['fat_value'] ?? nut['fat']);
    const fat: NutritionValue = {
      value: rawFat,
      unit: 'g',
      isMissing: rawFat === null,
    };

    const rawFiber = parseNumber(nut['fiber_100g'] ?? nut['fiber_value'] ?? nut['fiber']);
    const fiber: NutritionValue = {
      value: rawFiber,
      unit: 'g',
      isMissing: rawFiber === null,
    };

    // Allergens and Traces tags
    const declaredAllergens: string[] = Array.isArray(raw.allergens_tags)
      ? raw.allergens_tags.map((tag: string) => tag.replace(/^[a-z]{2}:/, '').trim())
      : (typeof raw.allergens === 'string' && raw.allergens.length > 0)
      ? raw.allergens.split(',').map((s: string) => s.trim())
      : [];

    const traceWarnings: string[] = Array.isArray(raw.traces_tags)
      ? raw.traces_tags.map((tag: string) => tag.replace(/^[a-z]{2}:/, '').trim())
      : (typeof raw.traces === 'string' && raw.traces.length > 0)
      ? raw.traces.split(',').map((s: string) => s.trim())
      : [];

    const ingredientsText = raw.ingredients_text_en || raw.ingredients_text || '';
    const parsedIngredients = Array.isArray(raw.ingredients)
      ? raw.ingredients.map((i: { text?: string }) => i.text || '').filter(Boolean)
      : ingredientsText.split(/[,;()]/).map((s: string) => s.trim()).filter(Boolean);

    const isIngredientsMissing = !ingredientsText || ingredientsText.trim().length === 0;
    const isNutritionMissing = sugars.isMissing && sodium.isMissing && saturatedFat.isMissing && energyKcal.isMissing;
    const isAllergensMissing = declaredAllergens.length === 0 && traceWarnings.length === 0 && isIngredientsMissing;

    const normalized: NormalizedProduct = {
      id: raw.id || cleanBarcode,
      barcode: cleanBarcode,
      name: raw.product_name_en || raw.product_name || 'Unnamed Packaged Product',
      brand: raw.brands || raw.brand_owner || undefined,
      imageUrl: raw.image_url || raw.image_front_url || undefined,
      categories: raw.categories_tags?.map((c: string) => c.replace(/^[a-z]{2}:/, '')) || [],
      ingredientsText,
      parsedIngredients,
      declaredAllergens,
      traceWarnings,
      nutrition: {
        basis,
        servingSize: raw.serving_size || undefined,
        energyKcal,
        sugars,
        saturatedFat,
        sodium,
        salt,
        carbohydrates,
        proteins,
        fat,
        fiber,
      },
      source: 'open_food_facts',
      retrievalTimestamp: new Date().toISOString(),
      missingDataFlags: {
        ingredientsMissing: isIngredientsMissing,
        allergensMissing: isAllergensMissing,
        nutritionMissing: isNutritionMissing,
      },
    };

    return {
      success: true,
      product: normalized,
      source: 'open_food_facts',
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMsg = err instanceof Error ? err.message : 'Network error';

    return {
      success: false,
      source: 'none',
      errorMessage: `Could not reach Open Food Facts API (${errorMsg}). Please check your connection or try a sample product.`
    };
  }
}
