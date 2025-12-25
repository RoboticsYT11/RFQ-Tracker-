const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all RFQs with filters, search, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      category,
      engineer_id,
      sales_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['created_at', 'rfq_received_date', 'rfq_due_date', 'estimated_project_value', 'priority'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let query = `
      SELECT 
        r.*,
        u1.full_name as assigned_engineer_name,
        u2.full_name as assigned_sales_person_name,
        u3.full_name as created_by_name,
        COUNT(q.id) as quotation_count
      FROM rfqs r
      LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
      LEFT JOIN users u3 ON r.created_by = u3.id
      LEFT JOIN quotations q ON r.id = q.rfq_id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'engineer') {
      query += ` AND r.assigned_engineer_id = $${paramCount}`;
      queryParams.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'sales') {
      query += ` AND (r.assigned_sales_person_id = $${paramCount} OR r.created_by = $${paramCount})`;
      queryParams.push(req.user.id);
      paramCount++;
    }

    // Apply filters
    if (status) {
      query += ` AND r.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND r.priority = $${paramCount}`;
      queryParams.push(priority);
      paramCount++;
    }

    if (category) {
      query += ` AND r.rfq_category = $${paramCount}`;
      queryParams.push(category);
      paramCount++;
    }

    if (engineer_id) {
      query += ` AND r.assigned_engineer_id = $${paramCount}`;
      queryParams.push(engineer_id);
      paramCount++;
    }

    if (sales_id) {
      query += ` AND r.assigned_sales_person_id = $${paramCount}`;
      queryParams.push(sales_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND r.rfq_received_date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND r.rfq_received_date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        r.rfq_number ILIKE $${paramCount} OR
        r.customer_name ILIKE $${paramCount} OR
        r.product_project_name ILIKE $${paramCount} OR
        r.company_name ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY r.id, u1.full_name, u2.full_name, u3.full_name`;
    query += ` ORDER BY r.${sortColumn} ${sortDir}`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT r.id) FROM rfqs r WHERE 1=1`;
    const countParams = [];
    let countParamCount = 1;

    if (req.user.role === 'engineer') {
      countQuery += ` AND r.assigned_engineer_id = $${countParamCount}`;
      countParams.push(req.user.id);
      countParamCount++;
    } else if (req.user.role === 'sales') {
      countQuery += ` AND (r.assigned_sales_person_id = $${countParamCount} OR r.created_by = $${countParamCount})`;
      countParams.push(req.user.id);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND r.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (priority) {
      countQuery += ` AND r.priority = $${countParamCount}`;
      countParams.push(priority);
      countParamCount++;
    }
    if (category) {
      countQuery += ` AND r.rfq_category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }
    if (search) {
      countQuery += ` AND (
        r.rfq_number ILIKE $${countParamCount} OR
        r.customer_name ILIKE $${countParamCount} OR
        r.product_project_name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get RFQs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single RFQ by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        r.*,
        u1.full_name as assigned_engineer_name,
        u2.full_name as assigned_sales_person_name,
        u3.full_name as created_by_name
      FROM rfqs r
      LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
      LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
      LEFT JOIN users u3 ON r.created_by = u3.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    // Check permissions
    const rfq = result.rows[0];
    if (req.user.role === 'engineer' && rfq.assigned_engineer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'sales' && rfq.assigned_sales_person_id !== req.user.id && rfq.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get quotations for this RFQ
    const quotationsResult = await pool.query(
      `SELECT q.*, u.full_name as created_by_name
       FROM quotations q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.rfq_id = $1
       ORDER BY q.created_at DESC`,
      [id]
    );

    // Get status audit log
    const auditResult = await pool.query(
      `SELECT sal.*, u.full_name as changed_by_name
       FROM status_audit_log sal
       LEFT JOIN users u ON sal.changed_by = u.id
       WHERE sal.rfq_id = $1
       ORDER BY sal.changed_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rfq,
        quotations: quotationsResult.rows,
        status_history: auditResult.rows
      }
    });
  } catch (error) {
    console.error('Get RFQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new RFQ
router.post('/',
  [
    body('customer_name').notEmpty().withMessage('Customer name is required'),
    body('rfq_received_date').isISO8601().withMessage('Valid RFQ received date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Generate RFQ number
      const rfqNumberResult = await pool.query('SELECT generate_rfq_number() as rfq_number');
      const rfqNumber = rfqNumberResult.rows[0].rfq_number;

      const {
        customer_name,
        customer_contact_person,
        email,
        phone,
        company_name,
        rfq_received_date,
        rfq_due_date,
        product_project_name,
        rfq_category,
        rfq_source,
        assigned_engineer_id,
        assigned_sales_person_id,
        priority = 'Medium',
        estimated_project_value,
        currency = 'INR',
        expected_order_date,
        status = 'Enquiry',
        remarks_notes
      } = req.body;

      // Set assigned sales person to current user if not provided and user is sales
      const finalSalesPersonId = assigned_sales_person_id || (req.user.role === 'sales' ? req.user.id : null);

      const result = await pool.query(
        `INSERT INTO rfqs (
          rfq_number, customer_name, customer_contact_person, email, phone,
          company_name, rfq_received_date, rfq_due_date, product_project_name,
          rfq_category, rfq_source, assigned_engineer_id, assigned_sales_person_id,
          priority, estimated_project_value, currency, expected_order_date,
          status, remarks_notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *`,
        [
          rfqNumber, customer_name, customer_contact_person, email, phone,
          company_name, rfq_received_date, rfq_due_date, product_project_name,
          rfq_category, rfq_source, assigned_engineer_id, finalSalesPersonId,
          priority, estimated_project_value, currency, expected_order_date,
          status, remarks_notes, req.user.id
        ]
      );

      // Log status change
      await pool.query(
        `INSERT INTO status_audit_log (rfq_id, old_status, new_status, changed_by)
         VALUES ($1, NULL, $2, $3)`,
        [result.rows[0].id, status, req.user.id]
      );

      res.status(201).json({
        success: true,
        message: 'RFQ created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create RFQ error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Update RFQ
router.put('/:id',
  [
    body('customer_name').optional().notEmpty().withMessage('Customer name cannot be empty'),
    body('rfq_received_date').optional().isISO8601().withMessage('Valid RFQ received date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Check if RFQ exists and get current status
      const existingResult = await pool.query('SELECT * FROM rfqs WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'RFQ not found' });
      }

      const existingRfq = existingResult.rows[0];

      // Check permissions
      if (req.user.role === 'engineer' && existingRfq.assigned_engineer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'sales' && existingRfq.assigned_sales_person_id !== req.user.id && existingRfq.created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const {
        customer_name,
        customer_contact_person,
        email,
        phone,
        company_name,
        rfq_received_date,
        rfq_due_date,
        product_project_name,
        rfq_category,
        rfq_source,
        assigned_engineer_id,
        assigned_sales_person_id,
        priority,
        estimated_project_value,
        currency,
        expected_order_date,
        status,
        reason_for_lost_on_hold,
        remarks_notes
      } = req.body;

      // Workflow validation
      if (status) {
        // Cannot move to Quotation Sent without quotation
        if (status === 'Quotation Sent') {
          const quotationCheck = await pool.query(
            'SELECT COUNT(*) FROM quotations WHERE rfq_id = $1',
            [id]
          );
          if (parseInt(quotationCheck.rows[0].count) === 0) {
            return res.status(400).json({
              success: false,
              message: 'Cannot set status to Quotation Sent without creating a quotation'
            });
          }
        }

        // Cannot mark Won without approved quotation
        if (status === 'Won') {
          const approvedQuotationCheck = await pool.query(
            `SELECT COUNT(*) FROM quotations 
             WHERE rfq_id = $1 AND approval_status = 'Approved'`,
            [id]
          );
          if (parseInt(approvedQuotationCheck.rows[0].count) === 0) {
            return res.status(400).json({
              success: false,
              message: 'Cannot mark RFQ as Won without an approved quotation'
            });
          }
        }

        // Cannot mark Lost/On Hold without reason
        if ((status === 'Lost' || status === 'On Hold') && !reason_for_lost_on_hold) {
          return res.status(400).json({
            success: false,
            message: `Reason is required when status is ${status}`
          });
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const fieldsToUpdate = {
        customer_name,
        customer_contact_person,
        email,
        phone,
        company_name,
        rfq_received_date,
        rfq_due_date,
        product_project_name,
        rfq_category,
        rfq_source,
        assigned_engineer_id,
        assigned_sales_person_id,
        priority,
        estimated_project_value,
        currency,
        expected_order_date,
        status,
        reason_for_lost_on_hold,
        remarks_notes
      };

      for (const [key, value] of Object.entries(fieldsToUpdate)) {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      updateValues.push(id);
      const updateQuery = `UPDATE rfqs SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await pool.query(updateQuery, updateValues);

      // Log status change if status was updated
      if (status && status !== existingRfq.status) {
        await pool.query(
          `INSERT INTO status_audit_log (rfq_id, old_status, new_status, changed_by, change_reason)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, existingRfq.status, status, req.user.id, reason_for_lost_on_hold || null]
        );

        // Create notification for status change to Won/Lost
        if (status === 'Won' || status === 'Lost') {
          await pool.query(
            `INSERT INTO notifications (user_id, rfq_id, notification_type, title, message)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              req.user.id,
              id,
              'status_change',
              `RFQ ${existingRfq.rfq_number} marked as ${status}`,
              `RFQ ${existingRfq.rfq_number} has been marked as ${status}`
            ]
          );
        }
      }

      res.json({
        success: true,
        message: 'RFQ updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update RFQ error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Delete RFQ (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM rfqs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    res.json({
      success: true,
      message: 'RFQ deleted successfully'
    });
  } catch (error) {
    console.error('Delete RFQ error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

