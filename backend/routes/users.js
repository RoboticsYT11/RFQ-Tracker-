const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get all users (Admin only, or filtered for others)
router.get('/', async (req, res) => {
  try {
    let query = 'SELECT id, username, email, full_name, role, is_active, created_at FROM users';
    const params = [];

    if (req.user.role !== 'admin') {
      // Non-admins can only see active users
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY full_name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get users by role (for dropdowns)
router.get('/by-role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['admin', 'sales', 'engineer', 'management'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email FROM users WHERE role = $1 AND is_active = true ORDER BY full_name',
      [role]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only see their own profile unless admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user (Admin only, or self for non-sensitive fields)
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, is_active, password } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updateFields.push(`full_name = $${paramCount}`);
      updateValues.push(full_name);
      paramCount++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
      paramCount++;
    }

    if (password !== undefined && password !== '') {
      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramCount}`);
      updateValues.push(passwordHash);
      paramCount++;
    }

    if (role !== undefined) {
      const validRoles = ['admin', 'sales', 'engineer', 'management'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      updateValues.push(is_active);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updateValues.push(id);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, username, email, full_name, role, is_active`;

    const result = await pool.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user (Admin only - soft delete by default, permanent if requested)
router.delete('/:id', authorize('admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await client.query('BEGIN');

    if (permanent === 'true') {
      // Permanent deletion - remove all references first
      
      // Clear RFQ assignments
      await client.query(
        'UPDATE rfqs SET assigned_engineer_id = NULL WHERE assigned_engineer_id = $1',
        [id]
      );
      
      await client.query(
        'UPDATE rfqs SET assigned_sales_person_id = NULL WHERE assigned_sales_person_id = $1',
        [id]
      );

      // Delete notifications for this user
      await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);

      // Update audit logs to remove user reference (keep the log but clear user info)
      await client.query(
        'UPDATE status_audit_log SET changed_by = NULL WHERE changed_by = $1',
        [id]
      );

      // Update quotations created by this user
      await client.query(
        'UPDATE quotations SET created_by = NULL WHERE created_by = $1',
        [id]
      );

      // Update RFQs created by this user
      await client.query(
        'UPDATE rfqs SET created_by = NULL WHERE created_by = $1',
        [id]
      );

      // Finally delete the user
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING username, full_name, role',
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'User deleted permanently',
        data: result.rows[0]
      });
    } else {
      // Soft delete by setting is_active to false
      const result = await client.query(
        'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, username, email, full_name, role, is_active',
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: result.rows[0]
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;

