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
import { useAuth, useNotifications } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { staffService } from '@/services/staff.service';
import { studentsService } from '@/services/students.service';
import { ClassSection, StaffMember, SubjectItem } from '@/types';

export const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staffModal, setStaffModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [designation, setDesignation] = useState('Subject Teacher');
  const [qualification, setQualification] = useState('');

  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, secRes, subjRes] = await Promise.all([
        staffService.listStaff(),
        studentsService.listSections(),
        academicsService.listSubjects(),
      ]);
      setStaffList(staffRes.items);
      setSections(secRes);
      setSubjects(subjRes);
      if (!assignStaffId && staffRes.items[0]) setAssignStaffId(staffRes.items[0].id);
      if (!assignSectionId && secRes[0]) setAssignSectionId(secRes[0].id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffService.createStaff({
        fullName,
        phone,
        employeeCode,
        designation,
        qualification: qualification || undefined,
        isTeacher: true,
      });
      showToast('success', 'Teacher added and pre-registered.');
      setStaffModal(false);
      setFullName('');
      setPhone('');
      setEmployeeCode('');
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffService.createAssignment({
        staffId: assignStaffId,
        sectionId: assignSectionId,
        subjectId: assignSubjectId || undefined,
        isClassTeacher,
      });
      showToast('success', 'Class/subject assigned to teacher.');
      setAssignModal(false);
      await loadData();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff & Teacher Assignments"
        subtitle="Faculty directory, subject allocations, and class teacher assignments"
        actions={
          isAdmin && (
            <>
              <Button variant="outline" onClick={() => setAssignModal(true)}>
                <Plus size={16} /> Assign Class / Subject
              </Button>
              <Button variant="accent" onClick={() => setStaffModal(true)}>
                <Plus size={16} /> Add Teacher
              </Button>
            </>
          )
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          rows={staffList}
          rowKey={(s) => s.id}
          emptyTitle="No staff members found"
          columns={[
            { key: 'code', header: 'Code', render: (s) => <strong>{s.employeeCode}</strong> },
            { key: 'name', header: 'Name', render: (s) => s.user.fullName },
            { key: 'desig', header: 'Designation', render: (s) => s.designation },
            {
              key: 'assignments',
              header: 'Assigned Classes & Subjects',
              render: (s) =>
                s.staffAssignments?.length ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.staffAssignments.map((a) => (
                      <Badge key={a.id} variant={a.isClassTeacher ? 'accent' : 'primary'}>
                        {a.section?.schoolClass?.name} {a.section?.name}
                        {a.subject ? ` • ${a.subject.name}` : a.isClassTeacher ? ' • Class Teacher' : ''}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                ),
            },
            ...(isAdmin ? [{ key: 'phone', header: 'Mobile', render: (s: StaffMember) => s.user.phone ?? '—' }] : []),
          ]}
        />
      )}

      <Modal open={staffModal} title="Add Teacher / Staff" onClose={() => setStaffModal(false)}>
        <form onSubmit={handleCreateStaff}>
          <div className="grid-2">
            <FormField label="Employee Code" required>
              <input className="input" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} required />
            </FormField>
            <FormField label="Mobile Number" required>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </FormField>
          </div>
          <FormField label="Full Name" required>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="Designation" required>
              <input className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
            </FormField>
            <FormField label="Qualification">
              <input className="input" value={qualification} onChange={(e) => setQualification(e.target.value)} />
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Teacher
          </Button>
        </form>
      </Modal>

      <Modal open={assignModal} title="Assign Class & Subject" onClose={() => setAssignModal(false)}>
        <form onSubmit={handleAssign}>
          <FormField label="Teacher" required>
            <select className="select" value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)} required>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.fullName} ({s.employeeCode})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Class & Section" required>
            <select className="select" value={assignSectionId} onChange={(e) => setAssignSectionId(e.target.value)} required>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.schoolClass?.name} - {sec.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Subject (optional if Class Teacher)">
            <select className="select" value={assignSubjectId} onChange={(e) => setAssignSubjectId(e.target.value)}>
              <option value="">-- General / Homeroom --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </FormField>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input id="is-ct" type="checkbox" checked={isClassTeacher} onChange={(e) => setIsClassTeacher(e.target.checked)} />
            <label htmlFor="is-ct" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Assign as Class Teacher for this section
            </label>
          </div>
          <Button type="submit" variant="accent">
            Save Assignment
          </Button>
        </form>
      </Modal>
    </div>
  );
};
