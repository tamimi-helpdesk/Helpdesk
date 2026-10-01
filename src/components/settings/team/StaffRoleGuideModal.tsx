import React from 'react';
import { Shield, ShieldAlert, Crown, Zap, Building, Eye, Key, CheckCircle2, X, Users, AlertCircle, HelpCircle } from 'lucide-react';

interface StaffRoleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffRoleGuideModal: React.FC<StaffRoleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Team Roles, Access Matrix & Collaboration Guide
              </h3>
              <p className="text-xs text-slate-500">
                Understanding Role-Based Access Control (RBAC) and Multi-Administrator Governance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Key Principle: Multi Super Admin Collaboration */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 space-y-2">
            <div className="flex items-center space-x-2 text-sky-900 dark:text-sky-200 font-black text-sm">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Multi-Super Admin Architecture</span>
            </div>
            <p className="text-sky-950 dark:text-sky-100 leading-relaxed">
              In this system, all Super Administrators possess full master authority. A Super Admin can edit any team profile, modify permissions, assign venues, reset PINs, and manage other accounts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-semibold text-[11px]">
              <div className="flex items-start space-x-2 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Management:</strong> You can edit or delete any other Super Admin, provided at least one active Super Admin remains in the directory.
                </span>
              </div>
              <div className="flex items-start space-x-2 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Self-Protection Guard:</strong> You cannot delete or suspend your own active session account. Switch to another Super Admin first.
                </span>
              </div>
            </div>
          </div>

          {/* Role Tier Hierarchy */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Enterprise Role Tiers
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Super Admin */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                      <Crown className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      Super Administrator
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    Tier 1 (Master)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Master omni-channel authority across all campus facilities, team RBAC matrix, security audit logs, Google Sheets cloud sync, and curfew rules.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                    All Venues &amp; RBAC
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                    Audit Logs
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    Cloud Sync
                  </span>
                </div>
              </div>

              {/* Facility Operator */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      Facility Operator
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                    Tier 2 (Operations)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Universal facility operator. Manages reservations, player check-ins, parcels, lost &amp; found property, and equipment handovers across all venues.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    All Sports Bookings
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    Parcels &amp; Handovers
                  </span>
                </div>
              </div>

              {/* Camp Services Officer */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      <Building className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      Camp Services Officer
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                    Tier 2 (Logistics)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Specialized logistics desk. Handles inbound parcel deliveries, airway tracking, lost &amp; found vault custody, and asset handovers across shifts.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    Parcels Desk
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    Lost &amp; Found
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    Shift Handovers
                  </span>
                </div>
              </div>

              {/* Clinic & Isolation Officer */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                      <Shield className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      Clinic &amp; Isolation Officer
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                    Tier 2 (Medical)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Medical personnel managing medical quarantine admissions, bed tracking, patient symptoms &amp; vitals, PCR logs, and clearance certificates.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                    Isolation Ward
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    Medical Clearance
                  </span>
                </div>
              </div>

              {/* View Only Auditor */}
              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                      <Eye className="w-4 h-4" />
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-xs">
                      View Only Auditor
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Tier 3 (Audit)
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Compliance and inspection account. Read-only visibility across live schedules, bookings, and exported analytics reports without modification rights.
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                    Read Only
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                    Export Analytics
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Common Questions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              Frequently Asked Questions
            </h4>
            <div className="space-y-2.5">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Q: How do I edit another Super Admin's name, email, or PIN?
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Click the <strong>Edit</strong> or <strong>Reset PIN</strong> button on their row or card. Make your changes and click Save. As a Super Admin, your changes apply immediately.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Q: Can I delete or suspend another Super Admin?
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Yes, you can delete or suspend any other Super Admin. The only restriction is that you cannot delete your own active session, and at least one Super Admin must always remain in the system so the portal is never locked out.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Q: How does "Switch User" work?
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  The "Switch User" feature allows administrators to instantly test and operate from any staff member's perspective without logging out or re-entering passcodes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-black shadow-sm transition cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
