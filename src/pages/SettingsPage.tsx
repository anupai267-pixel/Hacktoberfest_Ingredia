import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getScanHistory, clearAllHistory } from '../services/historyService';
import { deleteUserProfileData } from '../services/profileService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { 
  Download, 
  Trash2, 
  LogOut, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { profile, refreshProfile } = useProfile();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  // Clean up any obsolete client-side key storage
  React.useEffect(() => {
    localStorage.removeItem('ingredia_custom_gemini_key');
  }, []);

  const handleExportData = async () => {
    const history = await getScanHistory(user?.id);
    const exportPayload = {
      user: {
        id: user?.id,
        email: user?.email,
      },
      profile,
      history,
      exportedAt: new Date().toISOString(),
      app: 'Ingredia — Know What’s in Your Food',
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingredia_data_export_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    await clearAllHistory(user?.id);
    await deleteUserProfileData(user?.id);
    await refreshProfile();
    setDeleteConfirmOpen(false);
    setDeleteStatus('All stored profile information and scan records have been permanently cleared.');
  };

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Settings & Data Controls
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Manage your account, privacy controls, and data exports.
        </p>
      </div>

      {deleteStatus && (
        <div className="alert-banner alert-banner-success">
          <Check size={18} />
          <span>{deleteStatus}</span>
        </div>
      )}

      {/* Account & Storage Mode Status */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Account & Environment
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Account Email:</span>
            <span style={{ fontWeight: 600 }}>{user?.email || 'demo@ingredia.app'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Storage Engine:</span>
            <span style={{ fontWeight: 600, color: isSupabaseConfigured ? 'var(--status-suitable)' : 'var(--primary-berry)' }}>
              {isSupabaseConfigured ? 'Supabase PostgreSQL (Cloud Authenticated)' : 'Local Device Storage'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Session:</span>
            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--status-avoid)' }}
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Export & Deletion */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Data Privacy & Control
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          You have full ownership of your data. You can download an export of your preferences and scan history or permanently delete all stored records.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportData}
            className="btn btn-secondary"
          >
            <Download size={16} />
            <span>Export My Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Delete All My Data</span>
          </button>
        </div>

        {/* Delete Confirmation Box */}
        {deleteConfirmOpen && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              background: 'var(--status-avoid-bg)',
              border: '1px solid var(--status-avoid-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-avoid)', fontWeight: 600, marginBottom: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>Confirm Complete Data Deletion</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Are you sure? This action will permanently erase your profile preferences, custom allergies, and all recorded food scans.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleDeleteAllData}
                className="btn btn-danger btn-sm"
              >
                Yes, Permanently Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Medical & Regulatory Disclaimer */}
      <div
        style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.375rem' }}>
          Informational & Screening Disclaimer
        </strong>
        Ingredia is not a medical device, nor does it dispense clinical medical diagnoses, therapeutic advice, or legally binding food guarantees. All screening rules, nutrient thresholds, and allergen detections are designed for informational consumer assistance. Formulations and cross-contact risks are subject to change by manufacturers. Always consult your qualified healthcare practitioner or allergist for individual health decisions.
      </div>
    </div>
  );
};
