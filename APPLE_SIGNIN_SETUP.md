# Apple Sign-In Setup Guide

This guide explains how to set up Apple Sign-In authentication for VeloxPay using Sign in with Apple.

## Prerequisites

- Apple Developer Account
- Xcode (for generating the private key)
- Node.js backend running on `http://localhost:5000`
- React frontend running on `http://localhost:3000`

## Step 1: Create an App ID in Apple Developer

1. Go to [Apple Developer](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles** > **Identifiers**
3. Click the **+** button to create a new identifier
4. Select **App IDs** and click **Continue**
5. Register your app as a **Web**:
   - **App ID Prefix**: Select your Team ID
   - **App ID**: Enter a unique identifier (e.g., `com.veloxpay.app`)
   - **Description**: VeloxPay Web
6. Enable **Sign in with Apple** capability
7. Click **Continue** and **Register**

## Step 2: Create a Service ID

1. Go back to **Identifiers**
2. Click the **+** button to create a new identifier
3. Select **Services IDs** and click **Continue**
4. Fill in:
   - **Service ID**: Enter the same or related identifier (e.g., `com.veloxpay.app`)
   - **Description**: VeloxPay Web Services
5. Enable **Sign in with Apple**
6. Click **Configure**
7. Set **Primary App ID** to your App ID from Step 1
8. Add **Return URLs**:
   ```
   http://localhost:5000/api/auth/apple/callback
   https://yourdomain.com/api/auth/apple/callback (for production)
   ```
9. Click **Save**, then **Continue** and **Register**

Copy the **Service ID** (e.g., `com.veloxpay.app`) - this is your `APPLE_CLIENT_ID`.

## Step 3: Create a Private Key

1. Go to **Keys** in Apple Developer
2. Click **+** to create a new key
3. Enable **Sign in with Apple**
4. Click **Configure**
   - Select your **Primary App ID**
5. Click **Save** and then **Continue**
6. Give your key a name (e.g., VeloxPay Web Key)
7. Click **Register**
8. **Download** the `.p8` file and save it securely

Notes:
- Copy the **Key ID** shown on screen - this is your `APPLE_KEY_ID`
- Your **Team ID** is available in Apple Developer settings

## Step 4: Format the Private Key for Environment Variables

1. Open the downloaded `.p8` file in a text editor
2. Copy the entire content
3. Replace newlines with `\n` (for single-line format)
4. Set this as your `APPLE_PRIVATE_KEY` in `.env`

Example format:
```
-----BEGIN PRIVATE KEY-----\nMIGfMA0GCSqGSIb3DQEBA...\n-----END PRIVATE KEY-----
```

## Step 5: Configure Environment Variables

Update your `.env` file in the `server/` directory:

```env
APPLE_CLIENT_ID=com.veloxpay.app
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_KEY_ID=your_apple_key_id_here
APPLE_PRIVATE_KEY=your_private_key_formatted_above
APPLE_REDIRECT_URI=http://localhost:5000/api/auth/apple/callback
APPLE_FRONTEND_REDIRECT_URI=http://localhost:3000/login
```

## Step 6: Update Database Schema

Run the migration to add Apple ID columns:

```sql
-- Copy and run the contents of server/migration.sql in your PostgreSQL database
```

This adds:
- `apple_id` (unique identifier for Apple users)
- Updates to support OAuth-only logins

## Step 7: Test the Flow

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd veloxpay
   npm start
   ```

3. Navigate to the Login page
4. Click "Continue with Apple"
5. You should be redirected to Apple's sign-in page
6. After authentication, you'll be redirected back with a JWT token

## Troubleshooting

### "Invalid Client Error"
- Verify `APPLE_CLIENT_ID` matches your Service ID
- Ensure the Service ID has Sign in with Apple enabled

### "Redirect URI Mismatch"
- Check that the callback URL in Apple Developer matches `APPLE_REDIRECT_URI`
- Ensure exact match (http vs https, domain, port, path)

### "Invalid Signature"
- Verify `APPLE_PRIVATE_KEY` is correctly formatted
- Make sure `APPLE_TEAM_ID` and `APPLE_KEY_ID` are correct
- Ensure newlines are properly escaped as `\n`

### Token Not Returned
- Check browser console for errors
- Verify `APPLE_FRONTEND_REDIRECT_URI` is correct
- Check backend logs for authentication errors

## Security Notes

- **Never commit `.env` files** to version control
- Keep your Private Key secure - it's already in `.gitignore`
- Use HTTPS in production
- Regularly monitor Apple Developer account for changes
- Rotate API keys periodically

## API Endpoints

### GET /api/auth/apple
Redirects user to Apple authorization page

### POST /api/auth/apple/callback
Handles Apple's OAuth response
- Verifies the identity token
- Creates or finds user in database
- Returns JWT via redirect to `APPLE_FRONTEND_REDIRECT_URI`

## Production Deployment

For production:

1. Update `APPLE_REDIRECT_URI` to your production domain
2. Update `APPLE_FRONTEND_REDIRECT_URI` to your production domain
3. Register production domain in Apple Developer
4. Use HTTPS for all URLs
5. Update CORS settings if needed

## References

- [Apple Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Sign in with Apple REST API](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api)
- [Configuring Your Environment for Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/configuring_your_environment_for_sign_in_with_apple)