'use strict';
module.exports = (sequelize, DataTypes) => {
  const Url = sequelize.define(
    'Url',
    {
      originalUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shortCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true, 
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true, 
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      paranoid: true, // Enables soft delete
      timestamps: true,
    }
  );

  Url.associate = function (models) {
    Url.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Url;
};
