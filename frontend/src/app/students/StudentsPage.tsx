import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { useAuth, useDebounce, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { ClassSection, SchoolClass, StudentRecord } from '@/types';

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentModal, setStudentModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [admissionNo, setAdmissionNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [parentFullName, setParentFullName] = useState('');
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('A');
  const [selectedClassId, setSelectedClassId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, secRes, clsRes] = await Promise.all([
        studentsService.listStudents({
          page,
          search: debouncedSearch || undefined,
          sectionId: sectionFilter || undefined,
        }),
        studentsService.listSections(),
        studentsService.listClasses(),
      ]);
      setStudents(stuRes.items);
      setTotalPages(stuRes.meta.totalPages);
      setSections(secRes);
      setClasses(clsRes);
      if (!sectionId && secRes[0]) setSectionId(secRes[0].id);
      if (!selectedClassId && clsRes[0]) setSelectedClassId(clsRes[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sectionFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentsService.createStudent({
        admissionNo,
        fullName,
        sectionId,
        rollNo: rollNo || undefined,
        guardianPhone: guardianPhone || undefined,
        parentFullName: parentFullName || undefined,
      });
      showToast('success', 'Student created and linked to parent.');
      setStudentModal(false);
      setAdmissionNo('');
      setFullName('');
      setRollNo('');
      setGuardianPhone('');
      setParentFullName('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleCreateClassSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let targetClassId = selectedClassId;
      if (className.trim()) {
        const created = await studentsService.createClass({ name: className.trim() });
        targetClassId = created.id;
      }
      if (targetClassId && sectionName.trim()) {
        await studentsService.createSection({ classId: targetClassId, name: sectionName.trim() });
      }
      showToast('success', 'Class & section saved.');
      setClassModal(false);
      setClassName('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Students & Classes"
        subtitle="Student directory, admission numbers, sections, and parent relationships"
        actions={
          isAdmin && (
            <>
              <Button variant="outline" onClick={() => setClassModal(true)}>
                <Plus size={16} /> Add Class / Section
              </Button>
              <Button variant="accent" onClick={() => setStudentModal(true)}>
                <Plus size={16} /> Add Student
              </Button>
            </>
          )
        }
      />

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by student name, admission #, or roll #..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="select"
          style={{ width: 'auto', minWidth: 200 }}
          value={sectionFilter}
          onChange={(e) => {
            setPage(1);
            setSectionFilter(e.target.value);
          }}
        >
          <option value="">All Assigned Sections</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.schoolClass?.name} - {sec.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <>
          <DataTable
            rows={students}
            rowKey={(s) => s.id}
            emptyTitle="No students found"
            columns={[
              { key: 'adm', header: 'Admission #', render: (s) => <strong>{s.admissionNo}</strong> },
              { key: 'name', header: 'Student Name', render: (s) => s.fullName },
              {
                key: 'class',
                header: 'Class & Section',
                render: (s) => `${s.section?.schoolClass?.name ?? ''} - ${s.section?.name ?? ''}`,
              },
              { key: 'roll', header: 'Roll #', render: (s) => s.rollNo ?? '—' },
              {
                key: 'parents',
                header: 'Parent Contact',
                render: (s) =>
                  s.parentLinks?.map((p) => `${p.parentUser.fullName} (${p.parentUser.phone})`).join(', ') ||
                  s.guardianPhone ||
                  '—',
              },
            ]}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal open={studentModal} title="Add Student & Link Parent" onClose={() => setStudentModal(false)}>
        <form onSubmit={handleCreateStudent}>
          <div className="grid-2">
            <FormField label="Admission Number" required>
              <input className="input" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} required />
            </FormField>
            <FormField label="Roll Number">
              <input className="input" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Student Full Name" required>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="Class & Section" required>
            <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.schoolClass?.name} - {sec.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid-2">
            <FormField label="Parent Full Name">
              <input className="input" value={parentFullName} onChange={(e) => setParentFullName(e.target.value)} />
            </FormField>
            <FormField label="Parent Registered Mobile">
              <input className="input" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Student
          </Button>
        </form>
      </Modal>

      <Modal open={classModal} title="Create Class / Section" onClose={() => setClassModal(false)}>
        <form onSubmit={handleCreateClassSection}>
          <FormField label="Select Existing Class">
            <select className="select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
              <option value="">-- Create a new class below --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Or New Class Name" hint="Leave empty if adding section to an existing class">
            <input className="input" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Grade 6" />
          </FormField>
          <FormField label="Section Name" required>
            <input className="input" value={sectionName} onChange={(e) => setSectionName(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="accent">
            Save Class & Section
          </Button>
        </form>
      </Modal>
    </div>
  );
};
