"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Users", [
      {
        email: "demo1@example.com",
        api_key: "apikey123",
        name: "Demo User 1",
        plan: "enterprise",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "demo2@example.com",
        api_key: "apikey456",
        name: "Demo User 2",
        plan: "free",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
