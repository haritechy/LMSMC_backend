const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./userModel");

const Enrollment = sequelize.define("Enrollment", {
  studentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  studentid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  selectedOptionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Enrollment;
