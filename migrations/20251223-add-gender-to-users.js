export async function up(queryInterface, Sequelize) {
  // Make migration idempotent: only add column if it does not exist
  const table = await queryInterface.describeTable("Users");
  if (!table.gender) {
    await queryInterface.addColumn("Users", "gender", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
}

export async function down(queryInterface, Sequelize) {
  // Only attempt to remove the column if it exists
  const table = await queryInterface.describeTable("Users");
  if (table.gender) {
    await queryInterface.removeColumn("Users", "gender");
  }
}
