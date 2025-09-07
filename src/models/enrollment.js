const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./userModel");

const CoursePriceOption = require("./courseOptionModel");
const Course = require("./course");


const Enrollment = sequelize.define("Enrollment", {
  studentName: { type: DataTypes.STRING, allowNull: false },
  studentEmail: { type: DataTypes.STRING, allowNull: true },

  studentid: {
    type: DataTypes.INTEGER,
    allowNull: false,

    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',

    references: { model: "Users", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",

  },

  courseId: {   // ✅ added missing column
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Courses", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  selectedOptionId: { type: DataTypes.INTEGER, allowNull: true },

  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: false },

  razorpay_order_id: { type: DataTypes.STRING },
  razorpay_payment_id: { type: DataTypes.STRING },

  enrollmentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Associations
Enrollment.belongsTo(CoursePriceOption, {
  foreignKey: "selectedOptionId",
  as: "selectedOption",
});

Enrollment.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});

module.exports = Enrollment;
