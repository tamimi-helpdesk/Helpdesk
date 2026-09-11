/**
 * ============================================================================
 * AUTHENTICATION & ENTERPRISE SECURITY SERVICE (TAMIMI HELPDESK)
 * ============================================================================
 * Handles multi-user sessions, role-based access, credential persistence,
 * 30-minute idle auto-logout, brute-force rate-limiting & lockout,
 * session integrity verification, security audit logging, and input sanitization.
 * ============================================================================
 */

const AUTH_CRED_KEY = 'tamimi_helpdesk_auth_credentials_v2';
const AUTH_SESSION_KEY = 'tamimi_helpdesk_auth_session_v2';
const AUTH_LOCKOUT_KEY = 'tamimi_helpdesk_lockout_state_v1';
const AUTH_ACTIVITY_KEY = 'tamimi_helpdesk_last_activity_v1';
const AUTH_LOGOUT_REASON_KEY = 'tamimi_helpdesk_logout_reason_v1';
const AUTH_AUDIT_LOG_KEY = 'tamimi_helpdesk_security_audit_logs_v1';
const AUTH_STAFF_ACCOUNTS_KEY = 'tamimi_helpdesk_staff_accounts_v1';
const AUTH_ROLE_DEFAULTS_KEY = 'tamimi_helpdesk_role_defaults_v1';

export const DEFAULT_USER = 'Helpdesk';
export const DEFAULT_PASSWORD = 'Amaala@188';
export const DEFAULT_ROLE = 'FACILITY_OPERATOR';

// Super Administrator Credentials & Protection
export const SUPREME_ADMIN_EMAIL = 'limon.voice@gmail.com';
export const SUPREME_ADMIN_PASSWORD = 'Limon@2026';
export const SUPREME_ADMIN_ROLE = 'Super Administrator';

// Enterprise Security Rules
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
export const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // Warning shown when 2 minutes remain before auto-logout
export const MAX_FAILED_ATTEMPTS = 5; // Max 5 failed attempts before lockout
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout duration
export const MAX_SESSION_LIFESPAN_MS = 12 * 60 * 60 * 1000; // 12 hours absolute maximum session

export interface UserProfile {
  username: string;
  role: string;
  fullName: string;
  email?: string;
  lastLoginAt?: string;
  passwordHash: string;
  updatedAt: string;
}

export interface SessionInfo {
  isLoggedIn: boolean;
  id?: string;
  username: string;
  role: string;
  fullName: string;
  email?: string;
  loginTimestamp: number;
  lastActivityTimestamp: number;
  rememberMe: boolean;
  sessionToken: string;
  checksum?: string;
}

import { SecurityAuditEntry } from '../types';
import { FACILITIES } from '../data/facilities';

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  lastFailedAt: number | null;
}

export const AuthService = {
  /**
   * Log security events to local audit trail
   */
  logSecurityEvent(eventType: SecurityAuditEntry['eventType'], details: string, username?: string): void {
    try {
      const entry: SecurityAuditEntry = {
        id: `SEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        eventType,
        details,
        username: username || this.getUsername(),
      };
      const existingStr = localStorage.getItem(AUTH_AUDIT_LOG_KEY);
      const list: SecurityAuditEntry[] = existingStr ? JSON.parse(existingStr) : [];
      list.unshift(entry);
      // Keep last 100 security events
      if (list.length > 100) list.length = 100;
      localStorage.setItem(AUTH_AUDIT_LOG_KEY, JSON.stringify(list));
    } catch (e) {}
  },

  /**
   * General purpose audit event logging for admin actions
   */
  logAuditEvent(action: string, details: string, username?: string): void {
    this.logSecurityEvent('CONFIG_UPDATED', `[${action}] ${details}`, username);
  },

  /**
   * Get stored security audit logs
   */
  getSecurityAuditLogs(): SecurityAuditEntry[] {
    try {
      const existingStr = localStorage.getItem(AUTH_AUDIT_LOG_KEY);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Purge stored security audit logs
   */
  clearSecurityAuditLogs(): boolean {
    try {
      localStorage.removeItem(AUTH_AUDIT_LOG_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Get stored user credentials from persistent localStorage
   */
  getStoredCredentials(): UserProfile {
    try {
      const stored = localStorage.getItem(AUTH_CRED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.passwordHash) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth credentials from storage', e);
    }

    // Default initial user credentials
    const initial: UserProfile = {
      username: DEFAULT_USER,
      role: DEFAULT_ROLE,
      fullName: 'Tamimi Helpdesk Operator',
      email: 'helpdesk@tamimi.com',
      passwordHash: DEFAULT_PASSWORD,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_CRED_KEY, JSON.stringify(initial));
    } catch (e) {}

    return initial;
  },

  /**
   * Get current Brute-force lockout state
   */
  getLockoutState(): LockoutState {
    try {
      const data = localStorage.getItem(AUTH_LOCKOUT_KEY);
      if (data) {
        const parsed: LockoutState = JSON.parse(data);
        return parsed;
      }
    } catch (e) {}
    return { failedAttempts: 0, lockedUntil: null, lastFailedAt: null };
  },

  /**
   * Check if login is currently locked due to too many failed attempts
   */
  checkLockout(): { isLocked: boolean; remainingSeconds: number; remainingAttempts: number } {
    const state = this.getLockoutState();
    const now = Date.now();

    if (state.lockedUntil && state.lockedUntil > now) {
      const remainingSec = Math.ceil((state.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remainingSec, remainingAttempts: 0 };
    }

    // If lockout duration passed, reset lockout
    if (state.lockedUntil && state.lockedUntil <= now) {
      this.resetLockout();
      return { isLocked: false, remainingSeconds: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }

    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - state.failedAttempts);
    return { isLocked: false, remainingSeconds: 0, remainingAttempts };
  },

  /**
   * Record a failed login attempt for rate limiting
   */
  recordFailedAttempt(username?: string): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    const state = this.getLockoutState();
    const now = Date.now();
    const newAttempts = state.failedAttempts + 1;

    let lockedUntil: number | null = null;
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
      this.logSecurityEvent('LOCKOUT_TRIGGERED', `Account temporarily locked out for 5 minutes after 5 consecutive failed attempts.`, username);
    } else {
      this.logSecurityEvent('LOGIN_FAILURE', `Failed login attempt (${newAttempts}/${MAX_FAILED_ATTEMPTS}).`, username);
    }

    const newState: LockoutState = {
      failedAttempts: newAttempts,
      lockedUntil,
      lastFailedAt: now,
    };

    try {
      localStorage.setItem(AUTH_LOCKOUT_KEY, JSON.stringify(newState));
    } catch (e) {}

    const remainingSec = lockedUntil ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0;
    return {
      isLocked: newAttempts >= MAX_FAILED_ATTEMPTS,
      remainingSeconds: remainingSec,
      attempts: newAttempts,
    };
  },

  /**
   * Reset lockout counter on successful authentication
   */
  resetLockout(): void {
    try {
      localStorage.removeItem(AUTH_LOCKOUT_KEY);
    } catch (e) {}
  },

  /**
   * Update activity timestamp on user interaction (debounced by caller or called on events)
   */
  touchActivity(): void {
    const now = Date.now();
    try {
      sessionStorage.setItem(AUTH_ACTIVITY_KEY, String(now));
      
      // Also update active session object if present
      const sessionStr = localStorage.getItem(AUTH_SESSION_KEY);
      if (sessionStr) {
        const session: SessionInfo = JSON.parse(sessionStr);
        if (session && session.isLoggedIn) {
          session.lastActivityTimestamp = now;
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        }
      }
    } catch (e) {}
  },

  /**
   * Get remaining idle time in seconds before 30-min auto-logout
   */
  getRemainingIdleSeconds(): number {
    const session = this.getSession();
    if (!session || !session.isLoggedIn) return 0;
    const now = Date.now();
    const lastActive = session.lastActivityTimestamp || session.loginTimestamp || now;
    const elapsed = now - lastActive;
    const remainingMs = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
    return Math.ceil(remainingMs / 1000);
  },

  /**
   * Check if session is nearing idle expiration (e.g. 2 mins left)
   */
  isSessionExpiringSoon(): { isExpiring: boolean; remainingSeconds: number } {
    const remainingSec = this.getRemainingIdleSeconds();
    const isExpiring = remainingSec > 0 && remainingSec <= Math.ceil(WARNING_THRESHOLD_MS / 1000);
    return { isExpiring, remainingSeconds: remainingSec };
  },

  /**
   * Validate if current session is active and not expired due to 30-min idle timeout or max lifespan
   */
  validateSession(): { isValid: boolean; reason?: 'idle_timeout' | 'max_lifespan' | 'no_session' } {
    try {
      const sessionStr = localStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionStr) {
        return { isValid: false, reason: 'no_session' };
      }

      const session: SessionInfo = JSON.parse(sessionStr);
      if (!session || !session.isLoggedIn) {
        return { isValid: false, reason: 'no_session' };
      }

      const now = Date.now();
      const lastActive = session.lastActivityTimestamp || session.loginTimestamp || now;

      // 1. Check 30-minute idle inactivity timeout
      if (now - lastActive > IDLE_TIMEOUT_MS) {
        this.logout('idle_timeout');
        return { isValid: false, reason: 'idle_timeout' };
      }

      // 2. Check 12-hour max absolute session lifespan
      if (now - session.loginTimestamp > MAX_SESSION_LIFESPAN_MS) {
        this.logout('max_lifespan');
        return { isValid: false, reason: 'max_lifespan' };
      }

      return { isValid: true };
    } catch (e) {
      return { isValid: false, reason: 'no_session' };
    }
  },

  /**
   * Check if user currently has an active authenticated session
   */
  isLoggedIn(): boolean {
    const status = this.validateSession();
    return status.isValid;
  },

  /**
   * Get current session info
   */
  getSession(): SessionInfo | null {
    try {
      const sessionStr = localStorage.getItem(AUTH_SESSION_KEY);
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {}
    return null;
  },

  /**
   * Generate a cryptographically secure random session token
   */
  generateSessionToken(): string {
    const randomBytes = new Uint8Array(24);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randomBytes);
      return Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  /**
   * Generate a strictly unique immutable user identifier (UID)
   * Example: "UID-M3K2P-98A7F1"
   */
  generateUniqueStaffUID(): string {
    const ts = Date.now().toString(36).toUpperCase();
    let rand = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(5);
      window.crypto.getRandomValues(bytes);
      rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    } else {
      rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    return `UID-${ts}-${rand}`;
  },

  /**
   * Check if a given identifier/username represents the standard Helpdesk facility operator
   */
  isHelpdeskUser(usernameOrId?: string): boolean {
    const val = (usernameOrId || this.getUsername() || '').trim().toLowerCase();
    return (
      val === 'helpdesk' ||
      val === 'uid-sys-helpdesk-01' ||
      val === 'staff-operator-01' ||
      val === 'facility operator'
    );
  },

  /**
   * Check if current user or specified username is Super Administrator (Sole Owner: Limon Rahman)
   * Enforces strict role validation to ensure non-admins and Helpdesk can NEVER evaluate to Super Admin.
   */
  isSuperAdmin(usernameInput?: string): boolean {
    const user = (usernameInput || this.getUsername() || '').trim().toLowerCase();
    if (!user) return false;

    // Hard rejection: Helpdesk and standard operators can NEVER be Super Admin
    if (
      user === 'helpdesk' ||
      user === 'uid-sys-helpdesk-01' ||
      user === 'staff-operator-01' ||
      user === 'facility operator'
    ) {
      return false;
    }

    // Check active session
    const session = this.getSession();
    if (session && (!usernameInput || session.username.toLowerCase() === user)) {
      const sUser = (session.username || '').trim().toLowerCase();
      if (
        sUser === 'helpdesk' ||
        sUser === 'uid-sys-helpdesk-01' ||
        sUser === 'staff-operator-01' ||
        sUser === 'facility operator'
      ) {
        return false;
      }
      if (
        sUser === 'limon' ||
        sUser === 'limon.voice' ||
        sUser === 'limon.voice@gmail.com' ||
        sUser === SUPREME_ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }
    }

    // Primary Super Administrator & System Owner verification
    if (
      user === SUPREME_ADMIN_EMAIL.toLowerCase() ||
      user === 'limon' ||
      user === 'limon.voice' ||
      user === 'limon.voice@gmail.com' ||
      user === 'limon rahman'
    ) {
      return true;
    }

    // Check authoritative staff accounts directory
    try {
      const data = localStorage.getItem(AUTH_STAFF_ACCOUNTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const acc = parsed.find(
            (a: any) =>
              (a.username && a.username.toLowerCase() === user) ||
              (a.email && a.email.toLowerCase() === user) ||
              (a.id && a.id.toLowerCase() === user)
          );
          if (acc) {
            if (acc.username && acc.username.toLowerCase() === 'helpdesk') {
              return false;
            }
            return acc.role === 'SUPER_ADMIN' || acc.role === 'SUPREME_SUPER_ADMIN';
          }
        }
      }
    } catch (e) {}

    return false;
  },

  /**
   * Guard requiring active user to be a verified Super Administrator
   */
  requireSuperAdmin(actionName: string): { allowed: boolean; message: string } {
    if (!this.isSuperAdmin()) {
      return {
        allowed: false,
        message: `🔒 Access Denied: Only Super Administrators have permission to ${actionName}.`,
      };
    }
    return { allowed: true, message: '' };
  },

  /**
   * Alias for backward compatibility - checks Super Administrator status
   */
  isSupremeAdmin(usernameInput?: string): boolean {
    return this.isSuperAdmin(usernameInput);
  },

  /**
   * Check if an account or identifier refers to Limon Rahman (Permanent Master Super Admin & System Owner)
   */
  isLimonAccount(acc?: Partial<import('../types').StaffAccount> | string | null): boolean {
    if (!acc) return false;
    if (typeof acc === 'string') {
      const s = acc.toLowerCase().trim();
      return (
        s === 'limon' ||
        s === 'limon.voice' ||
        s === 'limon.voice@gmail.com' ||
        s === SUPREME_ADMIN_EMAIL.toLowerCase() ||
        s === 'limon rahman' ||
        s === 'uid-sys-limon-01' ||
        s === 'staff-002' ||
        s === 'staff-admin-01'
      );
    }
    const u = (acc.username || '').toLowerCase().trim();
    const e = (acc.email || '').toLowerCase().trim();
    const id = (acc.id || '').trim();
    const fn = (acc.fullName || '').toLowerCase().trim();
    return (
      u === 'limon' ||
      u === 'limon.voice' ||
      e === SUPREME_ADMIN_EMAIL.toLowerCase() ||
      e === 'limon.voice@gmail.com' ||
      id === 'UID-SYS-LIMON-01' ||
      id === 'STAFF-002' ||
      id === 'STAFF-ADMIN-01' ||
      fn === 'limon rahman'
    );
  },

  /**
   * Authenticate user with username/password & brute force rate limiting against Staff Directory
   */
  login(
    passwordInput: string,
    usernameInput: string = DEFAULT_USER,
    rememberMe: boolean = true
  ): { success: boolean; message: string; user?: UserProfile; isLocked?: boolean; remainingSeconds?: number } {
    // 1. Check if locked out
    const lockout = this.checkLockout();
    if (lockout.isLocked) {
      const mins = Math.floor(lockout.remainingSeconds / 60);
      const secs = lockout.remainingSeconds % 60;
      const timeDisplay = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      return {
        success: false,
        isLocked: true,
        remainingSeconds: lockout.remainingSeconds,
        message: `Account is temporarily locked due to 5 failed attempts. Please try again in ${timeDisplay}.`,
      };
    }

    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Please enter your password or PIN.' };
    }

    // 2. Fetch active staff accounts list
    const staffList = this.getStaffAccounts(true);

    // 3. Find matching account in the directory strictly
    let matchedStaff: import('../types').StaffAccount | undefined;

    if (cleanUser === '' || cleanUser === 'helpdesk') {
      matchedStaff = staffList.find((a) => a.username.toLowerCase() === 'helpdesk');
    } else {
      matchedStaff = staffList.find(
        (a) =>
          a.username.toLowerCase() === cleanUser ||
          (a.email && a.email.toLowerCase() === cleanUser) ||
          a.id.toLowerCase() === cleanUser
      );

      // Super Admin alias lookup if exact match not found
      if (!matchedStaff && (cleanUser === 'limon' || cleanUser === 'limon.voice' || cleanUser === SUPREME_ADMIN_EMAIL.toLowerCase())) {
        matchedStaff = staffList.find((a) => a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN');
      }
    }

    // If account not found in directory, reject login explicitly
    if (!matchedStaff) {
      const failed = this.recordFailedAttempt(usernameInput);
      if (failed.isLocked) {
        return {
          success: false,
          isLocked: true,
          remainingSeconds: failed.remainingSeconds,
          message: `Too many failed attempts (5/5). Account locked for 5 minutes for security.`,
        };
      }
      return {
        success: false,
        message: cleanUser === 'helpdesk' || cleanUser === ''
          ? "Account 'Helpdesk' does not exist in the staff directory. Please contact Super Administrator."
          : `User account '${usernameInput || 'specified'}' does not exist in the staff directory.`,
      };
    }

    // 4. Check if account is suspended
    if (!matchedStaff.isActive) {
      return {
        success: false,
        message: `Account '${matchedStaff.fullName}' is suspended. Please contact Super Administrator.`,
      };
    }

    // 5. Check credentials
    const isSuper = matchedStaff.role === 'SUPER_ADMIN' || (matchedStaff.role as any) === 'SUPREME_SUPER_ADMIN';
    const isHelpdeskUser = matchedStaff.username.toLowerCase() === 'helpdesk';
    const creds = this.getStoredCredentials();

    const isPassValid =
      cleanPass === matchedStaff.pinCode ||
      (matchedStaff.password && cleanPass === matchedStaff.password) ||
      (isSuper && (cleanPass === SUPREME_ADMIN_PASSWORD || cleanPass === '202688' || cleanPass === 'Limon@2026')) ||
      (isHelpdeskUser && (cleanPass === DEFAULT_PASSWORD || cleanPass === '188188' || cleanPass === 'Amaala@188' || cleanPass === creds.passwordHash)) ||
      (matchedStaff.badgeId && cleanPass === matchedStaff.badgeId) ||
      (creds.username.toLowerCase() === matchedStaff.username.toLowerCase() && cleanPass === creds.passwordHash);

    if (!isPassValid) {
      const failed = this.recordFailedAttempt(usernameInput);
      if (failed.isLocked) {
        return {
          success: false,
          isLocked: true,
          remainingSeconds: failed.remainingSeconds,
          message: `Too many failed attempts (5/5). Account locked for 5 minutes for security.`,
        };
      }
      const attemptsLeft = MAX_FAILED_ATTEMPTS - failed.attempts;
      return {
        success: false,
        message: `Incorrect password or PIN for @${matchedStaff.username}. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      };
    }

    // 6. Reset lockout on success
    this.resetLockout();

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    matchedStaff.lastLoginAt = nowIso;

    // Persist updated lastLoginAt to directory
    try {
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(staffList));
    } catch (e) {}

    // 7. Establish unified session
    const session: SessionInfo = {
      isLoggedIn: true,
      id: matchedStaff.id,
      username: matchedStaff.username,
      role: matchedStaff.roleTitle || matchedStaff.role,
      fullName: matchedStaff.fullName,
      email: matchedStaff.email,
      loginTimestamp: now,
      lastActivityTimestamp: now,
      rememberMe,
      sessionToken: this.generateSessionToken(),
    };

    try {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(AUTH_ACTIVITY_KEY, String(now));
      localStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
    } catch (e) {}

    // Legacy credentials sync
    const profile: UserProfile = {
      username: matchedStaff.username,
      role: matchedStaff.roleTitle || matchedStaff.role,
      fullName: matchedStaff.fullName,
      email: matchedStaff.email,
      passwordHash: matchedStaff.pinCode || DEFAULT_PASSWORD,
      lastLoginAt: nowIso,
      updatedAt: nowIso,
    };
    try {
      localStorage.setItem(AUTH_CRED_KEY, JSON.stringify(profile));
    } catch (e) {}

    this.logSecurityEvent(
      'LOGIN_SUCCESS',
      `Staff member '${matchedStaff.fullName}' (@${matchedStaff.username}) logged in successfully.`,
      matchedStaff.username
    );

    return {
      success: true,
      message: `Welcome back, ${matchedStaff.fullName}!`,
      user: profile,
    };
  },

  /**
   * Destroy active session and optionally record logout reason
   */
  logout(reason?: 'idle_timeout' | 'max_lifespan' | 'user_manual' | 'lock_screen'): void {
    const user = this.getUsername();
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_ACTIVITY_KEY);
      if (reason && reason !== 'user_manual') {
        localStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
      } else {
        localStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
      }

      if (reason === 'idle_timeout') {
        this.logSecurityEvent('IDLE_LOGOUT', `Auto-logout triggered due to 30 minutes of user inactivity.`, user);
      } else if (reason === 'user_manual') {
        this.logSecurityEvent('MANUAL_LOGOUT', `Operator logged out manually.`, user);
      }
    } catch (e) {
      console.warn('Error during logout', e);
    }
  },

  /**
   * Get and clear any previous logout reason (e.g. idle timeout notice for login screen)
   */
  consumeLogoutReason(): string | null {
    try {
      const reason = localStorage.getItem(AUTH_LOGOUT_REASON_KEY);
      if (reason) {
        localStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
        if (reason === 'idle_timeout') {
          return 'Session Expired: You were automatically logged out due to 30 minutes of inactivity to protect portal security.';
        }
        if (reason === 'max_lifespan') {
          return 'Session Expired: Maximum 12-hour session duration reached. Please re-authenticate.';
        }
        if (reason === 'lock_screen') {
          return 'Screen Locked: Please enter your password to unlock the portal.';
        }
      }
    } catch (e) {}
    return null;
  },

  /**
   * Change password with security validation
   */
  changePassword(oldPassword: string, newPassword: string, newUsername?: string): { success: boolean; message: string } {
    const creds = this.getStoredCredentials();

    if (oldPassword.trim() !== creds.passwordHash && oldPassword.trim() !== DEFAULT_PASSWORD) {
      return { success: false, message: 'Current password does not match. Please verify.' };
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const updated: UserProfile = {
      ...creds,
      username: newUsername && newUsername.trim() ? this.sanitizeText(newUsername.trim()) : creds.username,
      passwordHash: newPassword.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_CRED_KEY, JSON.stringify(updated));
      
      // Update session username if changed
      const session = this.getSession();
      if (session) {
        session.username = updated.username;
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      }

      this.logSecurityEvent('PASSWORD_CHANGED', `Account credentials and password updated securely.`, updated.username);
    } catch (e) {
      return { success: false, message: 'Failed to persist new credentials in storage.' };
    }

    return { success: true, message: 'Password & Account credentials updated successfully!' };
  },

  /**
   * Reset credentials back to factory defaults
   */
  resetToDefault(): { success: boolean; message: string } {
    const resetUser: UserProfile = {
      username: DEFAULT_USER,
      role: DEFAULT_ROLE,
      fullName: 'Tamimi Helpdesk Operator',
      email: 'helpdesk@tamimi.com',
      passwordHash: DEFAULT_PASSWORD,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(AUTH_CRED_KEY, JSON.stringify(resetUser));
      this.logSecurityEvent('PASSWORD_CHANGED', `Account credentials reset to default operator settings.`, DEFAULT_USER);
      return { success: true, message: `Account credentials reset to default operator settings.` };
    } catch (e) {
      return { success: false, message: 'Failed to reset credentials.' };
    }
  },

  /**
   * Sanitize text input to prevent XSS / script injection
   */
  sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/[<>]/g, '') // remove HTML tag markers
      .replace(/javascript:/gi, '') // remove JS pseudo protocols
      .replace(/data:/gi, '') // remove data URIs
      .replace(/vbscript:/gi, '') // remove vbscript
      .replace(/on\w+\s*=/gi, '') // remove inline event handlers like onload=, onclick=
      .trim();
  },

  /**
   * Sanitize value for CSV / Excel exports to prevent Formula Injection (CWE-1236)
   */
  sanitizeForCsv(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If string starts with =, +, -, @, or tab/carriage return, prepend an apostrophe
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str.replace(/"/g, '""')}`;
    }
    return str.replace(/"/g, '""');
  },

  /**
   * Get active username
   */
  getUsername(): string {
    const session = this.getSession();
    if (session && session.username) return session.username;
    const creds = this.getStoredCredentials();
    return creds.username || DEFAULT_USER;
  },

  /**
   * Get currently authenticated user details
   */
  getCurrentUser(): { id?: string; username: string; role: string; fullName: string; email?: string } | null {
    try {
      const session = this.getSession();
      if (session && session.isLoggedIn && session.username) {
        const list = this.getStaffAccounts(true);
        const staff = list.find(
          (a) =>
            (session.id && a.id === session.id) ||
            a.username.toLowerCase() === session.username.toLowerCase() ||
            (a.email && a.email.toLowerCase() === session.username.toLowerCase())
        );
        if (staff) {
          return {
            id: staff.id,
            username: staff.username,
            role: staff.roleTitle || staff.role,
            fullName: staff.fullName,
            email: staff.email,
          };
        }
        return {
          id: session.id,
          username: session.username,
          role: session.role || DEFAULT_ROLE,
          fullName: session.fullName || session.username,
          email: session.email,
        };
      }
      const creds = this.getStoredCredentials();
      const list = this.getStaffAccounts(true);
      const staff = list.find((a) => a.username.toLowerCase() === (creds.username || DEFAULT_USER).toLowerCase());
      if (staff) {
        return {
          id: staff.id,
          username: staff.username,
          role: staff.roleTitle || staff.role,
          fullName: staff.fullName,
          email: staff.email,
        };
      }
      return {
        id: 'STAFF-OPERATOR-01',
        username: creds.username || DEFAULT_USER,
        role: creds.role || DEFAULT_ROLE,
        fullName: creds.fullName || 'Tamimi Facility Operator',
        email: creds.email || 'helpdesk@tamimi.com',
      };
    } catch (e) {
      return {
        username: DEFAULT_USER,
        role: DEFAULT_ROLE,
        fullName: 'Tamimi Facility Operator',
      };
    }
  },

  /**
   * Get active user role
   */
  getUserRole(): string {
    const session = this.getSession();
    if (session && session.username && session.username.toLowerCase() === 'helpdesk') return 'Facility Operator';
    if (session && session.role) return session.role;
    const creds = this.getStoredCredentials();
    if ((creds.username || DEFAULT_USER).toLowerCase() === 'helpdesk') return 'Facility Operator';
    return creds.role || DEFAULT_ROLE;
  },

  /**
   * Get formatted staff name with role
   */
  getCurrentStaffName(): string {
    const session = this.getSession();
    if (session && session.fullName) return session.fullName;
    return `${this.getUsername()} (${this.getUserRole()})`;
  },

  /**
   * Get canonical baseline permission set based on StaffRole
   */
  getCanonicalPermissionsForRole(role: import('../types').StaffRole): Partial<import('../types').StaffAccount> {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'SUPREME_SUPER_ADMIN':
        return {
          canCreateBookings: true,
          canEditBookings: true,
          canCancelBookings: true,
          canDeleteRecords: true,
          canExportData: true,
          canManageSync: true,
          canManageUsers: true,
          canModifyRules: true,
          canManageSecurity: true,
          canManageParcels: true,
          canManageLostFound: true,
          canManageHandovers: true,
          canManageIsolation: true,
          canManageWorkflows: true,
          canAccessAuditLogs: true,
          canEmergencyLockdown: true,
          canViewPii: true,
          customOverridesActive: false,
        };
      case 'FACILITY_OPERATOR':
        return {
          canCreateBookings: true,
          canEditBookings: true,
          canCancelBookings: true,
          canDeleteRecords: false,
          canExportData: true,
          canManageSync: false,
          canManageUsers: false,
          canModifyRules: false,
          canManageSecurity: false,
          canManageParcels: true,
          canManageLostFound: true,
          canManageHandovers: true,
          canManageIsolation: true,
          canManageWorkflows: true,
          canAccessAuditLogs: false,
          canEmergencyLockdown: false,
          canViewPii: true,
          customOverridesActive: false,
        };
      case 'CAMP_SERVICES_OFFICER':
        return {
          canCreateBookings: false,
          canEditBookings: false,
          canCancelBookings: false,
          canDeleteRecords: false,
          canExportData: true,
          canManageSync: false,
          canManageUsers: false,
          canModifyRules: false,
          canManageSecurity: false,
          canManageParcels: true,
          canManageLostFound: true,
          canManageHandovers: true,
          canManageIsolation: false,
          canManageWorkflows: true,
          canAccessAuditLogs: false,
          canEmergencyLockdown: false,
          canViewPii: true,
          customOverridesActive: false,
        };
      case 'CLINIC_OFFICER':
        return {
          canCreateBookings: false,
          canEditBookings: false,
          canCancelBookings: false,
          canDeleteRecords: false,
          canExportData: true,
          canManageSync: false,
          canManageUsers: false,
          canModifyRules: false,
          canManageSecurity: false,
          canManageParcels: false,
          canManageLostFound: false,
          canManageHandovers: false,
          canManageIsolation: true,
          canManageWorkflows: false,
          canAccessAuditLogs: false,
          canEmergencyLockdown: false,
          canViewPii: true,
          customOverridesActive: false,
        };
      case 'VIEW_ONLY':
      default:
        return {
          canCreateBookings: false,
          canEditBookings: false,
          canCancelBookings: false,
          canDeleteRecords: false,
          canExportData: true,
          canManageSync: false,
          canManageUsers: false,
          canModifyRules: false,
          canManageSecurity: false,
          canManageParcels: false,
          canManageLostFound: false,
          canManageHandovers: false,
          canManageIsolation: false,
          canManageWorkflows: false,
          canAccessAuditLogs: false,
          canEmergencyLockdown: false,
          canViewPii: false,
          customOverridesActive: false,
        };
    }
  },

  /**
   * Get custom or canonical default permission set based on StaffRole
   */
  getDefaultPermissionsForRole(role: import('../types').StaffRole): Partial<import('../types').StaffAccount> {
    const canonical = this.getCanonicalPermissionsForRole(role);
    try {
      const stored = localStorage.getItem(AUTH_ROLE_DEFAULTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[role]) {
          return { ...canonical, ...parsed[role] };
        }
      }
    } catch (e) {}
    return canonical;
  },

  /**
   * Get all role default permission dictionaries
   */
  getAllRoleDefaultPermissions(): Record<string, Partial<import('../types').StaffAccount>> {
    const roles: import('../types').StaffRole[] = [
      'SUPER_ADMIN',
      'FACILITY_OPERATOR',
      'CAMP_SERVICES_OFFICER',
      'CLINIC_OFFICER',
      'VIEW_ONLY',
    ];
    const res: Record<string, Partial<import('../types').StaffAccount>> = {};
    for (const r of roles) {
      res[r] = this.getDefaultPermissionsForRole(r);
    }
    return res;
  },

  /**
   * Update role default permission and optionally cascade to all staff belonging to that role
   */
  updateRoleDefaultPermission(
    role: import('../types').StaffRole,
    permissionKey: keyof import('../types').StaffAccount,
    newValue: boolean
  ): { success: boolean; message: string } {
    try {
      const permCheck = this.requireSuperAdmin('update role permissions');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }

      // Guard: only Super Admin can have canManageUsers
      if (permissionKey === 'canManageUsers' && role !== 'SUPER_ADMIN' && role !== 'SUPREME_SUPER_ADMIN') {
        return { success: false, message: 'User Management permission is strictly reserved for Super Administrators.' };
      }

      // Read existing stored defaults
      let storedDefaults: Record<string, any> = {};
      try {
        const str = localStorage.getItem(AUTH_ROLE_DEFAULTS_KEY);
        if (str) storedDefaults = JSON.parse(str);
      } catch (e) {}

      if (!storedDefaults[role]) {
        storedDefaults[role] = { ...this.getCanonicalPermissionsForRole(role) };
      }
      storedDefaults[role][permissionKey] = newValue;
      localStorage.setItem(AUTH_ROLE_DEFAULTS_KEY, JSON.stringify(storedDefaults));

      // Cascade to non-overridden staff accounts of that role
      const staffList = this.getStaffAccounts(true);
      let updatedCount = 0;
      for (const staff of staffList) {
        if (staff.role === role && !staff.customOverridesActive) {
          (staff as any)[permissionKey] = newValue;
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(staffList));
      }

      this.logSecurityEvent('CONFIG_UPDATED', `Role default '${role}' updated: ${String(permissionKey)} = ${newValue ? 'ENABLED' : 'DISABLED'}`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Updated ${String(permissionKey)} to ${newValue ? 'Enabled' : 'Disabled'} for role ${role}.` };
    } catch (e) {
      return { success: false, message: 'Failed to update role default permission.' };
    }
  },

  /**
   * Reset all role defaults to canonical system baseline
   */
  resetAllRoleDefaultsToCanonical(): { success: boolean; message: string } {
    try {
      const permCheck = this.requireSuperAdmin('reset role defaults');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }
      localStorage.removeItem(AUTH_ROLE_DEFAULTS_KEY);
      this.logSecurityEvent('CONFIG_UPDATED', 'All role default permissions restored to system baseline.');
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: 'All role default permissions restored to standard system baseline.' };
    } catch (e) {
      return { success: false, message: 'Failed to reset role defaults.' };
    }
  },

  /**
   * Check if active operator has a specific functional permission
   * Explicitly validates roles so that 'Helpdesk' or standard operators cannot bypass restricted access.
   */
  hasPermission(permissionKey: keyof import('../types').StaffAccount): boolean {
    const currentUsername = (this.getUsername() || '').trim().toLowerCase();
    const isHelpdesk = this.isHelpdeskUser(currentUsername);

    // Highly sensitive permissions that ONLY Super Administrator can ever possess
    const superAdminOnlyPermissions: (keyof import('../types').StaffAccount)[] = [
      'canManageUsers',
      'canDeleteRecords',
      'canModifyRules',
      'canManageSecurity',
      'canEmergencyLockdown',
      'canAccessAuditLogs',
      'canManageSync',
    ];

    // Explicit hard rejection: Helpdesk can NEVER execute these restricted operations under any circumstances
    if (isHelpdesk && superAdminOnlyPermissions.includes(permissionKey)) {
      return false;
    }

    // User management is strictly locked to Super Administrator
    if (permissionKey === 'canManageUsers' && !this.isSuperAdmin()) {
      return false;
    }

    if (this.isSuperAdmin()) return true;

    const accounts = this.getStaffAccounts(true);
    const currentAcc = accounts.find(
      (a) =>
        a.username.toLowerCase() === currentUsername ||
        (a.email && a.email.toLowerCase() === currentUsername)
    );

    if (!currentAcc || !currentAcc.isActive) {
      return false;
    }

    if (currentAcc.role === 'SUPER_ADMIN' || (currentAcc.role as any) === 'SUPREME_SUPER_ADMIN') {
      return true;
    }

    // Double check: if target account is Helpdesk, deny restricted permissions
    if (this.isHelpdeskUser(currentAcc.username) && superAdminOnlyPermissions.includes(permissionKey)) {
      return false;
    }

    if (currentAcc[permissionKey] !== undefined) {
      return Boolean(currentAcc[permissionKey]);
    }
    const roleDefaults = this.getDefaultPermissionsForRole(currentAcc.role);
    return Boolean(roleDefaults[permissionKey]);
  },

  canCreateBookings(facilityId?: string): boolean {
    if (facilityId && !this.canAccessFacility(facilityId)) {
      return false;
    }
    return this.hasPermission('canCreateBookings');
  },

  canEditBookings(facilityId?: string): boolean {
    if (facilityId && !this.canAccessFacility(facilityId)) {
      return false;
    }
    return this.hasPermission('canEditBookings');
  },

  canCancelBookings(facilityId?: string): boolean {
    if (facilityId && !this.canAccessFacility(facilityId)) {
      return false;
    }
    return this.hasPermission('canCancelBookings');
  },

  canDeleteRecords(): boolean {
    return this.hasPermission('canDeleteRecords');
  },

  canExportData(): boolean {
    return this.hasPermission('canExportData');
  },

  canManageSync(): boolean {
    return this.hasPermission('canManageSync');
  },

  canManageUsers(): boolean {
    return this.hasPermission('canManageUsers');
  },

  canModifyRules(): boolean {
    return this.hasPermission('canModifyRules');
  },

  canAccessAuditLogs(): boolean {
    return this.hasPermission('canAccessAuditLogs');
  },

  canEmergencyLockdown(): boolean {
    return this.hasPermission('canEmergencyLockdown');
  },

  canManageParcels(): boolean {
    return this.hasPermission('canManageParcels');
  },

  canManageLostFound(): boolean {
    return this.hasPermission('canManageLostFound');
  },

  canManageHandovers(): boolean {
    return this.hasPermission('canManageHandovers');
  },

  canManageIsolation(): boolean {
    return this.hasPermission('canManageIsolation');
  },

  canManageWorkflows(): boolean {
    return this.hasPermission('canManageWorkflows');
  },

  canViewPii(): boolean {
    return this.hasPermission('canViewPii');
  },

  /**
   * Mask sensitive PII (Phone number, Email, Badge) if current user does not have canViewPii
   */
  maskPii(value?: string, type: 'phone' | 'email' | 'text' = 'text'): string {
    if (!value) return '';
    if (this.canViewPii()) return value;
    if (type === 'phone') {
      const clean = value.trim();
      if (clean.length <= 4) return '••••';
      return `${clean.slice(0, 4)} ••• •• ${clean.slice(-2)}`;
    }
    if (type === 'email') {
      const parts = value.split('@');
      if (parts.length === 2) {
        const user = parts[0];
        const maskedUser = user.length > 2 ? `${user[0]}•••${user[user.length - 1]}` : `${user[0]}•••`;
        return `${maskedUser}@${parts[1]}`;
      }
      return '••••@tamimi.com';
    }
    if (value.length <= 3) return '•••';
    return `${value.slice(0, 2)}••••${value.slice(-1)}`;
  },

  /**
   * Super Administrator granular permission toggle on any user
   */
  toggleStaffPermission(
    staffId: string,
    permissionKey: keyof import('../types').StaffAccount,
    forcedValue?: boolean
  ): { success: boolean; message: string; newValue?: boolean } {
    try {
      const permCheck = this.requireSuperAdmin('modify staff permissions');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === staffId || a.username.toLowerCase() === staffId.toLowerCase());
      if (!target) return { success: false, message: 'Staff user not found.' };

      // Guard: canManageUsers cannot be enabled on non-Super Admin roles
      if (permissionKey === 'canManageUsers' && target.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          message: 'User Management permission can only be granted to Super Administrators.',
        };
      }

      // Guard: Helpdesk account cannot have critical administrative permissions enabled
      if (this.isHelpdeskUser(target.username) && ['canManageUsers', 'canDeleteRecords', 'canModifyRules', 'canManageSecurity', 'canEmergencyLockdown'].includes(permissionKey)) {
        return {
          success: false,
          message: `Administrative permission '${String(permissionKey)}' cannot be assigned to Helpdesk role.`,
        };
      }

      const currentVal = (target as any)[permissionKey];
      const newVal = forcedValue !== undefined ? forcedValue : !currentVal;
      (target as any)[permissionKey] = newVal;
      target.customOverridesActive = true;

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent(
        'CONFIG_UPDATED',
        `Permission '${String(permissionKey)}' set to ${newVal ? 'ENABLED' : 'DISABLED'} for user '${target.username}' by Super Administrator.`
      );
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return {
        success: true,
        message: `Permission '${String(permissionKey)}' is now ${newVal ? 'Enabled' : 'Disabled'} for ${target.fullName}.`,
        newValue: !!newVal,
      };
    } catch (e) {
      return { success: false, message: 'Failed to update user permission.' };
    }
  },

  /**
   * Reset staff permissions to role standard defaults
   */
  resetStaffPermissionsToRoleDefaults(staffId: string): { success: boolean; message: string } {
    try {
      const permCheck = this.requireSuperAdmin('reset staff permissions');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === staffId || a.username.toLowerCase() === staffId.toLowerCase());
      if (!target) return { success: false, message: 'Staff user not found.' };

      const defaults = this.getDefaultPermissionsForRole(target.role);
      Object.assign(target, defaults);
      target.customOverridesActive = false;

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('CONFIG_UPDATED', `Permissions reset to role standard defaults for user '${target.username}'`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Permissions for '${target.fullName}' restored to default ${target.role} rules.` };
    } catch (e) {
      return { success: false, message: 'Failed to reset user permissions.' };
    }
  },

  /**
   * Assign a new role to staff member and optionally apply that role's default permissions
   */
  applyRoleToStaff(
    staffId: string,
    newRole: import('../types').StaffRole,
    customRoleTitle?: string,
    resetPermissions: boolean = true
  ): { success: boolean; message: string } {
    try {
      const permCheck = this.requireSuperAdmin('change staff roles');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === staffId || a.username.toLowerCase() === staffId.toLowerCase());
      if (!target) return { success: false, message: 'Staff user not found.' };

      // Self-protection guard for Super Admin role revocation
      const currentSession = this.getCurrentUser();
      if (
        (target.id === currentSession?.id || target.username.toLowerCase() === this.getUsername().toLowerCase()) &&
        target.role === 'SUPER_ADMIN' &&
        newRole !== 'SUPER_ADMIN'
      ) {
        return { success: false, message: 'Cannot demote your own active Super Administrator session.' };
      }

      // Helpdesk username can NEVER be escalated to SUPER_ADMIN
      if (this.isHelpdeskUser(target.username) && newRole === 'SUPER_ADMIN') {
        return { success: false, message: 'Helpdesk account cannot be promoted to Super Administrator.' };
      }

      target.role = newRole;
      if (customRoleTitle) {
        target.roleTitle = customRoleTitle;
      } else {
        switch (newRole) {
          case 'SUPER_ADMIN':
          case 'SUPREME_SUPER_ADMIN':
            target.roleTitle = 'Super Administrator';
            break;
          case 'FACILITY_OPERATOR':
            target.roleTitle = 'Facility Operator';
            break;
          case 'CAMP_SERVICES_OFFICER':
            target.roleTitle = 'Camp Services Officer';
            break;
          case 'CLINIC_OFFICER':
            target.roleTitle = 'Clinic & Isolation Officer';
            break;
          case 'VIEW_ONLY':
          default:
            target.roleTitle = 'View Only Auditor';
            break;
        }
      }

      if (resetPermissions) {
        const defaults = this.getDefaultPermissionsForRole(newRole);
        Object.assign(target, defaults);
        target.customOverridesActive = false;
      }

      // Enforce canManageUsers constraint
      target.canManageUsers = (newRole === 'SUPER_ADMIN');

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('USER_ROLE_CHANGED', `Assigned role '${target.roleTitle}' to user '${target.username}'`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Updated role for ${target.fullName} to ${target.roleTitle}.` };
    } catch (e) {
      return { success: false, message: 'Failed to apply new role.' };
    }
  },

  /**
   * Clone permissions from one staff account to one or more target accounts
   */
  cloneStaffPermissions(
    sourceStaffId: string,
    targetStaffIds: string[]
  ): { success: boolean; message: string; updatedCount?: number } {
    try {
      const permCheck = this.requireSuperAdmin('clone permissions');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message };
      }

      const list = this.getStaffAccounts(true);
      const source = list.find((a) => a.id === sourceStaffId || a.username.toLowerCase() === sourceStaffId.toLowerCase());
      if (!source) return { success: false, message: 'Source staff member not found.' };

      let updatedCount = 0;
      for (const targetId of targetStaffIds) {
        if (targetId === source.id) continue;
        const target = list.find((a) => a.id === targetId);
        if (!target) continue;

        target.canCreateBookings = source.canCreateBookings;
        target.canEditBookings = source.canEditBookings;
        target.canCancelBookings = source.canCancelBookings;
        target.canDeleteRecords = target.role === 'SUPER_ADMIN' ? source.canDeleteRecords : false;
        target.canExportData = source.canExportData;
        target.canManageSync = target.role === 'SUPER_ADMIN' ? source.canManageSync : false;
        target.canManageUsers = target.role === 'SUPER_ADMIN';
        target.canModifyRules = target.role === 'SUPER_ADMIN' ? source.canModifyRules : false;
        target.canManageSecurity = target.role === 'SUPER_ADMIN' ? source.canManageSecurity : false;
        target.canManageParcels = source.canManageParcels;
        target.canManageLostFound = source.canManageLostFound;
        target.canManageHandovers = source.canManageHandovers;
        target.canManageIsolation = source.canManageIsolation;
        target.canManageWorkflows = source.canManageWorkflows;
        target.canAccessAuditLogs = target.role === 'SUPER_ADMIN' ? source.canAccessAuditLogs : false;
        target.canEmergencyLockdown = target.role === 'SUPER_ADMIN' ? source.canEmergencyLockdown : false;
        target.customOverridesActive = true;
        updatedCount++;
      }

      if (updatedCount > 0) {
        localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
        this.logSecurityEvent('CONFIG_UPDATED', `Cloned permissions from '${source.username}' to ${updatedCount} staff members`);
        window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      }

      return {
        success: true,
        message: `Successfully cloned permissions to ${updatedCount} staff member${updatedCount !== 1 ? 's' : ''}.`,
        updatedCount,
      };
    } catch (e) {
      return { success: false, message: 'Failed to clone permissions.' };
    }
  },

  /**
   * Reset all staff permissions to their role standard defaults in one click
   */
  resetAllStaffPermissionsToRoleDefaults(): { success: boolean; message: string; count: number } {
    try {
      const permCheck = this.requireSuperAdmin('reset all staff permissions');
      if (!permCheck.allowed) {
        return { success: false, message: permCheck.message, count: 0 };
      }

      const list = this.getStaffAccounts(true);
      let count = 0;
      for (const acc of list) {
        const defaults = this.getDefaultPermissionsForRole(acc.role);
        Object.assign(acc, defaults);
        acc.canManageUsers = acc.role === 'SUPER_ADMIN';
        acc.customOverridesActive = false;
        count++;
      }
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('CONFIG_UPDATED', `All ${count} staff accounts synchronized to official role permissions`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Synchronized ${count} staff accounts to role standards.`, count };
    } catch (e) {
      return { success: false, message: 'Failed to reset all permissions.', count: 0 };
    }
  },

  /**
   * Calculate how many permission flags in an account deviate from its standard role defaults
   */
  countCustomOverrides(account: import('../types').StaffAccount): number {
    const defaults = this.getDefaultPermissionsForRole(account.role);
    const permKeys: (keyof import('../types').StaffAccount)[] = [
      'canCreateBookings',
      'canEditBookings',
      'canCancelBookings',
      'canDeleteRecords',
      'canExportData',
      'canManageSync',
      'canManageUsers',
      'canModifyRules',
      'canManageSecurity',
      'canManageParcels',
      'canManageLostFound',
      'canManageHandovers',
      'canManageIsolation',
      'canManageWorkflows',
      'canAccessAuditLogs',
      'canEmergencyLockdown',
    ];
    let diffCount = 0;
    for (const key of permKeys) {
      const currentVal = Boolean(account[key]);
      const defaultVal = Boolean(defaults[key]);
      if (currentVal !== defaultVal) {
        diffCount++;
      }
    }
    return diffCount;
  },

  /**
   * Role definitions and enterprise architecture specifications for RBAC
   */
  getRoleDefinitions(): {
    role: import('../types').StaffRole;
    title: string;
    description: string;
    departmentScope: string;
    tierLevel: string;
    icon: string;
    badgeClass: string;
    keyCapabilities: string[];
    restrictions: string[];
  }[] {
    return [
      {
        role: 'SUPER_ADMIN',
        title: 'Super Administrator',
        description: 'Full master authority across all campus facilities, team RBAC matrix, cloud sync, security audit logs, and curfew rules.',
        departmentScope: 'All Facilities & Camp Sectors',
        tierLevel: 'Tier 1 (Master)',
        icon: 'Crown',
        badgeClass: 'bg-amber-100 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        keyCapabilities: [
          'Full booking lifecycle: Create, Edit, Cancel & Delete',
          'Provision staff accounts, roles & reset security PINs',
          'Granular RBAC matrix override for any user',
          'Google Sheets & Cloud synchronization control',
          'Audit trail monitoring & Emergency lockdown control',
        ],
        restrictions: ['Cannot delete the last remaining active Super Administrator'],
      },
      {
        role: 'FACILITY_OPERATOR',
        title: 'Facility Operator',
        description: 'Universal facility operator managing reservations, player check-ins, parcels, equipment handovers, and camp lost & found.',
        departmentScope: 'All Sports & Recreational Facilities',
        tierLevel: 'Tier 2 (Operations)',
        icon: 'Zap',
        badgeClass: 'bg-sky-100 text-sky-950 dark:bg-sky-950/70 dark:text-sky-200 border-sky-300 dark:border-sky-700',
        keyCapabilities: [
          'Create, reschedule, edit & cancel slot reservations',
          'Parcel reception, airway tracking & resident handover',
          'Log lost items and process owner claim handovers',
          'Equipment turnover and shift change handover logs',
          'Export Excel & CSV operational reports',
        ],
        restrictions: [
          'No hard record deletions',
          'Cannot edit system users, credentials or permissions',
          'Cannot modify facility rules or operating hours',
        ],
      },
      {
        role: 'CAMP_SERVICES_OFFICER',
        title: 'Camp Services Officer',
        description: 'Logistics officer focused on resident parcel tracking, lost & found custody, and equipment/asset handovers across camp shifts.',
        departmentScope: 'Camp Services & Reception Desks',
        tierLevel: 'Tier 2 (Logistics)',
        icon: 'Package',
        badgeClass: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        keyCapabilities: [
          'Manage parcel deliveries, AWB tracking & resident pickup PINs',
          'Secure Lost & Found property custody & handover verification',
          'Shift-to-shift asset, radio, and key handovers',
          'Export camp service manifests and parcel logs',
        ],
        restrictions: [
          'Cannot create or modify sports & facility slot bookings',
          'No access to user management or system settings',
        ],
      },
      {
        role: 'CLINIC_OFFICER',
        title: 'Clinic & Isolation Officer',
        description: 'Medical staff managing patient intake, medical isolation ward beds, patient vitals, PCR/medical clearance, and release certificates.',
        departmentScope: 'Tamimi Health Clinic & Isolation Ward',
        tierLevel: 'Tier 2 (Medical)',
        icon: 'HeartPulse',
        badgeClass: 'bg-rose-100 text-rose-950 dark:bg-rose-950/70 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        keyCapabilities: [
          'Manage Medical Isolation Ward bed allocations',
          'Log patient intake, symptoms, vitals & PCR status',
          'Issue official medical clearance & discharge certificates',
          'Export clinical logs and health compliance metrics',
        ],
        restrictions: [
          'No booking access for sports and recreational venues',
          'No administrative or system configuration access',
        ],
      },
      {
        role: 'VIEW_ONLY',
        title: 'View Only Auditor',
        description: 'Independent auditor and compliance inspector. Read-only visibility into live schedules, logs, and analytics without editing rights.',
        departmentScope: 'All Facilities (Inspection Mode)',
        tierLevel: 'Tier 3 (Audit)',
        icon: 'Eye',
        badgeClass: 'bg-purple-100 text-purple-950 dark:bg-purple-950/70 dark:text-purple-200 border-purple-300 dark:border-purple-700',
        keyCapabilities: [
          'View all real-time booking schedules and player lists',
          'Inspect parcels, lost & found, and shift handovers',
          'Export analytics, CSV tables, and compliance reports',
        ],
        restrictions: [
          'Strictly read-only: No creation, editing, or cancellation',
          'Cannot modify any user accounts or operational settings',
        ],
      },
    ];
  },

  /**
   * Get initial default staff accounts (Limon as Super Admin, Helpdesk as Facility Operator)
   */
  getDefaultStaffAccounts(): import('../types').StaffAccount[] {
    return [
      {
        id: 'UID-SYS-LIMON-01',
        username: 'limon',
        fullName: 'Limon Rahman',
        role: 'SUPER_ADMIN',
        roleTitle: 'Super Admin',
        email: SUPREME_ADMIN_EMAIL,
        phoneNumber: '+966 50 188 7799',
        badgeId: 'EMP-0001',
        pinCode: '202688',
        assignedDepartment: 'ALL',
        assignedFacilityIds: FACILITIES.map((f) => f.id),
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canDeleteRecords: true,
        canExportData: true,
        canManageSync: true,
        canManageUsers: true,
        canModifyRules: true,
        canManageSecurity: true,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: true,
        canManageWorkflows: true,
        canAccessAuditLogs: true,
        canEmergencyLockdown: true,
        customOverridesActive: false,
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
        isImmutable: false,
      },
      {
        id: 'UID-SYS-HELPDESK-01',
        username: 'Helpdesk',
        fullName: 'Tamimi Facility Operator',
        role: 'FACILITY_OPERATOR',
        roleTitle: 'Facility Operator',
        email: 'helpdesk@tamimi.com',
        phoneNumber: '+966 50 000 0001',
        badgeId: 'EMP-0188',
        pinCode: '188188',
        assignedDepartment: 'ALL',
        assignedFacilityIds: FACILITIES.map((f) => f.id),
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canDeleteRecords: false,
        canExportData: true,
        canManageSync: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSecurity: false,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: true,
        canManageWorkflows: true,
        canAccessAuditLogs: false,
        canEmergencyLockdown: false,
        customOverridesActive: false,
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
        isImmutable: false,
      },
    ];
  },

  /**
   * Get all registered staff accounts with strictly unique UID verification, duplicate purging, and RBAC validation
   */
  getStaffAccounts(includeHidden: boolean = true): import('../types').StaffAccount[] {
    let list: import('../types').StaffAccount[] = [];
    try {
      const data = localStorage.getItem(AUTH_STAFF_ACCOUNTS_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let needsStorageSync = false;
          const currentSessionUser = this.getSession();
          const currentSessionId = currentSessionUser?.id;

          // 1. Purge unwanted mock demo accounts (tariq_camp, dr_nadia, auditor_farhan)
          const purgedList = parsed.filter((a) => {
            const u = (a.username || '').toLowerCase().trim();
            const id = a.id || '';
            const isMockDemo =
              (u === 'tariq_camp' && (id === 'STAFF-003' || !a.lastLoginAt)) ||
              (u === 'dr_nadia' && (id === 'STAFF-004' || !a.lastLoginAt)) ||
              (u === 'auditor_farhan' && (id === 'STAFF-005' || !a.lastLoginAt));
            if (isMockDemo) {
              needsStorageSync = true;
              return false;
            }
            return true;
          });

          // 2. Map and normalize accounts with UID uniqueness check
          const existingIds = new Set<string>();
          const normalized = purgedList.map((a, index) => {
            const isLimon =
              a.id === 'STAFF-ADMIN-01' ||
              a.id === 'UID-SYS-LIMON-01' ||
              a.id === 'STAFF-002' ||
              a.username?.toLowerCase() === 'limon' ||
              a.email?.toLowerCase() === SUPREME_ADMIN_EMAIL.toLowerCase();

            const isHelpdesk = this.isHelpdeskUser(a.username) || a.id === 'STAFF-OPERATOR-01' || a.id === 'UID-SYS-HELPDESK-01';

            let role: import('../types').StaffRole = a.role || 'FACILITY_OPERATOR';
            let roleTitle = a.roleTitle;
            let fullName = (a.fullName || a.username || 'Staff Member').trim();

            if (isLimon) {
              role = 'SUPER_ADMIN';
              roleTitle = roleTitle || 'Super Admin';
              fullName = fullName || 'Limon Rahman';
            } else if (isHelpdesk) {
              role = 'FACILITY_OPERATOR';
              roleTitle = roleTitle || 'Facility Operator';
            } else if (role === 'SUPER_ADMIN' || (role as any) === 'SUPREME_SUPER_ADMIN') {
              role = 'SUPER_ADMIN';
              if (!roleTitle) roleTitle = 'Super Admin';
            } else if (role === 'CAMP_SERVICES_OFFICER') {
              role = 'CAMP_SERVICES_OFFICER';
              if (!roleTitle) roleTitle = 'Camp Services Officer';
            } else if (role === 'CLINIC_OFFICER') {
              role = 'CLINIC_OFFICER';
              if (!roleTitle) roleTitle = 'Clinic & Isolation Officer';
            } else if (role === 'VIEW_ONLY' || (role as any) === 'Auditor') {
              role = 'VIEW_ONLY';
              if (!roleTitle) roleTitle = 'View Only';
            } else {
              role = 'FACILITY_OPERATOR';
              if (!roleTitle) roleTitle = 'Facility Operator';
            }

            const assignedFacilityIds = Array.isArray(a.assignedFacilityIds)
              ? a.assignedFacilityIds
              : (isLimon || role === 'SUPER_ADMIN' || isHelpdesk ? FACILITIES.map((f) => f.id) : []);

            const roleDefaults = this.getDefaultPermissionsForRole(role);

            const canManageUsers = isLimon || (a.canManageUsers !== undefined ? Boolean(a.canManageUsers) : (role === 'SUPER_ADMIN' || (role as any) === 'SUPREME_SUPER_ADMIN'));

            const canCreateBookings = isLimon
              ? true
              : a.canCreateBookings !== undefined
              ? Boolean(a.canCreateBookings)
              : Boolean(roleDefaults.canCreateBookings);

            const canEditBookings = isLimon
              ? true
              : a.canEditBookings !== undefined
              ? Boolean(a.canEditBookings)
              : Boolean(roleDefaults.canEditBookings);

            const canCancelBookings = isLimon
              ? true
              : a.canCancelBookings !== undefined
              ? Boolean(a.canCancelBookings)
              : Boolean(roleDefaults.canCancelBookings);

            const canDeleteRecords = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canDeleteRecords !== undefined
              ? Boolean(a.canDeleteRecords)
              : Boolean(roleDefaults.canDeleteRecords);

            const canExportData = isLimon
              ? true
              : a.canExportData !== undefined
              ? Boolean(a.canExportData)
              : roleDefaults.canExportData !== undefined
              ? Boolean(roleDefaults.canExportData)
              : true;

            const canManageSync = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canManageSync !== undefined
              ? Boolean(a.canManageSync)
              : Boolean(roleDefaults.canManageSync);

            const canModifyRules = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canModifyRules !== undefined
              ? Boolean(a.canModifyRules)
              : Boolean(roleDefaults.canModifyRules);

            const canManageSecurity = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canManageSecurity !== undefined
              ? Boolean(a.canManageSecurity)
              : Boolean(roleDefaults.canManageSecurity);

            const canManageParcels = isLimon
              ? true
              : a.canManageParcels !== undefined
              ? Boolean(a.canManageParcels)
              : Boolean(roleDefaults.canManageParcels);

            const canManageLostFound = isLimon
              ? true
              : a.canManageLostFound !== undefined
              ? Boolean(a.canManageLostFound)
              : Boolean(roleDefaults.canManageLostFound);

            const canManageHandovers = isLimon
              ? true
              : a.canManageHandovers !== undefined
              ? Boolean(a.canManageHandovers)
              : Boolean(roleDefaults.canManageHandovers);

            const canManageIsolation = isLimon
              ? true
              : a.canManageIsolation !== undefined
              ? Boolean(a.canManageIsolation)
              : Boolean(roleDefaults.canManageIsolation);

            const canManageWorkflows = isLimon
              ? true
              : a.canManageWorkflows !== undefined
              ? Boolean(a.canManageWorkflows)
              : assignedFacilityIds.includes('automated-workflow')
              ? true
              : roleDefaults.canManageWorkflows !== undefined
              ? Boolean(roleDefaults.canManageWorkflows)
              : true;

            const canAccessAuditLogs = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canAccessAuditLogs !== undefined
              ? Boolean(a.canAccessAuditLogs)
              : Boolean(roleDefaults.canAccessAuditLogs);

            const canEmergencyLockdown = isLimon
              ? true
              : isHelpdesk
              ? false
              : a.canEmergencyLockdown !== undefined
              ? Boolean(a.canEmergencyLockdown)
              : Boolean(roleDefaults.canEmergencyLockdown);

            // Ensure unique UID for each account
            let accountId = a.id;
            if (!accountId || existingIds.has(accountId)) {
              accountId = isLimon
                ? 'UID-SYS-LIMON-01'
                : isHelpdesk
                ? 'UID-SYS-HELPDESK-01'
                : this.generateUniqueStaffUID();
              needsStorageSync = true;
            }
            existingIds.add(accountId);

            return {
              ...a,
              id: accountId,
              username: (a.username || '').trim(),
              fullName,
              role,
              roleTitle,
              assignedFacilityIds,
              customOverridesActive: Boolean(a.customOverridesActive),
              isActive: a.isActive !== false,
              pinCode: a.pinCode || '188188',
              isImmutable: false,
              canCreateBookings,
              canEditBookings,
              canCancelBookings,
              canDeleteRecords,
              canExportData,
              canManageSync,
              canManageUsers,
              canModifyRules,
              canManageSecurity,
              canManageParcels,
              canManageLostFound,
              canManageHandovers,
              canManageIsolation,
              canManageWorkflows,
              canAccessAuditLogs,
              canEmergencyLockdown,
            };
          });

          // 3. Strict Deduplication by unique username AND UID (not by full name)
          const seenUsernames = new Map<string, import('../types').StaffAccount>();
          const seenIds = new Set<string>();

          for (const acc of normalized) {
            const lowerUser = acc.username.toLowerCase();
            if (!lowerUser) continue;

            const isCurrent = Boolean(currentSessionId && acc.id === currentSessionId);
            const isSuper = acc.role === 'SUPER_ADMIN' || (acc.role as any) === 'SUPREME_SUPER_ADMIN';

            const userConflict = seenUsernames.has(lowerUser);
            const idConflict = seenIds.has(acc.id);

            if (userConflict || idConflict) {
              needsStorageSync = true;
              const prev = seenUsernames.get(lowerUser);
              if (isCurrent || (isSuper && prev && prev.role !== 'SUPER_ADMIN')) {
                if (prev) {
                  seenUsernames.delete(prev.username.toLowerCase());
                  seenIds.delete(prev.id);
                }
                seenUsernames.set(lowerUser, acc);
                seenIds.add(acc.id);
              }
            } else {
              seenUsernames.set(lowerUser, acc);
              seenIds.add(acc.id);
            }
          }

          list = Array.from(seenUsernames.values());

          // 4. Ensure Limon Rahman (Root Master Super Admin) ALWAYS exists and is active
          const hasLimon = list.some((a) => this.isLimonAccount(a));
          if (!hasLimon) {
            const defaults = this.getDefaultStaffAccounts();
            const limonAcc = defaults.find((d) => this.isLimonAccount(d)) || defaults[0];
            list.unshift(limonAcc);
            needsStorageSync = true;
          }

          // Ensure Limon Rahman is always permanently configured with full master Super Admin privileges
          list = list.map((a) => {
            if (this.isLimonAccount(a)) {
              return {
                ...a,
                role: 'SUPER_ADMIN' as import('../types').StaffRole,
                roleTitle: a.roleTitle || 'Super Admin',
                isActive: true,
                isImmutable: true,
                canManageUsers: true,
                canDeleteRecords: true,
                canEmergencyLockdown: true,
                canManageSecurity: true,
                canManageSync: true,
                canModifyRules: true,
                canManageWorkflows: true,
                canAccessAuditLogs: true,
              };
            }
            return a;
          });

          if (needsStorageSync) {
            localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
          }
        } else {
          list = this.getDefaultStaffAccounts();
          localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
        }
      } else {
        list = this.getDefaultStaffAccounts();
        localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      }
    } catch (e) {
      list = this.getDefaultStaffAccounts();
    }

    if (!includeHidden) {
      return list.filter((a) => !a.isHidden);
    }

    return list;
  },

  /**
   * Clean up and deduplicate staff directory, removing any duplicate usernames or orphaned accounts
   */
  deduplicateStaffAccounts(): { success: boolean; message: string; count: number } {
    try {
      const guard = this.requireSuperAdmin('deduplicate the staff directory');
      if (!guard.allowed) {
        return { success: false, message: guard.reason, count: 0 };
      }

      const data = localStorage.getItem(AUTH_STAFF_ACCOUNTS_KEY);
      if (!data) return { success: true, message: 'Directory is already clean.', count: 0 };
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return { success: true, message: 'Directory is already clean.', count: 0 };

      const seenUsernames = new Set<string>();
      const seenFullNames = new Set<string>();
      const seenIds = new Set<string>();
      const cleanList: import('../types').StaffAccount[] = [];
      let removedCount = 0;

      for (const a of parsed) {
        const u = (a.username || '').toLowerCase().trim();
        const fn = (a.fullName || '').toLowerCase().trim();
        const id = a.id || '';
        if (!u || !fn || seenUsernames.has(u) || seenFullNames.has(fn) || seenIds.has(id)) {
          removedCount++;
          continue;
        }
        seenUsernames.add(u);
        seenFullNames.add(fn);
        seenIds.add(id);
        cleanList.push(a);
      }

      // Ensure at least one Super Admin
      const hasSuper = cleanList.some((a) => a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN');
      if (!hasSuper) {
        cleanList.unshift(this.getDefaultStaffAccounts()[0]);
      }

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(cleanList));
      this.logSecurityEvent('CONFIG_UPDATED', `Deduplicated staff accounts: ${removedCount} duplicates removed.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return {
        success: true,
        message: removedCount > 0 ? `Successfully removed ${removedCount} duplicate user account(s).` : 'Directory is clean. No duplicates found.',
        count: removedCount,
      };
    } catch (e) {
      return { success: false, message: 'Failed to deduplicate accounts.', count: 0 };
    }
  },

  /**
   * Reset the staff directory to standard enterprise defaults
   */
  restoreDefaultStaffDirectory(): { success: boolean; message: string; count: number } {
    try {
      const guard = this.requireSuperAdmin('restore enterprise defaults');
      if (!guard.allowed) {
        return { success: false, message: guard.reason, count: 0 };
      }

      const defaults = this.getDefaultStaffAccounts();
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(defaults));
      this.logSecurityEvent('CONFIG_UPDATED', 'Staff & User directory reset to enterprise corporate defaults.');
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Successfully restored ${defaults.length} enterprise staff accounts.`, count: defaults.length };
    } catch (e) {
      return { success: false, message: 'Failed to restore default staff directory.', count: 0 };
    }
  },

  /**
   * Toggle Active / Suspended status of a staff member
   */
  toggleStaffStatus(id: string): { success: boolean; message: string; newStatus?: boolean } {
    try {
      const guard = this.requireSuperAdmin('modify staff active status');
      if (!guard.allowed) {
        return { success: false, message: guard.reason };
      }

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === id);
      if (!target) return { success: false, message: 'Staff user not found.' };

      // Limon Rahman can NEVER be suspended
      if (this.isLimonAccount(target)) {
        return {
          success: false,
          message: '🔒 Limon Rahman is the Supreme Root Administrator and cannot be suspended.',
        };
      }

      const isTargetSuper = target.role === 'SUPER_ADMIN' || (target.role as any) === 'SUPREME_SUPER_ADMIN';

      // Safety Guard: Cannot suspend the only active Super Admin
      if (target.isActive && isTargetSuper) {
        const activeSuperAdmins = list.filter(
          (a) => (a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN') && a.isActive && a.id !== target.id
        );
        if (activeSuperAdmins.length === 0) {
          return {
            success: false,
            message: '⚠️ Cannot suspend the only active Super Administrator. At least one Super Admin must remain active.',
          };
        }
      }

      target.isActive = !target.isActive;
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent(
        'CONFIG_UPDATED',
        `Staff account '${target.username}' status changed to ${target.isActive ? 'ACTIVE' : 'SUSPENDED'}.`
      );
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return {
        success: true,
        message: `Account '${target.fullName}' is now ${target.isActive ? 'Active' : 'Suspended'}.`,
        newStatus: target.isActive,
      };
    } catch (e) {
      return { success: false, message: 'Failed to toggle account status.' };
    }
  },

  /**
   * Bulk set staff account active / suspended status
   */
  bulkSetStaffStatus(ids: string[], isActive: boolean): { success: boolean; message: string } {
    try {
      const guard = this.requireSuperAdmin('bulk update account status');
      if (!guard.allowed) {
        return { success: false, message: guard.reason };
      }

      const list = this.getStaffAccounts(true);
      let updatedCount = 0;

      for (const id of ids) {
        const target = list.find((a) => a.id === id);
        if (!target) continue;
        if (this.isLimonAccount(target)) continue; // Never suspend Limon
        target.isActive = isActive;
        updatedCount++;
      }

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent(
        'CONFIG_UPDATED',
        `Bulk updated status to ${isActive ? 'ACTIVE' : 'SUSPENDED'} for ${updatedCount} account(s).`
      );
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Successfully updated ${updatedCount} account(s).` };
    } catch (e) {
      return { success: false, message: 'Failed to bulk update account status.' };
    }
  },

  /**
   * Reset staff password or PIN
   */
  resetStaffPassword(id: string, newPinOrPass: string): { success: boolean; message: string } {
    try {
      const currentSession = this.getSession();
      const isSelf = currentSession?.id === id;
      const isSuper = this.isSuperAdmin();

      if (!isSuper && !isSelf) {
        return { success: false, message: 'Access denied: Only Super Administrators can reset passwords for other users.' };
      }

      const cleanSecret = (newPinOrPass || '').trim();
      if (!cleanSecret) return { success: false, message: 'Password/PIN cannot be empty.' };

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === id);
      if (!target) return { success: false, message: 'Staff user not found.' };

      // Set password and PIN
      target.password = cleanSecret;
      if (/^\d{4,8}$/.test(cleanSecret)) {
        target.pinCode = cleanSecret;
      }
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('PASSWORD_CHANGED', `Security credentials updated for user '${target.username}'.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Credentials updated for '${target.fullName}'.` };
    } catch (e) {
      return { success: false, message: 'Failed to update credentials.' };
    }
  },

  /**
   * Save or update a staff account with uniqueness verification
   */
  saveStaffAccount(account: import('../types').StaffAccount): { success: boolean; message: string } {
    try {
      const currentSession = this.getSession();
      const isSuper = this.isSuperAdmin();
      const isSelf = currentSession && currentSession.id === account.id;

      // Only Super Admin can create accounts or edit other users' accounts
      if (!isSuper && !isSelf) {
        return { success: false, message: 'Access denied: Only Super Administrators can create or modify staff accounts.' };
      }

      const cleanUsername = (account.username || '').trim();
      if (!cleanUsername) {
        return { success: false, message: 'Username cannot be empty.' };
      }

      const cleanFullName = (account.fullName || cleanUsername).trim();
      if (!cleanFullName) {
        return { success: false, message: 'Full name cannot be empty.' };
      }

      // Generate strictly unique UID if missing
      let accountId = account.id;
      if (!accountId) {
        accountId = this.generateUniqueStaffUID();
      }

      const list = this.getStaffAccounts(true);

      // Enforce unique username constraint across accounts
      const usernameConflict = list.find(
        (a) => a.id !== accountId && a.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (usernameConflict) {
        return {
          success: false,
          message: `Username '@${cleanUsername}' is already in use by '${usernameConflict.fullName}'. Please choose a unique username.`,
        };
      }

      const isHelpdesk = this.isHelpdeskUser(cleanUsername) || accountId === 'UID-SYS-HELPDESK-01';
      let effectiveRole = account.role;
      let effectiveRoleTitle = account.roleTitle;

      if (isHelpdesk) {
        effectiveRole = 'FACILITY_OPERATOR';
        effectiveRoleTitle = effectiveRoleTitle || 'Facility Operator';
      }

      // Non-Super Admins cannot grant themselves or others user management or security rights
      const canManageUsers = isSuper && effectiveRole === 'SUPER_ADMIN';

      const existingIdx = list.findIndex((a) => a.id === accountId);
      const isTargetLimon = this.isLimonAccount(account) || (existingIdx >= 0 && this.isLimonAccount(list[existingIdx]));

      const existingRecord = existingIdx >= 0 ? list[existingIdx] : undefined;

      const cleanedAccount: import('../types').StaffAccount = {
        ...(existingRecord || {}),
        ...account,
        id: accountId,
        username: cleanUsername,
        fullName: cleanFullName,
        role: isTargetLimon ? 'SUPER_ADMIN' : effectiveRole,
        roleTitle: effectiveRoleTitle || (isTargetLimon ? 'Super Admin' : (effectiveRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Facility Operator')),
        assignedDepartment: account.assignedDepartment || (existingRecord?.assignedDepartment || 'ALL'),
        assignedFacilityIds: Array.isArray(account.assignedFacilityIds) ? account.assignedFacilityIds : (existingRecord?.assignedFacilityIds || []),
        canManageUsers: isTargetLimon ? true : canManageUsers,
        canDeleteRecords: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canDeleteRecords)),
        canEmergencyLockdown: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canEmergencyLockdown)),
        canManageSecurity: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canManageSecurity)),
        canManageSync: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canManageSync)),
        canModifyRules: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canModifyRules)),
        canAccessAuditLogs: isTargetLimon ? true : (isHelpdesk ? false : Boolean(account.canAccessAuditLogs)),
        customOverridesActive: true,
        isActive: isTargetLimon ? true : (account.isActive !== undefined ? Boolean(account.isActive) : (existingRecord?.isActive !== undefined ? existingRecord.isActive : true)),
        isImmutable: isTargetLimon,
      };

      // Ensure password is saved or preserved
      if (account.password && account.password.trim()) {
        cleanedAccount.password = account.password.trim();
      } else if (existingRecord?.password) {
        cleanedAccount.password = existingRecord.password;
      }

      // Ensure PIN code is saved or preserved
      if (account.pinCode && account.pinCode.trim()) {
        cleanedAccount.pinCode = account.pinCode.trim();
      } else if (existingRecord?.pinCode) {
        cleanedAccount.pinCode = existingRecord.pinCode;
      }

      if (existingIdx >= 0) {
        list[existingIdx] = cleanedAccount;
      } else {
        list.push(cleanedAccount);
      }

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));

      // Synchronize Operator Profile storage so changes persist seamlessly across views
      try {
        const userProfileKey = `tamimi_operator_profile_v3_${cleanUsername.toLowerCase()}`;
        const storedProfileStr = localStorage.getItem(userProfileKey);
        const nameParts = cleanFullName.split(' ');
        const firstName = nameParts[0] || cleanFullName;
        const lastName = nameParts.slice(1).join(' ') || '';

        const existingProfile = storedProfileStr ? JSON.parse(storedProfileStr) : {};
        const updatedProfile = {
          ...existingProfile,
          firstName,
          lastName,
          roleTitle: cleanedAccount.roleTitle,
          badgeId: cleanedAccount.badgeId || existingProfile.badgeId || '',
          email: cleanedAccount.email || existingProfile.email || '',
          phoneNumber: cleanedAccount.phoneNumber || existingProfile.phoneNumber || '',
          department: cleanedAccount.assignedDepartment === 'ALL' ? 'Executive Helpdesk & Camp Operations' : (cleanedAccount.assignedDepartment || 'Camp Operations'),
          avatarUrl: cleanedAccount.avatarUrl || existingProfile.avatarUrl || '',
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(userProfileKey, JSON.stringify(updatedProfile));
      } catch (e) {}

      // If this account is the active session user, update active session state
      const currentUname = this.getUsername();
      if (
        currentUname &&
        (currentUname.toLowerCase() === cleanUsername ||
          currentUname.toLowerCase() === account.username?.toLowerCase() ||
          accountId === currentSession?.id)
      ) {
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            username: cleanUsername,
            fullName: cleanFullName,
            role: cleanedAccount.role,
            email: cleanedAccount.email || currentSession.email,
          };
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedSession));
        }

        try {
          const creds = this.getStoredCredentials();
          if (
            creds.username.toLowerCase() === cleanUsername ||
            creds.username.toLowerCase() === account.username?.toLowerCase()
          ) {
            localStorage.setItem(
              'tamimi_helpdesk_auth_credentials_v2',
              JSON.stringify({
                ...creds,
                username: cleanUsername,
                fullName: cleanFullName,
                email: cleanedAccount.email || creds.email,
                pinCode: cleanedAccount.pinCode || creds.pinCode,
                password: cleanedAccount.password || creds.password,
                role: cleanedAccount.role,
              })
            );
          }
        } catch (e) {}
      }

      this.logSecurityEvent('CONFIG_UPDATED', `Staff user profile '${cleanUsername}' (${cleanedAccount.roleTitle}) saved.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      window.dispatchEvent(new CustomEvent('tamimi_profile_updated'));
      return { success: true, message: `Staff user '${cleanedAccount.fullName}' saved successfully!` };
    } catch (e) {
      return { success: false, message: 'Failed to save staff user to local storage.' };
    }
  },

  /**
   * Save full list of staff accounts
   */
  saveStaffAccounts(accounts: import('../types').StaffAccount[]) {
    try {
      if (Array.isArray(accounts)) {
        localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(accounts));
        window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      }
    } catch (e) {}
  },

  /**
   * Delete a staff account
   * Safety Guards:
   * 1. Limon Rahman CAN NEVER BE DELETED by anyone (even another Super Admin).
   * 2. Limon Rahman can delete ANY OTHER user.
   * 3. Cannot delete your own currently active logged-in session account.
   * 4. Must maintain at least ONE active Super Administrator in the system.
   */
  deleteStaffAccount(id: string): { success: boolean; message: string } {
    try {
      const guard = this.requireSuperAdmin('delete staff user accounts');
      if (!guard.allowed) {
        return { success: false, message: guard.reason };
      }

      const list = this.getStaffAccounts(true);
      const target = list.find((a) => a.id === id);
      if (!target) return { success: false, message: 'Staff user not found.' };

      // ROOT PROTECTION: Limon Rahman CAN NEVER BE DELETED BY ANYONE
      if (this.isLimonAccount(target)) {
        return {
          success: false,
          message: '🔒 Protected Root Account: Limon Rahman is the permanent Master Administrator. This account cannot be deleted by anyone, including other Super Administrators.',
        };
      }

      const currentSessionUser = this.getCurrentUser();
      const currentSessionId = currentSessionUser?.id;
      const currentUsername = currentSessionUser?.username?.toLowerCase();

      // Guard 1: Cannot delete your own active logged-in session account
      if (currentSessionId && target.id === currentSessionId) {
        return {
          success: false,
          message: '⚠️ Cannot delete your own active session account. Switch to another Super Administrator first.',
        };
      }
      if (!currentSessionId && currentUsername && target.username.toLowerCase() === currentUsername) {
        const sameUsernames = list.filter((a) => a.username.toLowerCase() === currentUsername);
        if (sameUsernames.length <= 1) {
          return {
            success: false,
            message: '⚠️ Cannot delete your own active session account. Switch to another Super Administrator first.',
          };
        }
      }

      // Guard 2: If target is a Super Admin, ensure at least one other active Super Admin remains in the directory
      const isTargetSuper = target.role === 'SUPER_ADMIN' || (target.role as any) === 'SUPREME_SUPER_ADMIN';
      if (isTargetSuper) {
        const otherActiveSuperAdmins = list.filter(
          (a) =>
            (a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN') &&
            a.id !== target.id &&
            a.isActive
        );
        if (otherActiveSuperAdmins.length === 0) {
          return {
            success: false,
            message: '⚠️ Cannot delete the last remaining active Super Administrator. The system must have at least one Super Admin.',
          };
        }
      }

      // Delete strictly by exact ID
      const filtered = list.filter((a) => a.id !== target.id);
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(filtered));
      this.logSecurityEvent('CONFIG_UPDATED', `Staff user account '${target.username}' (${target.fullName}) was deleted.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Staff account '${target.fullName}' removed successfully.` };
    } catch (e) {
      return { success: false, message: 'Failed to delete staff account.' };
    }
  },

  /**
   * Bulk Delete staff accounts
   */
  bulkDeleteStaffAccounts(ids: string[]): { success: boolean; message: string; deletedCount: number } {
    try {
      const guard = this.requireSuperAdmin('bulk delete staff accounts');
      if (!guard.allowed) {
        return { success: false, message: guard.reason, deletedCount: 0 };
      }

      if (!ids || ids.length === 0) return { success: false, message: 'No accounts selected.', deletedCount: 0 };
      const list = this.getStaffAccounts(true);
      const toDeleteSet = new Set(ids);
      const currentSessionUser = this.getCurrentUser();
      const currentUsername = currentSessionUser?.username?.toLowerCase();

      const filtered = list.filter((a) => {
        if (!toDeleteSet.has(a.id)) return true;
        // Limon Rahman can NEVER be deleted in bulk
        if (this.isLimonAccount(a)) return true;
        // Cannot delete current active session
        if (currentUsername && (a.username.toLowerCase() === currentUsername || a.id === currentSessionUser?.id)) {
          return true;
        }
        return false;
      });

      // Guard: At least 1 Super Admin must remain
      const remainingSuperAdmins = filtered.filter(
        (a) => a.role === 'SUPER_ADMIN' || (a.role as any) === 'SUPREME_SUPER_ADMIN'
      );
      if (remainingSuperAdmins.length === 0) {
        return {
          success: false,
          message: '⚠️ Cannot delete selected accounts because it would remove all Super Administrators. At least one Super Admin must remain.',
          deletedCount: 0,
        };
      }

      const deletedCount = list.length - filtered.length;
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(filtered));
      this.logSecurityEvent('CONFIG_UPDATED', `Bulk deleted ${deletedCount} staff user accounts.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Successfully removed ${deletedCount} staff accounts.`, deletedCount };
    } catch (e) {
      return { success: false, message: 'Failed to perform bulk deletion.', deletedCount: 0 };
    }
  },

  /**
   * Bulk Toggle Staff Active Status
   */
  bulkToggleStaffStatus(ids: string[], newActiveState: boolean): { success: boolean; message: string; updatedCount: number } {
    try {
      const guard = this.requireSuperAdmin('bulk modify staff accounts');
      if (!guard.allowed) {
        return { success: false, message: guard.reason, updatedCount: 0 };
      }

      if (!ids || ids.length === 0) return { success: false, message: 'No accounts selected.', updatedCount: 0 };
      const list = this.getStaffAccounts(true);
      const idSet = new Set(ids);
      let updatedCount = 0;

      list.forEach((a) => {
        if (idSet.has(a.id)) {
          a.isActive = newActiveState;
          updatedCount++;
        }
      });

      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('CONFIG_UPDATED', `Bulk updated status to ${newActiveState ? 'ACTIVE' : 'SUSPENDED'} for ${updatedCount} staff accounts.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Successfully updated ${updatedCount} staff accounts to ${newActiveState ? 'Active' : 'Suspended'}.`, updatedCount };
    } catch (e) {
      return { success: false, message: 'Failed to update accounts status.', updatedCount: 0 };
    }
  },

  /**
   * Fast Switch active operational staff account (Internal verified handover)
   */
  switchActiveStaff(account: import('../types').StaffAccount): { success: boolean; message: string } {
    try {
      const now = Date.now();
      const session: SessionInfo = {
        isLoggedIn: true,
        id: account.id,
        username: account.username,
        role: account.roleTitle || account.role,
        fullName: account.fullName,
        email: account.email,
        loginTimestamp: now,
        lastActivityTimestamp: now,
        rememberMe: true,
        sessionToken: this.generateSessionToken(),
      };

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(AUTH_ACTIVITY_KEY, String(now));

      this.logSecurityEvent('LOGIN_SUCCESS', `Operator session transitioned to '${account.fullName}' (${account.roleTitle || account.role}).`, account.username);
      window.dispatchEvent(new CustomEvent('tamimi_staff_switched', { detail: account }));
      window.dispatchEvent(new CustomEvent('tamimi_profile_updated'));
      return { success: true, message: `Active operator switched to ${account.fullName}!` };
    } catch (e) {
      return { success: false, message: 'Failed to switch active operator.' };
    }
  },

  /**
   * Securely switch active operational staff account with mandatory credential verification.
   * Prevents unauthorized escalation (e.g. Operator switching to Administrator without admin credentials).
   */
  verifyAndSwitchStaff(
    targetAccount: import('../types').StaffAccount,
    secretInput: string
  ): { success: boolean; message: string } {
    const cleanPass = (secretInput || '').trim();
    if (!cleanPass) {
      return { success: false, message: 'Password or 6-digit Terminal PIN is required to authorize account switch.' };
    }

    const isSuper = targetAccount.role === 'SUPER_ADMIN' || (targetAccount.role as any) === 'SUPREME_SUPER_ADMIN';
    const isHelpdeskUser = targetAccount.username.toLowerCase() === 'helpdesk';
    const creds = this.getStoredCredentials();

    // Check credentials against the TARGET user's credentials
    const isPassValid =
      (targetAccount.pinCode && cleanPass === targetAccount.pinCode) ||
      (targetAccount.password && cleanPass === targetAccount.password) ||
      (isSuper && (cleanPass === SUPREME_ADMIN_PASSWORD || cleanPass === '202688' || cleanPass === 'Limon@2026')) ||
      (isHelpdeskUser && (cleanPass === DEFAULT_PASSWORD || cleanPass === '188188' || cleanPass === 'Amaala@188' || cleanPass === creds.passwordHash)) ||
      (targetAccount.badgeId && cleanPass === targetAccount.badgeId) ||
      (creds.username.toLowerCase() === targetAccount.username.toLowerCase() && cleanPass === creds.passwordHash);

    if (!isPassValid) {
      this.logSecurityEvent(
        'UNAUTHORIZED_SWITCH_ATTEMPT',
        `Unauthorized session switch attempt to @${targetAccount.username} (${targetAccount.fullName}). Invalid credentials provided.`,
        targetAccount.username
      );
      return {
        success: false,
        message: `Authentication failed: Incorrect password or PIN for @${targetAccount.username}. Session handover denied.`,
      };
    }

    // Credentials verified! Proceed to switch session
    return this.switchActiveStaff(targetAccount);
  },

  /**
   * Clone / Duplicate a staff account
   */
  duplicateStaffAccount(sourceId: string): { success: boolean; message: string; newAccount?: import('../types').StaffAccount } {
    try {
      const guard = this.requireSuperAdmin('duplicate staff profiles');
      if (!guard.allowed) {
        return { success: false, message: guard.reason };
      }

      const list = this.getStaffAccounts(true);
      const source = list.find((a) => a.id === sourceId || a.username.toLowerCase() === sourceId.toLowerCase());
      if (!source) return { success: false, message: 'Source staff profile not found.' };

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const isSourceLimon = source.username.toLowerCase() === 'limon' || source.id === 'STAFF-002';
      const cleanSourceFullName = isSourceLimon
        ? 'Tamimi Facility Operator'
        : source.fullName.replace(/Super Admin/g, 'Facility Operator').replace(/Executive Super Admin/g, 'Facility Operator');

      const newAccount: import('../types').StaffAccount = {
        ...source,
        id: this.generateUniqueStaffUID(),
        username: `${source.username}_copy${randomSuffix}`,
        fullName: `${cleanSourceFullName} Copy ${randomSuffix}`,
        role: 'FACILITY_OPERATOR',
        roleTitle: 'Facility Operator',
        badgeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        pinCode: String(Math.floor(100000 + Math.random() * 900000)),
        createdAt: new Date().toISOString(),
        lastLoginAt: undefined,
        isImmutable: false,
        isActive: true,
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canDeleteRecords: false,
        canEmergencyLockdown: false,
        canManageSecurity: false,
        canManageUsers: false,
        canModifyRules: false,
        canManageSync: false,
        canAccessAuditLogs: false,
        canExportData: true,
        canManageParcels: true,
        canManageLostFound: true,
        canManageHandovers: true,
        canManageIsolation: true,
      };

      list.push(newAccount);
      localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      this.logSecurityEvent('CONFIG_UPDATED', `Staff profile '${source.username}' duplicated as '${newAccount.username}'.`);
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: `Duplicated account '${newAccount.fullName}' created with PIN ${newAccount.pinCode}!`, newAccount };
    } catch (e) {
      return { success: false, message: 'Failed to duplicate staff account.' };
    }
  },

  /**
   * Export all staff accounts as clean CSV
   */
  exportStaffDirectoryCsv(): { success: boolean; csvContent: string; filename: string } {
    try {
      const list = this.getStaffAccounts(true);
      const headers = [
        'ID',
        'Username',
        'Full Name',
        'Role Tier',
        'Job Title',
        'Department',
        'Status',
        'Email',
        'Phone',
        'Badge ID',
        'PIN Code',
        'Assigned Venues Count',
        'Can Book',
        'Can Edit',
        'Can Cancel',
        'Can Delete',
        'Can Export',
        'Can Sync',
        'Can Manage Users',
        'Created Date'
      ];

      const rows = list.map((a) => [
        this.sanitizeForCsv(a.id),
        this.sanitizeForCsv(a.username),
        this.sanitizeForCsv(a.fullName),
        this.sanitizeForCsv(a.role),
        this.sanitizeForCsv(a.roleTitle),
        this.sanitizeForCsv(a.assignedDepartment),
        this.sanitizeForCsv(a.isActive ? 'Active' : 'Suspended'),
        this.sanitizeForCsv(a.email || ''),
        this.sanitizeForCsv(a.phoneNumber || ''),
        this.sanitizeForCsv(a.badgeId || ''),
        this.sanitizeForCsv(a.pinCode),
        this.sanitizeForCsv(a.assignedFacilityIds?.length || 0),
        this.sanitizeForCsv(a.canCreateBookings ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canEditBookings ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canCancelBookings ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canDeleteRecords ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canExportData ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canManageSync ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.canManageUsers ? 'YES' : 'NO'),
        this.sanitizeForCsv(a.createdAt),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const filename = `tamimi_staff_directory_${new Date().toISOString().slice(0, 10)}.csv`;
      return { success: true, csvContent, filename };
    } catch (e) {
      return { success: false, csvContent: '', filename: '' };
    }
  },

  /**
   * Get the list of facility IDs assigned to a specific user or current user.
   * If user is Super Administrator, returns all facility IDs.
   * If non-admin operator, returns strictly their assignedFacilityIds.
   */
  getUserAssignedFacilityIds(usernameInput?: string): string[] {
    const user = (usernameInput || this.getUsername() || '').trim().toLowerCase();
    if (!user) return [];

    // Super Administrator has unrestricted camp-wide clearance to all facilities
    if (this.isSuperAdmin(user)) {
      return FACILITIES.map((f) => f.id);
    }

    const accounts = this.getStaffAccounts(true);
    const staff = accounts.find(
      (a) => a.username.toLowerCase() === user || (a.email && a.email.toLowerCase() === user)
    );

    if (staff && Array.isArray(staff.assignedFacilityIds)) {
      return staff.assignedFacilityIds;
    }

    return [];
  },

  /**
   * Check if user is authorized to view, access, or book a specific facility
   */
  canAccessFacility(facilityId: string, usernameInput?: string): boolean {
    const user = (usernameInput || this.getUsername() || '').trim().toLowerCase();
    if (this.isSuperAdmin(user)) return true;
    const allowed = this.getUserAssignedFacilityIds(user);
    if (!allowed.includes(facilityId)) {
      return false;
    }

    const accounts = this.getStaffAccounts(true);
    const staff = accounts.find(
      (a) =>
        a.username.toLowerCase() === user ||
        (a.email && a.email.toLowerCase() === user) ||
        (a.id && a.id.toLowerCase() === user)
    );
    if (!staff) return false;

    // Check facility-specific operational clearances
    if ((facilityId === 'parcel-monitoring' || facilityId === 'parcel-management') && staff.canManageParcels === false) return false;
    if ((facilityId === 'lost-and-found' || facilityId === 'lost-found') && staff.canManageLostFound === false) return false;
    if ((facilityId === 'handover-takenover' || facilityId === 'shift-handover') && staff.canManageHandovers === false) return false;
    if (facilityId === 'isolation-room' && staff.canManageIsolation === false) return false;
    if (facilityId === 'automated-workflow' && staff.canManageWorkflows === false) return false;

    return true;
  },

  /**
   * Get all facility objects accessible to the user
   */
  getAccessibleFacilities(usernameInput?: string): import('../types').Facility[] {
    const user = (usernameInput || this.getUsername() || '').trim().toLowerCase();
    if (this.isSuperAdmin(user)) {
      return [...FACILITIES];
    }
    return FACILITIES.filter((f) => this.canAccessFacility(f.id, user));
  },

  /**
   * Get detailed Operator Profile (customizable via Settings UI, dynamically resolved for current user)
   */
  getOperatorProfile(): import('../types').OperatorProfile {
    const currentUsername = this.getUsername();
    const USER_PROFILE_KEY = `tamimi_operator_profile_v3_${currentUsername.toLowerCase()}`;
    const isSupreme = this.isSupremeAdmin(currentUsername);
    const isHelpdesk = this.isHelpdeskUser(currentUsername);

    // Find in staff accounts
    const accounts = this.getStaffAccounts(true);
    const staff = accounts.find(
      (a) => a.username.toLowerCase() === currentUsername.toLowerCase() || (a.email && a.email.toLowerCase() === currentUsername.toLowerCase())
    );

    try {
      const userStored = localStorage.getItem(USER_PROFILE_KEY);
      if (userStored) {
        const parsed = JSON.parse(userStored);
        if (parsed && (parsed.firstName || parsed.email)) {
          if (!isSupreme) {
            // Aggressive sanitization: non-supreme users must NEVER have admin names, emails, or titles
            const hasAdminContamination =
              (parsed.email && (parsed.email.toLowerCase().includes('limon') || parsed.email.toLowerCase().includes('tamimitafga188'))) ||
              (parsed.firstName && parsed.firstName.toLowerCase() === 'limon') ||
              (parsed.lastName && parsed.lastName.toLowerCase() === 'rahman') ||
              (parsed.roleTitle && (parsed.roleTitle.toLowerCase().includes('admin') || parsed.roleTitle.toLowerCase().includes('owner') || parsed.roleTitle.toLowerCase().includes('lead')));

            if (!hasAdminContamination) {
              const safeRoleTitle = staff?.roleTitle && !staff.roleTitle.toLowerCase().includes('admin')
                ? staff.roleTitle
                : 'Facility Operator';

              return {
                ...parsed,
                firstName: parsed.firstName || staff?.fullName?.split(' ')[0] || (isHelpdesk ? 'Tamimi' : currentUsername),
                lastName: parsed.lastName || staff?.fullName?.split(' ').slice(1).join(' ') || (isHelpdesk ? 'Helpdesk' : 'Operator'),
                email: (parsed.email && !parsed.email.toLowerCase().includes('limon') && !parsed.email.toLowerCase().includes('tamimitafga188'))
                  ? parsed.email
                  : (staff?.email || `${currentUsername.toLowerCase()}@tamimi.com`),
                roleTitle: safeRoleTitle,
                department: staff?.assignedDepartment === 'ALL' ? 'Executive Helpdesk & Camp Operations' : (staff?.assignedDepartment || parsed.department || 'Camp Operations'),
                badgeId: staff?.badgeId || parsed.badgeId || (isHelpdesk ? 'EMP-0188' : `TAMIMI-${currentUsername.toUpperCase()}`),
                avatarUrl: staff?.avatarUrl || parsed.avatarUrl || '',
              };
            }
          } else {
            return {
              ...parsed,
              roleTitle: staff?.roleTitle || parsed.roleTitle || 'Supreme Super Administrator & System Owner',
              department: staff?.assignedDepartment === 'ALL' ? 'Executive Helpdesk & Camp Operations' : (staff?.assignedDepartment || parsed.department),
              badgeId: staff?.badgeId || parsed.badgeId || 'TAMIMI-SUPREME-01',
              avatarUrl: staff?.avatarUrl || parsed.avatarUrl || '',
            };
          }
        }
      }
    } catch (e) {}

    // Clean initial profile derived strictly from the staff record
    const defaultFullName = staff?.fullName || (isSupreme ? 'Limon Rahman' : (isHelpdesk ? 'Tamimi Facility Operator' : currentUsername));

    const parts = defaultFullName.split(' ');
    const firstName = parts[0] || (isSupreme ? 'Limon' : currentUsername);
    const lastName = parts.slice(1).join(' ') || (isSupreme ? 'Rahman' : (isHelpdesk ? 'Helpdesk' : 'Operator'));

    const safeRoleTitle = staff?.roleTitle || (isSupreme ? 'Super Admin' : 'Facility Operator');

    const safeEmail = staff?.email || (isSupreme ? SUPREME_ADMIN_EMAIL : (isHelpdesk ? 'helpdesk@tamimi.com' : `${currentUsername.toLowerCase()}@tamimi.com`));

    const defaultProfile: import('../types').OperatorProfile = {
      firstName,
      lastName,
      roleTitle: safeRoleTitle,
      badgeId: staff?.badgeId || (isSupreme ? 'TAMIMI-SUPREME-01' : (isHelpdesk ? 'EMP-0188' : `TAMIMI-${currentUsername.toUpperCase()}`)),
      email: safeEmail,
      phoneNumber: staff?.phoneNumber || '+966 50 188 7799',
      department: staff?.assignedDepartment === 'ALL' ? 'Executive Helpdesk & Camp Operations' : (staff?.assignedDepartment || 'Executive Helpdesk & Camp Operations'),
      campusLocation: 'AMAALA Triple Bay Project, Camp 188',
      buildingOrDesk: 'Operations HQ - Station Alpha #01',
      roomOrTerminal: 'Terminal TAFGA-POS-12',
      country: 'Kingdom of Saudi Arabia',
      cityState: 'Tabuk / Red Sea Coast',
      postalCode: '47521',
      taxOrCorpId: 'CR-TAMIMI-8849102',
      bio: isSupreme
        ? 'Super Admin overseeing facility allocations, sports grounds scheduling, and system operations.'
        : 'Authorized operational staff member responsible for facility reservations.',
      avatarUrl: staff?.avatarUrl || '',
      activeShift: 'Executive 24/7 On-Duty',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
    } catch (e) {}

    return defaultProfile;
  },

  /**
   * Save updated Operator Profile
   */
  saveOperatorProfile(profile: import('../types').OperatorProfile): { success: boolean; message: string } {
    const currentUsername = this.getUsername();
    const USER_PROFILE_KEY = `tamimi_operator_profile_v3_${currentUsername.toLowerCase()}`;
    const isSupreme = this.isSupremeAdmin(currentUsername);

    try {
      const sanitized: import('../types').OperatorProfile = {
        ...profile,
        firstName: this.sanitizeText(profile.firstName),
        lastName: this.sanitizeText(profile.lastName),
        roleTitle: this.sanitizeText(profile.roleTitle) || (isSupreme ? 'Super Admin' : 'Facility Operator'),
        badgeId: this.sanitizeText(profile.badgeId),
        email: this.sanitizeText(profile.email),
        phoneNumber: this.sanitizeText(profile.phoneNumber),
        department: this.sanitizeText(profile.department),
        campusLocation: this.sanitizeText(profile.campusLocation),
        buildingOrDesk: this.sanitizeText(profile.buildingOrDesk),
        roomOrTerminal: this.sanitizeText(profile.roomOrTerminal),
        country: this.sanitizeText(profile.country),
        cityState: this.sanitizeText(profile.cityState),
        postalCode: this.sanitizeText(profile.postalCode),
        taxOrCorpId: this.sanitizeText(profile.taxOrCorpId),
        bio: this.sanitizeText(profile.bio),
        avatarUrl: profile.avatarUrl || '',
        activeShift: profile.activeShift || 'Executive 24/7 On-Duty',
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(sanitized));

      // Also synchronize into StaffAccount for this user so avatar & details update everywhere!
      const list = this.getStaffAccounts(true);
      const staffIdx = list.findIndex(
        (a) => a.username.toLowerCase() === currentUsername.toLowerCase() || (a.email && a.email.toLowerCase() === currentUsername.toLowerCase())
      );
      if (staffIdx >= 0) {
        list[staffIdx].fullName = `${sanitized.firstName} ${sanitized.lastName}`.trim();
        list[staffIdx].roleTitle = sanitized.roleTitle;
        list[staffIdx].email = sanitized.email;
        list[staffIdx].phoneNumber = sanitized.phoneNumber;
        list[staffIdx].badgeId = sanitized.badgeId;
        list[staffIdx].avatarUrl = sanitized.avatarUrl;
        list[staffIdx].customOverridesActive = true;
        localStorage.setItem(AUTH_STAFF_ACCOUNTS_KEY, JSON.stringify(list));
      }

      // Update active session in localStorage
      const session = this.getSession();
      if (session && session.username.toLowerCase() === currentUsername.toLowerCase()) {
        const updatedSession = {
          ...session,
          fullName: `${sanitized.firstName} ${sanitized.lastName}`.trim(),
          email: sanitized.email,
        };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedSession));
      }

      // Update master credentials if the active user is Limon (Master Admin)
      if (isSupreme) {
        const creds = this.getStoredCredentials();
        const updatedCreds = {
          ...creds,
          fullName: `${sanitized.firstName} ${sanitized.lastName}`.trim(),
          email: sanitized.email,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('tamimi_helpdesk_auth_credentials_v2', JSON.stringify(updatedCreds));
      }

      this.logSecurityEvent('CONFIG_UPDATED', `Operator profile information updated for '${currentUsername}'.`);
      window.dispatchEvent(new CustomEvent('tamimi_profile_updated', { detail: sanitized }));
      window.dispatchEvent(new CustomEvent('tamimi_staff_updated'));
      return { success: true, message: 'Operator profile details updated successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to save operator profile.' };
    }
  },

  /**
   * Get System Preferences (Curfews, limits, auto-print, sound, WhatsApp)
   */
  getSystemPreferences(): import('../types').SystemPreferences {
    const PREFS_KEY = 'tamimi_helpdesk_system_preferences_v2';
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    const defaults: import('../types').SystemPreferences = {
      idleTimeoutMinutes: 30,
      requirePinForCancellation: false,
      soundEffectsEnabled: true,
      confettiEnabled: true,
      autoPrintVoucher: false,
      autoSyncIntervalMinutes: 5,
      maxDailyBookingsPerBadge: 2,
      allowMultiSlotBooking: true,
      curfewStart: '23:30',
      curfewEnd: '06:00',
      whatsappCountryCode: '+966',
      whatsappAutoMessage: 'Your facility reservation is confirmed at TAMIMI HelpDesk TAFGA.',
      themeMode: 'system',
      enableBrowserDesktopAlerts: false,
      desktopAlertSound: true,
      thermalPaperFormat: '80mm',
      thermalSlipHeader: 'TAMIMI GLOBAL CO. LTD · TAFGA CAMP 188',
      thermalSlipFooter: 'Please present this admission voucher to the on-duty facility officer.',
      enableBarcodeOnTickets: true,
      cancelCutoffMinutes: 60,
      maxActiveBookingsPerBadge: 3,
      campusMarqueeText: '📢 Welcome to TAMIMI Camp 188 Facility Hub · All 20 recreational facilities are operational.',
      campusMarqueeLevel: 'normal',
      blacklistedBadges: [],
      vipWhitelistDepartments: ['Executive Directorate', 'Camp HSE & Security', 'Medical Operations'],
    };

    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(defaults));
    } catch (e) {}

    return defaults;
  },

  /**
   * Save System Preferences
   */
  saveSystemPreferences(prefs: import('../types').SystemPreferences): { success: boolean; message: string } {
    const PREFS_KEY = 'tamimi_helpdesk_system_preferences_v2';
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      this.logSecurityEvent('CONFIG_UPDATED', `System operating preferences updated.`);
      window.dispatchEvent(new CustomEvent('tamimi_preferences_updated', { detail: prefs }));
      return { success: true, message: 'System preferences saved and applied!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to save system preferences.' };
    }
  }
};


