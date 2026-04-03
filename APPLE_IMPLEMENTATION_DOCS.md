# Apple Sign-In Implementation

## Overview

Apple Sign-In has been integrated into the VeloxPay authentication system alongside Google OAuth. The implementation follows OAuth 2.0 standards and uses Apple's REST API for server-side token handling.

## Architecture

### Flow Diagram

```
User clicks "Continue with Apple"
          ↓
     Frontend redirects to backend
          ↓
Backend redirects to Apple auth
          ↓
User authenticates with Apple
          ↓
Apple redirects to callback endpoint
          ↓
Backend verifies token & creates user
          ↓
Backend redirects to frontend with JWT
          ↓
Frontend stores JWT in localStorage
          ↓
User is logged in to VeloxPay
```

## Backend Implementation

### Files Modified/Created

1. **`server/utils/appleAuth.js`** (NEW)
   - Contains helper functions for Apple authentication
   - `generateAppleClientSecret()`: Creates JWT for Apple API communication
   - Uses ES256 algorithm with Apple's private key

2. **`server/routes/auth.js`** (MODIFIED)
   - Added `GET /api/auth/apple` route
   - Added `POST /api/auth/apple/callback` route
   - Integrated Apple auth handler alongside Google auth

3. **`server/.env`** (MODIFIED)
   - Added Apple configuration variables
   - Includes redirect URIs and credentials

### API Endpoints

#### GET /api/auth/apple
Initiates Apple authentication flow

**Flow:**
1. Generate OAuth state parameter
2. Construct Apple authorization URL
3. Redirect user to Apple's sign-in page

**URL Parameters:**
- `client_id`: Apple Service ID
- `redirect_uri`: Backend callback endpoint
- `response_type`: "code id_token"
- `response_mode`: "form_post"
- `scope`: "email name"
- `state`: Random state for security

#### POST /api/auth/apple/callback
Handles Apple's OAuth callback

**Request Body:**
```javascript
{
  code: "authorization_code",           // Authorization code from Apple
  id_token: "jwt_from_apple",          // ID token with user info
  user: {                              // Only on first sign-in
    name: "John Doe",
    email: "john@example.com"
  }
}
```

**Response:**
Redirects to `APPLE_FRONTEND_REDIRECT_URI?token=JWT_TOKEN`

**Process:**
1. Decode ID token
2. Extract user information (apple_id, email, name)
3. Check if user exists in database
4. Create new user or update existing
5. Generate JWT token
6. Redirect to frontend with token

### Apple Client Secret JWT

Generated using the private key from Apple Developer portal:

```javascript
{
  alg: "ES256",
  kid: "APPLE_KEY_ID"
}
{
  iss: "APPLE_TEAM_ID",
  iat: current_timestamp,
  exp: current_timestamp + 6_months,
  aud: "https://appleid.apple.com",
  sub: "APPLE_CLIENT_ID"
}
```

## Frontend Implementation

### Files Modified

1. **`veloxpay/src/Login.js`** (MODIFIED)
   - Added `useSearchParams` hook
   - Added `useEffect` to handle OAuth callbacks
   - `handleAppleLogin()`: Redirects to backend Apple endpoint
   - Extracts JWT from URL search params
   - Stores token in localStorage

### Authentication Flow

```javascript
const handleAppleLogin = () => {
  window.location.href = 'http://localhost:5000/api/auth/apple';
};
```

The frontend redirects the user to the backend, which orchestrates the entire Apple authentication process. This is necessary because:
- Apple requires server-side client secret generation
- The private key must never be exposed to the frontend
- All token verification happens server-side

### Callback Handling

After authentication, the backend redirects with:
```
http://localhost:3000/login?token=JWT_TOKEN
```

The Login component:
1. Checks for token in URL params
2. Stores token in localStorage
3. Navigates to dashboard

## Database Schema

### Users Table Updates

Added columns to support Apple authentication:

```sql
ALTER TABLE users ADD COLUMN apple_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN avatar TEXT;
```

### User Fields

- `apple_id`: Unique identifier from Apple
- `email`: Email address (may be hidden on subsequent logins)
- `name`: User's name (optional from Apple)
- `avatar`: Profile picture URL
- `password_hash`: Nullable (not required for OAuth users)

## Environment Variables

### Server (.env)

```env
# Apple Authentication
APPLE_CLIENT_ID=com.veloxpay.app                    # Service ID from Apple
APPLE_TEAM_ID=XXXXXXXXXX                            # Team ID from Apple
APPLE_KEY_ID=XXXXXXXXXX                             # Key ID from Apple
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...  # Private key from .p8 file
APPLE_REDIRECT_URI=http://localhost:5000/api/auth/apple/callback
APPLE_FRONTEND_REDIRECT_URI=http://localhost:3000/login
```

### Frontend (.env)

No Apple-specific variables needed in frontend (server-side only)

## Security Considerations

### Private Key Management
- Private key is stored encrypted in `.env` (added to `.gitignore`)
- Only accessible server-side
- Never sent to frontend
- Should be rotated regularly

### Token Handling
- ID tokens are decoded and verified server-side
- JWT tokens generated server-side use `JWT_SECRET`
- Tokens stored in localStorage (can be upgraded to httpOnly cookies)

### CORS
- Apple requires server-side communication
- Frontend makes indirect requests through backend
- Reduces exposure of sensitive credentials

### Email Handling
- Apple only provides email on first sign-in
- Subsequent logins don't include email
- System stores email after first login
- User can hide email from app providers

## Error Handling

### Server-Side
- Missing service ID → 400 Bad Request
- Invalid token → 500 Internal Server Error
- Email conflicts → 400 Bad Request

### Frontend
- Token retrieval failure → Error message displayed
- Redirect failures → Stored in localStorage for debugging

## Testing

### Manual Testing Steps

1. **Setup Phase**
   - Generate Service ID in Apple Developer
   - Create private key
   - Download .p8 and format for .env
   - Add redirect URIs in Apple Developer

2. **Local Testing**
   - Start backend: `npm run dev` (from server/)
   - Start frontend: `npm start` (from veloxpay/)
   - Click "Continue with Apple" button
   - Authenticate with Apple account
   - Verify redirect to dashboard

3. **Database Check**
   ```sql
   SELECT apple_id, email, name FROM users WHERE apple_id IS NOT NULL;
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid Client" | Verify APPLE_CLIENT_ID and Service ID match |
| "Redirect URI Mismatch" | Register exact URI in Apple Developer |
| "Invalid Signature" | Check private key format and team/key IDs |
| Token not stored | Verify localStorage is enabled |

## Comparison: Google vs Apple Auth

| Aspect | Google | Apple |
|--------|--------|-------|
| Private Key | Not required | Required (.p8 file) |
| Frontend Handling | Supported | Not recommended |
| Email Privacy | Always provided | First login only |
| Token Type | ID Token + Access Token | ID Token only |
| Key Rotation | Via Google Cloud Console | Via Apple Developer |

## Migration Path

If upgrading from older version:

1. **Database**: Run migration to add apple_id column
2. **Backend**: Update auth.js with new routes
3. **Frontend**: Update Login.js to handle callbacks
4. **Environment**: Add Apple credentials to .env
5. **Testing**: Verify both Google and Apple auth work

## Future Enhancements

- [ ] Implement Apple Sign-Out
- [ ] Add user profile picture handling
- [ ] Support multiple social accounts per user
- [ ] Add account linking UI
- [ ] Implement refresh token rotation
- [ ] Add MFA for security

## References

- [Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Apple REST API](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api)
- [JWT Specification (RFC 7519)](https://tools.ietf.org/html/rfc7519)