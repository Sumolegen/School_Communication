import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/modals/Modal';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth, useNotifications, usePermissions } from '@/hooks';
import { academicsService } from '@/services/academics.service';
import { getApiErrorMessage } from '@/services/api';
import { staffService } from '@/services/staff.service';
import { studentsService } from '@/services/students.service';
import { timetableService } from '@/services/timetable.service';
import { ClassSection, DayOfWeek, StaffMember, SubjectItem, TimetableEntryItem } from '@/types';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const TimetablePage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canManage = hasPermission('TIMETABLE_MANAGE');

  const [sections, setSections] = useState<ClassSection[]>([]);
  const [sectionId, setSectionId] = useState(activeStudent?.sectionId ?? '');
  const [entries, setEntries] = useState<TimetableEntryItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MON');
  const [periodNo, setPeriodNo] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:45');
  const [subjectId, setSubjectId] = useState('');
  const [teacherStaffId, setTeacherStaffId] = useState('');

  useEffect(() => {
    if (activeStudent?.sectionId) {
      setSectionId(activeStudent.sectionId);
    }
  }, [activeStudent?.sectionId]);

  useEffect(() => {
    studentsService
      .listSections()
      .then((list) => {
        setSections(list);
        if (!sectionId && list[0]) setSectionId(list[0].id);
      })
      .catch(() => {});

    if (canManage) {
      Promise.all([academicsService.listSubjects(), staffService.listStaff({ teachersOnly: true })])
        .then(([subj, st]) => {
          setSubjects(subj);
          setStaffList(st.items);
          if (subj[0]) setSubjectId(subj[0].id);
          if (st.items[0]) setTeacherStaffId(st.items[0].id);
        })
        .catch(() => {});
    }
  }, [canManage]);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await timetableService.getSchedule(sectionId || undefined);
      setEntries(list);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await timetableService.upsertEntry({
        sectionId,
        dayOfWeek,
        periodNo,
        startTime,
        endTime,
        subjectId,
        teacherStaffId,
      });
      showToast('success', 'Timetable period saved.');
      setModalOpen(false);
      await loadSchedule();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Weekly Timetable"
        subtitle="Day-by-day class schedule displaying period timings, subjects, and teachers"
        actions={
          canManage && (
            <Button variant="accent" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add / Update Period
            </Button>
          )
        }
      />

      {sections.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <select className="select" style={{ width: 'auto', minWidth: 220 }} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All / My Schedule</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.schoolClass?.name} - {sec.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSchedule} />
      ) : entries.length === 0 ? (
        <EmptyState title="No timetable entries yet" />
      ) : (
        <div className="grid-3">
          {DAYS.map((day) => {
            const dayEntries = entries.filter((e) => e.dayOfWeek === day).sort((a, b) => a.periodNo - b.periodNo);
            return (
              <div key={day} className="card">
                <h3 style={{ margin: '0 0 12px', color: 'var(--brand-primary)', borderBottom: '2px solid var(--brand-accent)', paddingBottom: 6 }}>
                  {day}
                </h3>
                {dayEntries.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No periods scheduled</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dayEntries.map((item) => (
                      <div key={item.id} style={{ padding: 10, borderRadius: 8, background: 'var(--bg-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>Period {item.periodNo}</span>
                          <span>
                            <Clock size={12} style={{ verticalAlign: 'middle' }} /> {item.startTime} – {item.endTime}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--brand-primary)', marginTop: 2 }}>{item.subject.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.teacher.user.fullName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} title="Add / Update Timetable Period" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSaveEntry}>
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
            <FormField label="Day of Week" required>
              <select className="select" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Period #" required>
              <input className="input" type="number" min={1} max={12} value={periodNo} onChange={(e) => setPeriodNo(Number(e.target.value))} required />
            </FormField>
          </div>
          <div className="grid-2">
            <FormField label="Start Time" required>
              <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </FormField>
            <FormField label="End Time" required>
              <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </FormField>
          </div>
          <div className="grid-2">
            <FormField label="Subject" required>
              <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Teacher" required>
              <select className="select" value={teacherStaffId} onChange={(e) => setTeacherStaffId(e.target.value)} required>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.user.fullName}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <Button type="submit" variant="accent">
            Save Period
          </Button>
        </form>
      </Modal>
    </div>
  );
};
