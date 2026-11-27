import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { EmptyState } from '@/components/cards/EmptyState';
import { ErrorState } from '@/components/cards/ErrorState';
import { LoadingState } from '@/components/cards/LoadingState';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Pagination } from '@/components/tables/Pagination';
import { useNotifications } from '@/hooks';
import { getApiErrorMessage } from '@/services/api';
import { notificationsService } from '@/services/notifications.service';
import { NotificationItem } from '@/types';
import { formatDateTime } from '@/utils';

export const NotificationsPage: React.FC = () => {
  const { unreadCount, markRead, markAllRead, showToast } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsService.list({ unreadOnly: unreadOnly || undefined, page, limit: 20 });
      setItems(res.items);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, page]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const handleMarkOne = async (id: string) => {
    try {
      await markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('success', 'All notifications marked as read.');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`Chronological alert history • ${unreadCount} unread`}
        actions={
          <>
            <Button
              variant={unreadOnly ? 'primary' : 'outline'}
              onClick={() => {
                setPage(1);
                setUnreadOnly(!unreadOnly);
              }}
            >
              {unreadOnly ? 'Showing Unread Only' : 'Filter: Unread Only'}
            </Button>
            <Button variant="accent" onClick={handleMarkAll} disabled={unreadCount === 0}>
              <CheckCheck size={16} /> Mark All Read
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadFeed} />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications" description="You are completely caught up." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                background: n.isRead ? 'var(--bg-surface)' : '#fffbeb',
                borderColor: n.isRead ? 'var(--border-color)' : 'var(--brand-accent)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Bell size={16} color="var(--brand-primary)" />
                  <strong>{n.title}</strong>
                  <StatusPill status={n.priority} />
                  <Badge variant="primary">{n.category}</Badge>
                </div>
                <p style={{ margin: '6px 0 4px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{n.body}</p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDateTime(n.createdAt)}</div>
              </div>
              {!n.isRead && (
                <Button size="sm" variant="outline" onClick={() => handleMarkOne(n.id)}>
                  Mark Read
                </Button>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};
