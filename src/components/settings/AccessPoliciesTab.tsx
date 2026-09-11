import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  UserX,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  Sparkles,
  Sliders,
  Award,
  Users,
} from 'lucide-react';
import { SystemPreferences } from '../../types';
import { AuthService } from '../../services/authService';

interface AccessPoliciesTabProps {
  preferences: SystemPreferences;
  onPreferencesUpdate: (prefs: SystemPreferences) => void;
  onShowFeedback: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccessPoliciesTab: React.FC<AccessPoliciesTabProps> = ({
  preferences,
  onPreferencesUpdate,
  onShowFeedback,
}) => {
  // Quota & Anti-hoarding states
  const [maxDaily, setMaxDaily] = useState(preferences.maxDailyBookingsPerBadge ?? 2);
  const [maxActive, setMaxActive] = useState(preferences.maxActiveBookingsPerBadge ?? 3);
  const [allowMultiSlot, setAllowMultiSlot] = useState(preferences.allowMultiSlotBooking ?? true);
  const [cancelCutoff, setCancelCutoff] = useState(preferences.cancelCutoffMinutes ?? 60);
  const [requirePinForCancel, setRequirePinForCancel] = useState(
    preferences.requirePinForCancellation ?? true
  );

  // Curfew states
  const [curfewStart, setCurfewStart] = useState(preferences.curfewStart || '23:30');
  const [curfewEnd, setCurfewEnd] = useState(preferences.curfewEnd || '06:00');

  // Blacklist registry
  const [blacklistedBadges, setBlacklistedBadges] = useState(
    preferences.blacklistedBadges || []
  );
  const [badgeSearch, setBadgeSearch] = useState('');
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [newBadgeNo, setNewBadgeNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newUntil, setNewUntil] = useState('');

  // VIP Department Whitelist
  const [vipDepts, setVipDepts] = useState<string[]>(
    preferences.vipWhitelistDepartments || [
      'Executive Directorate',
      'Camp HSE & Security',
      'Medical Operations',
    ]
  );
  const [newVipDeptInput, setNewVipDeptInput] = useState('');

  // Add restricted badge
  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeNo.trim()) {
      onShowFeedback('Badge Number is required', 'error');
      return;
    }
    const exists = blacklistedBadges.some(
      (b) => b.badgeNo.toLowerCase() === newBadgeNo.trim().toLowerCase()
    );
    if (exists) {
      onShowFeedback('Badge number is already in the restricted registry.', 'error');
      return;
    }

    const newEntry = {
      badgeNo: newBadgeNo.trim().toUpperCase(),
      residentName: newName.trim() || 'Unspecified Resident',
      department: newDept.trim() || 'Operations',
      reason: newReason.trim() || 'Facility violation / equipment misuse',
      dateFlagged: new Date().toISOString().split('T')[0],
      suspendedUntil: newUntil || undefined,
    };

    const updatedList = [newEntry, ...blacklistedBadges];
    setBlacklistedBadges(updatedList);

    // Persist immediately
    const updated: SystemPreferences = {
      ...preferences,
      blacklistedBadges: updatedList,
    };
    AuthService.saveSystemPreferences(updated);
    onPreferencesUpdate(updated);

    AuthService.logAuditEvent(
      'BADGE_BLACKLISTED',
      `Super Admin restricted badge ${newEntry.badgeNo} (${newEntry.residentName}): ${newEntry.reason}`
    );

    onShowFeedback(`Badge ${newEntry.badgeNo} has been restricted.`, 'success');
    setShowAddBlacklistModal(false);
    setNewBadgeNo('');
    setNewName('');
    setNewDept('');
    setNewReason('');
    setNewUntil('');
  };

  // Remove badge from blacklist
  const handleRemoveBlacklist = (badgeNo: string) => {
    const updatedList = blacklistedBadges.filter((b) => b.badgeNo !== badgeNo);
    setBlacklistedBadges(updatedList);

    const updated: SystemPreferences = {
      ...preferences,
      blacklistedBadges: updatedList,
    };
    AuthService.saveSystemPreferences(updated);
    onPreferencesUpdate(updated);

    AuthService.logAuditEvent('BADGE_UNRESTRICTED', `Super Admin removed restriction for badge ${badgeNo}`);
    onShowFeedback(`Restriction removed for badge ${badgeNo}.`, 'info');
  };

  // Add VIP dept
  const handleAddVipDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newVipDeptInput.trim();
    if (!trimmed) return;
    if (vipDepts.includes(trimmed)) return;

    const updatedDepts = [...vipDepts, trimmed];
    setVipDepts(updatedDepts);
    setNewVipDeptInput('');

    const updated: SystemPreferences = {
      ...preferences,
      vipWhitelistDepartments: updatedDepts,
    };
    AuthService.saveSystemPreferences(updated);
    onPreferencesUpdate(updated);
    onShowFeedback(`Added ${trimmed} to VIP Whitelist.`, 'success');
  };

  const handleRemoveVipDept = (dept: string) => {
    const updatedDepts = vipDepts.filter((d) => d !== dept);
    setVipDepts(updatedDepts);

    const updated: SystemPreferences = {
      ...preferences,
      vipWhitelistDepartments: updatedDepts,
    };
    AuthService.saveSystemPreferences(updated);
    onPreferencesUpdate(updated);
    onShowFeedback(`Removed ${dept} from VIP Whitelist.`, 'info');
  };

  // Save all general policy settings
  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemPreferences = {
      ...preferences,
      maxDailyBookingsPerBadge: Number(maxDaily),
      maxActiveBookingsPerBadge: Number(maxActive),
      allowMultiSlotBooking: allowMultiSlot,
      cancelCutoffMinutes: Number(cancelCutoff),
      requirePinForCancellation: requirePinForCancel,
      curfewStart,
      curfewEnd,
      blacklistedBadges,
      vipWhitelistDepartments: vipDepts,
    };

    const res = AuthService.saveSystemPreferences(updated);
    if (res.success) {
      onPreferencesUpdate(updated);
      AuthService.logAuditEvent('CAMP_POLICIES_UPDATED', 'Super Admin updated camp-wide booking quotas and curfew policies.');
      onShowFeedback('Camp-wide quota and curfew policies updated successfully!', 'success');
    } else {
      onShowFeedback('Failed to save policies.', 'error');
    }
  };

  const filteredBadges = blacklistedBadges.filter(
    (b) =>
      b.badgeNo.toLowerCase().includes(badgeSearch.toLowerCase()) ||
      b.residentName.toLowerCase().includes(badgeSearch.toLowerCase()) ||
      (b.department && b.department.toLowerCase().includes(badgeSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <span>Quota, Curfew &amp; Badge Access Policies</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Super Administrator rules to prevent slot hoarding, restrict abusive badge accounts, and enforce camp night curfews.
        </p>
      </div>

      <form onSubmit={handleSavePolicies} className="space-y-6">
        {/* CARD 1: BOOKING QUOTAS & ANTI-HOARDING */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Anti-Hoarding &amp; Daily Fair-Use Limits
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Max Daily Bookings Per Badge
              </label>
              <select
                value={maxDaily}
                onChange={(e) => setMaxDaily(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              >
                <option value={1}>1 booking / day</option>
                <option value={2}>2 bookings / day (Standard)</option>
                <option value={3}>3 bookings / day</option>
                <option value={5}>5 bookings / day</option>
                <option value={999}>Unlimited (No limit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Max Active Future Bookings
              </label>
              <select
                value={maxActive}
                onChange={(e) => setMaxActive(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              >
                <option value={2}>Max 2 active sessions</option>
                <option value={3}>Max 3 active sessions</option>
                <option value={5}>Max 5 active sessions</option>
                <option value={10}>Max 10 active sessions</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Cancellation Cut-off Window
              </label>
              <select
                value={cancelCutoff}
                onChange={(e) => setCancelCutoff(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:border-sky-500"
              >
                <option value={15}>15 Minutes prior</option>
                <option value={30}>30 Minutes prior</option>
                <option value={60}>60 Minutes prior (1h)</option>
                <option value={120}>2 Hours prior</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Allow Consecutive Multi-Slot Reservations
                </h4>
                <p className="text-[11px] text-slate-500">Allow residents to book 2 consecutive hours in one session</p>
              </div>
              <input
                type="checkbox"
                checked={allowMultiSlot}
                onChange={(e) => setAllowMultiSlot(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Require Operator PIN For Cancellation
                </h4>
                <p className="text-[11px] text-slate-500">Prevent accidental cancellations without staff PIN authorization</p>
              </div>
              <input
                type="checkbox"
                checked={requirePinForCancel}
                onChange={(e) => setRequirePinForCancel(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: NIGHT CURFEW POLICIES */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Camp Night Curfew &amp; Quiet Hours Enforcement
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Curfew Lockout Starts
              </label>
              <input
                type="time"
                value={curfewStart}
                onChange={(e) => setCurfewStart(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Curfew Lockout Ends (Morning)
              </label>
              <input
                type="time"
                value={curfewEnd}
                onChange={(e) => setCurfewEnd(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: VIP & EXECUTIVE WHITELIST DEPARTMENTS */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              VIP &amp; Priority Whitelist Departments
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newVipDeptInput}
              onChange={(e) => setNewVipDeptInput(e.target.value)}
              placeholder="e.g. HSE Inspection Directorate, Aramco Audit Officers..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
            />
            <button
              type="button"
              onClick={handleAddVipDept}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {vipDepts.map((d) => (
              <span
                key={d}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                <span>⭐ {d}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVipDept(d)}
                  className="text-indigo-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save Policies Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Camp Policies</span>
          </button>
        </div>
      </form>

      {/* CARD 4: RESTRICTED & BLACKLISTED BADGES REGISTRY */}
      <div className="bg-white dark:bg-slate-900/90 border-2 border-rose-200 dark:border-rose-900/50 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Restricted &amp; Blacklisted Badges Registry ({blacklistedBadges.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Staff badge numbers restricted from creating facility bookings due to rule violations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddBlacklistModal(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Restrict Badge</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={badgeSearch}
            onChange={(e) => setBadgeSearch(e.target.value)}
            placeholder="Search restricted badges by number, name, department..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Table of restricted badges */}
        <div className="overflow-x-auto">
          {filteredBadges.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No restricted badges found. All staff badges are in good standing.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                  <th className="py-2.5 px-3">Badge No</th>
                  <th className="py-2.5 px-3">Resident Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Date Flagged</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBadges.map((b) => (
                  <tr key={b.badgeNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-black text-rose-600 dark:text-rose-400">
                      {b.badgeNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {b.residentName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{b.department || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{b.reason}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{b.dateFlagged}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveBlacklist(b.badgeNo)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Blacklist Modal */}
      {showAddBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <UserX className="w-5 h-5 text-rose-600" />
              <span>Restrict Resident Badge</span>
            </h3>

            <form onSubmit={handleAddBlacklist} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Badge Number (Required)
                </label>
                <input
                  type="text"
                  value={newBadgeNo}
                  onChange={(e) => setNewBadgeNo(e.target.value)}
                  placeholder="e.g. EMP-9821"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Resident Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mohammed Al-Otaibi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g. Logistics / Maintenance"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Violation Reason
                </label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Damaged billiard cue stick, consecutive no-show without cancellation"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlacklistModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Restrict Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
