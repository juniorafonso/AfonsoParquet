const { Sequelize } = require('sequelize');
const path = require('path');

// Database path from environment or default
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Disable SQL query logging
  
  // Connection pool settings
  pool: {
    max: 1, // SQLite works best with single connection
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Initialize WAL mode and busy timeout after connection
async function initializeSQLiteSettings() {
  try {
    await sequelize.query('PRAGMA journal_mode = WAL;');
    await sequelize.query('PRAGMA busy_timeout = 5000;');
    console.log('✓ SQLite configured with WAL mode and busy timeout');
  } catch (err) {
    console.warn('Warning: Failed to configure SQLite settings:', err.message);
  }
}

// Export both sequelize and initialization function
sequelize.initializeSQLiteSettings = initializeSQLiteSettings;

module.exports = sequelize;
