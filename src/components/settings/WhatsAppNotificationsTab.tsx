import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Volume2,
  Printer,
  Sparkles,
  CheckCircle2,
  BellRing,
  Bell,
  Send,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Info,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { SystemPreferences } from '../../types';
import { AuthService } from '../../services/authService';
import { AudioFeedback } from '../../utils/audioFeedback';
import {
  DesktopNotificationService,
  DesktopNotificationPermissionStatus,
} from '../../services/desktopNotificationService';

interface WhatsAppNotificationsTabProps {
  preferences: SystemPreferences;
  onPreferencesUpdate: (prefs: SystemPreferences) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppNotificationsTab: React.FC<WhatsAppNotificationsTabProps> = ({
  preferences,
  onPreferencesUpdate,
  onShowFeedback,
}) => {
  // Desktop notification settings
  const [desktopAlertsEnabled, setDesktopAlertsEnabled] = useState(
    preferences.enableBrowserDesktopAlerts ?? false
  );
  const [desktopAlertSound, setDesktopAlertSound] = useState(
    preferences.desktopAlertSound ?? true
  );
  const [permissionStatus, setPermissionStatus] = useState<DesktopNotificationPermissionStatus>(
    () => DesktopNotificationService.getPermissionStatus()
  );
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  // WhatsApp & Sound settings
  const [countryCode, setCountryCode] = useState(preferences.whatsappCountryCode || '+966');
  const [autoMessage, setAutoMessage] = useState(
    preferences.whatsappAutoMessage || 'Your facility reservation is confirmed at TAMIMI HelpDesk TAFGA.'
  );
  const [soundEnabled, setSoundEnabled] = useState(preferences.soundEffectsEnabled ?? true);
  const [confettiEnabled, setConfettiEnabled] = useState(preferences.confettiEnabled ?? true);
  const [autoPrint, setAutoPrint] = useState(preferences.autoPrintVoucher ?? false);

  // Poll / update permission state when tab is focused
  useEffect(() => {
    const updatePerm = () => {
      setPermissionStatus(DesktopNotificationService.getPermissionStatus());
    };
    updatePerm();
    window.addEventListener('focus', updatePerm);
    return () => window.removeEventListener('focus', updatePerm);
  }, []);

  // Handle Desktop Alert Toggle
  const handleToggleDesktopAlerts = async (checked: boolean) => {
    if (checked) {
      // If turning on, check/request browser permission
      const currentPerm = DesktopNotificationService.getPermissionStatus();
      if (currentPerm === 'unsupported') {
        onShowFeedback(
          'Browser Notifications are not supported in this environment or iframe.',
          'error'
        );
        setDesktopAlertsEnabled(false);
        return;
      }

      if (currentPerm === 'denied') {
        onShowFeedback(
          'Notifications are blocked in your browser. Please allow notifications in site settings.',
          'error'
        );
        setDesktopAlertsEnabled(false);
        return;
      }

      let granted = currentPerm === 'granted';
      if (!granted) {
        const reqResult = await DesktopNotificationService.requestPermission();
        setPermissionStatus(reqResult);
        granted = reqResult === 'granted';
      }

      if (granted) {
        setDesktopAlertsEnabled(true);
        const updated: SystemPreferences = {
          ...preferences,
          enableBrowserDesktopAlerts: true,
          desktopAlertSound,
        };
        AuthService.saveSystemPreferences(updated);
        onPreferencesUpdate(updated);
        onShowFeedback('Real-time desktop alerts enabled successfully!', 'success');
        AudioFeedback.playSuccessChime();
      } else {
        setDesktopAlertsEnabled(false);
        onShowFeedback('Notification permission was not granted by browser.', 'info');
      }
    } else {
      setDesktopAlertsEnabled(false);
      const updated: SystemPreferences = {
        ...preferences,
        enableBrowserDesktopAlerts: false,
      };
      AuthService.saveSystemPreferences(updated);
      onPreferencesUpdate(updated);
      onShowFeedback('Desktop alerts disabled.', 'info');
    }
  };

  // Handle Requesting Browser Permission Directly
  const handleRequestPermission = async () => {
    const res = await DesktopNotificationService.requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      onShowFeedback('Browser permission granted! You can now enable desktop alerts.', 'success');
      setDesktopAlertsEnabled(true);
      const updated: SystemPreferences = {
        ...preferences,
        enableBrowserDesktopAlerts: true,
      };
      AuthService.saveSystemPreferences(updated);
      onPreferencesUpdate(updated);
      AudioFeedback.playSuccessChime();
    } else if (res === 'denied') {
      onShowFeedback('Notifications were blocked. Check your browser address bar permissions.', 'error');
    }
  };

  // Trigger Instant Test Desktop Alert
  const handleSendTestAlert = async () => {
    setIsTestingAlert(true);
    try {
      const res = await DesktopNotificationService.sendTestAlert();
      setPermissionStatus(DesktopNotificationService.getPermissionStatus());
      if (res.success) {
        onShowFeedback(res.message, 'success');
      } else {
        onShowFeedback(res.message, 'error');
      }
    } catch (e: any) {
      onShowFeedback(e?.message || 'Failed to trigger test notification.', 'error');
    } finally {
      setIsTestingAlert(false);
    }
  };

  // Form Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemPreferences = {
      ...preferences,
      enableBrowserDesktopAlerts: desktopAlertsEnabled,
      desktopAlertSound,
      whatsappCountryCode: countryCode,
      whatsappAutoMessage: autoMessage,
      soundEffectsEnabled: soundEnabled,
      confettiEnabled: confettiEnabled,
      autoPrintVoucher: autoPrint,
    };
    const res = AuthService.saveSystemPreferences(updated);
    if (res.success) {
      onPreferencesUpdate(updated);
      onShowFeedback('Notification & alert settings saved!', 'success');
      if (soundEnabled) AudioFeedback.playSuccessChime();
    } else {
      onShowFeedback('Failed to save settings.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <BellRing className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <span>Desktop &amp; App Notifications</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage real-time browser desktop alerts for incoming bookings, guest WhatsApp message templates, acoustic sound cues, and vouchers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* CARD 1: REAL-TIME BROWSER DESKTOP NOTIFICATIONS (PRIMARY FEATURE) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900/95 border-2 border-sky-200 dark:border-sky-900/50 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/5 dark:bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header with Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Browser-Based Desktop Alerts</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Real-Time
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Native operating system notifications for incoming reservations across all 20 facilities.
                </p>
              </div>
            </div>

            {/* Live Browser Permission Status Pill */}
            <div className="shrink-0">
              {permissionStatus === 'granted' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Browser Permitted</span>
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Blocked in Browser</span>
                </span>
              ) : permissionStatus === 'unsupported' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  <span>Not Supported / Iframe</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Permission Needed</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Primary Toggle Row */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-blue-50/40 dark:from-sky-950/30 dark:to-blue-950/20 border border-sky-200/80 dark:border-sky-800/60">
              <div className="pr-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Enable Browser Desktop Alerts for Incoming Bookings
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dispatches a native OS desktop notification immediately when a guest or staff member creates a booking, or when bookings arrive via Google Sheets sync or another workstation.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  • Alerts pop up even when TAMIMI HelpDesk is running in the background or minimized.
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="enable-browser-desktop-alerts-toggle"
                  checked={desktopAlertsEnabled}
                  onChange={(e) => handleToggleDesktopAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* Sub-Option: Sound Chime with Desktop Alert */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Accompany Desktop Alert with Acoustic Chime
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Plays an executive alert tone alongside the browser notification banner.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={desktopAlertSound}
                onChange={(e) => setDesktopAlertSound(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            {/* Contextual Banner if Permission is Blocked or Needed */}
            {permissionStatus === 'denied' && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Notifications are blocked in your browser settings</p>
                  <p className="text-[11px] opacity-90">
                    To receive alerts: Click the site settings icon (padlock/tune) in your browser address bar, change <strong>Notifications</strong> to <strong>Allow</strong>, and refresh the application.
                  </p>
                </div>
              </div>
            )}

            {permissionStatus === 'default' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center space-x-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Browser permission has not been requested yet. Click to prompt your browser.</span>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer transition"
                >
                  Prompt Permission
                </button>
              </div>
            )}

            {/* Interactive Test & Preview Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Real-time channel: BroadcastChannel &amp; Cloud Polling Active</span>
              </div>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={isTestingAlert}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-black flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingAlert ? 'Sending Alert...' : 'Send Test Desktop Alert'}</span>
              </button>
            </div>

            {/* Visual OS Notification Banner Mockup */}
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Sample Native Notification Preview</span>
                <span>Clicking navigates to facility</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  🛎️
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white truncate">
                      New Booking: Executive VIP Lounge
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">Just now</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Guest: Eng. Tariq Al-Mansoor (+966 50 123 4567)
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Time: 14:00 - 15:00 · Booking Ref: #VIP-2026-9812
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: WHATSAPP GATEWAY */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp Direct Link Template</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Default Phone Country Prefix
              </label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-bold font-mono"
                placeholder="+966"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Automated WhatsApp Confirmation Intro
              </label>
              <textarea
                rows={2}
                value={autoMessage}
                onChange={(e) => setAutoMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: AUDIO & HAPTIC FEEDBACK */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Sound Effects &amp; Visual Feedback</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Audio Tone on Slot Select &amp; Booking
                </h4>
                <p className="text-[11px] text-slate-500">Play pleasant acoustic chime feedback</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Confetti Celebration Fanfare
                </h4>
                <p className="text-[11px] text-slate-500">Trigger vibrant particle burst on successful booking</p>
              </div>
              <input
                type="checkbox"
                checked={confettiEnabled}
                onChange={(e) => setConfettiEnabled(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 4: AUTO PRINT ENGINE */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Thermal Receipt &amp; Admission Print Engine</span>
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Auto-Open Print Preview on Confirmation
              </h4>
              <p className="text-[11px] text-slate-500">Automatically display admission voucher print dialog</p>
            </div>
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Notification Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
