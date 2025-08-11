const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Enrollment = sequelize.define("Enrollment", {
  studentName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  studentid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Must match the exact table name for User model in your DB
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
