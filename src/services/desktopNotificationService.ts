import { Booking } from '../types';
import { AuthService } from './authService';
import { StorageService } from './storageService';
import { audioFeedback } from './audioFeedbackService';

export type DesktopNotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class DesktopNotificationServiceImpl {
  private knownBookingIds: Set<string> = new Set();
  private alertedBookingIds: Set<string> = new Set();
  private isInitialized: boolean = false;
  private bc: BroadcastChannel | null = null;

  constructor() {
    // Initial known IDs cache if running in browser
    if (typeof window !== 'undefined') {
      try {
        const existing = StorageService.getAllBookings() || [];
        existing.forEach((b) => {
          if (b && b.id) this.knownBookingIds.add(b.id);
        });
      } catch (e) {
        // Storage not yet ready
      }
    }
  }

  /**
   * Checks whether the current browser environment supports the Web Notifications API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Retrieves current browser permission status
   */
  public getPermissionStatus(): DesktopNotificationPermissionStatus {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission as DesktopNotificationPermissionStatus;
  }

  /**
   * Requests permission from the browser
   */
  public async requestPermission(): Promise<DesktopNotificationPermissionStatus> {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      return result as DesktopNotificationPermissionStatus;
    } catch (error) {
      console.warn('Desktop Notification permission request error:', error);
      return this.getPermissionStatus();
    }
  }

  /**
   * Check if desktop alerts are enabled by operator and granted by browser
   */
  public isEnabled(): boolean {
    const prefs = AuthService.getSystemPreferences();
    return Boolean(prefs.enableBrowserDesktopAlerts) && this.getPermissionStatus() === 'granted';
  }

  /**
   * Initializes real-time listeners across local storage, global events, and BroadcastChannel
   */
  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Cache initial existing bookings so we do not notify on existing history
    try {
      const existing = StorageService.getAllBookings() || [];
      existing.forEach((b) => {
        if (b && b.id) this.knownBookingIds.add(b.id);
      });
    } catch (e) {}

    // 1. Listen for global booking updates (local creation, gas sync, cloud restore)
    window.addEventListener('tamimi_bookings_updated', () => {
      this.checkForIncomingBookings();
    });

    // 2. Direct incoming booking event for 0ms latency
    window.addEventListener('tamimi_incoming_booking', ((e: CustomEvent<{ booking: Booking }>) => {
      if (e?.detail?.booking) {
        this.notifyBooking(e.detail.booking);
      }
    }) as EventListener);

    // 3. Multi-tab BroadcastChannel listener
    if ('BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('tamimi_helpdesk_sync_channel');
        this.bc.addEventListener('message', (evt) => {
          if (evt.data?.type === 'BOOKINGS_UPDATED') {
            if (evt.data?.newBooking) {
              this.notifyBooking(evt.data.newBooking);
            } else {
              this.checkForIncomingBookings();
            }
          }
        });
      } catch (e) {}
    }
  }

  /**
   * Scans bookings for any newly arrived bookings not present in known IDs
   */
  public checkForIncomingBookings() {
    try {
      const allBookings = StorageService.getAllBookings() || [];
      const prefs = AuthService.getSystemPreferences();
      const shouldAlert = Boolean(prefs.enableBrowserDesktopAlerts) && this.getPermissionStatus() === 'granted';

      const freshIncoming: Booking[] = [];

      for (const b of allBookings) {
        if (!b || !b.id) continue;
        if (!this.knownBookingIds.has(b.id)) {
          this.knownBookingIds.add(b.id);
          // Only alert for confirmed bookings (not cancelled or tombstones)
          if (b.status === 'CONFIRMED' && shouldAlert) {
            freshIncoming.push(b);
          }
        }
      }

      // If multiple arrive in quick succession (e.g., initial sync), notify up to 3 newest
      if (freshIncoming.length > 0 && shouldAlert) {
        freshIncoming.slice(0, 3).forEach((b) => {
          this.notifyBooking(b);
        });
      }
    } catch (e) {
      console.warn('Error checking incoming bookings for desktop notification:', e);
    }
  }

  /**
   * Dispatches a native browser desktop alert for an incoming booking
   */
  public notifyBooking(booking: Booking, options: { isTest?: boolean } = {}) {
    if (!this.isSupported()) return;

    const prefs = AuthService.getSystemPreferences();
    if (!options.isTest && !prefs.enableBrowserDesktopAlerts) {
      return;
    }

    if (this.getPermissionStatus() !== 'granted') {
      return;
    }

    if (booking.id && !options.isTest && this.alertedBookingIds.has(booking.id)) {
      return;
    }

    if (booking.id) {
      this.alertedBookingIds.add(booking.id);
      this.knownBookingIds.add(booking.id);
    }

    const facilityName = booking.facilityName || 'Facility';
    const customer = booking.customerName || 'Guest';
    const phone = booking.phoneNumber ? ` (${booking.phoneNumber})` : '';
    const slotStr =
      booking.startTime && booking.endTime
        ? `${booking.startTime} - ${booking.endTime}`
        : booking.stage || 'Slot';
    const dateStr = booking.date || 'Today';

    const title = options.isTest
      ? '🔔 TAMIMI Operations: Test Desktop Alert'
      : `🛎️ New Booking: ${facilityName}`;

    const body = options.isTest
      ? 'Desktop alerts are active and running in real-time! You will receive native system notifications for new facility reservations.'
      : `Guest: ${customer}${phone}\nTime: ${slotStr} · ${dateStr}\nBooking Ref: #${booking.id || ''}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: options.isTest ? `test-alert-${Date.now()}` : `tamimi-booking-${booking.id || Date.now()}`,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        if (booking.facilityId) {
          window.dispatchEvent(
            new CustomEvent('tamimi_navigate_facility', {
              detail: { facilityId: booking.facilityId },
            })
          );
        }
        notification.close();
      };
    } catch (err) {
      console.warn('Unable to trigger native Notification instance:', err);
    }

    // Play optional pleasant audio alert
    const soundWanted = (prefs.desktopAlertSound ?? true) || (prefs.soundEffectsEnabled ?? true);
    if (soundWanted) {
      try {
        audioFeedback.playSuccessChime();
      } catch (err) {}
    }
  }

  /**
   * Triggers a test desktop alert for administrative testing from System Settings
   */
  public async sendTestAlert(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Browser desktop notifications are not supported in this browser or iframe context.',
      };
    }

    let status = this.getPermissionStatus();
    if (status === 'default') {
      status = await this.requestPermission();
    }

    if (status !== 'granted') {
      return {
        success: false,
        message:
          status === 'denied'
            ? 'Desktop notifications are blocked by your browser. Please click the lock or settings icon in your browser address bar and allow Notifications for this site.'
            : 'Browser notification permission was not granted.',
      };
    }

    const testBooking: Booking = {
      id: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      facilityId: 'barber-booking',
      facilityName: 'Executive VIP Lounge',
      customerName: 'Eng. Tariq Al-Mansoor',
      phoneNumber: '+966 50 123 4567',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '15:00',
      status: 'CONFIRMED',
      stage: 'VIP Suite 1',
      sheetTabName: 'Barber VIP',
      durationMinutes: 60,
      slotIds: ['slot-1400'],
      numberOfGuests: 1,
      createdAt: new Date().toISOString(),
    };

    this.notifyBooking(testBooking, { isTest: true });
    return {
      success: true,
      message: 'Test desktop alert sent! Check your desktop/OS notification center.',
    };
  }
}

export const DesktopNotificationService = new DesktopNotificationServiceImpl();
