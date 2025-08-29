// models/course.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CoursePriceOption = require("./courseOptionModel");

const Course = sequelize.define("Course", {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  thumbnail: DataTypes.STRING,
  basePrice: {
  type: DataTypes.INTEGER,
  allowNull: true,
  defaultValue:0,  
},
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  duration: DataTypes.INTEGER, // total duration of all classes in minutes
  TrainerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Users",  // Your User model's table name
      key: "id",
    },
  },
});

Course.hasMany(CoursePriceOption, { as: "priceOptions", foreignKey: "courseId" });
CoursePriceOption.belongsTo(Course, { foreignKey: "courseId" });

module.exports = Course;
