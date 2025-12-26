'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Courses', [
      {
        title: 'Full-Stack Web Development with MERN',
        category: 'Web Development',
        badge: 'Beginner to Advanced',
        description: 'Learn to build complete web applications using MongoDB, Express.js, React, and Node.js. From frontend to backend, master the entire stack.',
        lessons: 45,
        enrolled: 127,
        price: 120000,
        duration: '12 weeks',
        instructorName: 'Adebayo Johnson',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Data Science & Machine Learning Bootcamp',
        category: 'Data Science',
        badge: 'Intermediate',
        description: 'Master data analysis, statistical modeling, and machine learning algorithms using Python, pandas, scikit-learn, and TensorFlow.',
        lessons: 52,
        enrolled: 89,
        price: 150000,
        duration: '16 weeks',
        instructorName: 'Dr. Chioma Nwosu',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Cybersecurity Fundamentals & Ethical Hacking',
        category: 'Cybersecurity',
        badge: 'Beginner',
        description: 'Learn the basics of cybersecurity, network security, ethical hacking techniques, and how to protect systems from cyber threats.',
        lessons: 38,
        enrolled: 156,
        price: 95000,
        duration: '10 weeks',
        instructorName: 'Emeka Okafor',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Mobile App Development with Flutter',
        category: 'Mobile Development',
        badge: 'Intermediate',
        description: 'Build cross-platform mobile applications for Android and iOS using Flutter and Dart. Learn modern UI patterns and app deployment.',
        lessons: 42,
        enrolled: 73,
        price: 110000,
        duration: '14 weeks',
        instructorName: 'Kelechi Umeh',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'AI & Deep Learning with Python',
        category: 'AI/ML',
        badge: 'Advanced',
        description: 'Dive deep into artificial intelligence and deep learning. Build neural networks, computer vision models, and NLP applications.',
        lessons: 48,
        enrolled: 64,
        price: 180000,
        duration: '18 weeks',
        instructorName: 'Dr. Funmi Adeolu',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'DevOps & Cloud Computing Essentials',
        category: 'DevOps',
        badge: 'Intermediate',
        description: 'Master DevOps practices, CI/CD pipelines, Docker containerization, and cloud deployment on AWS, Azure, and Google Cloud.',
        lessons: 35,
        enrolled: 92,
        price: 130000,
        duration: '12 weeks',
        instructorName: 'Tunde Bakare',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Courses', null, {});
  }
};
