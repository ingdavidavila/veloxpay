import { useEffect, useRef } from 'react';

/**
 * Re-run `callback` when the user comes back to this tab.
 *
 * Every screen in this app fetches once in a mount-only useEffect, so data
 * went stale the moment anything changed elsewhere -- another device, the
 * mobile app, or a second browser tab. Nothing here polls, so without this
 * the only way to see current numbers is a manual reload.
 *
 * Listens to both events on purpose:
 *   - visibilitychange fires when the tab is re-shown after being hidden
 *     (switching tabs, unlocking the machine).
 *   - focus fires when the window regains focus while already visible
 *     (alt-tabbing back from another app).
 *
 * The callback is held in a ref so a caller passing an inline arrow function
 * doesn't tear down and re-add listeners on every render.
 */
export function useRefreshOnFocus(callback, { enabled = true } = {}) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => {
      if (document.visibilityState === 'visible') {
        savedCallback.current?.();
      }
    };

    document.addEventListener('visibilitychange', run);
    window.addEventListener('focus', run);

    return () => {
      document.removeEventListener('visibilitychange', run);
      window.removeEventListener('focus', run);
    };
  }, [enabled]);
}

export default useRefreshOnFocus;
