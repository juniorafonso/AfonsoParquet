const { User } = require('../models');

/**
 * Seed admin user if User table is empty
 * Uses ADMIN_USERNAME and ADMIN_PASSWORD from .env
 * After first boot, admin should change password via admin panel
 */
async function seedAdmin() {
  try {
    // Check if any users exist
    const userCount = await User.count();
    
    if (userCount === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      
      // Create admin user
      await User.createWithPassword(username, password);
      
      console.log('✓ Admin user created successfully');
      console.log(`  Username: ${username}`);
      console.log('  ⚠️  Please change the password after first login!');
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    throw error;
  }
}

module.exports = seedAdmin;
