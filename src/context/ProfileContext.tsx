import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '../types/user';
import { DEFAULT_USER_PROFILE } from '../types/user';
import { getUserProfile, saveUserProfile } from '../services/profileService';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: UserProfile;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getUserProfile(user?.id);
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    const newProfile: UserProfile = {
      ...profile,
      ...updates,
      id: user?.id || profile.id,
      updatedAt: new Date().toISOString(),
    };
    const res = await saveUserProfile(newProfile);
    if (res.success) {
      setProfile(newProfile);
      return true;
    }
    return false;
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
