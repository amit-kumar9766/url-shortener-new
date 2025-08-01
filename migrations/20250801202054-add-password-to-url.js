module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Urls', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Urls', 'password');
  },
};
