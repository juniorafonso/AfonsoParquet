/**
 * Reset Admin Password Script
 * Run with: node scripts/resetAdminPassword.js
 */

require('dotenv').config();
const { sequelize, User } = require('../src/models');

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    const username = process.env.ADMIN_USERNAME || 'admin';
    const newPassword = process.env.ADMIN_PASSWORD || 'change-this-password-immediately';
    
    console.log(`Looking for user: ${username}`);
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      console.log(`❌ User "${username}" not found in database.`);
      console.log('Creating new admin user...');
      
      const newUser = await User.createWithPassword(username, newPassword);
      console.log(`✅ Admin user created with ID: ${newUser.id}`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log(`✅ User found with ID: ${user.id}`);
      console.log('Updating password...');
      
      await user.setPassword(newPassword);
      await user.save();
      
      console.log(`✅ Password updated successfully!`);
      console.log(`   Username: ${username}`);
      console.log(`   New Password: ${newPassword}`);
    }
    
    await sequelize.close();
    console.log('\n✅ Done! You can now login with the credentials above.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
