import React from 'react';
import { Check } from 'lucide-react';

interface StaffAvatarProps {
  fullName: string;
  username: string;
  avatarUrl?: string;
  gradient?: string;
  ring?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isCurrent?: boolean;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  fullName,
  username,
  avatarUrl,
  gradient = 'from-sky-500 to-indigo-600',
  ring = '',
  size = 'md',
  isCurrent = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px] rounded-xl',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-16 h-16 text-base rounded-2xl',
  };

  const initials = (username || fullName || 'ST')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative shrink-0 inline-block">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          referrerPolicy="no-referrer"
          className={`${sizeClasses[size]} object-cover shadow-sm border border-slate-200 dark:border-slate-700 ${ring}`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center font-black text-white bg-gradient-to-tr ${gradient} ${ring} shadow-sm select-none`}
        >
          {initials}
        </div>
      )}
      {isCurrent && (
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs"
          title="Active On-Duty Session"
        >
          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
        </div>
      )}
    </div>
  );
};
