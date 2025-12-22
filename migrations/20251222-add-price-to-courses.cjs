"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add price column to existing Courses table
    await queryInterface.addColumn("Courses", "price", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove price column on rollback
    await queryInterface.removeColumn("Courses", "price");
  },
};
