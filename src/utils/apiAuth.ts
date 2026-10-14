/**
 * Utility to extract active session authentication headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    if (typeof localStorage !== 'undefined') {
      const rawSession = localStorage.getItem('tamimi_helpdesk_auth_session_v2');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && parsed.sessionToken) {
          headers['Authorization'] = `Bearer ${parsed.sessionToken}`;
          headers['x-session-token'] = parsed.sessionToken;
        }
      }
    }
  } catch (_) {}
  return headers;
}
