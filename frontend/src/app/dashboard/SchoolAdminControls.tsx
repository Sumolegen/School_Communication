import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/forms/FormField';
import { FileUploader } from '@/components/forms/FileUploader';
import { useAuth, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { schoolService } from '@/services/school.service';
import { AcademicYear } from '@/types';

export const SchoolAdminControls: React.FC = () => {
  const { school, setSchoolConfig } = useAuth();
  const { showToast } = useNotifications();

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [primaryColor, setPrimaryColor] = useState(school?.primaryColor ?? '#0F294A');
  const [accentColor, setAccentColor] = useState(school?.accentColor ?? '#D97706');
  const [contactPhone, setContactPhone] = useState(school?.contactPhone ?? '');
  const [broadcastOnly, setBroadcastOnly] = useState(school?.messagingBroadcastOnly ?? false);
  const [startHour, setStartHour] = useState<string>(
    school?.messagingStartHour !== null && school?.messagingStartHour !== undefined
      ? String(school.messagingStartHour)
      : '',
  );
  const [endHour, setEndHour] = useState<string>(
    school?.messagingEndHour !== null && school?.messagingEndHour !== undefined
      ? String(school.messagingEndHour)
      : '',
  );
  const [teacherCircularPerm, setTeacherCircularPerm] = useState(false);

  const loadSettings = async () => {
    try {
      const [yearList, overrides] = await Promise.all([
        schoolService.listAcademicYears(),
        schoolService.listSchoolOverrides(),
      ]);
      setYears(yearList);
      const circ = overrides.find(
        (o) => o.role.code === 'TEACHER' && o.permission.code === 'CIRCULAR_PUBLISH',
      );
      setTeacherCircularPerm(Boolean(circ?.granted));
    } catch {
      // Ignore silent load errors
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;
    try {
      const updated = await schoolService.updateSchool(school.id, {
        primaryColor,
        accentColor,
        contactPhone: contactPhone || undefined,
        messagingBroadcastOnly: broadcastOnly,
        messagingStartHour: startHour ? Number(startHour) : undefined,
        messagingEndHour: endHour ? Number(endHour) : undefined,
      });
      setSchoolConfig(updated);
      showToast('success', 'School branding & messaging controls updated.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await schoolService.createAcademicYear({ name: yearName, startDate, endDate, isCurrent: true });
      setYearName('');
      setStartDate('');
      setEndDate('');
      showToast('success', 'Academic year created and activated.');
      await loadSettings();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleToggleTeacherCircular = async () => {
    try {
      await schoolService.upsertPermissionOverride({
        roleCode: 'TEACHER',
        permissionCode: 'CIRCULAR_PUBLISH',
        granted: !teacherCircularPerm,
      });
      setTeacherCircularPerm(!teacherCircularPerm);
      showToast('success', 'Teacher circular publishing permission updated.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div className="grid-2" style={{ marginTop: 20 }}>
      <form className="card" onSubmit={handleSaveSchoolSettings}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Settings size={18} color="var(--brand-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.02rem', color: 'var(--brand-primary)' }}>
            White-Label Branding & Messaging Controls
          </h3>
        </div>
        <div className="grid-2">
          <FormField label="Primary Theme Color">
            <input className="input" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          </FormField>
          <FormField label="Accent Theme Color">
            <input className="input" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </FormField>
        </div>
        <FormField label="School Logo Upload">
          <FileUploader
            category="LOGO"
            accept="image/jpeg,image/png,image/webp"
            label="Upload School Logo"
            onUploaded={async (file) => {
              if (!school?.id) return;
              const updated = await schoolService.updateSchool(school.id, { logoUrl: file.publicUrl });
              setSchoolConfig(updated);
              showToast('success', 'School logo updated.');
            }}
          />
        </FormField>
        <FormField label="Office Contact Phone">
          <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </FormField>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <input
            id="broadcast-mode"
            type="checkbox"
            checked={broadcastOnly}
            onChange={(e) => setBroadcastOnly(e.target.checked)}
          />
          <label htmlFor="broadcast-mode" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            One-Way Broadcast Mode (disable parent replies)
          </label>
        </div>
        <div className="grid-2">
          <FormField label="Messaging Start Hour (0-23)">
            <input className="input" type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(e.target.value)} />
          </FormField>
          <FormField label="Messaging End Hour (0-23)">
            <input className="input" type="number" min={0} max={23} value={endHour} onChange={(e) => setEndHour(e.target.value)} />
          </FormField>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Button type="button" variant="outline" size="sm" onClick={handleToggleTeacherCircular}>
            Teacher Circulars: {teacherCircularPerm ? 'Allowed' : 'Restricted'}
          </Button>
          <Button type="submit" variant="accent">
            Save School Settings
          </Button>
        </div>
      </form>

      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: '1.02rem', color: 'var(--brand-primary)' }}>
          Academic Years
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {years.map((y) => (
            <div
              key={y.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--bg-muted)',
              }}
            >
              <div>
                <strong>{y.name}</strong>{' '}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ({y.startDate.slice(0, 10)} → {y.endDate.slice(0, 10)})
                </span>
              </div>
              {y.isCurrent ? (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success-text)' }}>ACTIVE</span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await schoolService.setCurrentAcademicYear(y.id);
                    await loadSettings();
                  }}
                >
                  Set Active
                </Button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleCreateYear}>
          <FormField label="New Academic Year Name" required>
            <input className="input" placeholder="e.g. 2027-2028" value={yearName} onChange={(e) => setYearName(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="Start Date" required>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </FormField>
            <FormField label="End Date" required>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </FormField>
          </div>
          <Button type="submit" variant="primary" size="sm">
            Add & Activate Year
          </Button>
        </form>
      </div>
    </div>
  );
};
