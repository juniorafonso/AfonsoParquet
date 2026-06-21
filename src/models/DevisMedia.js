const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DevisMedia = sequelize.define('DevisMedia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    devisRequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'devis_request_id',
      references: {
        model: 'devis_requests',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
      comment: 'image or video'
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Relative path to uploaded file'
    },
    mime: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'MIME type (e.g., image/jpeg, video/mp4)'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    }
  }, {
    tableName: 'devis_media',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['devis_request_id'] },
      { fields: ['type'] }
    ]
  });
  
  DevisMedia.associate = (models) => {
    // Many DevisMedia belong to one DevisRequest
    DevisMedia.belongsTo(models.DevisRequest, {
      foreignKey: 'devis_request_id',
      as: 'devisRequest'
    });
  };
  
  return DevisMedia;
};
