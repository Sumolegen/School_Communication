import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { SubjectItem } from '@/types';

export const SubjectsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canManage = hasPermission('SUBJECT_MANAGE');

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubjects(await academicsService.listSubjects());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsService.createSubject({ name, code });
      showToast('success', 'Subject created.');
      setModalOpen(false);
      setName('');
      setCode('');
      await loadSubjects();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage curriculum subjects across your school"
        actions={
          canManage && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Subject
            </Button>
          )
        }
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSubjects} />
      ) : (
        <DataTable
          rows={subjects}
          rowKey={(s) => s.id}
          columns={[
            { key: 'code', header: 'Code', render: (s) => <strong>{s.code}</strong> },
            { key: 'name', header: 'Subject Name', render: (s) => s.name },
            { key: 'status', header: 'Status', render: (s) => <StatusPill status={s.isActive ? 'ACTIVE' : 'SUSPENDED'} /> },
          ]}
        />
      )}

      <Modal open={modalOpen} title="Add Subject" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <FormField label="Subject Name" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Subject Code" required>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. MATH" required />
          </FormField>
          <Button type="submit" variant="accent">
            Create Subject
          </Button>
        </form>
      </Modal>
    </div>
  );
};
