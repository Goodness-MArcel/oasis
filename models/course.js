"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      // students (many-to-many)
      Course.belongsToMany(models.User, {
        through: models.Enrollment,
        as: "students",
        foreignKey: "courseId",
        otherKey: "userId",
      });

      // optional: allow eager-loading of enrollments
      Course.hasMany(models.Enrollment, { foreignKey: "courseId", as: "enrollments" });
    }
  }

  Course.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      badge: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lessons: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      enrolled: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      instructorName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Course",
      tableName: "Courses",
      timestamps: true,
    }
  );

  return Course;
};
