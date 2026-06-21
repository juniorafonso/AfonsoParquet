require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Database initialization
const { sequelize } = require('./models');
const seedAdmin = require('./config/seedAdmin');

async function startServer() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connected successfully.');
    
    // Initialize SQLite settings (WAL mode, busy timeout)
    await sequelize.initializeSQLiteSettings();
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync();
    console.log('✓ Database models synchronized.');
    
    // Seed admin user if User table is empty
    await seedAdmin();
    
    // Start server
    app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                    Afonso Parquet                          ║
║                                                            ║
║  Server running on http://${HOST}:${PORT}               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║  Press Ctrl+C to stop                                      ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

startServer();
