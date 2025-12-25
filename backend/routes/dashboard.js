const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, quarter, year

    let dateFilter = '';
    const params = [];
    let paramCount = 1;

    // Role-based filtering
    if (req.user.role === 'engineer') {
      dateFilter += ` AND r.assigned_engineer_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'sales') {
      dateFilter += ` AND (r.assigned_sales_person_id = $${paramCount} OR r.created_by = $${paramCount})`;
      params.push(req.user.id);
      paramCount++;
    }

    // Date range based on period
    let dateRangeFilter = '';
    const now = new Date();
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateRangeFilter = ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(startOfMonth.toISOString().split('T')[0]);
      paramCount++;
    } else if (period === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
      dateRangeFilter = ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(startOfQuarter.toISOString().split('T')[0]);
      paramCount++;
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateRangeFilter = ` AND r.rfq_received_date >= $${paramCount}`;
      params.push(startOfYear.toISOString().split('T')[0]);
      paramCount++;
    }

    // Total RFQs
    const totalRfqsResult = await pool.query(
      `SELECT COUNT(*) as total FROM rfqs r WHERE 1=1 ${dateFilter} ${dateRangeFilter}`,
      params
    );
    const totalRfqs = parseInt(totalRfqsResult.rows[0].total);

    // RFQs by Status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM rfqs r 
       WHERE 1=1 ${dateFilter} ${dateRangeFilter}
       GROUP BY status
       ORDER BY count DESC`,
      params
    );

    // RFQs by Category
    const categoryResult = await pool.query(
      `SELECT rfq_category, COUNT(*) as count 
       FROM rfqs r 
       WHERE 1=1 ${dateFilter} ${dateRangeFilter}
       GROUP BY rfq_category
       ORDER BY count DESC`,
      params
    );

    // Win vs Loss Ratio
    const winLossResult = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'Won' THEN 1 END) as won,
        COUNT(CASE WHEN status = 'Lost' THEN 1 END) as lost
       FROM rfqs r 
       WHERE 1=1 ${dateFilter} ${dateRangeFilter}`,
      params
    );
    const { won, lost } = winLossResult.rows[0];
    const winLossRatio = lost > 0 ? (won / lost).toFixed(2) : (won > 0 ? '100.00' : '0.00');

    // Total Quoted Value vs Won Value
    const valueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(q.quoted_amount), 0) as total_quoted,
        COALESCE(SUM(CASE WHEN r.status = 'Won' THEN q.final_approved_amount ELSE 0 END), 0) as total_won
       FROM rfqs r
       LEFT JOIN quotations q ON r.id = q.rfq_id
       WHERE 1=1 ${dateFilter} ${dateRangeFilter}`,
      params
    );
    const { total_quoted, total_won } = valueResult.rows[0];

    // Pending RFQs Aging
    const agingResult = await pool.query(
      `SELECT 
        rfq_number,
        customer_name,
        status,
        rfq_received_date,
        CURRENT_DATE - rfq_received_date as aging_days
       FROM rfqs r
       WHERE status NOT IN ('Won', 'Lost') ${dateFilter}
       ORDER BY aging_days DESC
       LIMIT 10`,
      params.slice(0, paramCount - (dateRangeFilter ? 1 : 0))
    );

    // Engineer-wise RFQ load
    let engineerQuery = `
      SELECT 
        u.id,
        u.full_name,
        COUNT(r.id) as rfq_count,
        COUNT(CASE WHEN r.status NOT IN ('Won', 'Lost') THEN 1 END) as active_count
       FROM users u
       LEFT JOIN rfqs r ON u.id = r.assigned_engineer_id ${dateRangeFilter ? `AND r.rfq_received_date >= $1` : ''}
       WHERE u.role = 'engineer' AND u.is_active = true
       GROUP BY u.id, u.full_name
       ORDER BY rfq_count DESC
    `;
    const engineerLoadResult = await pool.query(
      engineerQuery,
      dateRangeFilter ? [params[params.length - 1]] : []
    );

    // Overdue RFQs
    const overdueResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM rfqs r
       WHERE rfq_due_date < CURRENT_DATE 
       AND status NOT IN ('Won', 'Lost') ${dateFilter}`,
      params.slice(0, paramCount - (dateRangeFilter ? 1 : 0))
    );

    res.json({
      success: true,
      data: {
        totalRfqs,
        statusBreakdown: statusResult.rows || [],
        categoryBreakdown: categoryResult.rows || [],
        winLoss: {
          won: parseInt(won) || 0,
          lost: parseInt(lost) || 0,
          ratio: parseFloat(winLossRatio) || 0
        },
        values: {
          totalQuoted: parseFloat(total_quoted) || 0,
          totalWon: parseFloat(total_won) || 0
        },
        aging: agingResult.rows || [],
        engineerLoad: engineerLoadResult.rows || [],
        overdueCount: parseInt(overdueResult.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

