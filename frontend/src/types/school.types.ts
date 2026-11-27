export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED';

export interface SchoolConfig {
  id: string | null;
  schoolCode: string | null;
  name: string;
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: string;
  messagingBroadcastOnly: boolean;
  messagingStartHour?: number | null;
  messagingEndHour?: number | null;
  isActive?: boolean;
  _count?: {
    users: number;
    students: number;
    staffProfiles: number;
    classes: number;
  };
}

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
