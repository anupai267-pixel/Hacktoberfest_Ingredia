import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup, switchToDemoMode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please acknowledge the food safety disclaimer to create your account.');
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/onboarding');
    } else {
      setErrorMessage(result.error || 'Failed to create account. Please try again.');
    }
  };

  const handleDemoMode = () => {
    switchToDemoMode();
    navigate('/onboarding');
  };

  return (
    <div className="app-container-narrow" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="card" style={{ maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img src="/ingredia-icon.svg" alt="Ingredia" style={{ width: 44, height: 44, marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Start screening packaged foods with personalized safety rules.
          </p>
        </div>

        {errorMessage && (
          <div className="alert-banner alert-banner-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password (minimum 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Informed Consent Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', margin: '1rem 0 1.25rem 0' }}>
            <input
              id="terms-check"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ marginTop: '0.2rem', accentColor: 'var(--primary-berry)', cursor: 'pointer' }}
            />
            <label htmlFor="terms-check" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
              I understand that Ingredia provides informational packaged-food screening and is not a substitute for professional medical or allergist advice.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', height: '2.75rem' }}
          >
            <UserPlus size={18} />
            <span>{isLoading ? 'Creating Account...' : 'Continue to Profile Setup'}</span>
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Demo Mode Button */}
        <button
          type="button"
          onClick={handleDemoMode}
          className="btn btn-secondary"
          style={{ width: '100%', height: '2.75rem', gap: '0.5rem' }}
        >
          <Sparkles size={16} color="var(--primary-berry)" />
          <span>Explore with Local Demo Account</span>
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
