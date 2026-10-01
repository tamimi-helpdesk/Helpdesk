import { DepartmentContact, RoomExtension, EmergencyScript } from '../../data/departmentDirectory';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  name: string;
  badgeId: string;
  roomNumber?: string;
  phone: string;
  category: 'FACILITY_BOOKING' | 'MAINTENANCE_DEFECT' | 'BARBER_CINEMA' | 'BILLING_PAYMENT' | 'SECURITY_ACCESS' | 'CATERING_MESS';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  assignedOfficer: string;
  resolutionNotes?: string;
  technicianName?: string;
  technicianPhone?: string;
  dispatchEtaMinutes?: number;
  satisfactionRating?: number; // 1 to 5 stars
  feedbackComment?: string;
}

export type HotlineColor = 'rose' | 'emerald' | 'teal' | 'amber' | 'blue' | 'purple' | 'indigo' | 'cyan';
export type HotlineIcon = 'flame' | 'stethoscope' | 'activity' | 'shield' | 'phone' | 'wrench' | 'alert' | 'siren' | 'building' | 'users' | 'zap';

export interface CampEmergencyHotline {
  id: string;
  title: string;
  subtitle: string;
  extension: string;
  directPhone: string;
  badgeLabel: string;
  themeColor: HotlineColor;
  iconType: HotlineIcon;
}

export interface NationalEmergencyHotline {
  id: string;
  name: string;
  number: string;
  desc: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
  category?: string;
}

export type { DepartmentContact, RoomExtension, EmergencyScript };
