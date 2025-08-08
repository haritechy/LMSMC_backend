const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Enrollment = sequelize.define("Enrollment", {
  studentName: DataTypes.STRING,
  studentid: DataTypes.INTEGER,   // <-- add studentid field
  selectedOptionId: DataTypes.INTEGER,
});



module.exports = Enrollment;
