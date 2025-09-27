const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");


const Enrollment = sequelize.define("Enrollment", {
  studentName: { type: DataTypes.STRING, allowNull: false },
  studentEmail: { type: DataTypes.STRING, allowNull: true },

  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "Users", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Courses", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },

  selectedOptionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "CoursePriceOptions", key: "id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },

  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: false },

  razorpay_order_id: { type: DataTypes.STRING },
  razorpay_payment_id: { type: DataTypes.STRING },

  enrollmentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

  courseStages: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
});

module.exports = Enrollment;
