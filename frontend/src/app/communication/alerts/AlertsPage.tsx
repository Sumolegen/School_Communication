import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { studentsService } from '@/services/students.service';
import { AnnouncementItem, ClassSection, TargetScope } from '@/types';
import { formatDateTime } from '@/utils';

export const AlertsPage: React.FC = () => {
  const { user, activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();

  const [alerts, setAlerts] = useState<AnnouncementItem[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetScope, setTargetScope] = useState<TargetScope>(
    user?.role === 'TEACHER' ? 'CLASS_SECTION' : 'ENTIRE_SCHOOL',
  );
  const [sectionIds, setSectionIds] = useState<string[]>([]);

  const canPublish = hasPermission('ALERT_PUBLISH');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, secRes] = await Promise.all([
        communicationService.listAlerts({ studentId: activeStudent?.id }),
        studentsService.listSections().catch(() => []),
      ]);
      setAlerts(res.items);
      setSections(secRes);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communicationService.createAlert({
        title,
        body,
        priority: 'URGENT',
        targetScope,
        sectionIds: targetScope === 'CLASS_SECTION' ? sectionIds : undefined,
      });
      showToast('success', 'Urgent school alert dispatched.');
      setModalOpen(false);
      setTitle('');
      setBody('');
      setSectionIds([]);
      await loadAlerts();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="School Alerts"
        subtitle="Emergency notices, sudden holiday alerts, bus delays, and urgent updates"
        actions={
          canPublish && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Send Urgent Alert
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlerts} />
      ) : alerts.length === 0 ? (
        <EmptyState title="No urgent alerts" description="Emergency and priority school alerts will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="card" style={{ borderLeft: '4px solid #dc2626', background: '#fffafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <strong style={{ color: '#991b1b', fontSize: '1.05rem' }}>{alert.title}</strong>
                </div>
                <StatusPill status={alert.priority} />
              </div>
              <p style={{ margin: '10px 0 6px', color: 'var(--text-primary)' }}>{alert.body}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sent by {alert.createdBy?.fullName ?? 'School Admin'} • {formatDateTime(alert.publishedAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Dispatch Urgent School Alert" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSendAlert}>
          <FormField label="Alert Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rain Holiday Declared Today" required />
          </FormField>
          <FormField label="Alert Message" required>
            <textarea className="textarea" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
          </FormField>
          <FormField label="Delivery Target">
            <select className="select" value={targetScope} onChange={(e) => setTargetScope(e.target.value as TargetScope)}>
              {user?.role !== 'TEACHER' && <option value="ENTIRE_SCHOOL">Entire School</option>}
              <option value="CLASS_SECTION">Specific Classes</option>
            </select>
          </FormField>
          {targetScope === 'CLASS_SECTION' && (
            <FormField label="Select Sections">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {sections.map((sec) => (
                  <label key={sec.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.86rem' }}>
                    <input
                      type="checkbox"
                      checked={sectionIds.includes(sec.id)}
                      onChange={(e) =>
                        setSectionIds((prev) =>
                          e.target.checked ? [...prev, sec.id] : prev.filter((id) => id !== sec.id),
                        )
                      }
                    />
                    {sec.schoolClass?.name} {sec.name}
                  </label>
                ))}
              </div>
            </FormField>
          )}
          <Button type="submit" variant="danger">
            Broadcast Urgent Alert
          </Button>
        </form>
      </Modal>
    </div>
  );
};
