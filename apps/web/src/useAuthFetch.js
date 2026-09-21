import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const API_BASE = 'http://localhost:5000';

/**
 * Thrown after a 401 has been handled, to stop the calling code carrying on
 * with a response it cannot use. Callers that show an error to the user
 * should ignore it -- the redirect to /login has already happened.
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
 * A screen typically fires several requests at once, so an expired access
 * token produces several simultaneous 401s. Refreshing once per 401 would
 * spend the same refresh token several times over, and the server treats a
 * spent token as replay and revokes the whole family -- signing the user out
 * precisely when everything was working correctly.
 *
 * Module scope, not component state: the requests racing here come from
 * different components.
 */
let inFlightRefresh = null;

const refreshSession = async () => {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.token) return null;

      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data.token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return null;
    } finally {
      // Cleared in a microtask so callers that awaited this promise all see
      // the same result before the next refresh can start.
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
 * Access tokens now last 15 minutes, so a 401 during ordinary use usually
 * means "expired", not "revoked". It tries a refresh once and replays the
 * original request; only if that fails does it clear the session and send
 * the user to /login.
 *
 * Only for requests carrying an Authorization header. On the login and
 * password-reset screens a 401 means wrong credentials, and signing the user
 * out in response to that would be nonsense.
 */
export function useAuthFetch() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // logout is rebuilt on every AuthContext render. Holding it in a ref keeps
  // the returned function stable, so it can sit in a useEffect dependency
  // array without re-running the effect on every render.
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  return useCallback(
    async (input, init = {}) => {
      let response = await fetch(input, init);

      if (response.status === 401) {
        const newToken = await refreshSession();

        if (newToken) {
          // Replay with the new token, keeping whatever headers the caller
          // set. Its Authorization header carries the stale token.
          const retryInit = {
            ...init,
            headers: { ...(init.headers || {}), Authorization: `Bearer ${newToken}` },
          };
          response = await fetch(input, retryInit);
        }

        if (response.status === 401) {
          logoutRef.current?.();
          navigate('/login', { replace: true });
          throw new SessionExpiredError();
        }
      }

      return response;
    },
    [navigate]
  );
}

export default useAuthFetch;
