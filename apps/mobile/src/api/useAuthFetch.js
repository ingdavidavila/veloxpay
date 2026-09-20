import { useCallback } from 'react';
import { logout } from '@veloxpay/auth';
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
 * fetch() for authenticated calls, which clears the stored token and resets
 * to Login on a 401.
 *
 * Screens already bail out when getToken() returns nothing, but a *revoked*
 * token is present and simply refused -- so without this the app sat there
 * showing empty dashboards while every request came back 401.
 *
 * Only for requests carrying an Authorization header: on Login and Signup a
 * 401 means bad credentials, not a dead session.
 */
export function useAuthFetch(navigation) {
  return useCallback(
    async (input, init) => {
      const response = await fetch(input, init);

      if (response.status === 401) {
        await logout();
        resetToAuth(navigation);
        throw new SessionExpiredError();
      }

      return response;
    },
    [navigation]
  );
}

export default useAuthFetch;
