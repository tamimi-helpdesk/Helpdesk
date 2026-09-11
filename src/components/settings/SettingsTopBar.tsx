import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NotificationPopover } from '../NotificationPopover';
import { NotificationService } from '../../services/notificationService';
import { SettingsTabId } from './SettingsSidebar';

interface SettingsTopBarProps {
  title: string;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: (q: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onNavigateFacility?: (facilityId: string) => void;
  onSelectTab?: (tab: SettingsTabId) => void;
}

export const SettingsTopBar: React.FC<SettingsTopBarProps> = ({
  title,
  onClose,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  isFullscreen = true,
  onToggleFullscreen,
  onNavigateFacility,
  onSelectTab,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => NotificationService.getUnreadCount());

  const refreshUnread = () => {
    setUnreadCount(NotificationService.getUnreadCount());
  };

  useEffect(() => {
    refreshUnread();
    const handleUpdate = () => refreshUnread();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch(searchQuery);
  };

  return (
    <header className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative z-30">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="w-full sm:w-80 relative flex items-center">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search settings, rules, facilities..."
            className="w-full pl-9 pr-20 py-2 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-3 py-1 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/80 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800 rounded-xl text-[11px] font-black transition cursor-pointer"
          >
            Search
          </button>
        </div>
      </form>

      {/* Right Top Action Bar (Notifications, Messages, Settings Active, Day/Night toggle, Fullscreen, Close) */}
      <div className="flex items-center space-x-2 self-end sm:self-auto">
        {/* Fullscreen / Expand Mode Toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}

        {/* Unified Real-time Notification Center Popover */}
        <div className="relative">
          <button
            type="button"
            data-notification-trigger="true"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`relative p-2 rounded-xl border transition cursor-pointer active:scale-95 ${
              isNotificationOpen
                ? 'bg-sky-50 dark:bg-sky-950 border-sky-400 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="System Notifications Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Connected Notification Popover */}
          <NotificationPopover
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onNavigateFacility={(facilityId) => {
              setIsNotificationOpen(false);
              if (onNavigateFacility) {
                onNavigateFacility(facilityId);
              }
            }}
          />
        </div>

        {/* Messages / Quick Audit & Activity Logs shortcut */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('audit')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Open Audit & Security Logs"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Profile / Preferences Shortcut */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('profile')}
          className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 transition cursor-pointer"
          title="Operator Profile & Account"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Day / Night Theme Switcher Pill */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-sky-400' : 'text-slate-400'}`} />
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
        </button>

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-200 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-slate-700 dark:text-slate-300 transition cursor-pointer ml-1"
          title="Close Settings (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
