import React from 'react';
import { ShieldCheck, CheckCircle, Award } from 'lucide-react';

interface OfficialStampBadgeProps {
  type?: 'APPROVED' | 'VERIFIED' | 'ISSUED' | 'CONFIDENTIAL' | 'NONE';
  signatory?: string;
  date?: string;
  refCode?: string;
}

export const OfficialStampBadge: React.FC<OfficialStampBadgeProps> = ({
  type = 'APPROVED',
  signatory = 'OPERATIONS SUPERVISOR',
  date = new Date().toISOString().split('T')[0],
  refCode = 'TAFGA-LOC-188',
}) => {
  if (!type || type === 'NONE') return null;

  const getStampConfig = () => {
    switch (type) {
      case 'APPROVED':
        return {
          border: 'border-emerald-700 text-emerald-800 bg-emerald-50/40',
          title: 'APPROVED FOR DISPATCH',
          sub: 'TAMIMI GLOBAL FACILITY MGMT',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-700 mx-auto mb-0.5" />,
        };
      case 'VERIFIED':
        return {
          border: 'border-blue-800 text-blue-900 bg-blue-50/40',
          title: 'VERIFIED & AUTHENTICATED',
          sub: 'ACCOMMODATION & HELPDESK 188',
          icon: <CheckCircle className="w-5 h-5 text-blue-800 mx-auto mb-0.5" />,
        };
      case 'ISSUED':
        return {
          border: 'border-amber-800 text-amber-900 bg-amber-50/40',
          title: 'OFFICIALLY ISSUED',
          sub: 'CENTRAL STORE & INVENTORY',
          icon: <Award className="w-5 h-5 text-amber-800 mx-auto mb-0.5" />,
        };
      case 'CONFIDENTIAL':
        return {
          border: 'border-red-800 text-red-900 bg-red-50/40',
          title: 'OFFICIAL & CONFIDENTIAL',
          sub: 'RED SEA GLOBAL / TAFGA OPS',
          icon: <ShieldCheck className="w-5 h-5 text-red-800 mx-auto mb-0.5" />,
        };
      default:
        return {
          border: 'border-slate-800 text-slate-900 bg-slate-50/40',
          title: 'OFFICIAL DOCUMENT',
          sub: 'TAMIMI GLOBAL COMPANY',
          icon: <ShieldCheck className="w-5 h-5 text-slate-800 mx-auto mb-0.5" />,
        };
    }
  };

  const config = getStampConfig();

  return (
    <div
      className={`inline-block border-2 border-dashed ${config.border} rounded-xl px-3 py-2 text-center select-none transform rotate-[-3deg] shadow-xs print:opacity-90`}
      style={{ minWidth: '170px' }}
    >
      {config.icon}
      <div className="text-[10px] font-black tracking-widest uppercase">{config.title}</div>
      <div className="text-[8px] font-bold tracking-wider opacity-85 mt-0.5">{config.sub}</div>
      <div className="border-t border-current my-1 opacity-40"></div>
      <div className="flex items-center justify-between text-[7.5px] font-mono font-bold opacity-80 px-1">
        <span>REF: {refCode}</span>
        <span>{date}</span>
      </div>
      {signatory && (
        <div className="text-[7.5px] font-mono tracking-tight font-semibold mt-0.5 opacity-90 truncate">
          BY: {signatory}
        </div>
      )}
    </div>
  );
};
