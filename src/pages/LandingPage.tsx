import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  HeartHandshake, 
  Layers
} from 'lucide-react';
import { SampleProductPicker } from '../components/common/SampleProductPicker';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {/* Hero Section */}
      <section className="app-container" style={{ textAlign: 'center', paddingTop: '2.5rem', paddingBottom: '1rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-blush)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8125rem',
            color: 'var(--primary-berry)',
            fontWeight: 600,
            marginBottom: '1.25rem',
          }}
        >
          <ShieldCheck size={14} />
          <span>Transparent Packaged-Food Intelligence</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: 'var(--text-main)',
            maxWidth: '820px',
            margin: '0 auto 1.25rem auto',
          }}
        >
          Know What’s in Your Food.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 2.25rem auto',
            lineHeight: 1.6,
          }}
        >
          Understand packaged-food ingredients, allergen risks, and nutrition thresholds matched against your personal profile using transparent rules and plain-language explanations.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '3rem',
          }}
        >
          <Link to="/signup" className="btn btn-primary btn-lg" style={{ gap: '0.625rem' }}>
            <span>Get Started</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/scan" className="btn btn-secondary btn-lg" style={{ gap: '0.625rem' }}>
            <Camera size={18} />
            <span>Try Barcode Scanner</span>
          </Link>
        </div>

        {/* Hero Visual Mockup */}
        <div
          style={{
            maxWidth: '880px',
            margin: '0 auto',
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              textAlign: 'left',
            }}
          >
            {/* Step 1 Preview Card */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-berry)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  1
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Personalize Profile</h4>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Select food allergies, lactose intolerance, diabetes status, or dietary preferences without disclosing sensitive medical history.
              </p>
            </div>

            {/* Step 2 Preview Card */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-berry)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  2
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Scan or Upload</h4>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Scan product barcodes via your live device camera, enter barcodes manually, or upload a food label photo for instant client-side OCR.
              </p>
            </div>

            {/* Step 3 Preview Card */}
            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-berry)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  3
                </div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Clear Verdicts</h4>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Deterministic rules categorize foods into <strong>Suitable</strong>, <strong>Caution</strong>, or <strong>Avoid</strong>, with transparent reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Picker Section */}
      <section className="app-container">
        <SampleProductPicker title="Try Ingredia: Verified Foods & Safety Scenarios" />
      </section>

      {/* Core Principles & Features Section */}
      <section className="app-container" style={{ padding: '2rem 0' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Built on Safety, Rules, and Transparency
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            We believe safety decisions should never be a black box. Ingredia follows a strict principle: <strong>Rules Decide. AI Explains.</strong>
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Feature 1 */}
          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldAlert size={22} color="var(--primary-berry)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Confirmed vs Trace Allergens
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A confirmed allergen in ingredients triggers an immediate <strong>Avoid</strong>. Trace and “may contain” statements trigger conservative cross-contact warnings.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Layers size={22} color="var(--primary-berry)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Nutrition Screening Thresholds
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Illustrative prototype thresholds screen sugars, sodium, and saturated fat per 100g. Missing values are never falsely assumed to be zero.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileText size={22} color="var(--primary-berry)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Client-Side Label OCR
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Upload any package label photo. Our integrated OCR scans the text, populates an editable review form, and lets you verify before analyzing.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card">
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <HeartHandshake size={22} color="var(--primary-berry)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Lactose vs Milk Allergy
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ingredia biologically distinguishes dairy protein immune allergies (life-threatening) from lactose enzyme intolerance (digestive discomfort).
            </p>
          </div>
        </div>
      </section>

      {/* Ready to scan banner */}
      <section className="app-container" style={{ paddingBottom: '3rem' }}>
        <div
          style={{
            background: 'var(--bg-blush)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.625rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Start Scanning Smarter Today
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
            Set your preferences in seconds and get instant clarity on packaged groceries.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">
              Create Your Free Profile
            </Link>
            <Link to="/scan" className="btn btn-secondary">
              Open Barcode Scanner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
