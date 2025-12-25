# RFQ Tracker - Render Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- PostgreSQL database (can use Render's free PostgreSQL)

## Deployment Steps

### 1. Database Setup
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Choose a name (e.g., `rfq-tracker-db`)
4. Select the free plan
5. Note down the connection details (Internal Database URL)

### 2. Web Service Setup
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `rfq-tracker`
   - **Environment**: `Node`
   - **Build Command**: `npm run build:all`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### 3. Environment Variables
Add these environment variables in Render:

**Required Variables:**
- `NODE_ENV`: `production`
- `PORT`: (auto-set by Render)
- `DATABASE_URL`: (copy from your PostgreSQL service)
- `JWT_SECRET`: (generate a secure 32+ character string)
- `JWT_EXPIRE`: `7d`

**Optional Variables:**
- `UPLOAD_DIR`: `./uploads`
- `MAX_FILE_SIZE`: `10485760`
- `RFQ_REMINDER_DAYS`: `3`
- `INACTIVE_ALERT_DAYS`: `7`
- `CORS_ORIGIN`: `*` (or your specific domain)

### 4. Database Migration
After deployment, you'll need to run your database migrations:
1. Go to your web service in Render
2. Open the "Shell" tab
3. Run: `npm run migrate`
4. Optionally seed data: `npm run seed`

## Important Notes

1. **Database Connection**: The app expects PostgreSQL connection via `DATABASE_URL` environment variable
2. **File Uploads**: Files are stored locally in the `uploads` directory (consider using cloud storage for production)
3. **CORS**: Configure `CORS_ORIGIN` to your domain for security
4. **JWT Secret**: Use a strong, unique JWT secret for production

## Troubleshooting

- **Build Fails**: Check that all dependencies are in `package.json`
- **Database Connection**: Verify `DATABASE_URL` is correctly set
- **404 Errors**: Ensure React routing is handled by the catch-all route in server.js
- **File Upload Issues**: Check file permissions and `UPLOAD_DIR` path

## Post-Deployment

1. Test all API endpoints
2. Verify frontend loads correctly
3. Test user authentication
4. Check file upload functionality
5. Monitor logs for any errors