"use strict";

/**
 * Migration: create Payments table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Courses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      enrollmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Enrollments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      providerPaymentId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiptUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      refundedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop enum type (Postgres) after dropping table
    await queryInterface.dropTable("Payments");
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_Payments_status\";");
    } catch (e) {
      // ignore if not Postgres or already dropped
    }
  }
};