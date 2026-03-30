#!/usr/bin/env node

/**
 * Migration script for production deployment
 * This ensures migrations run properly without using sequelize.sync()
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    const { stdout, stderr } = await execPromise('npx sequelize-cli db:migrate');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

runMigrations();
