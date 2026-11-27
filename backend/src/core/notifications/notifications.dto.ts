import { NotificationCategory, PriorityLevel, TargetScope } from '@shared/enums';

export interface DispatchNotificationParams {
  schoolId: string;
  recipientUserIds: string[];
  studentId?: string | null;
  title: string;
  body: string;
  category: NotificationCategory;
  priority?: PriorityLevel;
  referenceType?: string;
  referenceId?: string;
}

export interface DispatchScopedNotificationParams {
  schoolId: string;
  targetScope: TargetScope;
  sectionIds?: string[];
  studentIds?: string[];
  excludeUserId?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority?: PriorityLevel;
  referenceType?: string;
  referenceId?: string;
}
