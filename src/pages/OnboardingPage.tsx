import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import type { CommonAllergen, LifeStage, DiabetesStatus, LactoseTolerance } from '../types/user';
import { 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Info 
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [lifeStages, setLifeStages] = useState<LifeStage[]>(profile.lifeStages || ['none']);
  const [diabetesStatus, setDiabetesStatus] = useState<DiabetesStatus>(profile.diabetesStatus || 'none');
  const [lactoseIntolerance, setLactoseIntolerance] = useState<LactoseTolerance>(profile.lactoseIntolerance || 'no');
  
  const [allergies, setAllergies] = useState<CommonAllergen[]>(profile.allergies || []);
  const [otherAllergies, setOtherAllergies] = useState<string>(profile.otherAllergies || '');
  
  const [isVegetarian, setIsVegetarian] = useState(profile.preferences?.isVegetarian || false);
  const [isVegan, setIsVegan] = useState(profile.preferences?.isVegan || false);
  const [avoidPalmOil, setAvoidPalmOil] = useState(profile.preferences?.avoidPalmOil || false);
  const [avoidHFCS, setAvoidHFCS] = useState(profile.preferences?.avoidHighFructoseCornSyrup || false);
  const [avoidSweeteners, setAvoidSweeteners] = useState(profile.preferences?.avoidArtificialSweeteners || false);
  const [customAvoidance, setCustomAvoidance] = useState<string>(
    (profile.preferences?.customAvoidIngredients || []).join(', ')
  );

  const [isSaving, setIsSaving] = useState(false);

  // Toggle helpers
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
        const withoutNone = prev.filter((s) => s !== 'none');
        return withoutNone.includes(item)
          ? withoutNone.filter((s) => s !== item).length === 0 ? ['none'] : withoutNone.filter((s) => s !== item)
          : [...withoutNone, item];
      });
    }
  };

  const handleSaveAndFinish = async () => {
    setIsSaving(true);
    const customList = customAvoidance
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    await updateProfile({
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
      informedConsentGiven: true,
      consentTimestamp: new Date().toISOString(),
    });

    setIsSaving(false);
    navigate('/dashboard');
  };

  const allergenList: { id: CommonAllergen; label: string; hint: string }[] = [
    { id: 'milk', label: 'Cow’s Milk', hint: 'Whey, casein, butter, dairy proteins' },
    { id: 'peanuts', label: 'Peanuts', hint: 'Groundnuts, peanut butter, peanut oil' },
    { id: 'tree_nuts', label: 'Tree Nuts', hint: 'Almonds, cashews, walnuts, hazelnuts' },
    { id: 'eggs', label: 'Eggs', hint: 'Albumin, egg whites, mayonnaise' },
    { id: 'soy', label: 'Soybeans', hint: 'Soy lecithin, edamame, tofu, tamari' },
    { id: 'wheat_gluten', label: 'Wheat / Gluten', hint: 'Wheat flour, barley, rye, malt' },
    { id: 'fish', label: 'Fin Fish', hint: 'Salmon, tuna, cod, fish sauce' },
    { id: 'shellfish', label: 'Shellfish', hint: 'Shrimp, crab, lobster, oysters' },
    { id: 'sesame', label: 'Sesame', hint: 'Sesame seeds, tahini, sesame oil' },
  ];

  return (
    <div className="app-container-narrow" style={{ paddingTop: '1.5rem', paddingBottom: '3.5rem' }}>
      {/* Progress Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: step === s ? 'var(--primary-berry)' : step > s ? 'var(--status-suitable-bg)' : 'var(--bg-card)',
                color: step === s ? '#FFFFFF' : step > s ? 'var(--status-suitable)' : 'var(--text-muted)',
                border: `1px solid ${step === s ? 'var(--primary-berry)' : step > s ? 'var(--status-suitable-border)' : 'var(--border-color)'}`,
              }}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
          ))}
        </div>
        <h2 style={{ fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {step === 1 && 'Food Allergies & Sensitivities'}
          {step === 2 && 'Dietary Lifestyle & Ingredients'}
          {step === 3 && 'Optional Health & Life-Stage Context'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {step === 1 && 'Select items that cause adverse allergic reactions.'}
          {step === 2 && 'Customize ingredients and dietary styles you wish to avoid.'}
          {step === 3 && 'All health context is optional and used solely for screening warnings.'}
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {/* STEP 1: ALLERGIES */}
        {step === 1 && (
          <div>
            <div className="alert-banner alert-banner-info" style={{ marginBottom: '1.5rem' }}>
              <ShieldCheck size={18} color="var(--primary-berry)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Safety First:</strong> Confirmed matches against your selected allergies will trigger an immediate <strong>Avoid</strong> verdict on any scanned food.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem',
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
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--status-avoid-bg)' : '#FFFFFF',
                      border: `1px solid ${isSelected ? 'var(--status-avoid-border)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: isSelected ? 'var(--status-avoid)' : 'var(--text-main)' }}>
                        {item.label}
                      </span>
                      {isSelected && <Check size={16} color="var(--status-avoid)" />}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Lactose Intolerance Distinction */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Lactose Intolerance (Separate from Milk Allergy)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(['no', 'yes', 'unsure'] as LactoseTolerance[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLactoseIntolerance(opt)}
                    className={`btn ${lactoseIntolerance === opt ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1, textTransform: 'capitalize' }}
                  >
                    {opt === 'yes' ? 'Yes, Lactose Intolerant' : opt === 'no' ? 'No' : 'Unsure'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Other Allergies */}
            <div className="form-group">
              <label className="form-label">Other Allergies (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={otherAllergies}
                onChange={(e) => setOtherAllergies(e.target.value)}
                placeholder="e.g. Mustard, Sulfites, Lupine, Strawberries"
              />
              <span className="form-helper">Separate multiple ingredients with commas.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary"
              >
                <span>Continue to Dietary Preferences</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DIETARY PREFERENCES */}
        {step === 2 && (
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.875rem' }}>
              Dietary Lifestyle
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setIsVegetarian(!isVegetarian);
                  if (!isVegetarian) setIsVegan(false);
                }}
                className={`btn ${isVegetarian ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: '3rem' }}
              >
                <span>Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsVegan(!isVegan);
                  if (!isVegan) setIsVegetarian(false);
                }}
                className={`btn ${isVegan ? 'btn-primary' : 'btn-secondary'}`}
                style={{ height: '3rem' }}
              >
                <span>Vegan (Strict Plant-Based)</span>
              </button>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.875rem' }}>
              Ingredient Screening Preferences
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={avoidPalmOil}
                  onChange={(e) => setAvoidPalmOil(e.target.checked)}
                  style={{ accentColor: 'var(--primary-berry)' }}
                />
                <div>
                  <strong style={{ fontSize: '0.875rem', display: 'block' }}>Avoid Palm Oil</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag products containing palm oil or palm fat derivatives</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={avoidHFCS}
                  onChange={(e) => setAvoidHFCS(e.target.checked)}
                  style={{ accentColor: 'var(--primary-berry)' }}
                />
                <div>
                  <strong style={{ fontSize: '0.875rem', display: 'block' }}>Avoid High Fructose Corn Syrup (HFCS)</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag corn syrups, glucose-fructose, and refined fructose</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={avoidSweeteners}
                  onChange={(e) => setAvoidSweeteners(e.target.checked)}
                  style={{ accentColor: 'var(--primary-berry)' }}
                />
                <div>
                  <strong style={{ fontSize: '0.875rem', display: 'block' }}>Avoid Artificial Sweeteners</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flag aspartame, sucralose, acesulfame K, saccharin</span>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Custom Ingredients to Avoid (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={customAvoidance}
                onChange={(e) => setCustomAvoidance(e.target.value)}
                placeholder="e.g. Red 40, Monosodium glutamate, Titanium dioxide"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-primary"
              >
                <span>Continue to Health Context</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HEALTH & LIFE-STAGE CONTEXT */}
        {step === 3 && (
          <div>
            <div className="alert-banner alert-banner-info" style={{ marginBottom: '1.5rem' }}>
              <Info size={18} color="var(--primary-berry)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Completely Optional:</strong> Sensitive health disclosures are never mandatory. Information selected here is strictly used to surface contextual warnings (e.g. high sugar considerations for diabetes).
              </div>
            </div>

            {/* Life Stage */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Life-Stage Considerations (Multi-select)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
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
                      className={`btn ${isSel ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ height: '2.5rem' }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diabetes Status */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Diabetes Status (Screening for High Sugar content)
              </label>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {[
                  { id: 'none', label: 'None' },
                  { id: 'type_1', label: 'Type 1' },
                  { id: 'type_2', label: 'Type 2' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDiabetesStatus(opt.id as DiabetesStatus)}
                    className={`btn ${diabetesStatus === opt.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy & Consent Summary */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', color: 'var(--text-main)', fontWeight: 600 }}>
                <ShieldCheck size={16} color="var(--status-suitable)" />
                <span>Your Data Stays Yours</span>
              </div>
              All preferences are stored securely. You can edit your profile or delete all stored data anytime in Settings. Ingredia never sells profile data or uses it for advertising.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndFinish}
                disabled={isSaving}
                className="btn btn-primary"
              >
                <span>{isSaving ? 'Saving Profile...' : 'Complete Profile & Open Dashboard'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
