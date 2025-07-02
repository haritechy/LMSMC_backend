// src/models/associations.js
const User = require("./userModel");
const Role = require("./roleModel");
const Message = require("./messageModel");

// 👇 User and Role
User.belongsTo(Role, { foreignKey: "RoleId" });

// 👇 Message Associations
Message.belongsTo(User, { as: "Sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "Receiver", foreignKey: "receiverId" });

module.exports = { User, Role, Message };
