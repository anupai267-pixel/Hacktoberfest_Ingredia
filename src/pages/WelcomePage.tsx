
import React from 'react';
import { ShieldCheck, HeartHandshake } from 'lucide-react';
import './WelcomePage.css';

interface WelcomePageProps {
  onAccept: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onAccept,
}) => {
  return (
    <main className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-icon">
          <ShieldCheck size={38} strokeWidth={2} />
        </div>

        <h1>
          Welcome to <span>Ingredia</span>
        </h1>

        <p className="welcome-subtitle">
          Empowering women with personalized packaged food
          safety clarity.
        </p>

        <section className="medical-notice">
          <h2>
            <HeartHandshake size={24} />
            Medical Notice
          </h2>

          <p className="notice-bold">
            SHE Scan provides general nutritional guidance,
            not medical advice.
          </p>

          <p className="notice-description">
            Our deterministic rule engine compares label values
            with established nutrition benchmarks for conditions
            like PCOS, pregnancy, breastfeeding, diabetes, and
            allergies.
          </p>

          <p className="notice-footer">
            Always consult your physician, OB/GYN, or registered
            dietitian before making significant dietary
            modifications or consuming foods with severe
            allergic sensitivities.
          </p>
        </section>

        <button
          className="welcome-accept"
          onClick={onAccept}
        >
          I Understand &amp; Agree
        </button>
      </div>
    </main>
  );
};
