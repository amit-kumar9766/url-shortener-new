"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Urls", [
      {
        originalUrl: "https://example.com",
        shortCode: "abc123",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        originalUrl: "https://openai.com",
        shortCode: "open01",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        originalUrl: "https://github.com",
        shortCode: "git789",
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Urls", null, {});
  },
};
