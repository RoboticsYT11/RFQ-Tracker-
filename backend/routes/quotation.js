const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'quotation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|excel|xlsx|doc|docx|jpg|jpeg|png|dwg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.mimetype === 'application/vnd.ms-excel';

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Excel, Word, Images, DWG'));
    }
  }
});

router.use(authenticate);

// Get all quotations for an RFQ
router.get('/rfq/:rfqId', async (req, res) => {
  try {
    const { rfqId } = req.params;

    // Check RFQ access
    const rfqCheck = await pool.query('SELECT * FROM rfqs WHERE id = $1', [rfqId]);
    if (rfqCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    const rfq = rfqCheck.rows[0];
    if (req.user.role === 'engineer' && rfq.assigned_engineer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user.role === 'sales' && rfq.assigned_sales_person_id !== req.user.id && rfq.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        q.*,
        u.full_name as created_by_name,
        COUNT(qd.id) as document_count
      FROM quotations q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quotation_documents qd ON q.id = qd.quotation_id
      WHERE q.rfq_id = $1
      GROUP BY q.id, u.full_name
      ORDER BY q.created_at DESC`,
      [rfqId]
    );

    // Get documents for each quotation
    for (let quotation of result.rows) {
      const docsResult = await pool.query(
        'SELECT * FROM quotation_documents WHERE quotation_id = $1',
        [quotation.id]
      );
      quotation.documents = docsResult.rows;
    }

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT q.*, u.full_name as created_by_name
       FROM quotations q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Get documents
    const docsResult = await pool.query(
      'SELECT * FROM quotation_documents WHERE quotation_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        documents: docsResult.rows
      }
    });
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create quotation
router.post('/',
  [
    body('rfq_id').isUUID().withMessage('Valid RFQ ID is required'),
    body('quotation_sent_date').isISO8601().withMessage('Valid quotation sent date is required'),
    body('quoted_amount').isNumeric().withMessage('Quoted amount is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { rfq_id } = req.body;

      // Check RFQ access
      const rfqCheck = await pool.query('SELECT * FROM rfqs WHERE id = $1', [rfq_id]);
      if (rfqCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'RFQ not found' });
      }

      const rfq = rfqCheck.rows[0];
      if (req.user.role === 'engineer' && rfq.assigned_engineer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role === 'sales' && rfq.assigned_sales_person_id !== req.user.id && rfq.created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Generate quotation number
      const quotationNumberResult = await pool.query('SELECT generate_quotation_number() as quotation_number');
      const quotationNumber = quotationNumberResult.rows[0].quotation_number;

      // Get latest revision number
      const revisionResult = await pool.query(
        'SELECT COALESCE(MAX(revision_number), 0) + 1 as revision FROM quotations WHERE rfq_id = $1',
        [rfq_id]
      );
      const revisionNumber = parseInt(revisionResult.rows[0].revision);

      const {
        quotation_sent_date,
        quoted_amount,
        material_cost,
        engineering_cost,
        software_cost,
        installation_cost,
        margin,
        validity_date,
        approval_status = 'Pending'
      } = req.body;

      const result = await pool.query(
        `INSERT INTO quotations (
          rfq_id, quotation_number, quotation_sent_date, revision_number,
          quoted_amount, material_cost, engineering_cost, software_cost,
          installation_cost, margin, validity_date, approval_status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          rfq_id, quotationNumber, quotation_sent_date, revisionNumber,
          quoted_amount, material_cost, engineering_cost, software_cost,
          installation_cost, margin, validity_date, approval_status, req.user.id
        ]
      );

      // Update RFQ status to Quotation Sent if it's not already
      const currentStatus = rfqCheck.rows[0].status;
      if (currentStatus !== 'Quotation Sent' && currentStatus !== 'Negotiation' && currentStatus !== 'Won') {
        await pool.query(
          'UPDATE rfqs SET status = $1 WHERE id = $2',
          ['Quotation Sent', rfq_id]
        );

        // Log status change
        await pool.query(
          `INSERT INTO status_audit_log (rfq_id, old_status, new_status, changed_by)
           VALUES ($1, $2, $3, $4)`,
          [rfq_id, currentStatus, 'Quotation Sent', req.user.id]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Quotation created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create quotation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Update quotation
router.put('/:id',
  [
    body('quoted_amount').optional().isNumeric().withMessage('Quoted amount must be numeric')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Check quotation exists
      const existingResult = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }

      const {
        quotation_sent_date,
        quoted_amount,
        material_cost,
        engineering_cost,
        software_cost,
        installation_cost,
        margin,
        validity_date,
        approval_status,
        final_approved_amount
      } = req.body;

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const fieldsToUpdate = {
        quotation_sent_date,
        quoted_amount,
        material_cost,
        engineering_cost,
        software_cost,
        installation_cost,
        margin,
        validity_date,
        approval_status,
        final_approved_amount
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
      const updateQuery = `UPDATE quotations SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

      const result = await pool.query(updateQuery, updateValues);

      res.json({
        success: true,
        message: 'Quotation updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update quotation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Upload document for quotation
router.post('/:id/documents', upload.array('documents', 10), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Check quotation exists
    const quotationCheck = await pool.query('SELECT * FROM quotations WHERE id = $1', [id]);
    if (quotationCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const uploadedDocs = [];

    for (const file of req.files) {
      const docResult = await pool.query(
        `INSERT INTO quotation_documents (
          quotation_id, file_name, file_path, file_type, file_size, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          id,
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          req.user.id
        ]
      );
      uploadedDocs.push(docResult.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: uploadedDocs
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete document
router.delete('/documents/:docId', async (req, res) => {
  try {
    const { docId } = req.params;

    const docResult = await pool.query('SELECT * FROM quotation_documents WHERE id = $1', [docId]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docResult.rows[0];

    // Delete file from filesystem
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    await pool.query('DELETE FROM quotation_documents WHERE id = $1', [docId]);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

