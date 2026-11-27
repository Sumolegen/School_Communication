import React, { useCallback, useEffect, useState } from 'react';
import { Calendar as CalendarIcon, List, Plus } from 'lucide-react';
import { MonthCalendar } from '@/components/calendars/MonthCalendar';
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
import { EventItem, EventType } from '@/types';
import { currentMonthKey, formatDate, todayIsoDate } from '@/utils';

export const EventsPage: React.FC = () => {
  const { activeStudent } = useAuth();
  const { hasPermission } = usePermissions();
  const { showToast } = useNotifications();
  const canManage = hasPermission('EVENT_MANAGE');

  const [month, setMonth] = useState(currentMonthKey());
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('EVENT');
  const [eventDate, setEventDate] = useState(todayIsoDate());

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await communicationService.listEvents({
        month,
        eventType: (typeFilter || undefined) as EventType | undefined,
        studentId: activeStudent?.id,
      });
      setEvents(list);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, typeFilter, activeStudent?.id]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await communicationService.createEvent({
        title,
        description: description || undefined,
        eventType,
        eventDate,
      });
      showToast('success', 'Calendar event added.');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      await loadEvents();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const markers = events.map((ev) => ({
    dateIso: ev.eventDate.slice(0, 10),
    label: ev.title,
    tone: (ev.eventType === 'HOLIDAY'
      ? 'info'
      : ev.eventType === 'EXAM'
        ? 'warning'
        : ev.eventType === 'PTM'
          ? 'accent'
          : 'success') as 'info' | 'warning' | 'accent' | 'success',
  }));

  return (
    <div>
      <PageHeader
        title="Events, Holidays & Exam Calendar"
        subtitle="Monthly calendar and list view for school events, holidays, PTMs, and exams"
        actions={
          <>
            <Button variant={viewMode === 'CALENDAR' ? 'primary' : 'outline'} onClick={() => setViewMode('CALENDAR')}>
              <CalendarIcon size={16} /> Calendar
            </Button>
            <Button variant={viewMode === 'LIST' ? 'primary' : 'outline'} onClick={() => setViewMode('LIST')}>
              <List size={16} /> List
            </Button>
            {canManage && (
              <Button variant="accent" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Add Event
              </Button>
            )}
          </>
        }
      />

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="month" className="input" style={{ width: 'auto' }} value={month} onChange={(e) => setMonth(e.target.value)} />
        <select className="select" style={{ width: 'auto', minWidth: 170 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="EVENT">School Events</option>
          <option value="HOLIDAY">Holidays</option>
          <option value="PTM">Parent-Teacher Meetings</option>
          <option value="EXAM">Exam Schedules</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : viewMode === 'CALENDAR' ? (
        <>
          <MonthCalendar month={month} markers={markers} />
          {events.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map((ev) => (
                <div key={ev.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{ev.title}</strong>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {formatDate(ev.eventDate)} {ev.description ? `• ${ev.description}` : ''}
                    </div>
                  </div>
                  <StatusPill status={ev.eventType} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : events.length === 0 ? (
        <EmptyState title="No events this month" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((ev) => (
            <div key={ev.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1.02rem' }}>{ev.title}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {formatDate(ev.eventDate)} {ev.description ? `— ${ev.description}` : ''}
                </div>
              </div>
              <StatusPill status={ev.eventType} />
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Add School Event / Holiday" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <FormField label="Event Title" required>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </FormField>
          <div className="grid-2">
            <FormField label="Category" required>
              <select className="select" value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                <option value="EVENT">EVENT</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="PTM">PTM</option>
                <option value="EXAM">EXAM</option>
              </select>
            </FormField>
            <FormField label="Date" required>
              <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <Button type="submit" variant="accent">
            Save Event
          </Button>
        </form>
      </Modal>
    </div>
  );
};
