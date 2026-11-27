import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { Pagination } from '@/components/tables/Pagination';
import { useAuth, useDebounce, useNotifications } from '@/hooks';
import { apiClient, getApiErrorMessage } from '@/services/api';
import { studentsService } from '@/services/students.service';
import { ClassSection, SchoolClass, StudentRecord } from '@/types';

interface ParentDirectoryOption {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
}

type ParentLinkEntry = NonNullable<StudentRecord['parentLinks']>[number] & {
  updatedAt?: string;
  createdAt?: string;
};

function getActiveParentLink(student: StudentRecord): ParentLinkEntry | null {
  const links = (student.parentLinks ?? []) as ParentLinkEntry[];
  if (links.length === 0) return null;

  const cleanGuardian = student.guardianPhone?.replace(/[\s\-+]/g, '');
  if (cleanGuardian) {
    const matched = links.find((p) => p.parentUser.phone.replace(/[\s\-+]/g, '') === cleanGuardian);
    if (matched) return matched;
  }

  return [...links].sort((a, b) =>
    (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? ''),
  )[0];
}

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [registeredParents, setRegisteredParents] = useState<ParentDirectoryOption[]>([]);
  const [sectionFilter, setSectionFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentModal, setStudentModal] = useState(false);
  const [classModal, setClassModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [admissionNo, setAdmissionNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [parentFullName, setParentFullName] = useState('');
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('A');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [editFullName, setEditFullName] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState<'FATHER' | 'MOTHER' | 'GUARDIAN'>('GUARDIAN');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, secRes, clsRes, parentList] = await Promise.all([
        studentsService.listStudents({
          page,
          search: debouncedSearch || undefined,
          sectionId: sectionFilter || undefined,
        }),
        studentsService.listSections(),
        studentsService.listClasses(),
        isAdmin ? studentsService.listParents().catch(() => []) : Promise.resolve([]),
      ]);
      setStudents(stuRes.items.filter((s) => s.isActive !== false));
      setTotalPages(stuRes.meta.totalPages);
      setSections(secRes);
      setClasses(clsRes);
      setRegisteredParents(parentList);
      if (!sectionId && secRes[0]) setSectionId(secRes[0].id);
      if (!selectedClassId && clsRes[0]) setSelectedClassId(clsRes[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sectionFilter, isAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedParentName = parentFullName.trim();
    const trimmedPhone = guardianPhone.trim();

    if (!trimmedParentName || !trimmedPhone) {
      showToast('error', 'Please enter both Parent Full Name and Parent Mobile Number.');
      return;
    }

    try {
      await studentsService.createStudent({
        admissionNo,
        fullName,
        sectionId,
        rollNo: rollNo || undefined,
        guardianPhone: trimmedPhone,
        parentFullName: trimmedParentName,
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

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const trimmedParentName = editParentName.trim();
    const trimmedParentPhone = editParentPhone.trim();

    if ((trimmedParentName && !trimmedParentPhone) || (!trimmedParentName && trimmedParentPhone)) {
      showToast('error', 'Please enter both Parent Full Name and Parent Mobile Number.');
      return;
    }

    try {
      await apiClient.patch(`/students/profiles/${editingStudent.id}`, {
        fullName: editFullName.trim(),
        sectionId: editSectionId,
        rollNo: editRollNo.trim() || undefined,
        ...(trimmedParentPhone ? { guardianPhone: trimmedParentPhone } : {}),
      });

      if (trimmedParentName && trimmedParentPhone) {
        await studentsService.linkParent(editingStudent.id, {
          parentFullName: trimmedParentName,
          parentPhone: trimmedParentPhone,
          relationship: editRelationship,
        });
      }

      showToast('success', `Updated ${editFullName.trim()} successfully.`);
      setEditingStudent(null);
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeletingBusy(true);
    try {
      await apiClient.patch(`/students/profiles/${deletingStudent.id}`, { isActive: false });
      showToast('success', `Removed ${deletingStudent.fullName} from active students.`);
      setDeletingStudent(null);
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setDeletingBusy(false);
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
                key: 'parentName',
                header: 'Parent Name',
                render: (s) => getActiveParentLink(s)?.parentUser.fullName || '—',
              },
              {
                key: 'parentContact',
                header: 'Parent Contact',
                render: (s) => getActiveParentLink(s)?.parentUser.phone || s.guardianPhone || '—',
              },
              ...(isAdmin
                ? [
                    {
                      key: 'actions',
                      header: 'Actions',
                      render: (s: StudentRecord) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            style={{ padding: '6px 9px' }}
                            title="Edit student & parent"
                            aria-label={`Edit ${s.fullName}`}
                            onClick={() => {
                              const activeLink = getActiveParentLink(s);
                              const existingParent = activeLink?.parentUser;
                              const rel = activeLink?.relationship;
                              setEditingStudent(s);
                              setEditFullName(s.fullName);
                              setEditSectionId(s.sectionId);
                              setEditRollNo(s.rollNo ?? '');
                              setEditParentName(existingParent?.fullName ?? '');
                              setEditParentPhone(existingParent?.phone ?? s.guardianPhone ?? '');
                              setEditRelationship(
                                rel === 'FATHER' || rel === 'MOTHER' || rel === 'GUARDIAN' ? rel : 'GUARDIAN',
                              );
                            }}
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            style={{ padding: '6px 9px' }}
                            title="Delete student"
                            aria-label={`Delete ${s.fullName}`}
                            onClick={() => setDeletingStudent(s)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      ),
                    },
                  ]
                : []),
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
          {registeredParents.length > 0 && (
            <FormField label="Quick Pick Existing Parent (optional)" hint="Select an already-registered parent or enter new details below">
              <select
                className="select"
                value=""
                onChange={(e) => {
                  const chosen = registeredParents.find((p) => p.id === e.target.value);
                  if (chosen) {
                    setParentFullName(chosen.fullName);
                    setGuardianPhone(chosen.phone);
                  }
                }}
              >
                <option value="">-- Choose registered parent --</option>
                {registeredParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <div className="grid-2">
            <FormField label="Parent Full Name" required>
              <input className="input" value={parentFullName} onChange={(e) => setParentFullName(e.target.value)} required />
            </FormField>
            <FormField label="Parent Registered Mobile" required hint="10-to-15 digits (default login PIN: 1234)">
              <input className="input" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} required />
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Student
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingStudent)}
        title={`Edit Student — ${editingStudent?.fullName ?? ''}`}
        onClose={() => setEditingStudent(null)}
      >
        <form onSubmit={handleEditStudent}>
          <div className="grid-2">
            <FormField label="Student Full Name" required>
              <input className="input" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
            </FormField>
            <FormField label="Roll Number">
              <input className="input" value={editRollNo} onChange={(e) => setEditRollNo(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Class & Section" required>
            <select className="select" value={editSectionId} onChange={(e) => setEditSectionId(e.target.value)} required>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.schoolClass?.name} - {sec.name}
                </option>
              ))}
            </select>
          </FormField>
          {registeredParents.length > 0 && (
            <FormField label="Select Existing Registered Parent (optional)">
              <select
                className="select"
                value=""
                onChange={(e) => {
                  const chosen = registeredParents.find((p) => p.id === e.target.value);
                  if (chosen) {
                    setEditParentName(chosen.fullName);
                    setEditParentPhone(chosen.phone);
                  }
                }}
              >
                <option value="">-- Choose registered parent --</option>
                {registeredParents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <div className="grid-3">
            <FormField label="Parent Full Name">
              <input className="input" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} />
            </FormField>
            <FormField label="Parent Mobile Number">
              <input className="input" value={editParentPhone} onChange={(e) => setEditParentPhone(e.target.value)} />
            </FormField>
            <FormField label="Relationship">
              <select
                className="select"
                value={editRelationship}
                onChange={(e) => setEditRelationship(e.target.value as 'FATHER' | 'MOTHER' | 'GUARDIAN')}
              >
                <option value="FATHER">FATHER</option>
                <option value="MOTHER">MOTHER</option>
                <option value="GUARDIAN">GUARDIAN</option>
              </select>
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Changes
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        title="Delete Student"
        message={`Are you sure you want to remove ${deletingStudent?.fullName ?? 'this student'} (${deletingStudent?.admissionNo ?? ''}) from active students?`}
        confirmLabel="Delete"
        busy={deletingBusy}
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeletingStudent(null)}
      />

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
