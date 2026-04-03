# Apple Sign-In Implementation Checklist

Follow this checklist to complete the Apple Sign-In setup for VeloxPay.

## Code Implementation ✅ (Already Done)

- [x] Install backend dependencies (axios, jsonwebtoken, google-auth-library, dotenv)
- [x] Install frontend dependencies (@react-oauth/google)
- [x] Create `server/utils/appleAuth.js` with helper functions
- [x] Add Apple auth routes to `server/routes/auth.js`
- [x] Update `veloxpay/src/Login.js` with Apple button handler
- [x] Update `veloxpay/src/App.js` with GoogleOAuthProvider
- [x] Add database migration for apple_id column
- [x] Add CORS and middleware to server
- [x] Create environment variable files

## Apple Developer Setup 📋 (You Need to Do This)

- [ ] Create Apple Developer Account (if not already done)
- [ ] Navigate to Certificates, Identifiers & Profiles
- [ ] **Create App ID**
  - [ ] Select Web as the platform
  - [ ] Enter App ID (e.g., com.veloxpay.app)
  - [ ] Enable "Sign in with Apple" capability
  - [ ] Register the App ID
  
- [ ] **Create Service ID**
  - [ ] Enter Service ID (e.g., com.veloxpay.app)
  - [ ] Enable "Sign in with Apple"
  - [ ] Configure and set Primary App ID to your App ID
  - [ ] Add Return URLs:
    - [ ] `http://localhost:5000/api/auth/apple/callback` (development)
    - [ ] `https://yourdomain.com/api/auth/apple/callback` (production - update later)
  - [ ] Save and register
  - [ ] **Copy Service ID** → This becomes `APPLE_CLIENT_ID`
  
- [ ] **Create Private Key**
  - [ ] Go to Keys section
  - [ ] Create new key with "Sign in with Apple" enabled
  - [ ] Configure with your App ID
  - [ ] Register and download .p8 file
  - [ ] **Copy Key ID** → This becomes `APPLE_KEY_ID`
  
- [ ] **Get Team ID**
  - [ ] Go to Account Settings
  - [ ] Find Team ID under the Membership section
  - [ ] **Copy Team ID** → This becomes `APPLE_TEAM_ID`

## Configuration 🔧 (You Need to Do This)

- [ ] **Format Private Key**
  - [ ] Open downloaded .p8 file in text editor
  - [ ] Copy entire contents
  - [ ] Replace actual newlines with `\n` (literal backslash-n)
  - [ ] Example format: `-----BEGIN PRIVATE KEY-----\nMIGfMA0G...\n-----END PRIVATE KEY-----`

- [ ] **Update server/.env**
  ```env
  APPLE_CLIENT_ID=com.veloxpay.app
  APPLE_TEAM_ID=your_team_id_here
  APPLE_KEY_ID=your_key_id_here
  APPLE_PRIVATE_KEY=your_formatted_private_key_here
  APPLE_REDIRECT_URI=http://localhost:5000/api/auth/apple/callback
  APPLE_FRONTEND_REDIRECT_URI=http://localhost:3000/login
  ```
  - [ ] Replace with actual values from Apple Developer
  - [ ] Keep JWT_SECRET secure and change in production
  - [ ] Keep GOOGLE credentials if using Google OAuth

- [ ] **Update veloxpay/.env**
  ```env
  REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
  ```

## Database Setup 🗄️ (You Need to Do This)

- [ ] **Run Migration**
  - [ ] Open PostgreSQL client (psql, pgAdmin, etc.)
  - [ ] Connect to the veloxpay database
  - [ ] Run SQL from `server/migration.sql`:
    ```sql
    -- Copy entire migration.sql content
    -- Run all commands
    ```
  - [ ] Verify columns were added:
    ```sql
    SELECT apple_id, google_id, avatar FROM users LIMIT 1;
    ```

- [ ] **Verify Schema**
  - [ ] Confirm `apple_id` column exists (UNIQUE, nullable)
  - [ ] Confirm `google_id` column exists
  - [ ] Confirm `avatar` column exists
  - [ ] Confirm `password_hash` is nullable

## Testing 🧪 (You Need to Do This)

### Prerequisites
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] PostgreSQL database available
- [ ] Environment variables configured

### Step 1: Start the Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev
# Should see: "Server running on port 5000"

# Terminal 2 - Frontend
cd veloxpay
npm start
# Should see: "Compiled successfully! You can now view veloxpay in the browser"
```

- [ ] Backend server started without errors
- [ ] Frontend server started without errors
- [ ] No environment variable errors in console

### Step 2: Test Apple Sign-In Flow
- [ ] Open browser to `http://localhost:3000/login`
- [ ] Click "Continue with Apple" button
- [ ] Check that redirected to Apple authorisation page
- [ ] Sign in with Apple ID
- [ ] Make sure redirected back to login page with token
- [ ] Verify JWT token stored in localStorage:
  ```javascript
  // In browser console:
  console.log(localStorage.getItem('token'));
  ```
- [ ] Verify redirected to dashboard
- [ ] Check user created in database:
  ```sql
  SELECT id, apple_id, email, name FROM users WHERE apple_id IS NOT NULL;
  ```

### Step 3: Test Second Sign-In
- [ ] Logout or clear localStorage
- [ ] Sign in with same Apple ID again
- [ ] Verify same user record used (no duplicate)
- [ ] Verify new JWT token generated
- [ ] Check dashboard loads correctly

### Step 4: Test Google Sign-In (Existing)
- [ ] Click "Continue with Google" button
- [ ] Verify Google auth still works
- [ ] Check dashboard loads with Google credentials

## Troubleshooting 🔍

If issues occur, check these in order:

1. **Backend Won't Start**
   - [ ] Verify all dependencies installed: `npm install`
   - [ ] Check Node.js version: `node --version`
   - [ ] Verify .env file exists with all variables
   - [ ] Check port 5000 isn't in use: `netstat -ano | findstr :5000` (Windows)

2. **Frontend Won't Start**
   - [ ] Verify dependencies: `npm install`
   - [ ] Clear cache: `npm start -- --reset-cache`
   - [ ] Check REACT_APP variables are set

3. **"Cannot GET /api/auth/apple"**
   - [ ] Verify server is running on port 5000
   - [ ] Check routes are loaded correctly
   - [ ] Restart backend server

4. **Apple Redirect Fails**
   - [ ] Verify APPLE_CLIENT_ID matches Service ID
   - [ ] Check redirect URI exactly matches Apple Developer settings
   - [ ] Verify http:// vs https:// matches (case sensitive)
   - [ ] Check port number is correct (5000 for dev)

5. **"Redirect URI Mismatch" from Apple**
   - [ ] Register domain in Apple Developer exactly as shown
   - [ ] Include full path: `/api/auth/apple/callback`
   - [ ] Don't include trailing slashes
   - [ ] Exact protocol, domain, port, and path match required

6. **"Invalid Signature" Error**
   - [ ] Verify APPLE_PRIVATE_KEY format:
     - Should start with `-----BEGIN PRIVATE KEY-----\n`
     - Should end with `\n-----END PRIVATE KEY-----`
     - No actual newlines, only `\n` characters
   - [ ] Verify APPLE_TEAM_ID is correct
   - [ ] Verify APPLE_KEY_ID is correct
   - [ ] Try regenerating key in Apple Developer

7. **User Not Created in Database**
   - [ ] Check backend logs for errors
   - [ ] Verify PostgreSQL is running and accessible
   - [ ] Check migration was applied successfully
   - [ ] Verify apple_id column exists

8. **Token Not Stored in localStorage**
   - [ ] Check browser console for JavaScript errors
   - [ ] Verify localStorage is enabled in browser
   - [ ] Check that token parameter in URL: `?token=xyz`
   - [ ] Verify login page successfully redirects

## Documentation Files 📚

- `APPLE_SIGNIN_SETUP.md` - Detailed Apple Developer setup guide
- `APPLE_IMPLEMENTATION_DOCS.md` - Technical implementation details
- `ENV_TEMPLATE.md` - Environment variables reference
- `server/migration.sql` - Database schema updates
- `server/utils/appleAuth.js` - Apple auth utility functions
- `server/routes/auth.js` - Backend API routes
- `veloxpay/src/Login.js` - Frontend login component

## Security Checklist 🔒

- [ ] `.env` files are in `.gitignore` (never commit credentials)
- [ ] Private key is never exposed in frontend
- [ ] All tokens verified server-side before use
- [ ] JWT_SECRET is strong (at least 32 characters)
- [ ] Change JWT_SECRET for production
- [ ] Rotate Apple private key every 90 days
- [ ] Use HTTPS in production (not HTTP)
- [ ] Monitor Cloud Console for security alerts
- [ ] Implement rate limiting for auth endpoints
- [ ] Log authentication attempts for debugging

## Production Deployment ⚙️ (Future)

When ready to deploy:

- [ ] Update APPLE_REDIRECT_URI to production domain
- [ ] Update APPLE_FRONTEND_REDIRECT_URI to production domain
- [ ] Register new domains in Apple Developer
- [ ] Add production URLs to Google Cloud Console
- [ ] Update JWT_SECRET for production
- [ ] Enable HTTPS
- [ ] Update CORS settings if needed
- [ ] Monitor backend logs for errors
- [ ] Test end-to-end in production environment
- [ ] Update disaster recovery procedures

## Support Resources 📖

- [Apple Developer Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Sign in with Apple REST API](https://developer.apple.com/documentation/sign_in_with_apple)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT (JSON Web Token) RFC 7519](https://tools.ietf.org/html/rfc7519)

## Next Steps After Completion

1. Test the authentication flow thoroughly
2. Create user profile page to display user data
3. Implement logout functionality
4. Add account linking for multiple OAuth providers
5. Implement refresh token logic
6. Add MFA support
7. Monitor usage analytics
8. Plan for future OAuth providers (Microsoft, GitHub, etc.)

---

**Status**: Starting Apple Integration
**Last Updated**: March 27, 2026
**Next Action**: Follow Apple Developer Setup section