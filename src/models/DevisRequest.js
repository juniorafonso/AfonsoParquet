const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DevisRequest = sequelize.define('DevisRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Coordonnées (Étape 2)
    civilite: {
      type: DataTypes.ENUM('M', 'Mme'),
      allowNull: true,
      comment: 'Monsieur ou Madame'
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    
    // Projet (Étape 1)
    npa: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Code postal / NPA'
    },
    buildingType: {
      type: DataTypes.ENUM('maison', 'appart_vide', 'appart_habite', 'bureau', 'autre'),
      allowNull: true,
      field: 'building_type'
    },
    serviceTypes: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Comma-separated: poncage,pose_parquet,pose_plinthe,reparation,autres',
      field: 'service_types',
      get() {
        const raw = this.getDataValue('serviceTypes');
        return raw ? raw.split(',') : [];
      },
      set(value) {
        // value should be an array
        this.setDataValue('serviceTypes', Array.isArray(value) ? value.join(',') : value);
      }
    },
    parquetType: {
      type: DataTypes.ENUM('massif', 'contrecolle', 'stratifie', 'ne_sais_pas'),
      allowNull: true,
      field: 'parquet_type'
    },
    poseType: {
      type: DataTypes.ENUM('flottant', 'cloue', 'colle', 'ne_sais_pas'),
      allowNull: true,
      field: 'pose_type'
    },
    surfaceM2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'surface_m2',
      validate: {
        min: 0
      }
    },
    delais: {
      type: DataTypes.ENUM('a_definir', 'rapidement', 'dans_le_mois'),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    externalLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'external_link',
      comment: 'Lien WeTransfer/Drive/YouTube pour vidéo externe'
    },
    
    // Status & metadata
    status: {
      type: DataTypes.ENUM('new', 'in_progress', 'done'),
      allowNull: false,
      defaultValue: 'new'
    },
    locale: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'fr',
      comment: 'Langue du formulaire (fr/en)'
    }
  }, {
    tableName: 'devis_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['created_at'] },
      { fields: ['email'] },
      { fields: ['npa'] }
    ]
  });
  
  DevisRequest.associate = (models) => {
    // One DevisRequest has many DevisMedia
    DevisRequest.hasMany(models.DevisMedia, {
      foreignKey: 'devis_request_id',
      as: 'media',
      onDelete: 'CASCADE'
    });
  };
  
  return DevisRequest;
};
