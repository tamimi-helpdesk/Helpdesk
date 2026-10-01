export type VillageStage = 'Stage 1' | 'Stage 2' | 'Stage 3';

export type ClusterType = 'VIP' | 'WORKERS';

export type ClusterId = 'H' | 'G' | 'F' | 'E' | 'I' | 'J' | 'K' | 'L' | 'A' | 'B' | 'C' | 'D';

export type BuildingCategory = 'Executive' | 'Senior' | 'Junior' | 'Workers';

export type BuildingFloor = 'GF' | 'FF';

export type TicketPriority = 'P1 - Critical / Emergency' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low / Normal';

export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_PARTS' | 'COMPLETED' | 'CLOSED';

export type TicketTradeCategory =
  | 'CIVIL'
  | 'Cleaning'
  | 'Electrical'
  | 'Equipment'
  | 'Fighting'
  | 'General'
  | 'Housekeeping'
  | 'HSE'
  | 'HVAC'
  | 'IT'
  | 'Landscaping'
  | 'Laundry'
  | 'Mechanical'
  | 'Pest Control'
  | 'Plumbing'
  | 'Pulming'
  | 'Waste Management'
  // Legacy aliases for backward compatibility
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'CIVIL_MASONRY'
  | 'HOUSEKEEPING'
  | 'APPLIANCE'
  | 'IT_COMMUNICATION'
  | 'FIRE_SAFETY';

export interface AssignedTechnician {
  id: string;
  name: string;
  trade: string;
  phone: string;
  assignedAt: string;
  badge?: string;
  etaMinutes?: number;
}

export interface MaterialPartUsed {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  cost?: number;
  unitCost?: number;
  totalCost?: number;
  name?: string;
  partCode?: string;
}

export interface TicketAuditLog {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  note?: string;
}

export interface TicketAttachment {
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export interface WorkOrderTicket {
  id: string; // e.g. "WO-2026-0182"
  ticketNumber: string; // e.g. "WO-0182"
  orderNumberDecimal?: string; // Planon decimal style e.g. "995058.01"
  orderGroup?: string; // Planon order group e.g. "01.02, Electrical", "01.01, Civil", "01.18, Fire systems"
  customer?: string; // e.g. "Red Sea Global", "Amaala Stage 1-3 Operations"
  project: string; // "Amaala Construction Village"
  client: string; // "Red Sea Global"
  
  // Location Hierarchy
  stage: VillageStage;
  cluster: ClusterId;
  clusterType: ClusterType;
  buildingNumber: number; // 1-14 for VIP, 1-16 for Workers
  buildingCategory: BuildingCategory;
  floor: BuildingFloor;
  unitNumber: string; // e.g. "001", "108", "013 (Toilet)", "114 (Toilet)"
  isToilet?: boolean;
  bedNumber?: 'Bed A' | 'Bed B'; // for Junior VIP rooms
  locationCode: string; // e.g. "ACV-S1-CL-H-EXEC-1-GF-004"
  
  // Planon Specific Fields
  propertyName?: string; // e.g. "TBCV1, AMAALA STAGE 1", "TBCV2, AMAALA STAGE 2", "TBCV3, AMAALA STAGE 3"
  spaceName?: string; // e.g. "TBCV3-C-C10-004 - Room C10-004", "Stage 2 Asian Dining Hall"
  requestCategoryCode?: string; // e.g. "CV05, FM REACTIVE WORK ORDER - Drawers Fixing"
  assetId?: string; // e.g. "AST-FW-02 - Food Warmer", "AST-LT-109 - Office Light"
  comment?: string; // e.g. "Stage 2 asian dining hall food warmer not working"
  technicallyCompletedOn?: string; // e.g. "01/04/2026 06:57"
  timeToCompleteScore?: number; // 1 (on time), 0 (at risk), -1 (breached)
  planonPriority?: 'AMA_P1, Critical (Immediate)' | 'AMA_P2, High (Urgent)' | 'AMA_P3, Low (Routine)' | 'AMA_P4, Scheduled';
  attachedFiles?: TicketAttachment[];

  // Ticket Defect Information
  category: TicketTradeCategory;
  subCategory: string;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  
  // Reporter Information
  reporterName: string;
  reporterBadge: string;
  reporterPhone: string;
  reporterDepartment: string;
  company: 'Red Sea Global' | 'TAMIMI Global' | 'Subcontractor / Partner';

  // Technician & Execution Details
  assignedTechnician?: AssignedTechnician;
  materialsUsed: MaterialPartUsed[];
  logs: TicketAuditLog[];
  
  // Satisfaction & Closeout
  satisfactionRating?: number; // 1-5
  feedbackNotes?: string;
  signatureTechnician?: string;
  signatureClient?: string;
  
  // Timestamps & SLA
  createdAt: string;
  updatedAt: string;
  targetResolutionTime: string;
  resolvedAt?: string;
  closedAt?: string;
  isBreached?: boolean;
  estimatedLaborHours?: number;
}

export interface VillageRoomInfo {
  unitNumber: string;
  floor: BuildingFloor;
  label: string;
  isToilet?: boolean;
  hasBedSplit?: boolean;
}
