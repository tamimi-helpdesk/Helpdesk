import React from 'react';

interface LaundryLogoProps {
  className?: string;
  size?: number;
}

export const LaundryLogo: React.FC<LaundryLogoProps> = ({
  className = '',
  size = 48,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-slate-800"
      >
        <path
          d="M32 6L32 58M6 32L58 32M14 14L50 50M14 50L50 14"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="6" fill="currentColor" />
        <circle cx="16" cy="16" r="3" fill="currentColor" />
        <circle cx="48" cy="16" r="3" fill="currentColor" />
        <circle cx="16" cy="48" r="3" fill="currentColor" />
        <circle cx="48" cy="48" r="3" fill="currentColor" />
      </svg>
      <div className="flex flex-col text-slate-900 font-bold leading-tight">
        <span className="text-[16px] tracking-wide font-sans">Laundry</span>
        <span className="text-[13px] font-sans text-slate-600">لوندري</span>
      </div>
    </div>
  );
};
