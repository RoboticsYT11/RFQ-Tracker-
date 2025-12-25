const { pool } = require('../config/database');

async function cleanupDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🧹 Starting database cleanup...');

    // First, clear all foreign key references to avoid constraints
    await client.query(
      `UPDATE rfqs SET assigned_engineer_id = NULL, assigned_sales_person_id = NULL`
    );
    console.log('✅ Cleared all RFQ assignments');

    // Clear references in other tables
    await client.query(
      `UPDATE status_audit_log SET changed_by = NULL WHERE changed_by IN (SELECT id FROM users WHERE role IN ('engineer', 'sales'))`
    );
    console.log('✅ Cleared status audit log references');

    await client.query(
      `UPDATE quotations SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role IN ('engineer', 'sales'))`
    );
    console.log('✅ Cleared quotation references');

    await client.query(
      `UPDATE rfqs SET created_by = NULL WHERE created_by IN (SELECT id FROM users WHERE role IN ('engineer', 'sales'))`
    );
    console.log('✅ Cleared RFQ created_by references');

    // Delete notifications for these users
    await client.query(
      `DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE role IN ('engineer', 'sales'))`
    );
    console.log('✅ Deleted notifications');

    // Now delete all engineers and sales persons (keep only admin)
    const deleteUsersResult = await client.query(
      `DELETE FROM users WHERE role IN ('engineer', 'sales') RETURNING username, role`
    );
    
    console.log(`✅ Deleted ${deleteUsersResult.rows.length} users:`);
    deleteUsersResult.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.role})`);
    });

    // Keep only 2 RFQs (delete the rest)
    const rfqsToKeep = await client.query(
      `SELECT id, rfq_number FROM rfqs ORDER BY created_at LIMIT 2`
    );

    if (rfqsToKeep.rows.length > 0) {
      const keepIds = rfqsToKeep.rows.map(rfq => rfq.id);
      
      // Delete quotations for RFQs we're removing
      await client.query(
        `DELETE FROM quotations WHERE rfq_id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        keepIds
      );

      // Delete status audit logs for RFQs we're removing
      await client.query(
        `DELETE FROM status_audit_log WHERE rfq_id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        keepIds
      );

      // Delete notifications for RFQs we're removing
      await client.query(
        `DELETE FROM notifications WHERE rfq_id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        keepIds
      );

      // Delete RFQs we don't want to keep
      const deletedRfqs = await client.query(
        `DELETE FROM rfqs WHERE id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING rfq_number`,
        keepIds
      );

      console.log(`✅ Deleted ${deletedRfqs.rows.length} RFQs, kept 2:`);
      rfqsToKeep.rows.forEach(rfq => {
        console.log(`   - Kept: ${rfq.rfq_number}`);
      });

      console.log('✅ Assignments already cleared from remaining RFQs');
    }

    await client.query('COMMIT');
    console.log('✅ Database cleanup completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDatabase().catch(console.error);