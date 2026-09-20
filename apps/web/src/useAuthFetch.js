import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

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
 * fetch() for authenticated calls, which clears the session and redirects to
 * /login on a 401.
 *
 * The server can now revoke a token before it expires -- "log out everywhere"
 * and password reset both do -- so a 401 no longer means only "expired". With
 * no handling, a revoked token left the app rendering blank dashboards and
 * empty lists: the server correctly refused every request and the UI never
 * said why.
 *
 * Only use this for requests that carry an Authorization header. On the login
 * and password-reset screens a 401 means "wrong credentials", and signing the
 * user out in response to that would be nonsense.
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
    async (input, init) => {
      const response = await fetch(input, init);

      if (response.status === 401) {
        logoutRef.current?.();
        navigate('/login', { replace: true });
        throw new SessionExpiredError();
      }

      return response;
    },
    [navigate]
  );
}

export default useAuthFetch;
