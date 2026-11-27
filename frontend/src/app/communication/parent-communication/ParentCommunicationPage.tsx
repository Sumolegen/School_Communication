import React, { useCallback, useEffect, useState } from 'react';
import { Lock, MessageSquare, Send } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { useAuth, useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { communicationService } from '@/services/communication.service';
import { DirectMessageItem, MessageThreadItem } from '@/types';
import { formatDateTime } from '@/utils';

export const ParentCommunicationPage: React.FC = () => {
  const { user, school, activeStudent } = useAuth();
  const { showToast } = useNotifications();

  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [contacts, setContacts] = useState<
    Array<{
      userId: string;
      fullName: string;
      designation?: string;
      subjects?: string[];
      studentId?: string;
      studentName?: string;
      className?: string;
    }>
  >([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedContactKey, setSelectedContactKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [threadList, contactList] = await Promise.all([
        communicationService.listThreads(activeStudent?.id),
        communicationService.getMessageContacts(activeStudent?.id),
      ]);
      setThreads(threadList);
      setContacts(contactList);
      if (threadList[0] && !activeThreadId) {
        setActiveThreadId(threadList[0].id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeStudent?.id]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const loadMessages = useCallback(async (threadId: string) => {
    if (!threadId) return;
    try {
      const res = await communicationService.getThreadMessages(threadId);
      setMessages(res.messages);
      await communicationService.markThreadRead(threadId);
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)));
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  }, [showToast]);

  useEffect(() => {
    if (activeThreadId) void loadMessages(activeThreadId);
  }, [activeThreadId, loadMessages]);

  const handleSendInThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      if (activeThreadId) {
        await communicationService.sendMessage({ threadId: activeThreadId, body: draft.trim() });
        setDraft('');
        await loadMessages(activeThreadId);
      } else if (selectedContactKey) {
        const contact = contacts.find((c) => `${c.userId}_${c.studentId ?? ''}` === selectedContactKey);
        if (!contact) return;
        const msg = await communicationService.sendMessage({
          studentId: contact.studentId ?? activeStudent?.id,
          receiverUserId: contact.userId,
          body: draft.trim(),
        });
        setDraft('');
        setActiveThreadId(msg.threadId);
        await loadThreads();
      }
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const isParentBlockedByBroadcast = user?.role === 'PARENT' && school?.messagingBroadcastOnly;

  return (
    <div>
      <PageHeader
        title="Parent-Teacher Direct Messaging"
        subtitle="Privacy-protected teacher-parent threads (teacher mobile numbers remain private)"
      />

      {school && (school.messagingBroadcastOnly || school.messagingStartHour !== null) && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            background: 'var(--brand-primary-soft)',
            color: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
          }}
        >
          <Lock size={16} />
          <span>
            {school.messagingBroadcastOnly
              ? 'One-way broadcast mode is active: parents can read teacher messages.'
              : `School messaging hours: ${school.messagingStartHour ?? 0}:00 – ${school.messagingEndHour ?? 23}:00.`}
          </span>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadThreads} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Start New Conversation
              </label>
              <select
                className="select"
                value={selectedContactKey}
                onChange={(e) => {
                  setSelectedContactKey(e.target.value);
                  setActiveThreadId('');
                  setMessages([]);
                }}
              >
                <option value="">Select teacher / parent...</option>
                {contacts.map((c) => (
                  <option key={`${c.userId}_${c.studentId ?? ''}`} value={`${c.userId}_${c.studentId ?? ''}`}>
                    {c.fullName} {c.studentName ? `(${c.studentName})` : c.subjects?.length ? `(${c.subjects.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
              Conversation Threads
            </div>
            {threads.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No conversations yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {threads.map((t) => {
                  const counterpart = user?.role === 'PARENT' ? t.teacherUser.fullName : t.parentUser.fullName;
                  const active = t.id === activeThreadId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedContactKey('');
                        setActiveThreadId(t.id);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: active ? 'var(--brand-primary-soft)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--brand-primary)' }}>{counterpart}</strong>
                        {t.unreadCount > 0 && <Badge variant="accent">{t.unreadCount}</Badge>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Student: {t.student.fullName}
                      </div>
                      {t.lastMessage && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.lastMessage.body}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
            {!activeThreadId && !selectedContactKey ? (
              <EmptyState title="Select a conversation" description="Choose an existing thread or select a teacher/parent to begin." />
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
                  {messages.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
                      <MessageSquare size={26} />
                      <div>Send the first message below.</div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.senderUserId === user?.id;
                      return (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: isMine ? 'var(--brand-primary)' : 'var(--bg-muted)',
                            color: isMine ? '#ffffff' : 'var(--text-primary)',
                          }}
                        >
                          <div style={{ fontSize: '0.92rem' }}>{m.body}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.78, marginTop: 4 }}>
                            {formatDateTime(m.createdAt)} {isMine && m.isRead ? '• Read' : ''}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleSendInThread}
                  style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}
                >
                  <input
                    className="input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={isParentBlockedByBroadcast ? 'Broadcast mode active (replies disabled)' : 'Type your message...'}
                    disabled={Boolean(isParentBlockedByBroadcast)}
                  />
                  <Button type="submit" variant="accent" disabled={Boolean(isParentBlockedByBroadcast) || !draft.trim()}>
                    <Send size={15} /> Send
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
