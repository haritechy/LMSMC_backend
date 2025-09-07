const sequelize = require("../config/db");
const Role = require("./roleModel");
const User = require("./userModel");
const Enrollment = require("./enrollment");
const Course = require("./course");
const CoursePriceOption = require("./courseOptionModel");

// Associations
Role.hasMany(User, { foreignKey: "roleId" });


sequelize.sync({ alter: true }).then(async () => {
  console.log("✅ All tables synced");
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');

    await DemoSession.sync({ alter: true }); // adjust table to match model
    console.log('DemoSession table synced!');

    process.exit(0); // exit after syncing
  } catch (error) {
    console.error('Error syncing DemoSession table:', error);
    process.exit(1);
  }
})();

  const roles = ["super admin","business admin","technical admin", "trainer", "student"];
  for (const name of roles) {
    await Role.findOrCreate({ where: { name } });
  }

  console.log("✅ Roles seeded");
}).catch((err) => {
  console.error("❌ Sync error:", err);
});



module.exports = { sequelize, Role, User, Enrollment, Course, CoursePriceOption };
