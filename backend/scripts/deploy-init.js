const { pool } = require('../config/database');

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Database connection established');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    client.release();
    
    if (tablesResult.rows.length === 0) {
      console.log('📋 No tables found, running migrations...');
      
      // Run migrations
      const { spawn } = require('child_process');
      const migrate = spawn('node', ['scripts/migrate.js'], { 
        cwd: __dirname + '/..',
        stdio: 'inherit' 
      });
      
      migrate.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migrations completed successfully');
          
          // Run seeding
          console.log('🌱 Seeding database with initial data...');
          const seed = spawn('node', ['scripts/seed.js'], { 
            cwd: __dirname + '/..',
            stdio: 'inherit' 
          });
          
          seed.on('close', (seedCode) => {
            if (seedCode === 0) {
              console.log('✅ Database initialization completed successfully');
              process.exit(0);
            } else {
              console.error('❌ Seeding failed');
              process.exit(1);
            }
          });
        } else {
          console.error('❌ Migration failed');
          process.exit(1);
        }
      });
    } else {
      console.log('✅ Database already initialized');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();