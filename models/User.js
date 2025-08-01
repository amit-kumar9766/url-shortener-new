"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      api_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {}
  );

  User.associate = function (models) {
    User.hasMany(models.Url, {
      foreignKey: "userId",
      as: "urls",
      onDelete: "CASCADE",
    });
  };

  return User;
};
