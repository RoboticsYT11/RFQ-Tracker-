# 🚀 RFQ Tracker - Production Deployment

## Quick Deploy to Render

### 1. Pre-Deployment Check
```bash
node deploy-verify.js
```
✅ Ensures all configuration is production-ready

### 2. Deploy to Render (Automatic)
1. **Push to GitHub**: `git push origin main`
2. **Render Dashboard**: Go to [dashboard.render.com](https://dashboard.render.com)
3. **New Blueprint**: Click "New" → "Blueprint"
4. **Connect Repo**: Select your GitHub repository
5. **Deploy**: Render automatically creates database + web service

### 3. Verify Deployment
```bash
node health-check.js https://your-app.onrender.com
```

## What Gets Deployed

### 🗄️ Database (PostgreSQL)
- **Name**: `rfq-tracker-db`
- **Auto-created**: Tables, indexes, functions
- **Sample Data**: Users, RFQs, quotations
- **SSL**: Enabled for security

### 🌐 Web Service
- **Name**: `rfq-tracker`
- **HTTPS**: Automatic SSL certificate
- **Global CDN**: Worldwide fast access
- **Auto-scaling**: Handles traffic spikes

### 👥 Sample Users (Auto-Created)
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Sales | `sales1` | `sales123` |
| Engineer | `engineer1` | `engineer123` |

## Environment Variables (Auto-Set)

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | Auto-generated | PostgreSQL connection |
| `JWT_SECRET` | Auto-generated | Secure token secret |
| `PORT` | Auto-set | Render port |

## Features Included

- ✅ **HTTPS** - Automatic SSL/TLS
- ✅ **Global Access** - Worldwide CDN
- ✅ **Auto-scaling** - Traffic-based scaling
- ✅ **Health Monitoring** - Built-in checks
- ✅ **Database Pooling** - Efficient connections
- ✅ **Error Handling** - Comprehensive logging
- ✅ **File Uploads** - Document management
- ✅ **Authentication** - JWT-based security

## Production URLs

After deployment, you'll get:
- **App**: `https://rfq-tracker-[random].onrender.com`
- **Health**: `https://rfq-tracker-[random].onrender.com/api/health`
- **API**: `https://rfq-tracker-[random].onrender.com/api/*`

## Troubleshooting

### Build Fails
```bash
# Check logs in Render dashboard
# Verify Node.js version in package.json
```

### Database Issues
```bash
# Check DATABASE_URL environment variable
# Verify PostgreSQL service is running
```

### App Not Loading
```bash
# Check web service logs
# Verify build completed successfully
# Test health endpoint
```

## Cost (Free Tier)
- **Web Service**: 750 hours/month
- **Database**: 1GB storage, 97 hours/month
- **Bandwidth**: 100GB/month
- **SSL**: Included
- **Custom Domain**: Available

## Scaling Options
- **Paid Plans**: 24/7 uptime, better performance
- **Database Upgrades**: More storage, continuous uptime
- **CDN**: Global edge caching
- **Monitoring**: Advanced metrics and alerts

---

## 🎯 Result

Your RFQ Tracker will be:
- 🌍 **Globally accessible** via HTTPS
- 🔒 **Secure** with SSL and JWT authentication  
- 📊 **Production-ready** with monitoring and logging
- 🚀 **Fast** with CDN and auto-scaling
- 💾 **Persistent** with PostgreSQL database

**Total deployment time**: ~5-10 minutes

Ready to deploy? Run `node deploy-verify.js` and follow the steps above! 🚀