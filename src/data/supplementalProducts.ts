import type { NormalizedProduct } from '../types/product';

/**
 * Supplemental packaged-food demo dataset.
 * Covers the required test scenarios:
 * 1. Complete data, suitable for standard profiles (Organic Rolled Oats)
 * 2. High-sugar nutrition flag (Hazelnut Cocoa Spread)
 * 3. Confirmed milk-allergen match (Greek Whole Milk Yogurt)
 * 4. Declared peanut-allergen match (Creamy Peanut Butter)
 * 5. Trace warning cross-contact (70% Dark Chocolate Bar)
 * 6. Missing nutrition or ingredient data (Imported Herbal Tea)
 * 7. High sodium flag (Instant Noodle Ramen)
 * 8. Non-vegan ingredient flag (Classic Fruit Gummies with gelatin)
 */
export const SUPPLEMENTAL_PRODUCTS: NormalizedProduct[] = [
  {
    id: 'demo-oats-101',
    barcode: '3017620422003',
    name: 'Organic Whole Grain Rolled Oats',
    brand: 'Ingredia Naturals',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    categories: ['Plant-based foods', 'Cereals and potatoes', 'Breakfasts'],
    ingredientsText: '100% Organic whole grain rolled oats.',
    parsedIngredients: ['Organic whole grain rolled oats'],
    declaredAllergens: ['en:gluten'],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 375, unit: 'kcal', isMissing: false },
      sugars: { value: 1.0, unit: 'g', isMissing: false },
      saturatedFat: { value: 1.3, unit: 'g', isMissing: false },
      sodium: { value: 5, unit: 'mg', isMissing: false },
      salt: { value: 0.01, unit: 'g', isMissing: false },
      carbohydrates: { value: 68.0, unit: 'g', isMissing: false },
      proteins: { value: 13.5, unit: 'g', isMissing: false },
      fiber: { value: 10.0, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-spread-102',
    barcode: '8000500179864',
    name: 'Hazelnut & Cocoa Breakfast Spread',
    brand: 'Dolcezza',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80',
    categories: ['Spreads', 'Sweet spreads', 'Cocoa and hazelnuts spreads'],
    ingredientsText: 'Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin.',
    parsedIngredients: ['Sugar', 'palm oil', 'hazelnuts', 'skimmed milk powder', 'fat-reduced cocoa', 'soya lecithin', 'vanillin'],
    declaredAllergens: ['en:milk', 'en:nuts', 'en:soybeans'],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 539, unit: 'kcal', isMissing: false },
      sugars: { value: 56.3, unit: 'g', isMissing: false }, // High sugar flag (> 22.5g)
      saturatedFat: { value: 10.6, unit: 'g', isMissing: false }, // High sat fat (> 5g)
      sodium: { value: 43, unit: 'mg', isMissing: false },
      salt: { value: 0.107, unit: 'g', isMissing: false },
      fat: { value: 30.9, unit: 'g', isMissing: false },
      proteins: { value: 6.3, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-yogurt-103',
    barcode: '5201051001078',
    name: 'Greek Whole Milk Strained Yogurt',
    brand: 'Olympus Pure',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    categories: ['Dairies', 'Fermented foods', 'Yogurts', 'Greek yogurts'],
    ingredientsText: 'Pasteurized whole milk, fresh cream, live active yogurt cultures (L. bulgaricus, S. thermophilus).',
    parsedIngredients: ['Pasteurized whole milk', 'fresh cream', 'live active yogurt cultures'],
    declaredAllergens: ['en:milk'],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 130, unit: 'kcal', isMissing: false },
      sugars: { value: 3.8, unit: 'g', isMissing: false },
      saturatedFat: { value: 6.5, unit: 'g', isMissing: false },
      sodium: { value: 55, unit: 'mg', isMissing: false },
      salt: { value: 0.14, unit: 'g', isMissing: false },
      proteins: { value: 9.0, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-peanut-104',
    barcode: '0040000004123',
    name: 'Crunchy Roasted Peanut Butter',
    brand: 'Earth Harvest',
    imageUrl: 'https://images.unsplash.com/photo-1568471173242-461f0a730452?auto=format&fit=crop&w=400&q=80',
    categories: ['Plant-based foods', 'Legumes and nuts', 'Nut butters', 'Peanut butters'],
    ingredientsText: 'Roasted peanuts (99%), sea salt.',
    parsedIngredients: ['Roasted peanuts', 'sea salt'],
    declaredAllergens: ['en:peanuts'],
    traceWarnings: ['May contain traces of tree nuts and sesame seeds.'],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 596, unit: 'kcal', isMissing: false },
      sugars: { value: 4.9, unit: 'g', isMissing: false },
      saturatedFat: { value: 8.2, unit: 'g', isMissing: false },
      sodium: { value: 190, unit: 'mg', isMissing: false },
      salt: { value: 0.48, unit: 'g', isMissing: false },
      proteins: { value: 26.0, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-chocolate-105',
    barcode: '7622210449283',
    name: '70% Dark Chocolate Single Origin',
    brand: 'Valle de Cacao',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    categories: ['Snacks', 'Sweet snacks', 'Chocolates', 'Dark chocolates'],
    ingredientsText: 'Cocoa mass, unrefined cane sugar, cocoa butter, organic vanilla pod powder.',
    parsedIngredients: ['Cocoa mass', 'unrefined cane sugar', 'cocoa butter', 'vanilla powder'],
    declaredAllergens: [],
    traceWarnings: ['Manufactured on shared equipment with hazelnuts, almonds, and milk.'],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 572, unit: 'kcal', isMissing: false },
      sugars: { value: 28.0, unit: 'g', isMissing: false },
      saturatedFat: { value: 24.0, unit: 'g', isMissing: false },
      sodium: { value: 12, unit: 'mg', isMissing: false },
      salt: { value: 0.03, unit: 'g', isMissing: false },
      proteins: { value: 8.5, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-tea-106',
    barcode: '5012345678900',
    name: 'Alpine Wild Herbal Infusion',
    brand: 'Mountain Botanicals',
    imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80',
    categories: ['Beverages', 'Hot beverages', 'Herbal teas'],
    ingredientsText: '', // Missing ingredients & nutrition test case!
    parsedIngredients: [],
    declaredAllergens: [],
    traceWarnings: [],
    nutrition: {
      basis: 'unknown',
      energyKcal: { value: null, unit: 'kcal', isMissing: true },
      sugars: { value: null, unit: 'g', isMissing: true },
      saturatedFat: { value: null, unit: 'g', isMissing: true },
      sodium: { value: null, unit: 'mg', isMissing: true },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: true,
      allergensMissing: true,
      nutritionMissing: true,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-ramen-107',
    barcode: '8801043003001',
    name: 'Spicy Instant Ramen Cup',
    brand: 'Noodle Works',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    categories: ['Meals', 'Noodle dishes', 'Instant noodles'],
    ingredientsText: 'Wheat flour, palm oil, modified potato starch, salt, monosodium glutamate, dehydrated vegetables (carrot, green onion, mushroom), red chili pepper, soy sauce powder, garlic.',
    parsedIngredients: ['Wheat flour', 'palm oil', 'salt', 'MSG', 'vegetables', 'chili', 'soy sauce powder', 'garlic'],
    declaredAllergens: ['en:gluten', 'en:soybeans'],
    traceWarnings: ['May contain crustaceans, fish, and eggs.'],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 440, unit: 'kcal', isMissing: false },
      sugars: { value: 3.5, unit: 'g', isMissing: false },
      saturatedFat: { value: 8.0, unit: 'g', isMissing: false },
      sodium: { value: 1780, unit: 'mg', isMissing: false }, // High sodium flag (> 600mg)
      salt: { value: 4.45, unit: 'g', isMissing: false },
      proteins: { value: 8.0, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  },
  {
    id: 'demo-gummies-108',
    barcode: '4001686301524',
    name: 'Classic Gummy Bears',
    brand: 'GoldBears Confections',
    imageUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=400&q=80',
    categories: ['Snacks', 'Sweet snacks', 'Confectioneries', 'Candies'],
    ingredientsText: 'Glucose syrup, sugar, beef gelatin, dextrose, citric acid, fruit and plant concentrates (safflower, spirulina, apple, elderberry), carnauba wax, white and yellow beeswax.',
    parsedIngredients: ['Glucose syrup', 'sugar', 'beef gelatin', 'dextrose', 'citric acid', 'fruit concentrates', 'carnauba wax', 'beeswax'],
    declaredAllergens: [],
    traceWarnings: [],
    nutrition: {
      basis: '100g',
      energyKcal: { value: 343, unit: 'kcal', isMissing: false },
      sugars: { value: 46.0, unit: 'g', isMissing: false }, // High sugar flag
      saturatedFat: { value: 0.1, unit: 'g', isMissing: false },
      sodium: { value: 30, unit: 'mg', isMissing: false },
      salt: { value: 0.07, unit: 'g', isMissing: false },
      proteins: { value: 6.9, unit: 'g', isMissing: false },
    },
    source: 'supplemental_dataset',
    retrievalTimestamp: new Date().toISOString(),
    missingDataFlags: {
      ingredientsMissing: false,
      allergensMissing: false,
      nutritionMissing: false,
    },
    isDemoSample: true,
  }
];

export function getSupplementalProductByBarcode(barcode: string): NormalizedProduct | undefined {
  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  return SUPPLEMENTAL_PRODUCTS.find(p => p.barcode === cleanBarcode || p.id === barcode);
}
