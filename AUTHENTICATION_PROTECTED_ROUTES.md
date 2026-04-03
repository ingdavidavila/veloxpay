# Authentication & Protected Routes Implementation

## Overview

A complete authentication system has been implemented with the following features:

- **Protected Routes**: Dashboard only accessible when logged in
- **Auth Context**: Global authentication state management
- **Auto-redirect**: Unauthorized users redirected to login
- **User Session**: Login persists across page refreshes
- **Logout**: Clear session and return to login

## Architecture

### Components Created/Updated

#### 1. AuthContext.js (NEW)
Central authentication state management using React Context API.

**Manages:**
- `user`: Current user data
- `isAuthenticated`: Login status
- `isLoading`: Loading state
- `login()`: Store token and user on authentication
- `logout()`: Clear token and user on logout
- `getToken()`: Retrieve JWT token

#### 2. ProtectedRoute.js (NEW)
Route wrapper that checks authentication before rendering.

**Features:**
- Checks if user is authenticated
- Shows loading state while checking
- Redirects to login if not authenticated
- Renders component if authenticated

#### 3. useAuth.js (NEW)
Custom hook for easy access to auth context throughout components.

**Usage:**
```javascript
const { user, isAuthenticated, login, logout } = useAuth();
```

#### 4. App.js (UPDATED)
- Wrapped with AuthProvider
- Dashboard routes protected with ProtectedRoute

#### 5. Login.js (UPDATED)
- Uses AuthContext.login() to store session
- Google OAuth uses context
- Traditional email/password now generates JWT and stores session

#### 6. Signup.js (UPDATED)
- Auto-logs in user after signup
- Uses AuthContext to store session
- Error handling with user feedback

### Backend Routes Updated

#### POST /api/auth/login
Now returns JWT token along with user data.

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John",
    "email": "john@example.com",
    "business_name": "Acme"
  }
}
```

#### POST /api/auth/signup
Now returns JWT token immediately after signup.

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John",
    "email": "john@example.com"
  }
}
```

## How It Works

### Login Flow

```
1. User enters credentials or OAuth provider redirects
2. Frontend sends request to backend
3. Backend verifies credentials and generates JWT
4. Frontend receives token and user data
5. Frontend calls AuthContext.login(token, userData)
6. AuthContext stores token and user in localStorage and state
7. User is redirected to dashboard
```

### Protected Route Check

```
1. User navigates to /dashboard
2. App.js renders <ProtectedRoute element={<Dashboard />} />
3. ProtectedRoute checks AuthContext.isAuthenticated
4. If authenticated: Dashboard renders
5. If not: User redirected to /login
```

### Session Persistence

```
1. On app load, AuthProvider checks localStorage for token
2. If token exists, sets isAuthenticated to true
3. All pages check this status
4. Dashboard accessible if isAuthenticated
5. Token persists across page refreshes
```

### Logout Flow

```
1. User clicks logout button
2. Frontend calls AuthContext.logout()
3. AuthContext clears localStorage and state
4. User redirected to login
5. localStorage no longer has token or user data
```

## Implementation Guide

### Step 1: Update Dashboard Component

Make sure your Dashboard only shows authenticated user's data:

```javascript
import { useAuth } from './useAuth';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.name || 'User'}</h1>
      
      <button onClick={logout} className="btn btn-danger">
        Logout
      </button>
      
      {/* Show only current user's data */}
      <div>
        <p>User ID: {user?.id}</p>
        <p>Email: {user?.email}</p>
        <p>Business: {user?.business_name}</p>
      </div>
    </div>
  );
}
```

### Step 2: Add Logout Button to Navigation

```javascript
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav>
      {/* Navigation items */}
      {isAuthenticated && (
        <button onClick={handleLogout}>Logout</button>
      )}
    </nav>
  );
}
```

### Step 3: Access User Data in Any Component

```javascript
import { useAuth } from './useAuth';

function Profile() {
  const { user, updateUser } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## Security Features

✅ **Token-based Authentication**: JWT tokens stored in localStorage
✅ **Protected Routes**: Unauthorized users cannot access dashboard
✅ **Session Persistence**: Login survives page refreshes
✅ **Auto-logout**: Session clears on logout
✅ **User Isolation**: Each user sees only their own data
✅ **Redirect**: Unauthenticated users automatically redirected to login

## File Structure

```
veloxpay/src/
├── AuthContext.js (NEW - Global auth state)
├── ProtectedRoute.js (NEW - Route protection)
├── useAuth.js (NEW - Custom hook)
├── App.js (UPDATED - AuthProvider & ProtectedRoute)
├── Login.js (UPDATED - Uses AuthContext)
├── Signup.js (UPDATED - Uses AuthContext)
├── Dashboard.js (NEEDS UPDATE - Add logout, use useAuth)
└── ... other components
```

## Testing

### Test 1: Direct Dashboard Access Without Login
1. Start app
2. Go directly to `http://localhost:3000/dashboard`
3. **Expected**: Redirected to login page

### Test 2: Login Then Access Dashboard
1. Go to login page
2. Enter credentials and click login
3. **Expected**: Redirected to dashboard, can view page

### Test 3: Logout Then Try Dashboard
1. While logged in, click logout button
2. Try to go to `/dashboard`
3. **Expected**: Redirected to login page

### Test 4: Refresh Page While Logged In
1. Login to dashboard
2. Refresh browser (F5)
3. **Expected**: Still on dashboard, still logged in

### Test 5: Close and Reopen Browser
1. Login to dashboard
2. Close browser completely
3. Reopen browser
4. Go to app URL
5. **Expected**: Can navigate to dashboard, still logged in

### Test 6: Passport OAuth Flows
1. Click "Continue with Google"
2. Complete authorization
3. **Expected**: Redirected to dashboard, logged in

## Environment Variables

Backend `.env` must have:
```env
JWT_SECRET=your_secret_key_here
```

Frontend `.env` must have:
```env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
```

## Common Issues & Solutions

### Issue: "Cannot access /dashboard" but shows login page
**Cause**: isLoading is true
**Solution**: AuthProvider is checking localStorage. Wait for it to complete.

### Issue: Token stored but not recognized
**Cause**: localStorage key wrong or token malformed
**Solution**: Check browser DevTools → Application → localStorage → verify token format

### Issue: Logout doesn't work
**Cause**: logout() not called or user still has token
**Solution**: Check that logout() clears both localStorage and state

### Issue: User data not showing in dashboard
**Cause**: user object not retrieved from localStorage
**Solution**: Verify that login() stores user data with JSON.stringify()

## Production Considerations

1. **Use httpOnly Cookies**: Instead of localStorage for better security
2. **Token Refresh**: Implement refresh token logic
3. **Secure Communication**: Always use HTTPS
4. **Rate Limiting**: Limit login attempts
5. **Session Timeout**: Auto-logout after inactivity
6. **CSRF Protection**: Add CSRF tokens for mutations

## Next Steps

1. ✅ Auth system implemented
2. ⏳ Update Dashboard.js to use useAuth()
3. ⏳ Add logout button to navigation
4. ⏳ Test all authentication flows
5. ⏳ Add error boundaries for auth failures
6. ⏳ Implement session timeout (optional)
7. ⏳ Deploy to production

## References

- React Context API: https://react.dev/reference/react/useContext
- JWT Tokens: https://jwt.io/
- Secure Authentication: https://owasp.org/www-project-authentication-cheat-sheet/