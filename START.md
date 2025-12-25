# Quick Start Guide

## Starting the Project

The workspace path contains spaces and special characters (`&`), which can cause issues with npm commands. Use these methods:

### 🚀 Option 1: Use Startup Scripts (Easiest - Recommended)

**Start both servers at once:**
```powershell
.\start-dev.ps1
```
This will open two separate windows, one for backend and one for frontend.

**Or start them separately:**
```powershell
# Terminal 1 - Backend
.\start-backend.ps1

# Terminal 2 - Frontend  
.\start-frontend.ps1
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```powershell
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
node node_modules\.bin\react-scripts start
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Login Credentials

- **Admin**: `admin` / `admin123`
- **Sales**: `sales1` / `sales123`, `sales2` / `sales123`
- **Engineer**: `engineer1` / `engineer123`, `engineer2` / `engineer123`

## Troubleshooting

If you get module not found errors, make sure dependencies are installed:
```powershell
npm run install-all
```

If ports are in use, you can change them:
- Backend: Edit `backend/.env` and change `PORT=5000`
- Frontend: Create `frontend/.env` with `PORT=3001`

