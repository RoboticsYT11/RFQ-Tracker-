# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v16+) installed: `node --version`
- ✅ PostgreSQL (v12+) installed and running
  - **Windows**: See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed Windows instructions
  - **Linux/Mac**: `pg_isready` should work if PostgreSQL is installed
- ✅ npm or yarn installed: `npm --version`

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Database Setup

#### Create Database

**Windows Users**: If `psql` command is not recognized, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for detailed instructions.

```bash
# Windows (PowerShell) - if psql is in PATH
psql -U postgres -c "CREATE DATABASE rfq_tracker;"

# OR use pgAdmin GUI (recommended for Windows)
# Open pgAdmin 4 → Right-click Databases → Create → Database → Name: rfq_tracker

# Linux/Mac
sudo -u postgres createdb rfq_tracker
```

#### Configure Environment

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfq_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRE=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

RFQ_REMINDER_DAYS=3
INACTIVE_ALERT_DAYS=7
```

**Important**: Replace `your_postgres_password` with your actual PostgreSQL password.

### 3. Initialize Database

```bash
cd backend
npm run migrate
```

This creates all tables, indexes, and functions.

### 4. Seed Sample Data

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin` / `admin123`
- Sales users: `sales1` / `sales123`, `sales2` / `sales123`
- Engineer users: `engineer1` / `engineer123`, `engineer2` / `engineer123`
- 6 sample RFQs
- 3 sample quotations

### 5. Create Required Directories

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path backend\uploads
New-Item -ItemType Directory -Force -Path backend\temp

# Linux/Mac
mkdir -p backend/uploads backend/temp
```

### 6. Start the Application

#### Option A: Run Both Together (Recommended)
```bash
# From root directory
npm run dev
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

Login with:
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### Database Connection Error

**Error**: `Connection refused` or `password authentication failed`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check credentials in `backend/.env`
3. Test connection: `psql -U postgres -d rfq_tracker`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
- Backend: Change `PORT` in `backend/.env` to another port (e.g., 5001)
- Frontend: Create `frontend/.env` with `PORT=3001`

### Migration Errors

**Error**: `relation already exists` or `permission denied`

**Solution**:
1. Drop and recreate database:
   ```bash
   psql -U postgres -c "DROP DATABASE rfq_tracker;"
   psql -U postgres -c "CREATE DATABASE rfq_tracker;"
   ```
2. Run migration again: `npm run migrate`

### Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

### File Upload Issues

**Error**: `ENOENT: no such file or directory`

**Solution**:
```bash
# Create uploads directory
mkdir -p backend/uploads backend/temp
```

## Verification Checklist

After setup, verify:

- [ ] Backend server starts without errors
- [ ] Frontend compiles successfully
- [ ] Can login with admin credentials
- [ ] Dashboard loads with statistics
- [ ] Can view RFQ list
- [ ] Can create new RFQ
- [ ] Database has sample data (check with `psql -U postgres -d rfq_tracker -c "SELECT COUNT(*) FROM rfqs;"`)

## Next Steps

1. Explore the dashboard
2. Review sample RFQs
3. Create a test RFQ
4. Try exporting data
5. Test different user roles

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review error messages in terminal/console
- Verify all environment variables are set correctly
- Ensure PostgreSQL is running and accessible

