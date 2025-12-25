const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function waitForDatabase(maxRetries = 10, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Database connection established');
      client.release();
      return true;
    } catch (error) {
      console.log(`⏳ Database connection attempt ${i + 1}/${maxRetries} failed. Retrying in ${delay/1000}s...`);
      console.log(`   Error: ${error.message}`);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Wait for database to be available with retries
    await waitForDatabase();
    
    const client = await pool.connect();
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('📋 No tables found, running migrations...');
      
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await client.query('BEGIN');
      await client.query(schema);
      await client.query('COMMIT');
      console.log('✅ Database migrations completed successfully');
      
      // Seed initial data
      console.log('🌱 Seeding database with initial data...');
      await client.query('BEGIN');
      
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES ('admin', 'admin@company.com', $1, 'System Administrator', 'admin')
         ON CONFLICT (username) DO NOTHING`,
        [adminPassword]
      );
      
      // Create sample users
      const salesPassword = await bcrypt.hash('sales123', 10);
      const engineerPassword = await bcrypt.hash('engineer123', 10);
      
      await client.query(
        `INSERT INTO users (username, email, password_hash, full_name, role)
         VALUES 
           ('sales1', 'sales1@company.com', $1, 'John Sales', 'sales'),
           ('engineer1', 'engineer1@company.com', $2, 'Mike Engineer', 'engineer')
         ON CONFLICT (username) DO NOTHING`,
        [salesPassword, engineerPassword]
      );
      
      await client.query('COMMIT');
      console.log('✅ Database seeded successfully');
    } else {
      console.log('✅ Database already initialized');
    }
    
    client.release();
    console.log('✅ Database initialization completed successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };