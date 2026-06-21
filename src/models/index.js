const sequelize = require('../config/database');

// Import model definitions
const UserModel = require('./User');
const DevisRequestModel = require('./DevisRequest');
const DevisMediaModel = require('./DevisMedia');
const ProjectModel = require('./Project');

// Initialize models
const User = UserModel(sequelize);
const DevisRequest = DevisRequestModel(sequelize);
const DevisMedia = DevisMediaModel(sequelize);
const Project = ProjectModel(sequelize);

// Setup associations
const models = {
  User,
  DevisRequest,
  DevisMedia,
  Project
};

// Call associate methods if they exist
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};

