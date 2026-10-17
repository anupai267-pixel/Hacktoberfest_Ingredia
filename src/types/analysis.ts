import type { NormalizedProduct } from './product';

export type ProductVerdict = 'suitable' | 'caution' | 'avoid' | 'insufficient_data';

export type FlagSeverity = 'info' | 'warning' | 'danger';

export interface AnalysisFlag {
  id: string;
  category: 'allergen' | 'trace' | 'dietary' | 'nutrition' | 'lifestage' | 'missing_data';
  severity: FlagSeverity;
  title: string;
  description: string;
  matchedTerm?: string;
  ruleCode: string;
}

export interface NutritionAssessment {
  metric: string;
  value: number | null;
  unit: string;
  basis: string;
  status: 'low' | 'moderate' | 'high' | 'unknown';
  thresholdUsed?: string;
  note?: string;
}

export interface AnalysisResult {
  productId: string;
  barcode: string;
  productName: string;
  verdict: ProductVerdict;
  verdictReason: string;
  flags: AnalysisFlag[];
  matchedAllergens: string[];
  matchedTraces: string[];
  ingredientsOfConcern: string[];
  nutritionalObservations: NutritionAssessment[];
  missingDataNotes: string[];
  triggeredRules: string[];
  analyzedAt: string;
  evaluatedProfileSnapshot: {
    allergies: string[];
    otherAllergies: string;
    lactoseIntolerance: string;
    isVegan: boolean;
    isVegetarian: boolean;
    diabetesStatus: string;
    lifeStages: string[];
  };
  aiExplanation?: string;
  aiExplanationModel?: string;
}

export interface ScanHistoryRecord {
  id: string;
  userId: string;
  productId: string;
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
  verdict: ProductVerdict;
  scannedAt: string;
  source: string;
  analysisSnapshot: AnalysisResult;
  productSnapshot: NormalizedProduct;
}
