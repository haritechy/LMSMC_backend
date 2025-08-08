const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CoursePriceOption = sequelize.define("CoursePriceOption", {
  studentCount: DataTypes.INTEGER,       // e.g., 1, 3, 5
  trainerCount: DataTypes.INTEGER,       // e.g., 1
  price: DataTypes.FLOAT       // e.g., 4000, 3600, 3400
});

module.exports = CoursePriceOption;
