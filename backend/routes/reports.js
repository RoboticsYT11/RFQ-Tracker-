const express = require('express');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Export RFQ list to Excel
router.get('/export/excel', async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      start_date,
      end_date
    } = req.query;

    let query = `
      SELECT 
        r.rfq_number,
        r.customer_name,
        r.company_name,
        r.product_project_name,
        r.rfq_category,
        r.status,
        r.priority,
        r.rfq_received_date,
        r.rfq_due_date,
        r.estimated_project_value,
        r.currency,
        u1.full_name as assigned_engineer,
        u2.full_name as assigned_sales_person
      FROM rfqs r
      LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'engineer') {
      query += ` AND r.assigned_engineer_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'sales') {
      query += ` AND (r.assigned_sales_person_id = $${paramCount} OR r.created_by = $${paramCount})`;
      params.push(req.user.id);
      paramCount++;
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (priority) {
      query += ` AND r.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }
    if (category) {
      query += ` AND r.rfq_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    if (start_date) {
      query += ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += ` AND r.rfq_received_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY r.rfq_received_date DESC';

    const result = await pool.query(query, params);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RFQs');

    // Generate file
    const fileName = `RFQ_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    XLSX.writeFile(workbook, filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// Export RFQ list to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      start_date,
      end_date
    } = req.query;

    let query = `
      SELECT 
        r.rfq_number,
        r.customer_name,
        r.company_name,
        r.product_project_name,
        r.rfq_category,
        r.status,
        r.priority,
        r.rfq_received_date,
        r.rfq_due_date,
        r.estimated_project_value,
        r.currency,
        u1.full_name as assigned_engineer,
        u2.full_name as assigned_sales_person
      FROM rfqs r
      LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'engineer') {
      query += ` AND r.assigned_engineer_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'sales') {
      query += ` AND (r.assigned_sales_person_id = $${paramCount} OR r.created_by = $${paramCount})`;
      params.push(req.user.id);
      paramCount++;
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (priority) {
      query += ` AND r.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }
    if (category) {
      query += ` AND r.rfq_category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    if (start_date) {
      query += ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += ` AND r.rfq_received_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ' ORDER BY r.rfq_received_date DESC';

    const result = await pool.query(query, params);

    const fileName = `RFQ_Export_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'rfq_number', title: 'RFQ Number' },
        { id: 'customer_name', title: 'Customer Name' },
        { id: 'company_name', title: 'Company Name' },
        { id: 'product_project_name', title: 'Product/Project' },
        { id: 'rfq_category', title: 'Category' },
        { id: 'status', title: 'Status' },
        { id: 'priority', title: 'Priority' },
        { id: 'rfq_received_date', title: 'Received Date' },
        { id: 'rfq_due_date', title: 'Due Date' },
        { id: 'estimated_project_value', title: 'Estimated Value' },
        { id: 'currency', title: 'Currency' },
        { id: 'assigned_engineer', title: 'Assigned Engineer' },
        { id: 'assigned_sales_person', title: 'Assigned Sales' }
      ]
    });

    await csvWriter.writeRecords(result.rows);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// Monthly RFQ performance report
router.get('/monthly-performance', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    let query = `
      SELECT 
        TO_CHAR(rfq_received_date, 'YYYY-MM') as month,
        COUNT(*) as total_rfqs,
        COUNT(CASE WHEN status = 'Won' THEN 1 END) as won,
        COUNT(CASE WHEN status = 'Lost' THEN 1 END) as lost,
        COUNT(CASE WHEN status = 'Quotation Sent' THEN 1 END) as quotation_sent,
        SUM(estimated_project_value) as total_estimated_value
      FROM rfqs r
      WHERE EXTRACT(YEAR FROM rfq_received_date) = $1
    `;
    const params = [year];

    // Role-based filtering
    if (req.user.role === 'engineer') {
      query += ` AND r.assigned_engineer_id = $2`;
      params.push(req.user.id);
    } else if (req.user.role === 'sales') {
      query += ` AND (r.assigned_sales_person_id = $2 OR r.created_by = $2)`;
      params.push(req.user.id);
    }

    query += ` GROUP BY TO_CHAR(rfq_received_date, 'YYYY-MM')
               ORDER BY month`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Monthly performance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Customer-wise RFQ history
router.get('/customer-history', async (req, res) => {
  try {
    const { customer_name } = req.query;

    if (!customer_name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    let query = `
      SELECT 
        r.*,
        u1.full_name as assigned_engineer_name,
        u2.full_name as assigned_sales_person_name,
        COUNT(q.id) as quotation_count,
        MAX(q.quoted_amount) as max_quoted_amount
      FROM rfqs r
      LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
      LEFT JOIN quotations q ON r.id = q.rfq_id
      WHERE r.customer_name ILIKE $1
    `;
    const params = [`%${customer_name}%`];

    // Role-based filtering
    if (req.user.role === 'engineer') {
      query += ` AND r.assigned_engineer_id = $2`;
      params.push(req.user.id);
    } else if (req.user.role === 'sales') {
      query += ` AND (r.assigned_sales_person_id = $2 OR r.created_by = $2)`;
      params.push(req.user.id);
    }

    query += ` GROUP BY r.id, u1.full_name, u2.full_name
              ORDER BY r.rfq_received_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Customer history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Engineer performance report
router.get('/engineer-performance', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        u.id,
        u.full_name,
        COUNT(r.id) as total_rfqs,
        COUNT(CASE WHEN r.status = 'Won' THEN 1 END) as won,
        COUNT(CASE WHEN r.status = 'Lost' THEN 1 END) as lost,
        COUNT(CASE WHEN r.status NOT IN ('Won', 'Lost') THEN 1 END) as active,
        AVG(CASE WHEN r.status = 'Won' THEN q.final_approved_amount END) as avg_won_value,
        SUM(CASE WHEN r.status = 'Won' THEN q.final_approved_amount ELSE 0 END) as total_won_value
      FROM users u
      LEFT JOIN rfqs r ON u.id = r.assigned_engineer_id
      LEFT JOIN quotations q ON r.id = q.rfq_id AND q.approval_status = 'Approved'
      WHERE u.role = 'engineer' AND u.is_active = true
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += ` AND r.rfq_received_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY u.id, u.full_name
               ORDER BY total_won_value DESC NULLS LAST`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Engineer performance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

