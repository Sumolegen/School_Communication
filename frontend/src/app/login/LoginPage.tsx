import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/forms/FormField';
import { ROUTES, UI_STRINGS } from '@/constants';
import { useAuth, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { authService } from '@/services/auth.service';
import { schoolService } from '@/services/school.service';
import { applySchoolTheme } from '@/utils';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loginWithPin, verifyOtp } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'PIN' | 'OTP'>('PIN');
  const [schoolCode, setSchoolCode] = useState('DEMO01');
  const [phone, setPhone] = useState('');
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [schoolPreview, setSchoolPreview] = useState<{ name: string; logoUrl?: string | null }>({
    name: UI_STRINGS.en.appName,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const loadSchoolBranding = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      applySchoolTheme('#0F294A', '#D97706');
      setSchoolPreview({ name: UI_STRINGS.en.appName });
      return;
    }
    try {
      const cfg = await schoolService.getPublicConfig(trimmed);
      setSchoolPreview({ name: cfg.name, logoUrl: cfg.logoUrl });
      applySchoolTheme(cfg.primaryColor, cfg.accentColor);
    } catch {
      // Keep default branding if code not yet complete
    }
  };

  useEffect(() => {
    void loadSchoolBranding(schoolCode);
  }, [schoolCode]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPin({
        schoolCode: schoolCode.trim() || undefined,
        phone: phone.trim(),
        pinOrPassword,
      });
      showToast('success', 'Signed in successfully.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to sign in. Verify your school code, mobile number, and PIN.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await authService.requestOtp({
        schoolCode: schoolCode.trim() || undefined,
        phone: phone.trim(),
      });
      setOtpSent(true);
      setDevOtpHint(res.devOtp ?? null);
      showToast('info', res.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not request OTP.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp({
        schoolCode: schoolCode.trim() || undefined,
        phone: phone.trim(),
        otp: otp.trim(),
      });
      showToast('success', 'OTP verified. Welcome!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'OTP verification failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, #1e3a5f 60%, var(--bg-page) 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 28, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <img
            src={schoolPreview.logoUrl || '/default-school-logo.svg'}
            alt={schoolPreview.name}
            style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--brand-primary)' }}>{schoolPreview.name}</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{UI_STRINGS.en.tagline}</div>
          </div>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {UI_STRINGS.en.loginSubtitle}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            className={`btn ${mode === 'PIN' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('PIN');
              setError(null);
            }}
          >
            <KeyRound size={16} /> School Code + PIN
          </button>
          <button
            type="button"
            className={`btn ${mode === 'OTP' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setMode('OTP');
              setError(null);
            }}
          >
            <Smartphone size={16} /> Mobile OTP
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={mode === 'PIN' ? handlePinSubmit : handleVerifyOtp}>
          <FormField
            label="School Code"
            hint="Leave blank only for Platform Super Admin login"
          >
            <input
              className="input"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEMO01"
            />
          </FormField>

          <FormField label="Registered Mobile Number" required>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              required
            />
          </FormField>

          {mode === 'PIN' ? (
            <>
              <FormField label="PIN / Password" required>
                <input
                  className="input"
                  type="password"
                  value={pinOrPassword}
                  onChange={(e) => setPinOrPassword(e.target.value)}
                  placeholder="Enter your PIN or password"
                  required
                />
              </FormField>
              <Button type="submit" variant="accent" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </>
          ) : (
            <>
              {!otpSent ? (
                <Button
                  type="button"
                  variant="accent"
                  style={{ width: '100%' }}
                  disabled={submitting || !phone.trim()}
                  onClick={handleRequestOtp}
                >
                  {submitting ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              ) : (
                <>
                  {devOtpHint && (
                    <div
                      style={{
                        background: 'var(--info-bg)',
                        color: 'var(--info-text)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.84rem',
                        marginBottom: 12,
                      }}
                    >
                      Development OTP Preview: <strong>{devOtpHint}</strong>
                    </div>
                  )}
                  <FormField label="Enter 6-Digit OTP" required>
                    <input
                      className="input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      required
                    />
                  </FormField>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="button" variant="outline" onClick={handleRequestOtp} disabled={submitting}>
                      Resend
                    </Button>
                    <Button type="submit" variant="accent" style={{ flex: 1 }} disabled={submitting}>
                      {submitting ? 'Verifying...' : 'Verify & Sign In'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </form>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={15} color="var(--brand-accent)" />
          <span>Only School-Admin pre-registered numbers can sign in.</span>
        </div>
      </div>
    </div>
  );
};
