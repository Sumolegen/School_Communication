export type PriorityLevel = 'NORMAL' | 'URGENT';
export type TargetScope = 'ENTIRE_SCHOOL' | 'CLASS_SECTION' | 'INDIVIDUAL_STUDENTS';
export type EventType = 'EVENT' | 'HOLIDAY' | 'PTM' | 'EXAM';

export interface FileMeta {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
  publicUrl: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  kind: 'ANNOUNCEMENT' | 'ALERT';
  priority: PriorityLevel;
  targetScope: TargetScope;
  publishedAt: string;
  isRead: boolean;
  createdBy?: { fullName: string; role?: { code: string; name: string } };
  attachmentFile?: FileMeta | null;
  targets?: Array<{
    section?: { id: string; name: string; schoolClass?: { name: string } } | null;
    student?: { id: string; fullName: string } | null;
  }>;
}

export interface HomeworkItem {
  id: string;
  title: string;
  instructions: string;
  assignedDate: string;
  dueDate: string;
  externalLinks: Array<{ label: string; url: string }>;
  section?: { id: string; name: string; schoolClass?: { name: string } };
  subject?: { id: string; name: string; code: string };
  teacher?: { user: { fullName: string } };
  attachments?: Array<{ id: string; file: FileMeta }>;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  eventType: EventType;
  eventDate: string;
  endDate?: string | null;
  targetScope: TargetScope;
  section?: { name: string; schoolClass?: { name: string } } | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: PriorityLevel;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

export interface CircularItem {
  id: string;
  title: string;
  description?: string | null;
  circularDate: string;
  targetScope: TargetScope;
  file: FileMeta;
  section?: { name: string; schoolClass?: { name: string } } | null;
  publishedBy?: { fullName: string };
}

export interface PhotoAlbumItem {
  id: string;
  title: string;
  description?: string | null;
  eventDate: string;
  section?: { name: string; schoolClass?: { name: string } } | null;
  photos: Array<{ id: string; caption?: string | null; file: FileMeta }>;
}

export interface ClassUpdateItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  section?: { name: string; schoolClass?: { name: string } };
  teacher?: { user: { fullName: string } };
  attachmentFile?: FileMeta | null;
}

export interface MessageThreadItem {
  id: string;
  studentId: string;
  parentUserId: string;
  teacherUserId: string;
  lastMessageAt: string;
  student: { id: string; fullName: string; admissionNo: string; section?: { name: string; schoolClass?: { name: string } } };
  parentUser: { id: string; fullName: string };
  teacherUser: { id: string; fullName: string };
  lastMessage?: { body: string; createdAt: string; senderUserId: string } | null;
  unreadCount: number;
}

export interface DirectMessageItem {
  id: string;
  threadId: string;
  senderUserId: string;
  receiverUserId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  senderUser?: { id: string; fullName: string };
  attachmentFile?: FileMeta | null;
}
