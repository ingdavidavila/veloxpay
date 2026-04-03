const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate Apple client secret JWT
 * This is required by Apple for server-to-server communication
 */
function generateAppleClientSecret() {
  const header = {
    alg: 'ES256',
    kid: process.env.APPLE_KEY_ID,
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 86400 * 180, // 6 months
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_CLIENT_ID,
  };

  // Create the client secret signing key
  const key = crypto.createPrivateKey({
    key: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    format: 'pem',
  });

  const secret = jwt.sign(payload, key, { algorithm: 'ES256', header });
  return secret;
}

/**
 * Parse Apple's private key from environment variable
 */
function parseApplePrivateKey() {
  return process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
}

module.exports = {
  generateAppleClientSecret,
  parseApplePrivateKey,
};