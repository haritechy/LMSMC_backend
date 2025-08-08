const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CoursePriceOption = require("./courseOptionModel");

const Course = sequelize.define("Course", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  thumbnail: DataTypes.STRING,
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  duration: DataTypes.INTEGER // total duration of all classes in minutes
});

Course.hasMany(CoursePriceOption, {
  as: "priceOptions",       
  foreignKey: "courseId"
});
CoursePriceOption.belongsTo(Course, {
  foreignKey: "courseId"
});

module.exports = Course;


