# Backend API Implementation Guide

## Quick Start

These are the three new endpoints you need to create in `server/routes/auth.js` or a new `server/routes/invoices.js`:

---

## 1. GET /api/invoices

Fetch all invoices for the authenticated user.

### Implementation Steps

1. **Verify JWT Token**
   ```javascript
   const token = req.headers.authorization?.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   const userId = decoded.userId;
   ```

2. **Query Database**
   ```javascript
   const limit = req.query.limit || 100;
   const query = `
     SELECT id, user_id, invoice_number, client_name, description, 
            status, total_amount, early_payout, due_date, created_at
     FROM invoices
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2
   `;
   const result = await pool.query(query, [userId, limit]);
   ```

3. **Return Response**
   ```javascript
   res.json(result.rows);
   ```

### Complete Code Example

```javascript
router.get('/api/invoices', async (req, res) => {
  try {
    // Extract and verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const limit = req.query.limit || 100;

    // Fetch invoices for user
    const query = `
      SELECT id, user_id, invoice_number, client_name, description, 
             status, total_amount, early_payout, due_date, created_at
      FROM invoices
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 2. GET /api/invoices/stats

Fetch invoice statistics (counts and amounts) for the authenticated user.

### Implementation Steps

1. **Extract user ID from JWT**
   ```javascript
   const token = req.headers.authorization?.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   const userId = decoded.userId;
   ```

2. **Query Statistics**
   ```javascript
   const query = `
     SELECT 
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
       COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
       COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_amount,
       COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as approved_amount,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_amount
     FROM invoices
     WHERE user_id = $1
   `;
   ```

3. **Return Formatted Response**
   ```javascript
   const row = result.rows[0];
   res.json({
     pending: parseInt(row.pending),
     approved: parseInt(row.approved),
     paid: parseInt(row.paid),
     pendingAmount: parseFloat(row.pending_amount),
     approvedAmount: parseFloat(row.approved_amount),
     paidAmount: parseFloat(row.paid_amount),
   });
   ```

### Complete Code Example

```javascript
router.get('/api/invoices/stats', async (req, res) => {
  try {
    // Extract and verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // Calculate statistics
    const query = `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int as paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN CAST(total_amount AS numeric) ELSE 0 END), 0)::numeric as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN CAST(total_amount AS numeric) ELSE 0 END), 0)::numeric as approved_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN CAST(total_amount AS numeric) ELSE 0 END), 0)::numeric as paid_amount
      FROM invoices
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];

    res.json({
      pending: row.pending,
      approved: row.approved,
      paid: row.paid,
      pendingAmount: parseFloat(row.pending_amount),
      approvedAmount: parseFloat(row.approved_amount),
      paidAmount: parseFloat(row.paid_amount),
    });

  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 3. PUT /api/user/profile

Update user profile information (business name, phone).

### Implementation Steps

1. **Extract JWT and validate**
   ```javascript
   const token = req.headers.authorization?.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   const userId = decoded.userId;
   ```

2. **Extract request body**
   ```javascript
   const { business_name, phone } = req.body;
   ```

3. **Update database**
   ```javascript
   const query = `
     UPDATE users
     SET business_name = $1, phone = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, business_name, phone, avatar, created_at
   `;
   ```

4. **Return updated user**
   ```javascript
   res.json({
     message: 'Profile updated successfully',
     user: result.rows[0]
   });
   ```

### Complete Code Example

```javascript
router.put('/api/user/profile', async (req, res) => {
  try {
    // Extract and verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;
    const { business_name, phone } = req.body;

    // Validate input
    if (!business_name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update user profile
    const query = `
      UPDATE users
      SET business_name = $1, phone = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, business_name, phone, avatar, created_at
    `;
    
    const result = await pool.query(query, [business_name, phone, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Database Schema Verification

Ensure your `invoices` table has these columns:

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'paid')),
  total_amount DECIMAL(10, 2) NOT NULL,
  early_payout DECIMAL(10, 2),
  due_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);
```

Ensure your `users` table has these columns:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

---

## Testing the Endpoints

### Test 1: Get Invoices

```bash
curl -X GET http://localhost:5000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "650e8400-e29b-41d4-a716-446655440001",
    "invoice_number": "INV-2025-001",
    "client_name": "Acme Corp",
    "description": "Web development services",
    "status": "pending",
    "total_amount": "15000.00",
    "early_payout": "14500.00",
    "due_date": "2025-03-14T00:00:00.000Z",
    "created_at": "2025-02-19T10:30:00.000Z"
  }
]
```

### Test 2: Get Stats

```bash
curl -X GET http://localhost:5000/api/invoices/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

**Expected Response:**
```json
{
  "pending": 1,
  "approved": 1,
  "paid": 1,
  "pendingAmount": 15000,
  "approvedAmount": 8500,
  "paidAmount": 22000
}
```

### Test 3: Update Profile

```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "New Business Name",
    "phone": "+1 (555) 123-4567"
  }'
```

**Expected Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "email": "john@example.com",
    "business_name": "New Business Name",
    "phone": "+1 (555) 123-4567",
    "avatar": null,
    "created_at": "2025-02-01T00:00:00.000Z"
  }
}
```

---

## Common Issues & Solutions

### Issue: "Unauthorized" Error

**Cause:** No token in Authorization header or token is invalid

**Solution:**
```javascript
// Verify header format is: "Bearer {token}"
const authHeader = req.headers.authorization; // "Bearer eyJhbGc..."
const token = authHeader?.split(' ')[1]; // "eyJhbGc..."

// Verify token is not expired
try {
  jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  console.log('Token error:', error.message); // "jwt expired"
}
```

### Issue: "Invalid token" Error

**Cause:** Token signed with different secret or corrupted

**Solution:**
```javascript
// Ensure JWT_SECRET environment variable matches
// on both login/signup AND when verifying
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Check if token was generated with this secret
const generated = jwt.sign({ userId: 'test' }, process.env.JWT_SECRET);
const verified = jwt.verify(generated, process.env.JWT_SECRET); // Should work
```

### Issue: No Invoices Returned

**Possible Causes:**
1. User has no invoices in database
2. `user_id` in JWT doesn't match database
3. Invoices table is empty

**Debug:**
```javascript
// Step 1: Print the userId from token
console.log('User ID from token:', userId);

// Step 2: Check if user exists
const userQuery = 'SELECT id FROM users WHERE id = $1';
const userResult = await pool.query(userQuery, [userId]);
console.log('User found:', userResult.rows.length > 0);

// Step 3: Check if invoices exist
const invoiceQuery = 'SELECT COUNT(*) FROM invoices WHERE user_id = $1';
const invoiceResult = await pool.query(invoiceQuery, [userId]);
console.log('Invoice count:', invoiceResult.rows[0].count);
```

### Issue: Database Error - "Column does not exist"

**Cause:** Table is missing required columns

**Solution:**
```sql
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify invoices table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'invoices';
```

---

## Security Checklist

- [ ] All endpoints verify JWT token in Authorization header
- [ ] All endpoints extract userId from JWT (not from request body)
- [ ] All queries filter by userId to prevent cross-user data access
- [ ] No user can query another user's data
- [ ] Passwords never exposed in any response
- [ ] JWT_SECRET not exposed in frontend code
- [ ] All errors logged but don't expose schema details
- [ ] Rate limiting implemented on endpoints
- [ ] HTTPS enforced in production

---

## Performance Tips

1. **Add Database Indexes**
   ```sql
   CREATE INDEX idx_invoices_user_id ON invoices(user_id);
   CREATE INDEX idx_invoices_status ON invoices(status);
   CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
   ```

2. **Pagination for Large Result Sets**
   ```javascript
   const page = req.query.page || 1;
   const limit = req.query.limit || 50;
   const offset = (page - 1) * limit;
   
   const query = `SELECT * FROM invoices WHERE user_id = $1 
                  ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
   ```

3. **Cache Stats**
   ```javascript
   // Cache for 5 minutes per user
   const cacheKey = `stats_${userId}`;
   if (cache.has(cacheKey)) {
     return res.json(cache.get(cacheKey));
   }
   ```

---

## Summary

You now have complete code for three backend endpoints that will:
- ✅ Fetch user's invoices
- ✅ Calculate user's statistics
- ✅ Update user's profile
- ✅ Verify authentication via JWT
- ✅ Prevent cross-user data access
- ✅ Handle errors properly

Copy-paste the code examples and modify the connection pool variable to match your setup. Test with the provided curl commands.