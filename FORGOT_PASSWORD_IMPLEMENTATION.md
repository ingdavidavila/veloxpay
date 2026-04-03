# Forgot Password Implementation Guide

This document outlines the forgot password and password reset functionality implemented in VeloxPay.

## Feature Overview

Users can now reset their forgotten passwords through a secure email-based flow:

1. Click "Forgot Password?" on the login page
2. Enter email address
3. Receive password reset link via email
4. Click link and create new password
5. Confirmation email is sent

## Architecture

### Frontend Components

#### ForgotPassword Component (`veloxpay/src/ForgotPassword.js`)
- Simple form with email input
- Sends email to backend
- Shows success/error messages
- Automatically redirects to login after successful submission

**Features:**
- Input validation
- Error handling
- Loading state
- Success feedback

#### ResetPassword Component (`veloxpay/src/ResetPassword.js`)
- Validates reset token from URL
- Password and confirmation password fields
- Password strength validation
- Confirmation sent after successful reset

**Features:**
- Token validation on mount
- Password confirmation matching
- Minimum 8-character requirement
- Auto-redirect to login after success
- Error handling for expired/invalid tokens

#### Login Component Updates (`veloxpay/src/Login.js`)
- Added "Forgot Password?" link
- Link positioned below login button
- Styled as secondary action

### Backend Routes

#### POST /api/auth/forgot-password
**Purpose:** Initiate password reset process

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, a password reset link will be sent."
}
```

**Process:**
1. Check if user with email exists
2. Generate secure reset token (32 random bytes)
3. Hash token with SHA-256
4. Store hashed token in database (valid for 1 hour)
5. Send email with reset link containing unhashed token
6. Return generic message (security: don't reveal if email exists)

#### POST /api/auth/verify-reset-token
**Purpose:** Validate reset token before password change

**Request:**
```json
{
  "token": "reset_token_from_url"
}
```

**Response (200):**
```json
{
  "message": "Token is valid"
}
```

**Response (400):**
```json
{
  "error": "Invalid or expired reset link"
}
```

**Process:**
1. Hash the provided token
2. Query database for matching token with non-expired timestamp
3. Return validation result

#### POST /api/auth/reset-password
**Purpose:** Change password using valid reset token

**Request:**
```json
{
  "token": "reset_token_from_url",
  "newPassword": "SecureNewPassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Response (400):**
```json
{
  "error": "Invalid or expired reset link"
}
```

**Process:**
1. Verify token is valid and not expired
2. Validate password (min 8 characters)
3. Hash new password with bcrypt
4. Update user's password_hash
5. Clear reset_token and reset_token_expiry
6. Send confirmation email
7. Return success message

### Email Templates

#### Password Reset Email
- Contains reset link (expires in 1 hour)
- Button with reset URL
- Alternative text link
- Warning about not sharing email

#### Confirmation Email
- Confirmation of password change
- Security reminder
- Support contact info

### Database Changes

**New Columns in users table:**
```sql
reset_token VARCHAR(255)           -- Hashed reset token
reset_token_expiry TIMESTAMP       -- Token expiration time
```

**Token Lifecycle:**
1. Generated: When user requests password reset
2. Stored: SHA-256 hash in database
3. Sent: Unhashed token in email link
4. Validated: Token checked against stored hash
5. Cleared: After successful password reset or expiration

## Security Features

### Token Security
✅ **Random Token Generation**: 32 bytes of cryptographic randomness
✅ **Token Hashing**: SHA-256 hashing prevents DB breach exploitation
✅ **Expiration**: Tokens valid for 1 hour only
✅ **One-Time Use**: Token cleared after password change
✅ **No Token Reuse**: New token required for each reset

### Email Security
✅ **Secure Email Transport**: SMTP with authentication
✅ **Generic Messages**: Don't reveal if email exists in system
✅ **Password Requirements**: Minimum 8 characters enforced
✅ **Password Hashing**: bcrypt hashing for new passwords
✅ **Confirmation Email**: Alerts user to unauthorized changes

### Frontend Security
✅ **Token in URL**: Passed via query parameter (can be saved as bookmark)
✅ **Client Validation**: Token validated before password change
✅ **Password Matching**: Frontend validation of password confirmation
✅ **HTTPS Ready**: No sensitive data in URL parameters (for production)

## Environment Configuration

Update `server/.env` with email settings:

```env
# Email Configuration
EMAIL_SERVICE=gmail                    # Email service provider
EMAIL_USER=your_email@gmail.com        # Your email address
EMAIL_PASSWORD=your_app_password       # App-specific password (NOT regular password)
FRONTEND_URL=http://localhost:3000     # Your frontend URL
```

### Gmail Setup

If using Gmail:

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to myaccount.google.com/security
   - App passwords
   - Select Mail and Windows Computer
   - Copy generated 16-character password
3. Use generated password as EMAIL_PASSWORD

### Other Email Services

**SendGrid:**
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

**Mailgun:**
```env
EMAIL_SERVICE=Mailgun
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASSWORD=your_mailgun_key
```

## Database Migration

Run the migration to add password reset columns:

```sql
-- From server/migration.sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
```

## Error Handling

### Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid reset link. Token is missing." | No token in URL | Request new reset link |
| "Invalid or expired reset link" | Token not found or expired | Request new reset link |
| "Passwords do not match" | Confirmation password differs | Re-enter and match passwords |
| "Password must be at least 8 characters" | Password too short | Use longer password |
| "An error occurred. Please try again." | Network/Server error | Check connection, retry |

### Backend Errors

| Error | Cause | Action |
|-------|-------|--------|
| "Email is required" | Empty email field | Validate input |
| "Invalid or expired reset link" | Token invalid/expired | Generate new token |
| "Token is required" | Missing token parameter | Validate request |
| "Internal server error" | Unexpected error | Check server logs |

## Testing the Flow

### Manual Testing

1. **Request Reset:**
   - Go to `/login`
   - Click "Forgot Password?"
   - Enter registered email
   - Verify success message

2. **Check Email:**
   - Open email inbox
   - Look for password reset email
   - Copy reset link (note token parameter)

3. **Reset Password:**
   - Click link in email
   - Verify token is valid
   - Enter new password
   - Confirm password matches
   - Click "Reset Password"
   - Verify success message
   - Automatically redirected to login

4. **Login with New Password:**
   - Use new password to login
   - Verify access to dashboard

### Failure Cases to Test

- Invalid token (modify token in URL)
- Expired token (wait or manually expire in DB)
- Mismatched passwords
- Too short password (< 8 chars)
- SQL injection in email field
- XSS in password field

## Production Deployment

### Email Service Setup
1. Choose email provider (Gmail, SendGrid, Mailgun, etc.)
2. Configure credentials in environment variables
3. Test email sending before deployment
4. Monitor bounce rates and delivery issues

### URL Configuration
1. Update `FRONTEND_URL` to production domain
2. Ensure SSL/HTTPS is enabled
3. Test reset link generation
4. Verify email links work from production

### Security Checklist
- [ ] Email credentials stored securely (not in code)
- [ ] HTTPS enabled for all URLs
- [ ] Token expiration set appropriately (recommend 1-24 hours)
- [ ] Rate limiting on forgot-password endpoint
- [ ] Logging enabled for failed attempts
- [ ] Email templates match branding
- [ ] Support email in templates is monitored

## Logging and Monitoring

### Recommended Logging Points

```javascript
// In production, add logging for:
console.log(`Password reset requested for: ${email}`);
console.log(`Reset token generated for user: ${userId}`);
console.log(`Password reset completed for user: ${userId}`);
console.error(`Failed to send reset email to: ${email}`);
```

### Metrics to Track
- Requests for password reset
- Successful password changes
- Failed reset attempts
- Email delivery failures
- Token expiration frequency

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   Forgot Password Flow                          │
└─────────────────────────────────────────────────────────────────┘

User clicks "Forgot Password?"
          ↓
Browser navigates to /forgot-password
          ↓
User enters email and clicks "Send Reset Link"
          ↓
POST /api/auth/forgot-password
          ↓
Backend: Generate token, hash token, store with expiry
          ↓
Backend: Send email with reset link (contains unhashed token)
          ↓
Frontend: Show success message
          ↓
User clicks link in email
          ↓
Browser navigates to /reset-password?token=xyz
          ↓
Frontend: POST /api/auth/verify-reset-token
          ↓
Backend: Hash token, check validity
          ↓
Frontend: Show password reset form if valid
          ↓
User enters new password, clicks "Reset Password"
          ↓
POST /api/auth/reset-password
          ↓
Backend: Hash password, update users table, clear token
          ↓
Backend: Send confirmation email
          ↓
Frontend: Show success, redirect to login
          ↓
User logs in with new password
```

## Troubleshooting

### Email Not Received

**Checklist:**
- [ ] EMAIL_SERVICE configured correctly
- [ ] EMAIL_USER and EMAIL_PASSWORD are correct
- [ ] SMTP port is correct for provider
- [ ] Firewall allows SMTP connection
- [ ] Check spam/junk folder
- [ ] Check server logs for email errors

**Debug Email Send:**
```javascript
// Test in backend
const { sendPasswordResetEmail } = require('../../utils/mailService');
sendPasswordResetEmail('test@example.com', 'test-token');
```

### Token Validation Fails

**Checklist:**
- [ ] Token matches what was sent in email
- [ ] Database columns exist (migration ran)
- [ ] Token hasn't expired (within 1 hour)
- [ ] URL parameters aren't double-encoded

**Check Database:**
```sql
SELECT reset_token, reset_token_expiry FROM users WHERE email = 'user@example.com';
```

### Password Not Updating

**Checklist:**
- [ ] Database connection working
- [ ] password_hash column exists and is nullable
- [ ] Bcrypt installed and working
- [ ] User record exists in database

## Future Enhancements

- [ ] Rate limiting on forgot-password endpoint
- [ ] Account lockout after failed attempts
- [ ] Social account recovery via phone
- [ ] 2FA for password reset process
- [ ] Remember recovery email option
- [ ] Password strength meter on reset page
- [ ] SMS backup recovery method
- [ ] Security questions option

## References

- [OWASP - Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Bcrypt Security](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)