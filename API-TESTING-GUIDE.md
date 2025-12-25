# 🚀 RFQ Tracker API Testing Guide

## 🌐 **Base URL**
```
Production: https://rfq-tracker-vy6i.onrender.com/api
Local: http://localhost:5000/api
```

## 🔐 **Authentication**
Most endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 **API Endpoints**

### **🔑 Authentication APIs**

#### **1. Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "admin",
    "full_name": "System Administrator"
  }
}
```

#### **2. Register User (Admin Only)**
```http
POST /api/auth/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@company.com",
  "password": "password123",
  "full_name": "New User",
  "role": "sales"
}
```

#### **3. Get Current User Profile**
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### **4. Update Profile**
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "email": "newemail@company.com"
}
```

#### **5. Change Password**
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpass",
  "new_password": "newpass123"
}
```

---

### **📊 RFQ Management APIs**

#### **6. Get All RFQs (with filters)**
```http
GET /api/rfq?page=1&limit=10&status=Enquiry&priority=High&search=customer
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `status`: Filter by status
- `priority`: Filter by priority
- `category`: Filter by category
- `engineer_id`: Filter by assigned engineer
- `sales_id`: Filter by assigned sales person
- `search`: Search in customer name, company, project
- `sort_by`: Sort column (default: created_at)
- `sort_order`: ASC or DESC (default: DESC)
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)

#### **7. Get Single RFQ**
```http
GET /api/rfq/:id
Authorization: Bearer <token>
```

#### **8. Create New RFQ**
```http
POST /api/rfq
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "ABC Company",
  "customer_contact_person": "John Doe",
  "email": "john@abc.com",
  "phone": "+91-9876543210",
  "company_name": "ABC Manufacturing",
  "rfq_received_date": "2024-01-15",
  "rfq_due_date": "2024-02-15",
  "product_project_name": "Automated Assembly Line",
  "rfq_category": "Automation",
  "rfq_source": "Email",
  "assigned_engineer_id": "engineer-uuid",
  "assigned_sales_person_id": "sales-uuid",
  "priority": "High",
  "estimated_project_value": 2500000,
  "currency": "INR",
  "expected_order_date": "2024-03-01",
  "remarks_notes": "Large project requiring detailed review"
}
```

#### **9. Update RFQ**
```http
PUT /api/rfq/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Under Review",
  "priority": "Critical",
  "remarks_notes": "Updated requirements received"
}
```

#### **10. Delete RFQ**
```http
DELETE /api/rfq/:id
Authorization: Bearer <token>
```

#### **11. Update RFQ Status**
```http
PUT /api/rfq/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Quotation Sent",
  "reason": "Quotation prepared and sent to customer"
}
```

---

### **💰 Quotation APIs**

#### **12. Get Quotations for RFQ**
```http
GET /api/quotation/rfq/:rfqId
Authorization: Bearer <token>
```

#### **13. Create Quotation**
```http
POST /api/quotation
Authorization: Bearer <token>
Content-Type: application/json

{
  "rfq_id": "rfq-uuid",
  "quotation_sent_date": "2024-01-25",
  "quoted_amount": 2750000,
  "material_cost": 1500000,
  "engineering_cost": 800000,
  "software_cost": 200000,
  "installation_cost": 150000,
  "margin": 100000,
  "validity_date": "2024-04-25"
}
```

#### **14. Update Quotation**
```http
PUT /api/quotation/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "quoted_amount": 2650000,
  "approval_status": "Approved"
}
```

#### **15. Upload Quotation Document**
```http
POST /api/quotation/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- document: <file>
```

#### **16. Get Quotation Documents**
```http
GET /api/quotation/:id/documents
Authorization: Bearer <token>
```

---

### **📈 Dashboard APIs**

#### **17. Get Dashboard Statistics**
```http
GET /api/dashboard/stats?period=month
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: month, quarter, year

#### **18. Get Recent Activities**
```http
GET /api/dashboard/activities?limit=10
Authorization: Bearer <token>
```

#### **19. Get RFQ Status Distribution**
```http
GET /api/dashboard/rfq-status-chart
Authorization: Bearer <token>
```

#### **20. Get Monthly Trends**
```http
GET /api/dashboard/monthly-trends?months=6
Authorization: Bearer <token>
```

---

### **👥 User Management APIs**

#### **21. Get All Users**
```http
GET /api/users
Authorization: Bearer <token>
```

#### **22. Get Users by Role**
```http
GET /api/users/by-role/sales
Authorization: Bearer <token>
```

#### **23. Get Single User**
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### **24. Update User (Admin Only)**
```http
PUT /api/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "email": "updated@company.com",
  "role": "engineer",
  "is_active": true
}
```

#### **25. Deactivate User (Admin Only)**
```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

---

### **📊 Reports APIs**

#### **26. Export RFQs to Excel**
```http
GET /api/reports/export/excel?status=Enquiry&start_date=2024-01-01
Authorization: Bearer <token>
```

#### **27. Export RFQs to CSV**
```http
GET /api/reports/export/csv?category=Automation
Authorization: Bearer <token>
```

#### **28. Get Performance Report**
```http
GET /api/reports/performance?period=quarter
Authorization: Bearer <token>
```

---

### **🔍 Health Check**

#### **29. Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "RFQ Tracker API is running",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 **Testing Tools**

### **1. Postman Collection**
Create a Postman collection with all these endpoints for easy testing.

### **2. cURL Examples**

**Login:**
```bash
curl -X POST https://rfq-tracker-vy6i.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get RFQs:**
```bash
curl -X GET https://rfq-tracker-vy6i.onrender.com/api/rfq \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **3. JavaScript/Fetch Examples**

```javascript
// Login
const login = async () => {
  const response = await fetch('https://rfq-tracker-vy6i.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await response.json();
  return data.token;
};

// Get RFQs
const getRFQs = async (token) => {
  const response = await fetch('https://rfq-tracker-vy6i.onrender.com/api/rfq', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

---

## 🔐 **Authentication Flow**

1. **Login** with credentials → Get JWT token
2. **Include token** in Authorization header for all protected endpoints
3. **Token expires** after 7 days (configurable)
4. **Refresh** by logging in again

---

## 📝 **Response Formats**

### **Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 🎯 **Quick Test Sequence**

1. **Health Check**: `GET /api/health`
2. **Login**: `POST /api/auth/login`
3. **Get Profile**: `GET /api/auth/profile`
4. **Get RFQs**: `GET /api/rfq`
5. **Get Dashboard**: `GET /api/dashboard/stats`
6. **Get Users**: `GET /api/users`

Your RFQ Tracker API is fully functional and ready for testing! 🚀