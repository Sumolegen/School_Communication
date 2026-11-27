export interface SchoolClass {
  id: string;
  name: string;
  displayOrder: number;
  sections?: ClassSection[];
}

export interface ClassSection {
  id: string;
  classId: string;
  academicYearId: string;
  name: string;
  schoolClass?: SchoolClass;
  classTeacher?: {
    id: string;
    user: { id: string; fullName: string };
  } | null;
  _count?: { students: number };
}

export interface StudentRecord {
  id: string;
  admissionNo: string;
  fullName: string;
  rollNo?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
  sectionId: string;
  academicYearId: string;
  isActive: boolean;
  relationship?: string;
  isPrimary?: boolean;
  section?: ClassSection;
  academicYear?: { id: string; name: string };
  parentLinks?: Array<{
    id: string;
    relationship: string;
    parentUser: { id: string; fullName: string; phone: string; email?: string | null };
  }>;
}
