# Forgot Password Feature - Quick Setup

## Files Added/Modified

### Frontend Files
✅ `veloxpay/src/ForgotPassword.js` - Forgot password request form
✅ `veloxpay/src/ResetPassword.js` - Password reset form with token validation
✅ `veloxpay/src/Login.js` - Added "Forgot Password?" link
✅ `veloxpay/src/App.js` - Added routes for new components

### Backend Files
✅ `server/routes/auth.js` - Added 3 new endpoints
✅ `server/utils/mailService.js` - Email sending utilities
✅ `server/.env` - Email configuration variables
✅ `server/migration.sql` - Database schema updates

### Dependencies Added
✅ `nodemailer` - Email sending library
✅ `crypto-random-string` - Secure token generation

## Setup Checklist

### Step 1: Install Dependencies ✅ (Already Done)
```bash
cd server
npm install nodemailer crypto-random-string
```

### Step 2: Update Database Schema
Run the migration to add password reset columns:

```sql
-- Database: veloxpay (PostgreSQL)
-- From server/migration.sql, run:

ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
```

**Verify:**
```sql
\d users  -- Check table structure includes new columns
```

### Step 3: Configure Email Service

Update `server/.env` with your email provider:

#### Option A: Gmail (Recommended for Development)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
FRONTEND_URL=http://localhost:3000
```

**Gmail Setup Steps:**
1. Go to myaccount.google.com
2. Click "Security" in left sidebar
3. Enable 2-Step Verification
4. Go to App passwords
5. Select "Mail" and "Windows Computer"
6. Copy generated 16-character password
7. Paste as EMAIL_PASSWORD in .env

#### Option B: SendGrid
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your_sendgrid_api_key...
FRONTEND_URL=http://localhost:3000
```

#### Option C: Mailgun
```env
EMAIL_SERVICE=Mailgun
EMAIL_USER=postmaster@your-domain.com
EMAIL_PASSWORD=your_mailgun_private_key
FRONTEND_URL=http://localhost:3000
```

### Step 4: Test Email Configuration

Create a test file `server/test-email.js`:

```javascript
const { sendPasswordResetEmail } = require('./utils/mailService');

async function test() {
  const sent = await sendPasswordResetEmail(
    'your_test_email@gmail.com',
    'test-token-12345'
  );
  console.log('Email sent:', sent);
}

test();
```

Run test:
```bash
cd server
node test-email.js
```

Check your email for test message.

### Step 5: Test the Feature

1. **Start Backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd veloxpay
   npm start
   ```

3. **Test Flow:**
   - Go to http://localhost:3000/login
   - Click "Forgot Password?"
   - Enter your email address
   - Click "Send Reset Link"
   - Check your email for reset link
   - Click link in email
   - Enter new password
   - Verify confirmation page
   - Go back to login
   - Login with new password

## Features

### ForgotPassword Component
- Email input form
- Error/success messages
- Auto-redirect to login after success
- Loading state during submission

### ResetPassword Component
- Token validation on page load
- Password and confirmation fields
- Password strength validation (min 8 chars)
- Matches validation
- Auto-redirect to login after success

### Backend Endpoints

**POST /api/auth/forgot-password**
- Generates secure reset token
- Sends email with reset link
- Valid for 1 hour

**POST /api/auth/verify-reset-token**
- Validates token existence and expiration
- Called by ResetPassword component on mount

**POST /api/auth/reset-password**
- Updates user password
- Clears reset token
- Sends confirmation email

## Security Features

✅ Random token generation (32 bytes)
✅ Token hashing (SHA-256)
✅ 1-hour expiration
✅ One-time use (cleared after reset)
✅ Password hashing (bcrypt)
✅ Email verification
✅ Generic error messages
✅ Rate limiting ready (recommended)

## Troubleshooting

### Email Not Sending

**Check:**
1. EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD are set
2. Internet connection is working
3. Firewall allows SMTP
4. Check server logs for errors
5. For Gmail: App password (not regular password)

**Test:**
```bash
cd server
npm test  # If test setup exists
# Or manually test with test-email.js script
```

### Token Validation Fails

**Check:**
1. Database migration was run
2. reset_token column exists
3. Token in URL hasn't changed
4. Token isn't expired (valid for 1 hour)

**Verify in DB:**
```sql
SELECT email, reset_token, reset_token_expiry FROM users WHERE email = 'test@example.com';
```

### Password Not Updating

**Check:**
1. New password is at least 8 characters
2. Password confirmation matches
3. Database connection working
4. password_hash column is nullable

## File Locations

```
VeloxPay/
├── veloxpay/src/
│   ├── ForgotPassword.js (NEW)
│   ├── ResetPassword.js (NEW)
│   ├── Login.js (UPDATED)
│   └── App.js (UPDATED)
│
└── server/
    ├── routes/auth.js (UPDATED - 3 new endpoints)
    ├── utils/mailService.js (NEW)
    ├── .env (UPDATED)
    ├── migration.sql (UPDATED)
    └── package.json (UPDATED)

Documentation:
└── FORGOT_PASSWORD_IMPLEMENTATION.md (Comprehensive guide)
```

## Next Steps

1. ✅ Code implementation complete
2. ⏳ Update database with migration
3. ⏳ Configure email in .env
4. ⏳ Test email sending
5. ⏳ Test complete forgot password flow
6. ⏳ Deploy to production

## Production Deployment

Before deploying:

1. **Email Service:**
   - [ ] Use production email service (SendGrid, Mailgun, etc.)
   - [ ] Set credentials in environment variables
   - [ ] Test email delivery

2. **URLs:**
   - [ ] Update FRONTEND_URL to production domain
   - [ ] Ensure HTTPS is enabled
   - [ ] Test reset links work

3. **Security:**
   - [ ] Credentials not in code
   - [ ] HTTPS enforced
   - [ ] Rate limiting on endpoints
   - [ ] Logging enabled
   - [ ] Error messages don't reveal info

4. **Email Templates:**
   - [ ] Update branding in emails
   - [ ] Add support contact
   - [ ] Test email rendering
   - [ ] Check spam folder handling

## Support Resources

- **Implementation Guide**: `FORGOT_PASSWORD_IMPLEMENTATION.md`
- **Nodemailer Docs**: https://nodemailer.com/
- **OWASP Forgot Password**: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

---

**Status**: Implementation Complete
**Ready For**: Database Migration → Email Configuration → Testing
**Date**: March 27, 2026