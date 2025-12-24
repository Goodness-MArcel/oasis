"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Payment.belongsTo(models.Course, { foreignKey: "courseId", as: "course" });
      Payment.belongsTo(models.Enrollment, { foreignKey: "enrollmentId", as: "enrollment" });

      // allow eager-loading from user/course -> payments
      if (models.User && models.User.hasMany) {
        models.User.hasMany(Payment, { foreignKey: "userId", as: "payments" });
      }
      if (models.Course && models.Course.hasMany) {
        models.Course.hasMany(Payment, { foreignKey: "courseId", as: "payments" });
      }
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      enrollmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerPaymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      refundedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "Payments",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["courseId"] },
        { fields: ["enrollmentId"] },
      ],
    }
  );

  return Payment;
};
