# RFQ Tracker - Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)

## Deployment Steps

### 1. Automatic Deployment via render.yaml
This project includes a `render.yaml` file for automatic deployment.

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Connect to Render**: 
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing this project
3. **Deploy**: Render will automatically create:
   - PostgreSQL database (`rfq-tracker-db`)
   - Web service (`rfq-tracker`)
   - All necessary environment variables

### 2. Manual Deployment (Alternative)

#### Step 1: Database Setup
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Configure:
   - **Name**: `rfq-tracker-db`
   - **Database**: `rfq_tracker`
   - **User**: `rfq_user`
   - **Plan**: Free
4. Note the **Internal Database URL**

#### Step 2: Web Service Setup
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `rfq-tracker`
   - **Environment**: `Node`
   - **Build Command**: `npm run build:all`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Step 3: Environment Variables
Add these in Render Web Service settings:

**Required Variables:**
- `NODE_ENV`: `production`
- `DATABASE_URL`: (copy from PostgreSQL service - Internal Database URL)
- `JWT_SECRET`: (generate a secure 32+ character string)
- `JWT_EXPIRE`: `7d`

**Optional Variables:**
- `UPLOAD_DIR`: `./uploads`
- `MAX_FILE_SIZE`: `10485760`
- `RFQ_REMINDER_DAYS`: `3`
- `INACTIVE_ALERT_DAYS`: `7`
- `CORS_ORIGIN`: `*` (or your specific domain for security)

## Automatic Features

### Database Initialization
The application automatically:
1. **Checks** if database tables exist on startup
2. **Creates** all tables if they don't exist (runs migration)
3. **Seeds** initial data including sample users and RFQs
4. **Starts** the web server

### Sample Users (Created Automatically)
- **Admin**: `admin` / `admin123`
- **Sales**: `sales1` / `sales123`, `sales2` / `sales123`  
- **Engineers**: `engineer1` / `engineer123`, `engineer2` / `engineer123`

### Production Features
- ✅ **HTTPS** enabled automatically by Render
- ✅ **Global CDN** for fast worldwide access
- ✅ **Auto-scaling** based on traffic
- ✅ **Health checks** via `/api/health` endpoint
- ✅ **Database connection pooling**
- ✅ **Static file serving** for React frontend
- ✅ **Error handling** and logging

## Verification Steps

After deployment, verify:

1. **Homepage loads**: Visit your Render URL
2. **API health**: Visit `https://your-app.onrender.com/api/health`
3. **Login works**: Use sample credentials above
4. **RFQ creation**: Create a new RFQ
5. **Database persistence**: Refresh page, data should remain

## Important Notes

### File Uploads
- Files stored locally in `uploads` directory
- For production scale, consider cloud storage (AWS S3, Cloudinary)
- Current limit: 10MB per file

### Database
- **Free PostgreSQL**: 1GB storage, 97 hours/month uptime
- **Paid plans**: Available for 24/7 uptime and more storage
- **Backups**: Automatic daily backups on paid plans

### Performance
- **Free tier**: Apps sleep after 15 minutes of inactivity
- **Paid plans**: Always-on, faster performance
- **Scaling**: Automatic based on traffic

### Security
- JWT tokens for authentication
- CORS protection
- Environment variables for secrets
- PostgreSQL with SSL connections

## Troubleshooting

### Common Issues

**Build Fails**
- Check all dependencies in `package.json`
- Verify Node.js version compatibility

**Database Connection Fails**
- Verify `DATABASE_URL` environment variable
- Check PostgreSQL service is running
- Ensure database and web service are in same region

**404 Errors**
- React routing handled by catch-all in `server.js`
- Ensure frontend build completed successfully

**File Upload Issues**
- Check `UPLOAD_DIR` permissions
- Verify `MAX_FILE_SIZE` setting
- Monitor disk space usage

### Logs and Monitoring
- View logs in Render dashboard
- Monitor performance metrics
- Set up alerts for downtime

## Scaling and Maintenance

### Monitoring
- Use Render's built-in metrics
- Monitor database usage
- Track API response times

### Backups
- Database: Automatic on paid plans
- Files: Consider cloud storage migration
- Code: GitHub repository

### Updates
- Push to GitHub triggers auto-deployment
- Use staging environment for testing
- Monitor deployment logs

## Cost Optimization

### Free Tier Limits
- Web service: 750 hours/month
- Database: 1GB storage, 97 hours/month
- Bandwidth: 100GB/month

### Upgrade Recommendations
- **Paid database** for 24/7 uptime
- **Paid web service** for better performance
- **Cloud storage** for file uploads at scale

---

## Quick Start Commands

```bash
# Local development
npm run dev

# Build for production
npm run build:all

# Start production server
npm start

# Database operations
npm run migrate
npm run seed
```

Your RFQ Tracker is now deployed globally with HTTPS and ready for production use! 🚀