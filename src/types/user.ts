export type LifeStage = 'none' | 'pcos_pcod' | 'pregnancy' | 'breastfeeding';

export type DiabetesStatus = 'none' | 'type_1' | 'type_2';

export type LactoseTolerance = 'no' | 'yes' | 'unsure';

export type CommonAllergen = 
  | 'milk'
  | 'eggs'
  | 'peanuts'
  | 'tree_nuts'
  | 'soy'
  | 'wheat_gluten'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export interface UserPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  avoidPalmOil: boolean;
  avoidHighFructoseCornSyrup: boolean;
  avoidArtificialSweeteners: boolean;
  avoidArtificialColors: boolean;
  customAvoidIngredients: string[]; // comma-separated or list of user-entered ingredients
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  lifeStages: LifeStage[];
  diabetesStatus: DiabetesStatus;
  lactoseIntolerance: LactoseTolerance;
  allergies: CommonAllergen[];
  otherAllergies: string; // custom free text
  preferences: UserPreferences;
  informedConsentGiven: boolean;
  consentTimestamp?: string;
  createdAt: string;
  updatedAt: string;
  isDemoUser?: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'demo-user-1',
  email: 'demo@ingredia.app',
  fullName: 'Ingredia Explorer',
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
  consentTimestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDemoUser: true,
};
