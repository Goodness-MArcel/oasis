"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Courses table
    await queryInterface.createTable('Courses', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      badge: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lessons: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      enrolled: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      instructorName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Create Enrollments table
    await queryInterface.createTable('Enrollments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Courses', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('enrolled','completed','cancelled'),
        allowNull: false,
        defaultValue: 'enrolled',
      },
      progress: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Add unique index to prevent duplicate enrollments
    await queryInterface.addIndex('Enrollments', ['userId', 'courseId'], { unique: true, name: 'enrollments_user_course_unique' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Enrollments', 'enrollments_user_course_unique');
    await queryInterface.dropTable('Enrollments');
    await queryInterface.dropTable('Courses');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Enrollments_status";');
  }
};
