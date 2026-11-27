import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { DataTable } from '@/components/tables/DataTable';
import { useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { schoolService } from '@/services/school.service';
import { SchoolConfig, SubscriptionStatus } from '@/types';

interface Props {
  schools: SchoolConfig[];
  onRefresh: () => Promise<void>;
}

export const SuperAdminSchoolConsole: React.FC<Props> = ({ schools, onRefresh }) => {
  const { showToast } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [schoolCode, setSchoolCode] = useState('');
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0F294A');
  const [accentColor, setAccentColor] = useState('#D97706');
  const [contactPhone, setContactPhone] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schoolService.createSchool({
        schoolCode,
        name,
        primaryColor,
        accentColor,
        contactPhone: contactPhone || undefined,
        adminFullName: adminFullName || undefined,
        adminPhone: adminPhone || undefined,
        adminPassword: adminPassword || undefined,
      });
      showToast('success', 'School onboarded successfully.');
      setModalOpen(false);
      setSchoolCode('');
      setName('');
      setAdminFullName('');
      setAdminPhone('');
      await onRefresh();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubscriptionChange = async (school: SchoolConfig, status: SubscriptionStatus) => {
    if (!school.id) return;
    try {
      await schoolService.updateSchool(school.id, { subscriptionStatus: status });
      showToast('success', `${school.name} subscription updated to ${status}.`);
      await onRefresh();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--brand-primary)' }}>
          Multi-Tenant Schools & Subscriptions
        </h2>
        <Button variant="accent" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Onboard School
        </Button>
      </div>

      <DataTable
        rows={schools}
        rowKey={(s) => s.id ?? s.schoolCode ?? s.name}
        columns={[
          { key: 'code', header: 'Code', render: (s) => <strong>{s.schoolCode}</strong> },
          { key: 'name', header: 'School Name', render: (s) => s.name },
          {
            key: 'theme',
            header: 'Branding',
            render: (s) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: s.primaryColor, display: 'inline-block' }} />
                <span style={{ width: 14, height: 14, borderRadius: 4, background: s.accentColor, display: 'inline-block' }} />
              </div>
            ),
          },
          { key: 'students', header: 'Students', render: (s) => s._count?.students ?? 0 },
          { key: 'status', header: 'Subscription', render: (s) => <StatusPill status={s.subscriptionStatus} /> },
          {
            key: 'action',
            header: 'Update Status',
            render: (s) => (
              <select
                className="select"
                style={{ width: 'auto', padding: '5px 8px', fontSize: '0.82rem' }}
                value={s.subscriptionStatus}
                onChange={(e) => handleSubscriptionChange(s, e.target.value as SubscriptionStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} title="Onboard New School" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleOnboard}>
          <div className="grid-2">
            <FormField label="School Code" required>
              <input className="input" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} required />
            </FormField>
            <FormField label="School Name" required>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormField>
          </div>
          <div className="grid-2">
            <FormField label="Primary Color">
              <input className="input" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </FormField>
            <FormField label="Accent Color">
              <input className="input" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Office Phone">
            <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </FormField>
          <div className="grid-2">
            <FormField label="Initial School Admin Name">
              <input className="input" value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} />
            </FormField>
            <FormField label="Admin Mobile Number">
              <input className="input" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Initial Admin Password">
            <input className="input" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
          </FormField>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving ? 'Onboarding...' : 'Create School'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
