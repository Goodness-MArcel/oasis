"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename description to about
    await queryInterface.renameColumn("Courses", "description", "about");

    // Add new columns
    await queryInterface.addColumn("Courses", "curriculum", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Courses", "outcome", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Courses", "section", {
      type: Sequelize.ENUM('morning', 'afternoon'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse the changes
    await queryInterface.removeColumn("Courses", "section");
    await queryInterface.removeColumn("Courses", "outcome");
    await queryInterface.removeColumn("Courses", "curriculum");

    // Rename back
    await queryInterface.renameColumn("Courses", "about", "description");
  },
};