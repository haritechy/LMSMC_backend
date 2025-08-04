const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define("Course", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  defaultPrice: DataTypes.FLOAT,
  thumbnail: DataTypes.STRING,
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  duration: DataTypes.INTEGER // total duration of all classes in minutes
});

module.exports = Course;


