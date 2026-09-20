const jwt = require('jsonwebtoken');
const pool = require('../db');

/**
 * Verify the bearer token and confirm it has not been revoked.
 *
 * A JWT is self-contained: once signed it stays valid until it expires, and
 * nothing the server does can call it back. That is why "log out" used to be
 * local-only -- deleting the client's copy left the token itself working for
 * its full 7 days, on every other device, and a password reset did not touch
 * it either.
 *
 * Each token now carries the user's token_version. Bumping that column
 * invalidates every token minted before the bump, which is what makes "log
 * out everywhere" and reset-password actually revoke access.
 *
 * The cost is one SELECT per authenticated request. That is the price of
 * revocation with stateless tokens; the query is a primary-key lookup, and
 * nearly every route here already hits the database anyway. If that ever
 * shows up in profiles, cache token_version per user with a short TTL rather
 * than dropping the check.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];   // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      const result = await pool.query(
        'SELECT token_version FROM users WHERE id = $1',
        [payload.userId]
      );

      // The account was deleted while the token was still in date.
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Your session is no longer valid. Please log in again.' });
      }

      // Tokens minted before the last bump are refused. Treat a token with no
      // tokenVersion as version 0, so the ones already in the wild keep
      // working until their user next revokes or resets.
      const current = result.rows[0].token_version;
      const presented = payload.tokenVersion ?? 0;

      if (presented !== current) {
        return res.status(401).json({ error: 'Your session has been signed out. Please log in again.' });
      }

      req.user = payload;     // { userId, supplierId, tokenVersion }
      next();
    } catch (dbError) {
      console.error('Auth token-version check failed:', dbError);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};

module.exports = authenticateToken;
