const { DataTypes } = require('sequelize');
const argon2 = require('argon2');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Instance methods
    hooks: {
      // Don't hash password on every save, only when it changes
    }
  });
  
  // Instance method to verify password
  User.prototype.verifyPassword = async function(password) {
    try {
      return await argon2.verify(this.passwordHash, password);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };
  
  // Instance method to set password (hashes with Argon2id)
  User.prototype.setPassword = async function(password) {
    try {
      // Argon2id with moderate cost (optimized for not blocking event loop)
      this.passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4
      });
    } catch (error) {
      console.error('Password hashing error:', error);
      throw error;
    }
  };
  
  // Class method to create user with hashed password
  User.createWithPassword = async function(username, password) {
    const user = User.build({ username });
    await user.setPassword(password);
    await user.save();
    return user;
  };
  
  return User;
};
