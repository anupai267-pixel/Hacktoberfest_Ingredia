import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import type { CommonAllergen, LifeStage, DiabetesStatus, LactoseTolerance } from '../types/user';
import { 
  ShieldCheck, 
  Save, 
  Check 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, loading } = useProfile();

  const [lifeStages, setLifeStages] = useState<LifeStage[]>(['none']);
  const [diabetesStatus, setDiabetesStatus] = useState<DiabetesStatus>('none');
  const [lactoseIntolerance, setLactoseIntolerance] = useState<LactoseTolerance>('no');
  const [allergies, setAllergies] = useState<CommonAllergen[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string>('');
  
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [avoidPalmOil, setAvoidPalmOil] = useState(false);
  const [avoidHFCS, setAvoidHFCS] = useState(false);
  const [avoidSweeteners, setAvoidSweeteners] = useState(false);
  const [customAvoidance, setCustomAvoidance] = useState<string>('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setLifeStages(profile.lifeStages || ['none']);
      setDiabetesStatus(profile.diabetesStatus || 'none');
      setLactoseIntolerance(profile.lactoseIntolerance || 'no');
      setAllergies(profile.allergies || []);
      setOtherAllergies(profile.otherAllergies || '');
      setIsVegetarian(profile.preferences?.isVegetarian || false);
      setIsVegan(profile.preferences?.isVegan || false);
      setAvoidPalmOil(profile.preferences?.avoidPalmOil || false);
      setAvoidHFCS(profile.preferences?.avoidHighFructoseCornSyrup || false);
      setAvoidSweeteners(profile.preferences?.avoidArtificialSweeteners || false);
      setCustomAvoidance((profile.preferences?.customAvoidIngredients || []).join(', '));
    }
  }, [profile]);

  const toggleAllergen = (item: CommonAllergen) => {
    setAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleLifeStage = (item: LifeStage) => {
    if (item === 'none') {
      setLifeStages(['none']);
    } else {
      setLifeStages((prev) => {
        const without = prev.filter((s) => s !== 'none');
        return without.includes(item)
          ? without.filter((s) => s !== item).length === 0 ? ['none'] : without.filter((s) => s !== item)
          : [...without, item];
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const customList = customAvoidance
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const success = await updateProfile({
      lifeStages,
      diabetesStatus,
      lactoseIntolerance,
      allergies,
      otherAllergies: otherAllergies.trim(),
      preferences: {
        isVegetarian,
        isVegan,
        avoidPalmOil,
        avoidHighFructoseCornSyrup: avoidHFCS,
        avoidArtificialSweeteners: avoidSweeteners,
        avoidArtificialColors: false,
        customAvoidIngredients: customList,
      },
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const allergenList: { id: CommonAllergen; label: string; hint: string }[] = [
    { id: 'milk', label: 'Cow’s Milk', hint: 'Casein, whey, butter, dairy proteins' },
    { id: 'peanuts', label: 'Peanuts', hint: 'Peanuts, groundnut paste' },
    { id: 'tree_nuts', label: 'Tree Nuts', hint: 'Almonds, cashews, walnuts, hazelnuts' },
    { id: 'eggs', label: 'Eggs', hint: 'Albumen, egg whites, mayonnaise' },
    { id: 'soy', label: 'Soybeans', hint: 'Soy lecithin, edamame, tofu' },
    { id: 'wheat_gluten', label: 'Wheat / Gluten', hint: 'Wheat flour, barley, rye' },
    { id: 'fish', label: 'Fin Fish', hint: 'Cod, salmon, tuna, fish sauce' },
    { id: 'shellfish', label: 'Shellfish', hint: 'Shrimp, crab, lobster, oysters' },
    { id: 'sesame', label: 'Sesame', hint: 'Sesame seeds, tahini, sesame oil' },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading preferences...</div>;
  }

  return (
    <div className="app-container-narrow" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Personal Dietary Profile
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Update your safety preferences. Modifying preferences will customize all future product evaluations.
        </p>
      </div>

      {saveSuccess && (
        <div className="alert-banner alert-banner-success">
          <Check size={18} />
          <span>Profile preferences updated successfully! Future scans will apply these rules.</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 1: Food Allergies */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary-berry)" />
            <span>Food Allergies</span>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Products matching these allergens will produce an immediate <strong>Avoid</strong> verdict.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            {allergenList.map((item) => {
              const isSelected = allergies.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleAllergen(item.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--status-avoid-bg)' : '#FFFFFF',
                    border: `1px solid ${isSelected ? 'var(--status-avoid-border)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? 'var(--status-avoid)' : 'var(--text-main)' }}>
                      {item.label}
                    </span>
                    {isSelected && <Check size={16} color="var(--status-avoid)" />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Custom Other Allergies (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={otherAllergies}
              onChange={(e) => setOtherAllergies(e.target.value)}
              placeholder="e.g. Mustard, Sulfites, Celery, Lupin"
            />
          </div>
        </div>

        {/* Section 2: Dietary Lifestyle & Lactose */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.875rem' }}>
            Dietary Lifestyle & Tolerances
          </h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Lactose Intolerance (Separate from Milk Allergy)
            </label>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              {(['no', 'yes', 'unsure'] as LactoseTolerance[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLactoseIntolerance(opt)}
                  className={`btn btn-sm ${lactoseIntolerance === opt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  {opt === 'yes' ? 'Yes, Intolerant' : opt === 'no' ? 'No' : 'Unsure'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsVegetarian(!isVegetarian);
                if (!isVegetarian) setIsVegan(false);
              }}
              className={`btn ${isVegetarian ? 'btn-primary' : 'btn-secondary'}`}
            >
              Vegetarian
            </button>
            <button
              type="button"
              onClick={() => {
                setIsVegan(!isVegan);
                if (!isVegan) setIsVegetarian(false);
              }}
              className={`btn ${isVegan ? 'btn-primary' : 'btn-secondary'}`}
            >
              Vegan (Plant-Based)
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={avoidPalmOil}
                onChange={(e) => setAvoidPalmOil(e.target.checked)}
                style={{ accentColor: 'var(--primary-berry)' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Avoid Palm Oil</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={avoidHFCS}
                onChange={(e) => setAvoidHFCS(e.target.checked)}
                style={{ accentColor: 'var(--primary-berry)' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Avoid High Fructose Corn Syrup</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={avoidSweeteners}
                onChange={(e) => setAvoidSweeteners(e.target.checked)}
                style={{ accentColor: 'var(--primary-berry)' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Avoid Artificial Sweeteners (Aspartame, Sucralose)</span>
            </label>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Custom Avoid Ingredients (comma-separated)</label>
            <input
              type="text"
              className="form-input"
              value={customAvoidance}
              onChange={(e) => setCustomAvoidance(e.target.value)}
              placeholder="e.g. Red 40, MSG, Tartrazine"
            />
          </div>
        </div>

        {/* Section 3: Health Context */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Optional Health Context
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Used only to display relevant safety notes (e.g. high sugar warning for diabetes).
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Life-Stage Considerations
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {[
                { id: 'none', label: 'None' },
                { id: 'pcos_pcod', label: 'PCOS / PCOD' },
                { id: 'pregnancy', label: 'Pregnancy' },
                { id: 'breastfeeding', label: 'Breastfeeding' },
              ].map((item) => {
                const isSel = lifeStages.includes(item.id as LifeStage);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLifeStage(item.id as LifeStage)}
                    className={`btn btn-sm ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Diabetes Status
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'none', label: 'None' },
                { id: 'type_1', label: 'Type 1' },
                { id: 'type_2', label: 'Type 2' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDiabetesStatus(opt.id as DiabetesStatus)}
                  className={`btn btn-sm ${diabetesStatus === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary btn-lg"
          >
            <Save size={18} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
