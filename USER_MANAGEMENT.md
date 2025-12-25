# User Management Guide

## How to Add/Update Employees, Engineers, and Sales Team Members

### Option 1: Using the API (Recommended - Admin Only)

As an admin, you can manage users through the API endpoints.

#### 1. **Add New User**

**Endpoint**: `POST /api/auth/register`

**Authentication**: Required (Admin token)

**Request Body**:
```json
{
  "username": "john_engineer",
  "email": "john@yantrik.com",
  "password": "secure_password123",
  "full_name": "John Engineer",
  "role": "engineer"
}
```

**Available Roles**:
- `admin` - System administrators
- `sales` - Sales team members
- `engineer` - Engineering team members
- `management` - Management team

**Example using PowerShell (after logging in as admin)**:
```powershell
$token = "your_jwt_token_here"
$body = @{
    username = "sarah_engineer"
    email = "sarah@yantrik.com"
    password = "password123"
    full_name = "Sarah Engineer"
    role = "engineer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{Authorization = "Bearer $token"; "Content-Type" = "application/json"} `
    -Body $body
```

#### 2. **Update Existing User**

**Endpoint**: `PUT /api/users/:id`

**Authentication**: Required (Admin token)

**Request Body** (include only fields to update):
```json
{
  "full_name": "John Engineer Updated",
  "role": "engineer",
  "is_active": true
}
```

#### 3. **Get All Users**

**Endpoint**: `GET /api/users`

**Returns**: List of all users (admin) or only active users (others)

#### 4. **Get Users by Role**

**Endpoint**: `GET /api/users/by-role/:role`

**Example**: `GET /api/users/by-role/engineer`

**Returns**: List of active users with that role

---

### Option 2: Using PostgreSQL Directly

You can directly insert/update users in the database using pgAdmin or psql.

#### Connect to Database

```sql
-- Connect to the database
\c rfq_tracker
```

#### Add New User

```sql
-- Hash password first (use bcrypt, or use a tool to generate hash)
-- Example: password 'engineer123' hashed = $2a$10$... (get from bcrypt)

INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
  'new_engineer',
  'engineer@yantrik.com',
  '$2a$10$YourBcryptHashHere', -- Generate using: bcrypt.hash('password', 10)
  'New Engineer',
  'engineer'
);
```

**To generate password hash using Node.js**:
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('your_password', 10);
console.log(hash);
```

#### Update User

```sql
-- Update user details
UPDATE users 
SET full_name = 'Updated Name',
    role = 'engineer',
    is_active = true
WHERE username = 'john_engineer';
```

#### View All Engineers

```sql
SELECT id, username, email, full_name, role, is_active, created_at
FROM users
WHERE role = 'engineer'
ORDER BY full_name;
```

#### View All Sales Team

```sql
SELECT id, username, email, full_name, role, is_active, created_at
FROM users
WHERE role = 'sales'
ORDER BY full_name;
```

#### Deactivate User (Soft Delete)

```sql
UPDATE users 
SET is_active = false
WHERE username = 'old_user';
```

---

### Option 3: Update Seed File (For Initial Setup)

If you want to add default users during initial setup, edit `backend/scripts/seed.js`:

```javascript
// Add more engineers
const engineerResult = await client.query(
  `INSERT INTO users (username, email, password_hash, full_name, role)
   VALUES 
     ('engineer1', 'engineer1@yantrik.com', $1, 'Engineer One', 'engineer'),
     ('engineer2', 'engineer2@yantrik.com', $1, 'Engineer Two', 'engineer'),
     ('engineer3', 'engineer3@yantrik.com', $1, 'Engineer Three', 'engineer') -- Add more here
   ON CONFLICT (username) DO NOTHING
   RETURNING id`,
  [engineerPassword]
);

// Add more sales
const salesResult = await client.query(
  `INSERT INTO users (username, email, password_hash, full_name, role)
   VALUES 
     ('sales1', 'sales1@yantrik.com', $1, 'Sales One', 'sales'),
     ('sales2', 'sales2@yantrik.com', $1, 'Sales Two', 'sales'),
     ('sales3', 'sales3@yantrik.com', $1, 'Sales Three', 'sales') -- Add more here
   ON CONFLICT (username) DO NOTHING
   RETURNING id`,
  [salesPassword]
);
```

Then re-run the seed:
```powershell
cd backend
npm run seed
```

**Note**: Seed script uses `ON CONFLICT DO NOTHING`, so existing users won't be overwritten.

---

## Quick Reference: Default Passwords

If you use the seed script, default passwords are:
- **Admin**: `admin123`
- **Sales**: `sales123`
- **Engineers**: `engineer123`

**Important**: Change these passwords after first login in production!

---

## Using Postman or Similar Tools

1. **Login as admin**:
   - POST `http://localhost:5000/api/auth/login`
   - Body: `{"username": "admin", "password": "admin123"}`
   - Copy the `token` from response

2. **Add new user**:
   - POST `http://localhost:5000/api/auth/register`
   - Headers: `Authorization: Bearer <token>`
   - Body: User details (see Option 1 above)

3. **Update user**:
   - PUT `http://localhost:5000/api/users/<user_id>`
   - Headers: `Authorization: Bearer <token>`
   - Body: Fields to update

---

## Troubleshooting

**User creation fails with "User already exists"**:
- Username or email already in database
- Use different username/email or update existing user

**Cannot register user (403 Forbidden)**:
- Only admins can create users via API
- Make sure you're logged in as admin

**Password not working**:
- Check if user is active: `SELECT is_active FROM users WHERE username = 'username';`
- Verify password hash if manually inserted

