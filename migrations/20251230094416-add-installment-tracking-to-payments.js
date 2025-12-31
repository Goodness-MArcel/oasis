'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add installment tracking columns to Payments table
    await queryInterface.addColumn('Payments', 'installment_number', {
      type: Sequelize.TINYINT,
      allowNull: true,
      comment: 'Installment number (1, 2, 3) for installment payments'
    });

    await queryInterface.addColumn('Payments', 'total_installments', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: 'Total number of installments for this payment plan'
    });

    await queryInterface.addColumn('Payments', 'installment_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Amount for this specific installment'
    });

    await queryInterface.addColumn('Payments', 'paid_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date when this installment was paid'
    });

    await queryInterface.addColumn('Payments', 'installment_status', {
      type: Sequelize.ENUM('pending', 'paid', 'overdue', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Status of this installment'
    });

    await queryInterface.addColumn('Payments', 'balance_remaining', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Remaining balance for installment payments'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove installment tracking columns from Payments table
    await queryInterface.removeColumn('Payments', 'installment_number');
    await queryInterface.removeColumn('Payments', 'total_installments');
    await queryInterface.removeColumn('Payments', 'installment_amount');
    await queryInterface.removeColumn('Payments', 'paid_date');
    await queryInterface.removeColumn('Payments', 'installment_status');
    await queryInterface.removeColumn('Payments', 'balance_remaining');
  }
};
