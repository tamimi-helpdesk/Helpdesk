import React from 'react';
import {
  TrendingUp,
  Activity,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StorageService, getTodayDateString } from '../../services/storageService';
import { FACILITIES } from '../../data/facilities';

export const AnalyticsTab: React.FC = () => {
  const allBookings = StorageService.getAllBookings();
  const todayStr = getTodayDateString();

  const todayBookings = allBookings.filter((b) => b.date === todayStr);
  const confirmed = allBookings.filter((b) => b.status === 'CONFIRMED');
  const cancelled = allBookings.filter((b) => b.status === 'CANCELLED');

  // Count by facility
  const countsByFacility: Record<string, number> = {};
  allBookings.forEach((b) => {
    countsByFacility[b.facilityName] = (countsByFacility[b.facilityName] || 0) + 1;
  });

  const sortedFacilities = Object.entries(countsByFacility).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Executive Reports &amp; Facility Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time utilization metrics, capacity trends, and booking volumes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Lifetime</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{allBookings.length}</span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block mt-1">All 20 Facilities</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Today's Active</span>
          <span className="text-2xl font-black text-sky-600 dark:text-sky-400">{todayBookings.length}</span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">Scheduled for Today</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Confirmed Rate</span>
          <span className="text-2xl font-black text-emerald-600">
            {allBookings.length ? Math.round((confirmed.length / allBookings.length) * 100) : 100}%
          </span>
          <span className="text-[10px] text-slate-500 font-bold block mt-1">{confirmed.length} Active Vouchers</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Facilities</span>
          <span className="text-2xl font-black text-purple-600">{FACILITIES.length}</span>
          <span className="text-[10px] text-slate-500 font-bold block mt-1">Available to Camp 188</span>
        </div>
      </div>

      {/* Facility Breakdown */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">
          Most Popular Facilities by Booking Volume
        </h3>

        <div className="space-y-3">
          {sortedFacilities.slice(0, 6).map(([facName, count]) => {
            const pct = allBookings.length ? Math.round((count / allBookings.length) * 100) : 0;
            return (
              <div key={facName} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200">{facName}</span>
                  <span className="text-slate-500 font-mono">{count} bookings ({pct}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
