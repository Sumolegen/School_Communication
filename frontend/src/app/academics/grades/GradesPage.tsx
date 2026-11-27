import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { useNotifications } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { GradeScaleItem } from '@/types';

export const GradesPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [scales, setScales] = useState<GradeScaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [gradeLabel, setGradeLabel] = useState('');
  const [minPercentage, setMinPercentage] = useState(0);
  const [maxPercentage, setMaxPercentage] = useState(100);
  const [remarks, setRemarks] = useState('');

  const loadScales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScales(await academicsService.listGradeScales());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScales();
  }, [loadScales]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicsService.saveGradeScale({ gradeLabel, minPercentage, maxPercentage, remarks: remarks || undefined });
      showToast('success', 'Grade scale saved.');
      setModalOpen(false);
      setGradeLabel('');
      await loadScales();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Grade Scales"
        subtitle="Configure school-wide percentage-to-grade rules"
        actions={
          <Button variant="accent" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add / Update Grade
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadScales} />
      ) : (
        <DataTable
          rows={scales}
          rowKey={(g) => g.id}
          columns={[
            { key: 'label', header: 'Grade', render: (g) => <strong>{g.gradeLabel}</strong> },
            { key: 'min', header: 'Min %', render: (g) => `${g.minPercentage}%` },
            { key: 'max', header: 'Max %', render: (g) => `${g.maxPercentage}%` },
            { key: 'remarks', header: 'Description', render: (g) => g.remarks ?? '—' },
          ]}
        />
      )}

      <Modal open={modalOpen} title="Add / Update Grade Scale" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <FormField label="Grade Label" required>
            <input className="input" value={gradeLabel} onChange={(e) => setGradeLabel(e.target.value)} placeholder="e.g. A+" required />
          </FormField>
          <div className="grid-2">
            <FormField label="Min Percentage" required>
              <input className="input" type="number" step="0.01" value={minPercentage} onChange={(e) => setMinPercentage(Number(e.target.value))} required />
            </FormField>
            <FormField label="Max Percentage" required>
              <input className="input" type="number" step="0.01" value={maxPercentage} onChange={(e) => setMaxPercentage(Number(e.target.value))} required />
            </FormField>
          </div>
          <FormField label="Remarks">
            <input className="input" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </FormField>
          <Button type="submit" variant="accent">
            Save Grade Rule
          </Button>
        </form>
      </Modal>
    </div>
  );
};
