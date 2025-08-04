"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Users", "plan", {
      type: Sequelize.ENUM("free", "enterprise"),
      allowNull: false,
      defaultValue: "free",
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Users", "plan");
  },
};
