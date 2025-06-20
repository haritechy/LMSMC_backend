const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Role = require("./roleModel");

const User = sequelize.define("User", {
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  mobile: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
});

User.belongsTo(Role);

module.exports = User;
