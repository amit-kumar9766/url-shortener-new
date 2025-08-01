"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const oneDayLater = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await queryInterface.bulkInsert("Urls", [
      {
        originalUrl: "https://example.com",
        shortCode: "abc1234",
        userId: 1,
        expiryDate: oneDayLater,
        createdAt: now,
        updatedAt: now,
      },
      {
        originalUrl: "https://google.com",
        shortCode: "xyz789",
        userId: 1,
        expiryDate: yesterday,
        createdAt: now,
        updatedAt: now,
      },
      {
        originalUrl: "https://openai.com",
        shortCode: "openai",
        userId: 2,
        expiryDate: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Urls", null, {});
  },
};
