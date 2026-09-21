import { useCallback } from 'react';
import { logout, getRefreshToken, saveTokens } from '@veloxpay/auth';
import { apiUrl } from '../config/api';
import { resetToAuth } from '../navigation/resetToAuth';

/**
 * Thrown after a 401 has been handled. Callers that show an Alert on failure
 * should ignore it -- the user is already being sent back to Login, and a
 * "Connection Error" popup over the login screen is just noise.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

export const isSessionExpired = (err) => err?.name === 'SessionExpiredError';

/**
 * One shared refresh attempt.
 *
 * Screens fire several requests at once, so an expired access token produces
 * several simultaneous 401s. Refreshing once per 401 would spend the same
 * refresh token repeatedly, and the server treats a spent token as replay and
 * revokes the whole family -- signing the user out exactly when nothing was
 * actually wrong.
 *
 * Module scope, not component state: the racing requests come from different
 * screens.
 */
let inFlightRefresh = null;

const refreshSession = async () => {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(apiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.token) return null;

      await saveTokens(data.token, data.refreshToken);
      return data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return null;
    } finally {
      setTimeout(() => {
        inFlightRefresh = null;
      }, 0);
    }
  })();

  return inFlightRefresh;
};

/**
 * fetch() for authenticated calls.
 *
 * Access tokens last 15 minutes, so a 401 in ordinary use usually means
 * "expired". It refreshes once and replays the request; only if that fails
 * does it clear the stored session and reset to Login.
 *
 * Only for requests carrying an Authorization header: on Login and Signup a
 * 401 means bad credentials, not a dead session.
 */
export function useAuthFetch(navigation) {
  return useCallback(
    async (input, init = {}) => {
      let response = await fetch(input, init);

      if (response.status === 401) {
        const newToken = await refreshSession();

        if (newToken) {
          const retryInit = {
            ...init,
            headers: { ...(init.headers || {}), Authorization: `Bearer ${newToken}` },
          };
          response = await fetch(input, retryInit);
        }

        if (response.status === 401) {
          await logout();
          resetToAuth(navigation);
          throw new SessionExpiredError();
        }
      }

      return response;
    },
    [navigation]
  );
}

export default useAuthFetch;
