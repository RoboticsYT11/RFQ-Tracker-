# RFQ Tracker & Activity Tracker System

A comprehensive full-stack application for managing Request for Quotation (RFQ) processes from enquiry to final order closure. Built for industrial automation companies with role-based access control, workflow management, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **RFQ Master Data Management**: Complete RFQ lifecycle tracking with auto-generated RFQ numbers
- **Quotation Tracking**: Multiple quotations per RFQ with revision control and approval workflow
- **Status Workflow**: Enforced business rules for status transitions
- **Dashboard & Analytics**: Real-time statistics, charts, and performance metrics
- **Search & Filter**: Advanced filtering by status, priority, category, date range, and more
- **Notifications & Alerts**: Overdue RFQ tracking and status change notifications
- **Role-Based Access**: Admin, Sales, Engineer, and Management roles with appropriate permissions
- **Export Functionality**: Export RFQ data to Excel and CSV formats
- **Audit Trail**: Complete history of status changes with timestamps

### User Roles
- **Admin**: Full access to all features
- **Sales**: Create RFQs, update status, upload quotations
- **Engineer**: View assigned RFQs, add technical inputs
- **Management**: Read-only dashboard and reports

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Multer** for file uploads
- **XLSX** and CSV-Writer for exports

### Frontend
- **React 18** with React Router
- **Recharts** for data visualization
- **Axios** for API calls
- **React DatePicker** for date inputs
- **CSS3** for styling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "RFQ Tracker & Activity Tracker"
```

### 2. Install Dependencies

Install root, backend, and frontend dependencies:

```bash
npm run install-all
```

Or install manually:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rfq_tracker;

# Exit psql
\q
```

#### Configure Environment Variables

Create `backend/.env` file with the following content (update with your database credentials):

```bash
cd backend
# Create .env file manually or copy from example if available
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfq_tracker
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

RFQ_REMINDER_DAYS=3
INACTIVE_ALERT_DAYS=7
```

#### Run Database Migrations

```bash
cd backend
npm run migrate
```

This will create all necessary tables, indexes, and functions.

#### Seed Sample Data

```bash
cd backend
npm run seed
```

This creates:
- Admin user: `admin` / `admin123`
- Sales users: `sales1` / `sales123`, `sales2` / `sales123`
- Engineer users: `engineer1` / `engineer123`, `engineer2` / `engineer123`
- 6 sample RFQs with various statuses
- 3 sample quotations

### 4. Create Required Directories

```bash
# Create uploads directory for quotation documents
mkdir -p backend/uploads
mkdir -p backend/temp
```

### 5. Start the Application

#### Option 1: Run Both Backend and Frontend Together

From the root directory:

```bash
npm run dev
```

#### Option 2: Run Separately

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

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📖 Usage Guide

### Login

Use the demo credentials created during seeding:
- **Admin**: `admin` / `admin123`
- **Sales**: `sales1` / `sales123`
- **Engineer**: `engineer1` / `engineer123`

### Creating an RFQ

1. Navigate to "RFQs" → "New RFQ"
2. Fill in customer information
3. Set RFQ dates and priority
4. Assign engineer and sales person
5. Add project details and estimated value
6. Click "Create RFQ"

### Managing Quotations

1. Open an RFQ detail page
2. Create a quotation with costing breakdown
3. Upload supporting documents (PDF, Excel, Drawings)
4. Set approval status
5. Update final approved amount when approved

### Changing RFQ Status

1. Open RFQ detail page
2. Click "Change Status"
3. Select new status
4. If marking as Lost/On Hold, provide reason (required)
5. System validates workflow rules automatically

### Dashboard Analytics

- View total RFQs by period (Month/Quarter/Year)
- See status breakdown with pie charts
- Analyze category distribution
- Track win/loss ratio
- Monitor engineer workload
- View overdue RFQs

### Exporting Data

1. Apply filters if needed
2. Click "Export Excel" or "Export CSV"
3. File downloads automatically

## 🗂️ Project Structure

```
RFQ Tracker & Activity Tracker/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── database/
│   │   └── schema.sql           # Database schema
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── rfq.js                # RFQ CRUD routes
│   │   ├── quotation.js          # Quotation routes
│   │   ├── dashboard.js          # Dashboard stats
│   │   ├── users.js              # User management
│   │   └── reports.js            # Export & reports
│   ├── scripts/
│   │   ├── migrate.js            # Database migration
│   │   └── seed.js               # Sample data seeding
│   ├── uploads/                  # Quotation documents
│   ├── temp/                     # Temporary export files
│   ├── server.js                 # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/             # Login component
│   │   │   ├── Dashboard/        # Dashboard with charts
│   │   │   ├── Layout/           # Layout & navigation
│   │   │   └── RFQ/              # RFQ components
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state management
│   │   ├── utils/
│   │   │   └── api.js            # API client
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json                  # Root package.json
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user

### RFQs
- `GET /api/rfq` - List RFQs with filters
- `GET /api/rfq/:id` - Get RFQ details
- `POST /api/rfq` - Create new RFQ
- `PUT /api/rfq/:id` - Update RFQ
- `DELETE /api/rfq/:id` - Delete RFQ (Admin only)

### Quotations
- `GET /api/quotation/rfq/:rfqId` - Get quotations for RFQ
- `GET /api/quotation/:id` - Get quotation details
- `POST /api/quotation` - Create quotation
- `PUT /api/quotation/:id` - Update quotation
- `POST /api/quotation/:id/documents` - Upload documents
- `DELETE /api/quotation/documents/:docId` - Delete document

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Reports
- `GET /api/reports/export/excel` - Export to Excel
- `GET /api/reports/export/csv` - Export to CSV
- `GET /api/reports/monthly-performance` - Monthly performance
- `GET /api/reports/customer-history` - Customer RFQ history
- `GET /api/reports/engineer-performance` - Engineer performance

### Users
- `GET /api/users` - List users
- `GET /api/users/by-role/:role` - Get users by role
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user (Admin only)

## 🔄 Workflow Rules

The system enforces the following business rules:

1. **Quotation Sent**: Cannot set status to "Quotation Sent" without creating at least one quotation
2. **Won Status**: Cannot mark RFQ as "Won" without an approved quotation
3. **Lost/On Hold**: Must provide reason when marking as "Lost" or "On Hold"
4. **Status Changes**: All status changes are logged with timestamp and user

## 🎨 UI Features

- **Status Color Coding**: Visual indicators for RFQ status
- **Priority Indicators**: Color-coded priority levels
- **Overdue Highlighting**: Red highlighting for overdue RFQs
- **Responsive Design**: Works on desktop and mobile devices
- **Clean Industrial UI**: Professional ERP-style interface
- **Interactive Charts**: Pie charts and bar charts for analytics

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Set `PORT=3001` in `frontend/.env` (create if needed)

### Migration Errors
- Ensure PostgreSQL is running
- Check database user has CREATE privileges
- Drop and recreate database if needed

### File Upload Issues
- Ensure `backend/uploads` directory exists
- Check file size limits in `.env`
- Verify file permissions

## 📝 Notes

- Default currency is INR (Indian Rupees)
- RFQ numbers are auto-generated in format: `RFQ-YYYY-XXXXX`
- Quotation numbers are auto-generated in format: `QUO-YYYY-XXXXX`
- All dates are stored in UTC and displayed in local timezone
- File uploads are stored in `backend/uploads` directory

## 🔮 Future Enhancements

- Email notifications for status changes
- Advanced reporting with custom date ranges
- Integration with ERP/CRM systems
- Mobile app support
- Real-time collaboration features
- Document version control
- Advanced search with full-text search
- Bulk operations
- Custom fields and tags

## 📄 License

This project is proprietary software for internal use.

## 👥 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for Industrial Automation Companies**

#   R F Q - T r a c k e r -  
 