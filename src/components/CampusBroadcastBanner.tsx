import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Bell, Crown, X, Volume2 } from 'lucide-react';
import { CampusBroadcastAlert } from '../types';
import { FacilityCustomizationService } from '../services/facilityCustomizationService';
import { AuthService } from '../services/authService';

export const CampusBroadcastBanner: React.FC = () => {
  const [broadcast, setBroadcast] = useState<CampusBroadcastAlert | null>(() =>
    FacilityCustomizationService.getActiveBroadcast()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setBroadcast(FacilityCustomizationService.getActiveBroadcast());
    };
    window.addEventListener('tamimi_broadcast_updated', handleUpdate);
    return () => window.removeEventListener('tamimi_broadcast_updated', handleUpdate);
  }, []);

  if (!broadcast || !broadcast.active) return null;

  const isEmergency = broadcast.priority === 'EMERGENCY';
  const isWarning = broadcast.priority === 'WARNING';
  const isVip = broadcast.priority === 'VIP';

  const handleDismiss = () => {
    FacilityCustomizationService.dismissBroadcast(broadcast.id);
  };

  return (
    <div
      className={`w-full py-2.5 px-4 flex items-center justify-between shadow-lg transition-all animate-in slide-in-from-top duration-300 z-50 ${
        isEmergency
          ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white border-b-2 border-red-400'
          : isWarning
          ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-slate-950 border-b-2 border-amber-300'
          : isVip
          ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-amber-200 border-b-2 border-amber-400/60'
          : 'bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800 text-white border-b-2 border-blue-400'
      }`}
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto flex-1">
        <div className="p-1 rounded-full bg-black/20 shrink-0">
          {isEmergency && <ShieldAlert className="w-5 h-5 animate-pulse text-white" />}
          {isWarning && <AlertTriangle className="w-5 h-5 text-slate-950" />}
          {isVip && <Crown className="w-5 h-5 text-amber-300 animate-bounce" />}
          {!isEmergency && !isWarning && !isVip && <Bell className="w-5 h-5 text-white" />}
        </div>

        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-black/25 shrink-0">
            {broadcast.priority} ALERT
          </span>
          <span className="font-bold text-xs sm:text-sm">{broadcast.title}:</span>
          <span className="text-xs sm:text-sm font-medium opacity-95">{broadcast.message}</span>
        </div>

        {AuthService.isSuperAdmin() && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-black/20 text-current transition-colors text-xs flex items-center gap-1 shrink-0"
            title="Dismiss alert across campus (Super Admin)"
          >
            <span className="hidden sm:inline font-bold text-[10px]">End Alert</span>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
