'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Payments', 'total_paid', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Cumulative total amount paid so far for this course'
    });

    // Update existing records to set total_paid based on current installment_amount
    await queryInterface.sequelize.query(`
      UPDATE "Payments"
      SET total_paid = COALESCE(installment_amount, 0)
      WHERE total_paid = 0 OR total_paid IS NULL
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Payments', 'total_paid');
  }
};
