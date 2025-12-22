"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add duration column to existing Courses table
    await queryInterface.addColumn("Courses", "duration", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove duration column on rollback
    await queryInterface.removeColumn("Courses", "duration");
  },
};
