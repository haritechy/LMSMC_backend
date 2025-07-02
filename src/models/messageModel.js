// src/models/messageModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Message = sequelize.define("Message", {
  senderId: DataTypes.INTEGER,
  receiverId: DataTypes.INTEGER,
  content: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM("sent", "delivered", "read", "flagged"),
    defaultValue: "sent"
  },
  priority: {
    type: DataTypes.ENUM("low", "normal", "high"),
    defaultValue: "normal"
  }
});

module.exports = Message;
