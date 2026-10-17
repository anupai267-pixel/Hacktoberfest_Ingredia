export type NutritionBasis = '100g' | '100ml' | 'serving' | 'unknown';

export type ProductDataSource = 
  | 'open_food_facts'
  | 'label_ocr'
  | 'supplemental_dataset'
  | 'manual_entry';

export interface NutritionValue {
  value: number | null;
  unit: 'g' | 'mg' | 'kcal' | 'kJ' | '%' | string;
  isMissing: boolean;
}

export interface ProductNutrition {
  basis: NutritionBasis;
  servingSize?: string;
  energyKcal?: NutritionValue;
  sugars?: NutritionValue;
  sodium?: NutritionValue;      // in mg or converted
  salt?: NutritionValue;        // in g
  saturatedFat?: NutritionValue;// in g
  carbohydrates?: NutritionValue;
  fat?: NutritionValue;
  proteins?: NutritionValue;
  fiber?: NutritionValue;
}

export interface NormalizedProduct {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  categories?: string[];
  ingredientsText: string;
  parsedIngredients: string[];
  declaredAllergens: string[];
  traceWarnings: string[];
  nutrition: ProductNutrition;
  source: ProductDataSource;
  retrievalTimestamp: string;
  missingDataFlags: {
    ingredientsMissing: boolean;
    allergensMissing: boolean;
    nutritionMissing: boolean;
  };
  ocrConfidence?: number;
  userConfirmed?: boolean;
  isDemoSample?: boolean;
}

export interface OCRExtractedData {
  rawText: string;
  detectedIngredientsText: string;
  detectedNutrition: {
    sugars?: number;
    saturatedFat?: number;
    sodium?: number;
    salt?: number;
    energyKcal?: number;
  };
  confidence: number;
}
