import bcrypt from "bcrypt";

export async function up(queryInterface, Sequelize) {
  const passwordHash = await bcrypt.hash("admin123", 10);
  await queryInterface.bulkInsert(
    "Admins",
    [
      {
        email: "admin@oasis.com",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    {}
  );
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("Admins", { email: "admin@oasis.com" }, {});
}
