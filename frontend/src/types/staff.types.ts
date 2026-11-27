export interface StaffAssignment {
  id: string;
  staffId: string;
  sectionId: string;
  subjectId?: string | null;
  isClassTeacher: boolean;
  section?: {
    id: string;
    name: string;
    schoolClass: { id: string; name: string };
  };
  subject?: { id: string; name: string; code: string } | null;
}

export interface StaffMember {
  id: string;
  employeeCode: string;
  designation: string;
  qualification?: string | null;
  isTeacher: boolean;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    phone?: string;
    email?: string | null;
    avatarUrl?: string | null;
    isActive: boolean;
  };
  staffAssignments?: StaffAssignment[];
}
