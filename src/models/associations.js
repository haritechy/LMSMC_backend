const User = require("./userModel");
const Role = require("./roleModel");
const Message = require("./messageModel");
const Course = require("./course");
const Class = require("./class");
const Enrollment = require("./enrollment");
const CoursePriceOption = require("./courseOptionModel");

// -------------------- Associations --------------------

// User - Role
User.belongsTo(Role, { foreignKey: "RoleId" });
Role.hasMany(User, { foreignKey: "RoleId" });

// Course - Class
Course.hasMany(Class, { foreignKey: "CourseId", onDelete: "CASCADE" });
Class.belongsTo(Course, { foreignKey: "CourseId" });

// Course - Enrollment
Course.hasMany(Enrollment, { foreignKey: "courseId", as: "courseEnrollments", onDelete: "CASCADE" });
Enrollment.belongsTo(Course, { foreignKey: "courseId", as: "course" });

// Course - Trainer (User)
Course.belongsTo(User, { as: "Trainer", foreignKey: "TrainerId" });
User.hasMany(Course, { as: "Courses", foreignKey: "TrainerId" });

// Enrollment - User (student)
Enrollment.belongsTo(User, { as: "student", foreignKey: "studentId" });
User.hasMany(Enrollment, { as: "studentEnrollments", foreignKey: "studentId" });

// Enrollment - CoursePriceOption
Enrollment.belongsTo(CoursePriceOption, { as: "selectedOption", foreignKey: "selectedOptionId" });
CoursePriceOption.hasMany(Enrollment, { as: "optionEnrollments", foreignKey: "selectedOptionId" });

// Messages associations
Message.belongsTo(User, { as: "Sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "Receiver", foreignKey: "receiverId" });
User.hasMany(Message, { as: "SentMessages", foreignKey: "senderId" });
User.hasMany(Message, { as: "ReceivedMessages", foreignKey: "receiverId" });

module.exports = {
  User,
  Role,
  Message,
  Course,
  Class,
  Enrollment,
  CoursePriceOption,
};
