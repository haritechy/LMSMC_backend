const User = require("./userModel");
const Role = require("./roleModel");
const Message = require("./messageModel");
const Course = require("./course");
const Class = require("./class");
const Enrollment = require("./enrollment");

// User - Role
User.belongsTo(Role, { foreignKey: "RoleId" });
Role.hasMany(User, { foreignKey: "RoleId" });

// Course - Class
Course.hasMany(Class, { foreignKey: "CourseId", onDelete: "CASCADE" });
Class.belongsTo(Course, { foreignKey: "CourseId" });

// Course - Enrollment
Course.hasMany(Enrollment, { foreignKey: "CourseId", onDelete: "CASCADE" });
Enrollment.belongsTo(Course, { foreignKey: "CourseId" });

// Course - Trainer (User)
Course.belongsTo(User, { as: "Trainer", foreignKey: "TrainerId" });
User.hasMany(Course, { as: "Courses", foreignKey: "TrainerId" });


// Define associations
Enrollment.belongsTo(Course, { foreignKey: "CourseId" });

Course.hasMany(Enrollment, { foreignKey: "CourseId" });


// Enrollment - User (student)
Enrollment.belongsTo(User, { as: "student", foreignKey: "studentid" });
User.hasMany(Enrollment, { as: "enrollments", foreignKey: "studentid" });

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
};

