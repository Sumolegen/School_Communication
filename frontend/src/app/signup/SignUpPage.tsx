import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, GraduationCap, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/forms/FormField';
import { ROUTES, UI_STRINGS } from '@/constants';
import { useAuth, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { schoolService } from '@/services/school.service';
import { RoleCode } from '@/types';
import { applySchoolTheme } from '@/utils';

export const SignUpPage: React.FC = () => {
  const { isAuthenticated, signupUser, signupSchool } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [signupType, setSignupType] = useState<'MEMBER' | 'SCHOOL'>('MEMBER');

  // Member fields
  const [schoolCode, setSchoolCode] = useState('DEMO01');
  const [roleCode, setRoleCode] = useState<RoleCode>('PARENT');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // School fields
  const [schoolName, setSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');

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
      // Keep fallback
    }
  };

  useEffect(() => {
    if (signupType === 'MEMBER') {
      void loadSchoolBranding(schoolCode);
    } else {
      applySchoolTheme('#0F294A', '#D97706');
      setSchoolPreview({ name: schoolName.trim() || UI_STRINGS.en.appName });
    }
  }, [schoolCode, signupType, schoolName]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pinOrPassword !== confirmPin) {
      setError('PIN / Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signupUser({
        schoolCode: schoolCode.trim().toUpperCase(),
        roleCode,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        pinOrPassword,
      });
      showToast('success', 'Account created successfully! Welcome to your school portal.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create account. Please check the details.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (adminPassword !== confirmAdminPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signupSchool({
        schoolName: schoolName.trim(),
        schoolCode: newSchoolCode.trim().toUpperCase(),
        adminFullName: adminFullName.trim(),
        adminPhone: adminPhone.trim(),
        adminEmail: adminEmail.trim() || undefined,
        adminPassword,
      });
      showToast('success', 'School registered successfully! Welcome Admin.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to register school. Please check the details.'));
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
        padding: '30px 20px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <img
            src={schoolPreview.logoUrl || '/default-school-logo.svg'}
            alt={schoolPreview.name}
            style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--brand-primary)' }}>
              {signupType === 'MEMBER' ? schoolPreview.name : (schoolName || 'Register New School')}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Create your account to get started</div>
          </div>
        </div>

        {/* Toggle between Member Signup vs School Admin Registration */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${signupType === 'MEMBER' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => {
              setSignupType('MEMBER');
              setError(null);
            }}
          >
            <Users size={16} /> Join School (Member)
          </button>
          <button
            type="button"
            className={`btn ${signupType === 'SCHOOL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, fontSize: '0.86rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => {
              setSignupType('SCHOOL');
              setError(null);
            }}
          >
            <Building2 size={16} /> Register School
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {signupType === 'MEMBER' ? (
          <form onSubmit={handleMemberSubmit}>
            <FormField label="School Code" required hint="Enter the code provided by your school (e.g. DEMO01)">
              <input
                className="input"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                placeholder="e.g. DEMO01"
                required
              />
            </FormField>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                I am registering as *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { code: 'PARENT' as RoleCode, label: 'Parent / Guardian', icon: Users },
                  { code: 'STUDENT' as RoleCode, label: 'Student', icon: GraduationCap },
                  { code: 'TEACHER' as RoleCode, label: 'Teacher', icon: UserCheck },
                ].map(({ code, label, icon: Icon }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setRoleCode(code)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      fontSize: '0.82rem',
                      borderRadius: 'var(--radius-sm)',
                      border: roleCode === code ? '2px solid var(--brand-accent)' : '1px solid var(--border-color)',
                      background: roleCode === code ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                      color: roleCode === code ? 'var(--brand-accent)' : 'var(--text-primary)',
                      fontWeight: roleCode === code ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <FormField label="Full Name" required>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </FormField>

            <FormField label="Mobile Number" required hint="Used for login and notifications">
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />
            </FormField>

            <FormField label="Email (Optional)">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="PIN / Password" required>
                <input
                  className="input"
                  type="password"
                  value={pinOrPassword}
                  onChange={(e) => setPinOrPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  required
                />
              </FormField>

              <FormField label="Confirm PIN" required>
                <input
                  className="input"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Re-enter PIN"
                  required
                />
              </FormField>
            </div>

            <Button type="submit" variant="accent" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
              <UserPlus size={16} />
              {submitting ? 'Creating account...' : 'Create Account & Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSchoolSubmit}>
            <FormField label="School Name" required>
              <input
                className="input"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Oakridge International School"
                required
              />
            </FormField>

            <FormField label="Desired School Code" required hint="Unique code for staff & parents to log in (e.g. OAKRIDGE01)">
              <input
                className="input"
                value={newSchoolCode}
                onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                placeholder="e.g. OAKRIDGE01"
                required
              />
            </FormField>

            <FormField label="Admin Full Name" required>
              <input
                className="input"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Kumar"
                required
              />
            </FormField>

            <FormField label="Admin Mobile Number" required hint="10-digit mobile number for Admin login">
              <input
                className="input"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />
            </FormField>

            <FormField label="Admin Email (Optional)">
              <input
                className="input"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@school.edu"
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Admin Password" required>
                <input
                  className="input"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  required
                />
              </FormField>

              <FormField label="Confirm Password" required>
                <input
                  className="input"
                  type="password"
                  value={confirmAdminPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </FormField>
            </div>

            <Button type="submit" variant="accent" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
              <Building2 size={16} />
              {submitting ? 'Registering School...' : 'Register School & Sign In'}
            </Button>
          </form>
        )}

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.86rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account?</span>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Sign In
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} color="var(--brand-accent)" />
          <span>Accounts are secured with multi-tenant isolation and encrypted credentials.</span>
        </div>
      </div>
    </div>
  );
};
