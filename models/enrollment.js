"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {
      Enrollment.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Enrollment.belongsTo(models.Course, { foreignKey: "courseId", as: "course" });
    }
  }

  Enrollment.init(
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
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('enrolled','completed','cancelled'),
        allowNull: false,
        defaultValue: 'enrolled',
      },
      progress: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "Enrollment",
      tableName: "Enrollments",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "courseId"],
        },
        { fields: ["courseId"] },
        { fields: ["userId"] },
      ],
    }
  );

  return Enrollment;
};
