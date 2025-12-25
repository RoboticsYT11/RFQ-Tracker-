# 🚀 RFQ Tracker & Activity Tracker

A comprehensive web-based RFQ (Request for Quotation) management system built with React.js and Node.js, designed for Yantrik Automation Pvt Ltd.

![RFQ Tracker](https://img.shields.io/badge/Status-Production%20Ready-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

## ✨ Features

### 🎯 Core Functionality
- **RFQ Management**: Create, edit, view, and track RFQs
- **User Management**: Admin, Sales, Engineer, and Management roles
- **Quotation Tracking**: Manage quotations and approvals
- **Status Tracking**: Real-time RFQ status updates with history
- **Dashboard Analytics**: Visual insights and statistics
- **Document Management**: File uploads and attachments

### 🎨 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Colorful Interface**: Intuitive color-coded sections
- **Role-based Access**: Different permissions for different user types
- **Real-time Updates**: Live status changes and notifications

### 🔧 Technical Features
- **RESTful API**: Clean backend architecture
- **JWT Authentication**: Secure user sessions
- **Database Migrations**: Automated schema management
- **File Upload Support**: Document attachments
- **Audit Logging**: Complete activity tracking

## 🌐 Live Demo

**Frontend**: [https://rfq-tracker-frontend.onrender.com](https://rfq-tracker-frontend.onrender.com)
**Backend API**: [https://rfq-tracker-backend.onrender.com](https://rfq-tracker-backend.onrender.com)

### Demo Credentials
- **Admin**: `admin` / `admin123`

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React.js      │    │   Node.js       │    │  PostgreSQL     │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 5000)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/RoboticsYT11/RFQ-Tracker-.git
   cd RFQ-Tracker-
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb rfq_tracker
   
   # Run migrations and seed data
   cd backend
   node scripts/seed.js
   ```

4. **Configure environment**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Update database credentials in backend/.env
   ```

5. **Start the application**
   ```bash
   # Option 1: Use the startup script
   ./start-all.ps1  # Windows
   ./start-all.sh   # Linux/Mac
   
   # Option 2: Start manually
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🌍 Deployment

### Deploy to Render (Recommended)

1. **Fork this repository** to your GitHub account

2. **Create Render account** at [render.com](https://render.com)

3. **Deploy using Blueprint**
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Click "Deploy" and wait for deployment to complete

4. **Access your deployed application**
   - Your app will be available at: `https://your-app-name.onrender.com`

### Deploy to Other Platforms

- **Heroku**: Use the included `Procfile` and `heroku.yml`
- **DigitalOcean**: Use Docker Compose with `docker-compose.yml`
- **AWS/Azure**: Deploy using container services
- **Vercel/Netlify**: Frontend-only deployment with external API

## 📁 Project Structure

```
RFQ-Tracker-/
├── backend/                 # Node.js API server
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication and validation
│   ├── routes/             # API endpoints
│   ├── scripts/            # Database migrations and seeds
│   ├── uploads/            # File upload directory
│   └── server.js           # Main server file
├── frontend/               # React.js application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main app component
│   └── package.json
├── docker-compose.yml      # Docker deployment
├── render.yaml            # Render deployment config
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfq_tracker
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### RFQ Management
![RFQ List](docs/screenshots/rfq-list.png)

### User Management
![Settings](docs/screenshots/settings.png)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 About Yantrik Automation

This RFQ Tracker is developed for Yantrik Automation Pvt Ltd, a leading automation solutions provider specializing in:
- Industrial Automation
- Vision Systems
- Robotics Solutions
- Electrical Control Systems
- Software Development

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact: [your-email@company.com]
- Documentation: [Link to detailed docs]

## 🚀 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Integration with ERP systems
- [ ] Multi-language support
- [ ] Advanced workflow automation

---

**Made with ❤️ for Yantrik Automation Pvt Ltd**