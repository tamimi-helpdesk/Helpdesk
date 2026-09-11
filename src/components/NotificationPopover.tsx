import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  CalendarCheck,
  AlertTriangle,
  ArrowLeftRight,
  Package,
  Building2,
  RefreshCw,
  Megaphone,
  CheckCircle2,
  ExternalLink,
  Search,
  BellRing,
} from 'lucide-react';
import { AppNotification, NotificationService } from '../services/notificationService';
import { AuthService } from '../services/authService';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateFacility?: (facilityId: string) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (isNaN(diffMs)) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  onNavigateFacility,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'bookings' | 'services'>('all');
  const [isDesktopAlertsOn, setIsDesktopAlertsOn] = useState(() => {
    return Boolean(AuthService.getSystemPreferences().enableBrowserDesktopAlerts);
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  const refreshList = () => {
    setNotifications(NotificationService.getAllNotifications());
    setIsDesktopAlertsOn(Boolean(AuthService.getSystemPreferences().enableBrowserDesktopAlerts));
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('tamimi_notifications_updated', handleUpdate);
    window.addEventListener('tamimi_bookings_updated', handleUpdate);
    window.addEventListener('tamimi_handover_updated', handleUpdate);
    window.addEventListener('tamimi_parcels_updated', handleUpdate);
    window.addEventListener('tamimi_isolation_updated', handleUpdate);
    return () => {
      window.removeEventListener('tamimi_notifications_updated', handleUpdate);
      window.removeEventListener('tamimi_bookings_updated', handleUpdate);
      window.removeEventListener('tamimi_handover_updated', handleUpdate);
      window.removeEventListener('tamimi_parcels_updated', handleUpdate);
      window.removeEventListener('tamimi_isolation_updated', handleUpdate);
    };
  }, []);

  // Safe outside click & escape key detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. If clicked inside the popover ref
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }

      // 2. If target is inside any notification popover or trigger element
      if (
        target.closest?.('[data-notification-popover="true"]') ||
        target.closest?.('[data-notification-trigger="true"]')
      ) {
        return;
      }

      // 3. If element was unmounted/disconnected during a click handler inside the popover
      if (!target.isConnected) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const bookingsCount = notifications.filter((n) => n.type === 'booking' || n.type === 'cancellation').length;
  const servicesCount = notifications.filter((n) =>
    ['handover', 'parcel', 'isolation', 'lost_found', 'notice', 'system'].includes(n.type)
  ).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings') return n.type === 'booking' || n.type === 'cancellation';
    if (filter === 'services') return ['handover', 'parcel', 'isolation', 'lost_found', 'notice', 'system'].includes(n.type);
    return true;
  });

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    NotificationService.markAllAsRead();
    refreshList();
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    NotificationService.clearAll();
    refreshList();
  };

  const handleItemClick = (e: React.MouseEvent, n: AppNotification) => {
    e.preventDefault();
    e.stopPropagation();
    NotificationService.markAsRead(n.id);
    refreshList();
    if (n.facilityId && onNavigateFacility) {
      onNavigateFacility(n.facilityId);
      onClose();
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    NotificationService.dismissNotification(id);
    refreshList();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'cancellation':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'handover':
        return <ArrowLeftRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'parcel':
        return <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'lost_found':
        return <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'isolation':
        return <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'notice':
        return <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div
      ref={popoverRef}
      data-notification-popover="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Popover Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/90 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-950 dark:text-white leading-tight">
              Notifications Center
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All updates are read'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer active:scale-95"
              title="Mark all as read"
            >
              <CheckCheck className="w-3 h-3 text-sky-500" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer active:scale-95"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs with Live Badge Counts */}
      <div className="px-2.5 py-1.5 bg-slate-100/80 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-1 text-[11px] font-bold overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'bookings', label: 'Bookings', count: bookingsCount },
          { id: 'services', label: 'Services', count: servicesCount },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFilter(t.id as any);
            }}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
              filter === t.id
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                filter === t.id
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredNotifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No notifications in this filter
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Live updates for facilities, parcels, and handovers will appear automatically.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={(e) => handleItemClick(e, n)}
              className={`p-3 transition-colors cursor-pointer group flex items-start space-x-3 ${
                !n.isRead
                  ? 'bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-50 dark:hover:bg-sky-950/60'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Type Icon */}
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {getIcon(n.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs leading-tight truncate ${
                      !n.isRead
                        ? 'font-black text-slate-950 dark:text-white'
                        : 'font-bold text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {n.title}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {formatRelativeTime(n.timestamp)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium leading-normal">
                  {n.message}
                </p>

                {n.facilityId && (
                  <div className="mt-1 flex items-center space-x-1 text-[10px] text-sky-600 dark:text-sky-400 font-bold group-hover:underline">
                    <span>Open facility view</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              {/* Status Indicator & Dismiss */}
              <div className="flex items-center space-x-1 shrink-0">
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                )}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer status bar */}
      <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center space-x-1.5">
          <BellRing className={`w-3 h-3 ${isDesktopAlertsOn ? 'text-sky-500' : 'text-slate-400'}`} />
          <span>Desktop Alerts:</span>
          <span className={`font-bold ${isDesktopAlertsOn ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
            {isDesktopAlertsOn ? 'ON' : 'OFF'}
          </span>
        </div>
        <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Synced</span>
        </span>
      </div>
    </div>
  );
};
