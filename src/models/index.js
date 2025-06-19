
const sequelize = require("../config/db");
const Role = require("./roleModel");
const User = require("./userModel");

sequelize.sync({alter:true})
  .then(() => console.log("✅ All tables synced"))
  .catch((err) => console.error("❌ Sync error:", err));

module.exports = { sequelize, Role, User };
