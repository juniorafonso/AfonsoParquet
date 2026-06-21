const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titleFr: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'title_fr',
      comment: 'Titre du projet en français'
    },
    titleEn: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'title_en',
      comment: 'Titre du projet en anglais'
    },
    descFr: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'desc_fr',
      comment: 'Description en français'
    },
    descEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'desc_en',
      comment: 'Description en anglais'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Category: poncage, pose, plinthe, reparation, etc.'
    },
    imagePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_path',
      comment: 'Relative path to project image'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Display order (lower = first)'
    },
    published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the project is visible on the site'
    }
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['published'] },
      { fields: ['category'] },
      { fields: ['order'] }
    ]
  });
  
  return Project;
};
