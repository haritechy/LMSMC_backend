const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Role = sequelize.define("Role", {
  name: {
    type: DataTypes.ENUM("admin", "trainer", "student"),
    allowNull: false,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = Role;
