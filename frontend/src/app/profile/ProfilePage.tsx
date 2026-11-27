import React, { useState } from 'react';
import { Phone, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { FormField } from '@/components/forms/FormField';
import { PageHeader } from '@/components/navigation/PageHeader';
import { ROLE_LABELS } from '@/constants';
import { useAuth, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { authService } from '@/services/auth.service';

export const ProfilePage: React.FC = () => {
  const { user, school, students, activeStudent, setActiveStudentId, refreshSession } = useAuth();
  const { showToast } = useNotifications();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateOwnProfile({
        fullName,
        email: email || undefined,
        newPinOrPassword: newPin || undefined,
      });
      setNewPin('');
      await refreshSession();
      showToast('success', 'Profile updated successfully.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletionRequest = async () => {
    try {
      await authService.requestDeletion();
      showToast('info', 'Account deletion request submitted to your School Administrator.');
      setConfirmDeleteOpen(false);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Profile & School Information" subtitle="Manage your account details, PIN, and linked students" />

      <div className="grid-2">
        <form className="card" onSubmit={handleSave}>
          <h3 style={{ margin: '0 0 14px', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} /> Account Profile
          </h3>
          <FormField label="Role">
            <input className="input" value={user ? ROLE_LABELS[user.role] : ''} disabled />
          </FormField>
          <FormField label="Registered Mobile">
            <input className="input" value={user?.phone ?? ''} disabled />
          </FormField>
          <FormField label="Full Name" required>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Change PIN / Password (optional)">
            <input
              className="input"
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Leave blank to keep current PIN/password"
            />
          </FormField>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving ? 'Saving...' : 'Update Profile'}
          </Button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {school && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={18} /> School Contact Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
                <div><strong>School:</strong> {school.name} ({school.schoolCode})</div>
                <div><strong>Phone:</strong> {school.contactPhone ?? '—'}</div>
                <div><strong>Email:</strong> {school.contactEmail ?? '—'}</div>
                <div><strong>Address:</strong> {school.address ?? '—'}</div>
              </div>
            </div>
          )}

          {students.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', color: 'var(--brand-primary)' }}>Linked Children</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {students.map((stu) => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => setActiveStudentId(stu.id)}
                    className="btn btn-outline"
                    style={{
                      justifyContent: 'space-between',
                      borderColor: activeStudent?.id === stu.id ? 'var(--brand-accent)' : 'var(--border-color)',
                      background: activeStudent?.id === stu.id ? 'var(--brand-accent-soft)' : 'var(--bg-surface)',
                    }}
                  >
                    <span>
                      <strong>{stu.fullName}</strong> ({stu.section?.schoolClass?.name} {stu.section?.name})
                    </span>
                    <span style={{ fontSize: '0.78rem' }}>{activeStudent?.id === stu.id ? 'Active' : 'Switch'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ margin: '0 0 8px', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} /> Data & Account Deletion
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Submit an account deletion request to your school administrator if you wish to deactivate your record.
            </p>
            <Button variant="danger" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
              Request Account Deletion
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Confirm Deletion Request"
        message="This will submit an account deletion request to your school administrator. Continue?"
        confirmLabel="Submit Request"
        onConfirm={handleDeletionRequest}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};
