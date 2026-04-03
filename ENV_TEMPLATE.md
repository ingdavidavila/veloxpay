# Environment Variables Configuration

## Backend (.env in server/ directory)

### Google OAuth
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Apple Sign-In
```env
APPLE_CLIENT_ID=com.veloxpay.app
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIGfMA0GCSqGSIb3...\n-----END PRIVATE KEY-----
APPLE_REDIRECT_URI=http://localhost:5000/api/auth/apple/callback
APPLE_FRONTEND_REDIRECT_URI=http://localhost:3000/login
```

### JWT Configuration
```env
JWT_SECRET=your_super_secret_key_change_in_production
```

## Frontend (.env in veloxpay/ directory)

### Google OAuth
```env
REACT_APP_GOOGLE_CLIENT_ID=561160732067-869vmojtu8agf72flbdn1hs8att2n4ui.apps.googleusercontent.com
```

## How to Get Credentials

### Apple Credentials
1. **APPLE_CLIENT_ID**: Your Service ID from Apple Developer (e.g., com.veloxpay.app)
2. **APPLE_TEAM_ID**: Your Team ID (available in Apple Developer Account Settings)
3. **APPLE_KEY_ID**: From the key you created (visible on Key Details page)
4. **APPLE_PRIVATE_KEY**: Contents of the .p8 file with `\n` instead of actual newlines

### Google Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Web Application
3. Copy Client ID and Secret

## Important Notes

- ⚠️ **Never commit .env files** - they are in .gitignore
- ⚠️ **Keep private keys secure** - treat them like passwords
- ⚠️ **Update URLs for production** - change localhost to your domain
- ✅ Use different credentials for development and production
- ✅ Rotate credentials every 90 days
- ✅ Monitor credential usage in developer consoles

## Production URLs

When deploying to production, update:

```env
# Production Example
APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/apple/callback
APPLE_FRONTEND_REDIRECT_URI=https://yourdomain.com/login
```

Make sure to register these URLs in Apple Developer and Google Cloud Console.