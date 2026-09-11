import { WorkOrderTicket, TicketStatus, AssignedTechnician, MaterialPartUsed } from '../types/ticket';
import { INITIAL_WORK_ORDER_TICKETS } from '../data/initialTickets';
import { safeSetLocalStorage } from './storageService';
import * as XLSX from 'xlsx';

const TICKETS_STORAGE_KEY = 'acv_helpdesk_work_orders_v1';

let inMemoryTickets: WorkOrderTicket[] = [];
let isInitialized = false;

function broadcastTicketMutation(ticket: WorkOrderTicket | { id: string }, mutationType: 'UPSERT' | 'DELETE' = 'UPSERT') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tamimi_tickets_updated', { detail: inMemoryTickets }));
    fetch('/api/hub/mutate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mutationType,
        entity: 'supportTickets',
        id: ticket.id,
        data: mutationType === 'UPSERT' ? ticket : undefined,
      }),
    }).catch(() => {});
  }
}

export class TicketService {
  public static init() {
    if (isInitialized) return;
    try {
      const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          let hasDuplicates = false;
          inMemoryTickets = parsed.map((t, idx) => {
            if (!t.id || seenIds.has(t.id)) {
              hasDuplicates = true;
              const uniqueId = `WO-${t.ticketNumber || Date.now()}-${idx}`;
              seenIds.add(uniqueId);
              return { ...t, id: uniqueId };
            }
            seenIds.add(t.id);
            return t;
          });
          if (hasDuplicates) {
            safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
          }
          isInitialized = true;
          return;
        }
      }
    } catch (e) {
      console.warn('TicketService: LocalStorage read error, using initial tickets', e);
    }
    inMemoryTickets = [...INITIAL_WORK_ORDER_TICKETS];
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    isInitialized = true;
  }

  public static getTickets(): WorkOrderTicket[] {
    this.init();
    return [...inMemoryTickets];
  }

  public static getTicketById(id: string): WorkOrderTicket | undefined {
    this.init();
    return inMemoryTickets.find((t) => t.id === id || t.ticketNumber === id);
  }

  public static saveTickets(tickets: WorkOrderTicket[], broadcast: boolean = true): void {
    inMemoryTickets = [...tickets];
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    if (broadcast && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamimi_tickets_updated', { detail: inMemoryTickets }));
    }
  }

  /**
   * Merge remote tickets received from Server Hub SSE or Disaster Snapshot
   */
  public static mergeRemoteTickets(remoteList: WorkOrderTicket[]): void {
    this.init();
    if (!Array.isArray(remoteList) || remoteList.length === 0) return;

    const map = new Map<string, WorkOrderTicket>();
    inMemoryTickets.forEach((t) => {
      map.set(String(t.id).toLowerCase().trim(), t);
    });

    let hasChanges = false;
    remoteList.forEach((remote) => {
      if (!remote || !remote.id) return;
      const key = String(remote.id).toLowerCase().trim();
      const local = map.get(key);
      if (!local) {
        map.set(key, remote);
        hasChanges = true;
      } else {
        const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
        if (remoteTime > localTime) {
          map.set(key, remote);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      inMemoryTickets = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tamimi_tickets_updated', { detail: inMemoryTickets }));
      }
    }
  }

  /**
   * Apply remote deletion event received from Hub
   */
  public static applyRemoteDeletion(id: string): void {
    this.init();
    const cleanId = String(id).toLowerCase().trim();
    const prevLen = inMemoryTickets.length;
    inMemoryTickets = inMemoryTickets.filter((t) => String(t.id).toLowerCase().trim() !== cleanId);
    if (inMemoryTickets.length !== prevLen) {
      safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tamimi_tickets_updated', { detail: inMemoryTickets }));
      }
    }
  }

  /**
   * Apply remote single upsert received from Hub SSE
   */
  public static applyRemoteUpsert(remoteTicket: WorkOrderTicket): void {
    this.init();
    if (!remoteTicket || !remoteTicket.id) return;
    const cleanId = String(remoteTicket.id).toLowerCase().trim();
    const idx = inMemoryTickets.findIndex((t) => String(t.id).toLowerCase().trim() === cleanId);
    if (idx >= 0) {
      inMemoryTickets[idx] = { ...inMemoryTickets[idx], ...remoteTicket };
    } else {
      inMemoryTickets.unshift(remoteTicket);
    }
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tamimi_tickets_updated', { detail: inMemoryTickets }));
    }
  }

  public static createTicket(
    data: Omit<
      WorkOrderTicket,
      'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'targetResolutionTime' | 'logs' | 'materialsUsed'
    > & {
      materialsUsed?: MaterialPartUsed[];
      initialLog?: string;
    }
  ): WorkOrderTicket {
    this.init();
    const now = new Date();
    const nowIso = now.toISOString();

    // Calculate Planon Decimal Number (e.g. 1083111.00 as shown in the Planon Work Order confirmation)
    let maxOrderNum = 1083110;
    for (const t of inMemoryTickets) {
      const raw = t.orderNumberDecimal || t.ticketNumber || '';
      const match = raw.match(/^(\d{6,8})(?:\.\d+)?$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxOrderNum) maxOrderNum = val;
      }
    }
    const nextOrderNum = maxOrderNum + 1;
    const planonOrderNum = `${nextOrderNum}.00`;
    const id = `WO-${now.getFullYear()}-${planonOrderNum}`;
    const ticketNumber = (data as any).ticketNumber || planonOrderNum;

    // Map trade to Planon Order Group
    const tradeOrderGroupMap: Record<string, string> = {
      CIVIL: '01.01, Civil',
      Cleaning: '01.05, Cleaning',
      Electrical: '01.02, Electrical',
      Equipment: '01.06, Equipment',
      Fighting: '01.18, Fire systems',
      General: '01.10, General FM',
      Housekeeping: '01.07, Housekeeping',
      HSE: '01.12, Health & Safety',
      HVAC: '01.03, HVAC / AC',
      IT: '01.08, IT & Telecom',
      Landscaping: '01.14, Landscaping',
      Laundry: '01.15, Laundry',
      Mechanical: '01.09, Mechanical',
      'Pest Control': '01.16, Pest Control',
      Pulming: '01.04, Plumbing',
      'Waste Management': '01.17, Waste Management',
      PLUMBING: '01.04, Plumbing',
      ELECTRICAL: '01.02, Electrical',
      CARPENTRY: '01.01, Civil',
      CIVIL_MASONRY: '01.01, Civil',
      APPLIANCE: '01.06, Equipment',
      IT_COMMUNICATION: '01.08, IT & Telecom',
      FIRE_SAFETY: '01.18, Fire systems',
    };

    const assignedOrderGroup = data.orderGroup || tradeOrderGroupMap[data.category] || '01.10, General FM';

    // Map priority to Planon Priority
    let planonPriority: any = data.planonPriority;
    if (!planonPriority) {
      if (data.priority.includes('P1')) planonPriority = 'AMA_P1, Critical (Immediate)';
      else if (data.priority.includes('P2')) planonPriority = 'AMA_P2, High (Urgent)';
      else if (data.priority.includes('P3')) planonPriority = 'AMA_P3, Low (Routine)';
      else planonPriority = 'AMA_P4, Scheduled';
    }

    // Calculate SLA target resolution time based on Priority
    let hoursToAdd = 48;
    if (data.priority.includes('P1')) hoursToAdd = 2; // P1 Critical: 2 hours
    else if (data.priority.includes('P2')) hoursToAdd = 4; // P2 High: 4 hours
    else if (data.priority.includes('P3')) hoursToAdd = 12; // P3 Medium: 12 hours
    else hoursToAdd = 48; // P4 Normal: 48 hours

    const targetDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);

    const newTicket: WorkOrderTicket = {
      ...data,
      id,
      ticketNumber,
      orderNumberDecimal: data.orderNumberDecimal || planonOrderNum,
      orderGroup: assignedOrderGroup,
      customer: data.customer || 'Red Sea Global (RSG) / Amaala',
      planonPriority,
      propertyName: data.propertyName || `TBCV${data.stage.replace('Stage ', '')}, AMAALA ${data.stage.toUpperCase()}`,
      spaceName: data.spaceName || data.locationCode,
      timeToCompleteScore: data.timeToCompleteScore ?? 1,
      materialsUsed: data.materialsUsed || [],
      createdAt: nowIso,
      updatedAt: nowIso,
      targetResolutionTime: targetDate.toISOString(),
      logs: [
        {
          id: `LOG-${Date.now()}-1`,
          timestamp: nowIso,
          author: data.reporterName || 'Helpdesk Dispatch',
          action: 'Work Order Created',
          note: data.initialLog || `Created in Planon Reactive Maintenance with priority ${data.priority} for ${data.locationCode}`,
        },
      ],
    };

    if (data.assignedTechnician) {
      newTicket.logs.push({
        id: `LOG-${Date.now()}-2`,
        timestamp: nowIso,
        author: 'Dispatch Desk',
        action: 'Assigned to Technician',
        note: `Assigned to ${data.assignedTechnician.name} (${data.assignedTechnician.trade})`,
      });
    }

    inMemoryTickets = [newTicket, ...inMemoryTickets];
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(newTicket, 'UPSERT');
    return newTicket;
  }

  public static updateTicket(id: string, updates: Partial<WorkOrderTicket>, author?: string, auditNote?: string): WorkOrderTicket | null {
    this.init();
    const index = inMemoryTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = inMemoryTickets[index];
    const nowIso = new Date().toISOString();

    const newLogs = [...existing.logs];
    if (auditNote) {
      newLogs.push({
        id: `LOG-${Date.now()}`,
        timestamp: nowIso,
        author: author || 'System Operator',
        action: 'Ticket Updated',
        note: auditNote,
      });
    }

    const updated: WorkOrderTicket = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
      logs: newLogs,
    };

    inMemoryTickets[index] = updated;
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(updated, 'UPSERT');
    return updated;
  }

  public static updateStatus(id: string, newStatus: TicketStatus, author: string, note?: string): WorkOrderTicket | null {
    this.init();
    const index = inMemoryTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = inMemoryTickets[index];
    const nowIso = new Date().toISOString();

    const updates: Partial<WorkOrderTicket> = {
      status: newStatus,
      updatedAt: nowIso,
    };

    if (newStatus === 'COMPLETED' && !existing.resolvedAt) {
      updates.resolvedAt = nowIso;
    }
    if (newStatus === 'CLOSED' && !existing.closedAt) {
      updates.closedAt = nowIso;
    }

    const logEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: nowIso,
      author,
      action: `Status changed to ${newStatus}`,
      note: note || `Work Order transitioned from ${existing.status} to ${newStatus}`,
    };

    const updated: WorkOrderTicket = {
      ...existing,
      ...updates,
      logs: [...existing.logs, logEntry],
    };

    inMemoryTickets[index] = updated;
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(updated, 'UPSERT');
    return updated;
  }

  public static assignTechnician(id: string, technician: AssignedTechnician, author: string, note?: string): WorkOrderTicket | null {
    this.init();
    const index = inMemoryTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = inMemoryTickets[index];
    const nowIso = new Date().toISOString();

    const updated: WorkOrderTicket = {
      ...existing,
      assignedTechnician: technician,
      status: existing.status === 'NEW' ? 'ASSIGNED' : existing.status,
      updatedAt: nowIso,
      logs: [
        ...existing.logs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          author,
          action: `Assigned to ${technician.name}`,
          note: note || `Dispatched to ${technician.trade} specialist (${technician.phone}) with ETA ${technician.etaMinutes || 30} mins.`,
        },
      ],
    };

    inMemoryTickets[index] = updated;
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(updated, 'UPSERT');
    return updated;
  }

  public static addMaterialUsed(id: string, material: MaterialPartUsed, author: string): WorkOrderTicket | null {
    this.init();
    const index = inMemoryTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = inMemoryTickets[index];
    const nowIso = new Date().toISOString();

    const updatedMaterials = [...existing.materialsUsed, material];
    const updated: WorkOrderTicket = {
      ...existing,
      materialsUsed: updatedMaterials,
      updatedAt: nowIso,
      logs: [
        ...existing.logs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          author,
          action: 'Spare Part Requisitioned',
          note: `Added ${material.quantity} ${material.unit} of ${material.description} (${material.itemCode})`,
        },
      ],
    };

    inMemoryTickets[index] = updated;
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(updated, 'UPSERT');
    return updated;
  }

  public static submitSatisfaction(
    id: string,
    rating: number,
    feedbackNotes?: string,
    signatureClient?: string
  ): WorkOrderTicket | null {
    this.init();
    const index = inMemoryTickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = inMemoryTickets[index];
    const nowIso = new Date().toISOString();

    const updated: WorkOrderTicket = {
      ...existing,
      satisfactionRating: rating,
      feedbackNotes: feedbackNotes || existing.feedbackNotes,
      signatureClient: signatureClient || existing.signatureClient,
      status: existing.status === 'COMPLETED' ? 'CLOSED' : existing.status,
      closedAt: existing.status === 'COMPLETED' ? nowIso : existing.closedAt,
      updatedAt: nowIso,
      logs: [
        ...existing.logs,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowIso,
          author: existing.reporterName || 'Client Sign-off',
          action: `Rated ${rating}/5 Stars`,
          note: feedbackNotes || 'Client satisfaction verification completed.',
        },
      ],
    };

    inMemoryTickets[index] = updated;
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    broadcastTicketMutation(updated, 'UPSERT');
    return updated;
  }

  public static deleteTicket(id: string): boolean {
    this.init();
    const prevLen = inMemoryTickets.length;
    inMemoryTickets = inMemoryTickets.filter((t) => t.id !== id);
    if (inMemoryTickets.length !== prevLen) {
      safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
      broadcastTicketMutation({ id }, 'DELETE');
      return true;
    }
    return false;
  }

  public static resetToDemoData(): WorkOrderTicket[] {
    inMemoryTickets = [...INITIAL_WORK_ORDER_TICKETS];
    safeSetLocalStorage(TICKETS_STORAGE_KEY, JSON.stringify(inMemoryTickets));
    return [...inMemoryTickets];
  }

  public static exportToExcel(tickets: WorkOrderTicket[], fileName?: string): void {
    const rows = tickets.map((t) => ({
      'Work Order #': t.ticketNumber,
      'Project': t.project,
      'Client': t.client,
      'Stage': t.stage,
      'Cluster': `Cluster ${t.cluster} (${t.clusterType})`,
      'Building': `${t.buildingCategory} ${t.buildingNumber}`,
      'Floor': t.floor,
      'Unit / Room': t.unitNumber + (t.isToilet ? ' (Communal Toilet)' : '') + (t.bedNumber ? ` [${t.bedNumber}]` : ''),
      'Location Code': t.locationCode,
      'Trade Category': t.category,
      'Sub Category': t.subCategory,
      'Priority': t.priority,
      'Status': t.status,
      'Issue Title': t.title,
      'Description': t.description,
      'Reporter Name': t.reporterName,
      'Reporter Badge': t.reporterBadge,
      'Reporter Phone': t.reporterPhone,
      'Reporter Company': t.company,
      'Department': t.reporterDepartment,
      'Assigned Technician': t.assignedTechnician ? `${t.assignedTechnician.name} (${t.assignedTechnician.trade})` : 'Unassigned',
      'Technician Phone': t.assignedTechnician ? t.assignedTechnician.phone : '',
      'Materials Count': t.materialsUsed.length,
      'Materials Total Cost (SAR)': t.materialsUsed.reduce((acc, m) => acc + (m.cost || 0) * m.quantity, 0),
      'Created At': new Date(t.createdAt).toLocaleString(),
      'Target SLA': new Date(t.targetResolutionTime).toLocaleString(),
      'Resolved At': t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : 'Pending',
      'Closed At': t.closedAt ? new Date(t.closedAt).toLocaleString() : 'Open',
      'Satisfaction (1-5)': t.satisfactionRating || 'N/A',
      'Client Feedback': t.feedbackNotes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ACV_Work_Orders');
    const name = fileName || `Amaala_Village_Work_Orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, name);
  }
}
