"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make migration idempotent for environments loading .cjs
    const table = await queryInterface.describeTable("Users");
    if (!table.gender) {
      await queryInterface.addColumn("Users", "gender", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Users");
    if (table.gender) {
      await queryInterface.removeColumn("Users", "gender");
    }
  },
};
