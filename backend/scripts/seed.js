const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ('admin', 'admin@company.com', $1, 'System Administrator', 'admin')
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [adminPassword]
    );

    // Create sample users
    const salesPassword = await bcrypt.hash('sales123', 10);
    const engineerPassword = await bcrypt.hash('engineer123', 10);

    const salesResult = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES 
         ('sales1', 'sales1@company.com', $1, 'John Sales', 'sales'),
         ('sales2', 'sales2@company.com', $1, 'Jane Sales', 'sales')
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [salesPassword]
    );

    const engineerResult = await client.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES 
         ('engineer1', 'engineer1@company.com', $1, 'Mike Engineer', 'engineer'),
         ('engineer2', 'engineer2@company.com', $1, 'Sarah Engineer', 'engineer')
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [engineerPassword]
    );

    // Get user IDs
    const usersResult = await client.query('SELECT id, role FROM users ORDER BY role, username');
    const users = usersResult.rows;
    const admin = users.find(u => u.role === 'admin');
    const salesUsers = users.filter(u => u.role === 'sales');
    const engineers = users.filter(u => u.role === 'engineer');

    if (!admin || salesUsers.length === 0 || engineers.length === 0) {
      console.log('⚠️  Users already exist or creation failed');
      await client.query('COMMIT');
      return;
    }

    // Generate sample RFQs
    const sampleRFQs = [
      {
        customer_name: 'ABC Manufacturing Ltd.',
        customer_contact_person: 'Rajesh Kumar',
        email: 'rajesh@abc.com',
        phone: '+91-9876543210',
        company_name: 'ABC Manufacturing Ltd.',
        rfq_received_date: new Date('2024-01-15'),
        rfq_due_date: new Date('2024-02-15'),
        product_project_name: 'Automated Assembly Line',
        rfq_category: 'Automation',
        rfq_source: 'Email',
        assigned_engineer_id: engineers[0].id,
        assigned_sales_person_id: salesUsers[0].id,
        priority: 'High',
        estimated_project_value: 2500000,
        currency: 'INR',
        expected_order_date: new Date('2024-03-01'),
        status: 'Quotation Sent',
        remarks_notes: 'Large project, requires detailed technical review'
      },
      {
        customer_name: 'XYZ Industries',
        customer_contact_person: 'Priya Sharma',
        email: 'priya@xyz.com',
        phone: '+91-9876543211',
        company_name: 'XYZ Industries',
        rfq_received_date: new Date('2024-01-20'),
        rfq_due_date: new Date('2024-02-20'),
        product_project_name: 'Vision Inspection System',
        rfq_category: 'Vision',
        rfq_source: 'Sales Team',
        assigned_engineer_id: engineers[1].id,
        assigned_sales_person_id: salesUsers[0].id,
        priority: 'Critical',
        estimated_project_value: 1800000,
        currency: 'INR',
        expected_order_date: new Date('2024-02-28'),
        status: 'Negotiation',
        remarks_notes: 'Customer reviewing pricing'
      },
      {
        customer_name: 'Tech Solutions Pvt Ltd',
        customer_contact_person: 'Amit Patel',
        email: 'amit@techsol.com',
        phone: '+91-9876543212',
        company_name: 'Tech Solutions Pvt Ltd',
        rfq_received_date: new Date('2024-02-01'),
        rfq_due_date: new Date('2024-03-01'),
        product_project_name: 'Robotic Welding Station',
        rfq_category: 'Robotics',
        rfq_source: 'Portal',
        assigned_engineer_id: engineers[0].id,
        assigned_sales_person_id: salesUsers[1].id,
        priority: 'Medium',
        estimated_project_value: 3200000,
        currency: 'INR',
        expected_order_date: new Date('2024-04-15'),
        status: 'Under Review',
        remarks_notes: 'Technical feasibility study in progress'
      },
      {
        customer_name: 'Global Motors',
        customer_contact_person: 'Vikram Singh',
        email: 'vikram@globalmotors.com',
        phone: '+91-9876543213',
        company_name: 'Global Motors',
        rfq_received_date: new Date('2024-01-10'),
        rfq_due_date: new Date('2024-01-25'),
        product_project_name: 'Electrical Control Panel',
        rfq_category: 'Electrical',
        rfq_source: 'Phone',
        assigned_engineer_id: engineers[1].id,
        assigned_sales_person_id: salesUsers[1].id,
        priority: 'High',
        estimated_project_value: 850000,
        currency: 'INR',
        expected_order_date: new Date('2024-02-10'),
        status: 'Won',
        remarks_notes: 'Order confirmed, PO received'
      },
      {
        customer_name: 'Precision Tools Inc',
        customer_contact_person: 'Neha Verma',
        email: 'neha@precision.com',
        phone: '+91-9876543214',
        company_name: 'Precision Tools Inc',
        rfq_received_date: new Date('2024-01-05'),
        rfq_due_date: new Date('2024-01-20'),
        product_project_name: 'Mechanical Conveyor System',
        rfq_category: 'Mechanical',
        rfq_source: 'Reference',
        assigned_engineer_id: engineers[0].id,
        assigned_sales_person_id: salesUsers[0].id,
        priority: 'Medium',
        estimated_project_value: 1200000,
        currency: 'INR',
        expected_order_date: new Date('2024-02-05'),
        status: 'Lost',
        reason_for_lost_on_hold: 'Customer chose competitor due to lower price',
        remarks_notes: 'Lost to competitor'
      },
      {
        customer_name: 'Smart Systems Co',
        customer_contact_person: 'Ravi Mehta',
        email: 'ravi@smartsys.com',
        phone: '+91-9876543215',
        company_name: 'Smart Systems Co',
        rfq_received_date: new Date('2024-02-10'),
        rfq_due_date: new Date('2024-03-10'),
        product_project_name: 'SCADA Software Development',
        rfq_category: 'Software',
        rfq_source: 'Email',
        assigned_engineer_id: engineers[1].id,
        assigned_sales_person_id: salesUsers[1].id,
        priority: 'Low',
        estimated_project_value: 650000,
        currency: 'INR',
        expected_order_date: new Date('2024-04-01'),
        status: 'Enquiry',
        remarks_notes: 'Initial enquiry, awaiting requirements'
      }
    ];

    // Insert RFQs
    const rfqIds = [];
    for (const rfq of sampleRFQs) {
      const rfqNumberResult = await client.query('SELECT generate_rfq_number() as rfq_number');
      const rfqNumber = rfqNumberResult.rows[0].rfq_number;

      const rfqResult = await client.query(
        `INSERT INTO rfqs (
          rfq_number, customer_name, customer_contact_person, email, phone,
          company_name, rfq_received_date, rfq_due_date, product_project_name,
          rfq_category, rfq_source, assigned_engineer_id, assigned_sales_person_id,
          priority, estimated_project_value, currency, expected_order_date,
          status, reason_for_lost_on_hold, remarks_notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING id, rfq_number`,
        [
          rfqNumber, rfq.customer_name, rfq.customer_contact_person, rfq.email, rfq.phone,
          rfq.company_name, rfq.rfq_received_date, rfq.rfq_due_date, rfq.product_project_name,
          rfq.rfq_category, rfq.rfq_source, rfq.assigned_engineer_id, rfq.assigned_sales_person_id,
          rfq.priority, rfq.estimated_project_value, rfq.currency, rfq.expected_order_date,
          rfq.status, rfq.reason_for_lost_on_hold || null, rfq.remarks_notes, admin.id
        ]
      );

      rfqIds.push(rfqResult.rows[0]);

      // Log status change
      await client.query(
        `INSERT INTO status_audit_log (rfq_id, old_status, new_status, changed_by)
         VALUES ($1, NULL, $2, $3)`,
        [rfqResult.rows[0].id, rfq.status, admin.id]
      );
    }

    // Create sample quotations
    const quotations = [
      {
        rfq_id: rfqIds[0].id, // ABC Manufacturing - Quotation Sent
        quotation_sent_date: new Date('2024-01-25'),
        quoted_amount: 2750000,
        material_cost: 1500000,
        engineering_cost: 800000,
        software_cost: 200000,
        installation_cost: 150000,
        margin: 100000,
        validity_date: new Date('2024-04-25'),
        approval_status: 'Pending'
      },
      {
        rfq_id: rfqIds[1].id, // XYZ Industries - Negotiation
        quotation_sent_date: new Date('2024-02-05'),
        quoted_amount: 1950000,
        material_cost: 1000000,
        engineering_cost: 600000,
        software_cost: 250000,
        installation_cost: 100000,
        margin: 0,
        validity_date: new Date('2024-05-05'),
        approval_status: 'Pending'
      },
      {
        rfq_id: rfqIds[3].id, // Global Motors - Won
        quotation_sent_date: new Date('2024-01-20'),
        quoted_amount: 900000,
        material_cost: 500000,
        engineering_cost: 250000,
        software_cost: 50000,
        installation_cost: 50000,
        margin: 50000,
        validity_date: new Date('2024-04-20'),
        approval_status: 'Approved',
        final_approved_amount: 900000
      }
    ];

    for (const quo of quotations) {
      const quotationNumberResult = await client.query('SELECT generate_quotation_number() as quotation_number');
      const quotationNumber = quotationNumberResult.rows[0].quotation_number;

      await client.query(
        `INSERT INTO quotations (
          rfq_id, quotation_number, quotation_sent_date, revision_number,
          quoted_amount, material_cost, engineering_cost, software_cost,
          installation_cost, margin, validity_date, approval_status, final_approved_amount, created_by
        ) VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          quo.rfq_id, quotationNumber, quo.quotation_sent_date, quo.quoted_amount,
          quo.material_cost, quo.engineering_cost, quo.software_cost,
          quo.installation_cost, quo.margin, quo.validity_date,
          quo.approval_status, quo.final_approved_amount || null, admin.id
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
    console.log('\n📋 Sample Users Created:');
    console.log('  Admin: admin / admin123');
    console.log('  Sales: sales1 / sales123, sales2 / sales123');
    console.log('  Engineer: engineer1 / engineer123, engineer2 / engineer123');
    console.log(`\n📊 Created ${rfqIds.length} sample RFQs`);
    console.log(`📄 Created ${quotations.length} sample quotations`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch(console.error);

