import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          {/* Badge */}
          <div style={styles.badge}>
            <span style={{ fontSize: '14px' }}>🏪</span>
            <span style={styles.badgeText}>Souvenir Shop Management</span>
          </div>

          <h1 style={styles.heroTitle}>
            Manage your store with <span style={styles.highlight}>confidence</span>
          </h1>

          <p style={styles.heroSubtitle}>
            A powerful dashboard to manage products, track orders, and grow your souvenir business.
          </p>

          {/* Features */}
          <div style={styles.features}>
            {[
              { icon: '⚡', title: 'Real-time Updates', desc: 'Products sync instantly to buyer app' },
              { icon: '📊', title: 'Order Tracking', desc: 'Monitor all orders in one place' },
              { icon: '🔔', title: 'Smart Notifications', desc: 'Get notified on every new order' },
            ].map((f) => (
              <div key={f.title} style={styles.featureItem}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <div>
                  <p style={styles.featureTitle}>{f.title}</p>
                  <p style={styles.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div style={styles.leftDecoration}>
          <div style={styles.decorCircle1} />
          <div style={styles.decorCircle2} />
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.loginCard}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div style={styles.cardLogo}>
              <span style={{ fontSize: '24px' }}>🏪</span>
            </div>
            <h2 style={styles.cardTitle}>Welcome back</h2>
            <p style={styles.cardSubtitle}>Sign in to your seller account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputPrefix}>📧</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
              </div>
              <div style={styles.inputWrapper}>
                <span style={styles.inputPrefix}>🔒</span>
                <input
                  style={styles.input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <span>Sign In →</span>
              )}
            </button>
          </form>

          <p style={styles.footerText}>
            For sellers only. Contact admin for access.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #3D2314 0%, #5C4033 50%, #7D5A4F 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '440px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '100px',
    marginBottom: '32px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: '800',
    color: '#fff',
    lineHeight: '1.2',
    margin: '0 0 20px 0',
    letterSpacing: '-1px',
  },
  highlight: {
    color: '#F5C87A',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.7',
    margin: '0 0 40px 0',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  featureIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 2px 0',
  },
  featureDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  leftDecoration: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
  decorCircle1: {
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'absolute',
    bottom: '-100px',
    right: '-100px',
  },
  decorCircle2: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'absolute',
    bottom: '-50px',
    right: '50px',
  },
  rightPanel: {
    width: '480px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    backgroundColor: '#F8F9FA',
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
    border: '1px solid #F1F5F9',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  cardLogo: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#FDF6F0',
    border: '1px solid #F0E0D6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 16px auto',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1A2E',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFF5F5',
    border: '1px solid #FED7D7',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: '#E53E3E',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #E5E7EB',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  inputPrefix: {
    padding: '0 12px',
    fontSize: '16px',
  },
  input: {
    flex: 1,
    padding: '13px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1A1A2E',
    backgroundColor: 'transparent',
  },
  showPasswordBtn: {
    padding: '0 12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '16px',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #5C4033, #7D5A4F)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    letterSpacing: '0.3px',
    boxShadow: '0 4px 14px rgba(92, 64, 51, 0.3)',
  },
  submitButtonDisabled: {
    background: '#CBD5E0',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '20px',
  },
};