import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
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
import { ExamTermItem, ExamTermType } from '@/types';
import { formatDate, todayIsoDate } from '@/utils';

export const ExamsPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canManage = hasPermission('EXAM_MANAGE');

  const [terms, setTerms] = useState<ExamTermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [termType, setTermType] = useState<ExamTermType>('UNIT_TEST');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate());

  const loadTerms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTerms(await academicsService.listExamTerms());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTerms();
  }, [loadTerms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsService.createExamTerm({ name, termType, startDate, endDate });
      showToast('success', 'Exam term created.');
      setModalOpen(false);
      setName('');
      await loadTerms();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Examinations & Terms"
        subtitle="Manage Unit Test, Quarterly, Half-Yearly, and Annual exam terms"
        actions={
          canManage && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Exam Term
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTerms} />
      ) : (
        <DataTable
          rows={terms}
          rowKey={(t) => t.id}
          columns={[
            { key: 'name', header: 'Exam Term', render: (t) => <strong>{t.name}</strong> },
            { key: 'type', header: 'Term Type', render: (t) => <Badge variant="primary">{t.termType}</Badge> },
            { key: 'start', header: 'Start Date', render: (t) => formatDate(t.startDate) },
            { key: 'end', header: 'End Date', render: (t) => formatDate(t.endDate) },
          ]}
        />
      )}

      <Modal open={modalOpen} title="Add Exam Term" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <FormField label="Term Name" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quarterly Exam 2026" required />
          </FormField>
          <FormField label="Term Category" required>
            <select className="select" value={termType} onChange={(e) => setTermType(e.target.value as ExamTermType)}>
              <option value="UNIT_TEST">UNIT_TEST</option>
              <option value="QUARTERLY">QUARTERLY</option>
              <option value="HALF_YEARLY">HALF_YEARLY</option>
              <option value="ANNUAL">ANNUAL</option>
            </select>
          </FormField>
          <div className="grid-2">
            <FormField label="Start Date" required>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </FormField>
            <FormField label="End Date" required>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Create Exam Term
          </Button>
        </form>
      </Modal>
    </div>
  );
};
