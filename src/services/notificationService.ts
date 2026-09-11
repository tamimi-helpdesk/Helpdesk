import { StorageService } from './storageService';
import { GasService } from './gasService';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'booking' | 'cancellation' | 'isolation' | 'handover' | 'parcel' | 'system' | 'notice' | 'lost_found';
  facilityId?: string;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high';
  actionUrl?: string;
}

const CUSTOM_NOTIFS_KEY = 'tamimi_custom_notifications_v3';
const READ_IDS_KEY = 'tamimi_read_notifications_v3';
const DISMISSED_IDS_KEY = 'tamimi_dismissed_notifications_v3';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function getCustomNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(CUSTOM_NOTIFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomNotifications(list: AppNotification[]) {
  try {
    localStorage.setItem(CUSTOM_NOTIFS_KEY, JSON.stringify(list));
  } catch {}
}

export const NotificationService = {
  /**
   * Generates a unified real-time list of notifications by combining custom notifications
   * and dynamic activity events from all facilities and services.
   */
  getAllNotifications(): AppNotification[] {
    const custom = getCustomNotifications();
    const readIds = getReadIds();
    const dismissedIds = getDismissedIds();
    const dynamicList: AppNotification[] = [];

    // 1. Ingest recent bookings
    try {
      const bookings = StorageService.getAllBookings() || [];
      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
        .slice(0, 15);

      recentBookings.forEach((b) => {
        if (!b.id) return;
        const notifId = `notif-b-${b.id}`;
        if (dismissedIds.has(notifId)) return;

        const slotTimeStr = b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : (b.stage || 'Slot');

        if (b.status === 'CANCELLED') {
          dynamicList.push({
            id: notifId,
            title: `Booking Cancelled: ${b.facilityName || 'Facility'}`,
            message: `${b.customerName || 'Guest'} · ${slotTimeStr} on ${b.date || ''}. Reason: ${b.cancellationReason || 'Operator request'}`,
            timestamp: b.cancelledAt || b.createdAt || new Date().toISOString(),
            type: 'cancellation',
            facilityId: b.facilityId,
            isRead: readIds.has(notifId),
            priority: 'normal',
          });
        } else {
          dynamicList.push({
            id: notifId,
            title: `New Reservation: ${b.facilityName || 'Facility'}`,
            message: `${b.customerName || 'Guest'} (${b.phoneNumber || 'Direct'}) reserved ${slotTimeStr} on ${b.date || ''}`,
            timestamp: b.createdAt || b.date || new Date().toISOString(),
            type: 'booking',
            facilityId: b.facilityId,
            isRead: readIds.has(notifId),
            priority: 'normal',
          });
        }
      });
    } catch {}

    // 2. Ingest recent handovers
    try {
      const handovers = StorageService.getHandoverRecords() || [];
      const recentHandovers = [...handovers]
        .sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime())
        .slice(0, 10);

      recentHandovers.forEach((h) => {
        if (!h.id) return;
        const notifId = `notif-h-${h.id}`;
        if (dismissedIds.has(notifId)) return;

        dynamicList.push({
          id: notifId,
          title: `Handover Logged: ${h.itemName || 'Asset'}`,
          message: `${h.category || 'Item'} handed over by ${h.authorizedByStaff || 'Staff'} to ${h.personName || 'Guest'} (${h.status})`,
          timestamp: h.createdAt || h.issueDate || new Date().toISOString(),
          type: 'handover',
          facilityId: 'handover-takenover',
          isRead: readIds.has(notifId),
          priority: 'normal',
        });
      });
    } catch {}

    // 3. Ingest recent parcels
    try {
      const parcels = StorageService.getParcelRecords() || [];
      const recentParcels = [...parcels]
        .sort((a, b) => new Date(b.receivedDate || b.createdAt).getTime() - new Date(a.receivedDate || a.createdAt).getTime())
        .slice(0, 10);

      recentParcels.forEach((p) => {
        if (!p.id) return;
        const notifId = `notif-p-${p.id}`;
        if (dismissedIds.has(notifId)) return;

        const isPending = p.status !== 'HANDED_TO_GUEST' && p.status !== 'DELIVERED_TO_ROOM' && p.status !== 'COLLECTED_BY_REP';

        dynamicList.push({
          id: notifId,
          title: isPending ? `Inbound Parcel Waiting: ${p.recipientName || 'Recipient'}` : `Parcel Delivered: ${p.recipientName}`,
          message: `${p.courierCompany || 'Courier'} pkg (${p.trackingNumber || 'No track'}) · Room: ${p.roomNumber || 'Office'} · Status: ${p.status}`,
          timestamp: p.receivedDate || p.createdAt || new Date().toISOString(),
          type: 'parcel',
          facilityId: 'parcel-monitoring',
          isRead: readIds.has(notifId),
          priority: isPending ? 'high' : 'normal',
        });
      });
    } catch {}

    // 4. Ingest recent Lost & Found
    try {
      const lostItems = StorageService.getLostFoundRecords() || [];
      const recentLost = [...lostItems]
        .sort((a, b) => new Date(b.dateRecorded || (b as any).createdAt || '').getTime() - new Date(a.dateRecorded || (a as any).createdAt || '').getTime())
        .slice(0, 6);

      recentLost.forEach((l) => {
        if (!l.id) return;
        const notifId = `notif-lnfd-${l.id}`;
        if (dismissedIds.has(notifId)) return;

        dynamicList.push({
          id: notifId,
          title: `Lost & Found: ${l.itemName || 'Item'} (${l.recordType || 'Reported'})`,
          message: `Location: ${l.locationFoundOrLost || 'Facility'} · Reported by: ${l.finderOrReporterName || 'Staff'}`,
          timestamp: l.dateRecorded || (l as any).createdAt || new Date().toISOString(),
          type: 'lost_found',
          facilityId: 'lost-and-found',
          isRead: readIds.has(notifId),
          priority: 'normal',
        });
      });
    } catch {}

    // 5. Ingest isolation rooms activity
    try {
      const isoRooms = StorageService.getIsolationRooms() || [];
      const occupiedRooms = isoRooms.filter((r) => r.occupants && r.occupants.length > 0);

      occupiedRooms.forEach((r) => {
        if (!r.id) return;
        const notifId = `notif-iso-${r.id}`;
        if (dismissedIds.has(notifId)) return;

        const count = r.occupants?.length || 0;
        const names = r.occupants?.map((o) => o.patientName).filter(Boolean).join(', ');
        dynamicList.push({
          id: notifId,
          title: `Isolation Room ${r.buildingNumber || r.id} Active`,
          message: `${count} occupant(s) [${names || 'Active'}] registered in ${r.building || 'Facility'}`,
          timestamp: r.lastUpdated || r.checkIn || new Date().toISOString(),
          type: 'isolation',
          facilityId: 'isolation-room',
          isRead: readIds.has(notifId),
          priority: 'normal',
        });
      });
    } catch {}

    // 6. Ingest Google Sheets Cloud Sync
    try {
      const gasCfg = GasService.getConfig();
      if (gasCfg.webAppUrl) {
        const notifId = 'notif-sys-gas';
        if (!dismissedIds.has(notifId)) {
          dynamicList.push({
            id: notifId,
            title: 'Google Sheets Cloud Sync Active',
            message: 'Connected to Google Apps Script Web App. 20 Facility tabs ready for real-time synchronization.',
            timestamp: gasCfg.lastSyncedAt || new Date().toISOString(),
            type: 'system',
            facilityId: 'sync-hub',
            isRead: readIds.has(notifId),
            priority: 'low',
          });
        }
      }
    } catch {}

    // 7. Combine Custom and Dynamic notifications
    const all = [...custom.filter((c) => !dismissedIds.has(c.id)).map((c) => ({
      ...c,
      isRead: readIds.has(c.id) || !!c.isRead,
    })), ...dynamicList];

    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  getUnreadCount(): number {
    return this.getAllNotifications().filter((n) => !n.isRead).length;
  },

  markAsRead(notificationId: string) {
    const readIds = getReadIds();
    readIds.add(notificationId);
    saveReadIds(readIds);
    window.dispatchEvent(new CustomEvent('tamimi_notifications_updated'));
  },

  markAllAsRead() {
    const all = this.getAllNotifications();
    const readIds = getReadIds();
    all.forEach((n) => readIds.add(n.id));
    saveReadIds(readIds);
    window.dispatchEvent(new CustomEvent('tamimi_notifications_updated'));
  },

  dismissNotification(notificationId: string) {
    const dismissedIds = getDismissedIds();
    dismissedIds.add(notificationId);
    saveDismissedIds(dismissedIds);

    // Also remove from custom if present
    const custom = getCustomNotifications().filter((c) => c.id !== notificationId);
    saveCustomNotifications(custom);

    window.dispatchEvent(new CustomEvent('tamimi_notifications_updated'));
  },

  clearAll() {
    const all = this.getAllNotifications();
    const dismissedIds = getDismissedIds();
    all.forEach((n) => dismissedIds.add(n.id));
    saveDismissedIds(dismissedIds);
    saveCustomNotifications([]);
    window.dispatchEvent(new CustomEvent('tamimi_notifications_updated'));
  },

  addNotification(notification: Omit<AppNotification, 'id' | 'isRead' | 'timestamp'>) {
    const custom = getCustomNotifications();
    const newNotif: AppNotification = {
      ...notification,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    custom.unshift(newNotif);
    saveCustomNotifications(custom);
    window.dispatchEvent(new CustomEvent('tamimi_notifications_updated'));
  },
};
