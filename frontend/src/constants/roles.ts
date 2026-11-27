import { RoleCode } from '@/types';

export const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: 'Platform Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  STUDENT: 'Student',
};

export const ADMIN_ROLES: RoleCode[] = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
export const STAFF_OR_ADMIN_ROLES: RoleCode[] = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
export const PARENT_OR_STUDENT_ROLES: RoleCode[] = ['PARENT', 'STUDENT'];
