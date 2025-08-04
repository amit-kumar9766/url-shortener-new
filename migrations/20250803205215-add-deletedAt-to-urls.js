module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Urls", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("Urls", "deletedAt");
  },
};
