import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DEFAULT_USER_PROFILE, type UserProfile } from '../types/user';

const DEMO_PROFILE_STORAGE_KEY = 'ingredia_demo_user_profile_v1';

export async function getUserProfile(userId?: string): Promise<UserProfile> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name || '',
          lifeStages: data.life_stages || ['none'],
          diabetesStatus: data.diabetes_status || 'none',
          lactoseIntolerance: data.lactose_intolerance || 'no',
          allergies: data.allergies || [],
          otherAllergies: data.other_allergies || '',
          preferences: data.preferences || DEFAULT_USER_PROFILE.preferences,
          informedConsentGiven: data.informed_consent_given ?? true,
          consentTimestamp: data.consent_timestamp,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          isDemoUser: false,
        };
      }
    } catch (e) {
      console.warn('Could not fetch Supabase profile, falling back to local:', e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse local profile:', e);
    }
  }

  return DEFAULT_USER_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
  const updatedProfile: UserProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  // Always sync to local storage for immediate responsiveness
  localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));

  if (isSupabaseConfigured && supabase && !profile.isDemoUser) {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: updatedProfile.id,
        email: updatedProfile.email,
        full_name: updatedProfile.fullName,
        life_stages: updatedProfile.lifeStages,
        diabetes_status: updatedProfile.diabetesStatus,
        lactose_intolerance: updatedProfile.lactoseIntolerance,
        allergies: updatedProfile.allergies,
        other_allergies: updatedProfile.otherAllergies,
        preferences: updatedProfile.preferences,
        informed_consent_given: updatedProfile.informedConsentGiven,
        consent_timestamp: updatedProfile.consentTimestamp,
        updated_at: updatedProfile.updatedAt,
      });

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown database error' };
    }
  }

  return { success: true };
}

export async function deleteUserProfileData(userId?: string): Promise<boolean> {
  localStorage.removeItem(DEMO_PROFILE_STORAGE_KEY);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (e) {
      console.error('Failed to delete Supabase profile:', e);
      return false;
    }
  }

  return true;
}
