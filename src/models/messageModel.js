const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
  senderId: DataTypes.INTEGER,
  receiverId: DataTypes.INTEGER,
  content: DataTypes.TEXT,
});

module.exports = Message;
