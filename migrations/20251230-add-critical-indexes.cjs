'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add critical indexes for better query performance
    // Focus on the most impactful indexes for common queries

    try {
      // User table - most critical indexes
      await queryInterface.addIndex('Users', ['createdAt'], {
        name: 'users_created_at_idx'
      });

      await queryInterface.addIndex('Users', ['role'], {
        name: 'users_role_idx'
      });

      // Enrollment table - critical for joins
      await queryInterface.addIndex('Enrollments', ['userId'], {
        name: 'enrollments_user_id_idx'
      });

      await queryInterface.addIndex('Enrollments', ['courseId'], {
        name: 'enrollments_course_id_idx'
      });

      await queryInterface.addIndex('Enrollments', ['status'], {
        name: 'enrollments_status_idx'
      });

      await queryInterface.addIndex('Enrollments', ['createdAt'], {
        name: 'enrollments_created_at_idx'
      });

      // Composite index for user-course relationship
      await queryInterface.addIndex('Enrollments', ['userId', 'courseId'], {
        name: 'enrollments_user_course_idx',
        unique: true
      });

      // Payment table - critical for financial queries
      await queryInterface.addIndex('Payments', ['userId'], {
        name: 'payments_user_id_idx'
      });

      await queryInterface.addIndex('Payments', ['status'], {
        name: 'payments_status_idx'
      });

      await queryInterface.addIndex('Payments', ['installment_status'], {
        name: 'payments_installment_status_idx'
      });

      // Meeting table - for calendar queries
      await queryInterface.addIndex('Meetings', ['start'], {
        name: 'meetings_start_idx'
      });

      console.log('Critical database indexes added successfully');
    } catch (error) {
      console.error('Error adding indexes:', error.message);
      // Continue with other indexes even if some fail
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes safely
    const indexesToRemove = [
      { table: 'Users', index: 'users_created_at_idx' },
      { table: 'Users', index: 'users_role_idx' },
      { table: 'Enrollments', index: 'enrollments_user_id_idx' },
      { table: 'Enrollments', index: 'enrollments_course_id_idx' },
      { table: 'Enrollments', index: 'enrollments_status_idx' },
      { table: 'Enrollments', index: 'enrollments_created_at_idx' },
      { table: 'Enrollments', index: 'enrollments_user_course_idx' },
      { table: 'Payments', index: 'payments_user_id_idx' },
      { table: 'Payments', index: 'payments_status_idx' },
      { table: 'Payments', index: 'payments_installment_status_idx' },
      { table: 'Meetings', index: 'meetings_start_idx' }
    ];

    for (const { table, index } of indexesToRemove) {
      try {
        await queryInterface.removeIndex(table, index);
      } catch (error) {
        console.log(`Index ${index} not found or already removed`);
      }
    }
  }
};