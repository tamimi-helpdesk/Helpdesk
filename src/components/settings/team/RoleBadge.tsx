import React from 'react';
import { Crown, Shield, Zap, Eye, User, ShieldCheck } from 'lucide-react';
import { StaffAccount, StaffRole } from '../../../types';
import { AuthService } from '../../../services/authService';

export type RoleTier = 'Admin' | 'Supervisor' | 'User';

export interface RoleBadgeProps {
  role?: StaffRole | string;
  roleTitle?: string;
  username?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badge' | 'pill' | 'dot' | 'detailed';
  showIcon?: boolean;
  interactive?: boolean;
  className?: string;
  titleOverride?: string;
}

export interface RoleTierInfo {
  tier: RoleTier;
  label: string;
  subLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  classes: {
    badge: string;
    border: string;
    text: string;
    dot: string;
  };
}

/**
 * Resolves any StaffRole or custom title into one of the three primary IAM tiers:
 * Admin, Supervisor, or User.
 */
export function resolveRoleTier(role?: StaffRole | string, roleTitle?: string): RoleTierInfo {
  const normalizedRole = (role || '').toUpperCase().trim();
  const normalizedTitle = (roleTitle || '').toLowerCase().trim();

  // 1. ADMIN TIER (Super Admin, Supreme Admin, System Administrator)
  if (
    normalizedRole === 'SUPER_ADMIN' ||
    normalizedRole === 'SUPREME_SUPER_ADMIN' ||
    normalizedRole.includes('ADMIN') ||
    normalizedTitle.includes('admin') ||
    normalizedTitle.includes('director') ||
    normalizedTitle.includes('chief')
  ) {
    return {
      tier: 'Admin',
      label: 'Admin',
      subLabel: roleTitle || 'Super Administrator',
      description: 'Full administrative authority, IAM control, and master configuration access',
      icon: Crown,
      classes: {
        badge: 'bg-amber-50 dark:bg-amber-950/80',
        border: 'border-amber-300/90 dark:border-amber-700/80',
        text: 'text-amber-800 dark:text-amber-200',
        dot: 'bg-amber-500 shadow-xs shadow-amber-400',
      },
    };
  }

  // 2. SUPERVISOR TIER (Facility Operator, Camp Services, Clinic Officer, Desk Leads)
  if (
    normalizedRole === 'FACILITY_OPERATOR' ||
    normalizedRole === 'CAMP_SERVICES_OFFICER' ||
    normalizedRole === 'CLINIC_OFFICER' ||
    normalizedRole.includes('OPERATOR') ||
    normalizedRole.includes('OFFICER') ||
    normalizedRole.includes('SUPERVISOR') ||
    normalizedTitle.includes('supervisor') ||
    normalizedTitle.includes('operator') ||
    normalizedTitle.includes('officer') ||
    normalizedTitle.includes('lead') ||
    normalizedTitle.includes('manager') ||
    normalizedTitle.includes('coordinator')
  ) {
    return {
      tier: 'Supervisor',
      label: 'Supervisor',
      subLabel: roleTitle || 'Operational Lead',
      description: 'Operational privileges for bookings, facility allocation, parcels, and campus desks',
      icon: Zap,
      classes: {
        badge: 'bg-sky-50 dark:bg-sky-950/80',
        border: 'border-sky-300/90 dark:border-sky-700/80',
        text: 'text-sky-800 dark:text-sky-200',
        dot: 'bg-sky-500 shadow-xs shadow-sky-400',
      },
    };
  }

  // 3. USER TIER (View Only, Reader, Auditor, Standard User)
  return {
    tier: 'User',
    label: 'User',
    subLabel: roleTitle || 'Standard / View Only',
    description: 'Read-only viewing and monitoring access across campus schedules and logs',
    icon: User,
    classes: {
      badge: 'bg-purple-50 dark:bg-purple-950/80',
      border: 'border-purple-300/90 dark:border-purple-700/80',
      text: 'text-purple-800 dark:text-purple-200',
      dot: 'bg-purple-500 shadow-xs shadow-purple-400',
    },
  };
}

/**
 * Visual 'Role Badge' (Admin, Supervisor, User) that appears next to usernames
 * within the user management interface for better status identification.
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  roleTitle,
  username,
  size = 'xs',
  variant = 'badge',
  showIcon = true,
  interactive = false,
  className = '',
  titleOverride,
}) => {
  // If role isn't explicitly provided but username is, attempt lookup from staff directory
  let resolvedRole = role;
  let resolvedTitle = roleTitle;

  if (!resolvedRole && username) {
    try {
      const allStaff = AuthService.getStaffAccounts(true);
      const match = allStaff.find(
        (s) => s.username.toLowerCase() === username.toLowerCase()
      );
      if (match) {
        resolvedRole = match.role;
        resolvedTitle = resolvedTitle || match.roleTitle;
      }
    } catch (e) {
      // Fallback silently to default
    }
  }

  const info = resolveRoleTier(resolvedRole, resolvedTitle);
  const IconComponent = info.icon;

  // Sizing styles
  const sizeStyles = {
    xs: {
      container: 'text-[9px] px-1.5 py-0.5 gap-1',
      icon: 'w-2.5 h-2.5',
      dot: 'w-1.5 h-1.5',
    },
    sm: {
      container: 'text-[10px] px-2 py-0.5 gap-1.5',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'text-xs px-2.5 py-1 gap-1.5',
      icon: 'w-3.5 h-3.5',
      dot: 'w-2 h-2',
    },
  }[size];

  const shapeClass = variant === 'pill' ? 'rounded-full' : 'rounded-md';

  const tooltipText =
    titleOverride ||
    `Role: ${info.tier} (${info.subLabel}) • ${info.description}`;

  return (
    <span
      title={tooltipText}
      className={`inline-flex items-center select-none font-black uppercase tracking-wider border shadow-2xs transition-all ${shapeClass} ${sizeStyles.container} ${info.classes.badge} ${info.classes.border} ${info.classes.text} ${
        interactive ? 'cursor-help hover:opacity-90 active:scale-95' : 'cursor-default'
      } ${className}`}
    >
      {/* Visual Dot if requested */}
      {variant === 'dot' && (
        <span
          className={`rounded-full shrink-0 ${sizeStyles.dot} ${info.classes.dot}`}
          aria-hidden="true"
        />
      )}

      {/* Visual Role Icon */}
      {showIcon && variant !== 'dot' && (
        <IconComponent
          className={`shrink-0 ${sizeStyles.icon}`}
          aria-hidden="true"
        />
      )}

      {/* Primary Tier Label: Admin, Supervisor, or User */}
      <span>{info.label}</span>

      {/* Detailed subtitle suffix if variant is detailed */}
      {variant === 'detailed' && info.subLabel && info.subLabel !== info.label && (
        <span className="opacity-70 font-semibold normal-case text-[85%] truncate max-w-[80px]">
          · {info.subLabel}
        </span>
      )}
    </span>
  );
};
