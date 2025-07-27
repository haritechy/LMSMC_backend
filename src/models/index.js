const sequelize = require("../config/db");
const Role = require("./roleModel");
const User = require("./userModel");

Role.hasMany(User, { foreignKey: "roleId" });


sequelize.sync({ alter: true }).then(async () => {
  console.log("✅ All tables synced");

  // Seed roles (insert if not exists)
  const roles = ["super admin","business admin","technical admin", "trainer", "student"];
  for (const name of roles) {
    await Role.findOrCreate({ where: { name } });
  }

  console.log("✅ Roles seeded");
}).catch((err) => {
  console.error("❌ Sync error:", err);
});

module.exports = { sequelize, Role, User };
