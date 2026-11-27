import { RoleCode } from '../enums';

export interface AuthUser {
  userId: string;
  schoolId: string | null;
  role: RoleCode;
  permissions: string[];
  phone: string;
  fullName: string;
  staffId?: string | null;
  studentId?: string | null;
  linkedStudentIds: string[];
  assignedSectionIds: string[];
}
