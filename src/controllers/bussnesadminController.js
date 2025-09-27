const Enrollment = require("../models/enrollment");
const Course = require("../models/course");
const User = require("../models/userModel");

// Get all students report (all enrollments with student info)
const getAllStudentReports = async (req, res) => {
  try {
    // Fetch all enrollments with student and course details
    const enrollments = await Enrollment.findAll({
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, as: "course", attributes: ["id", "title"] }
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(enrollments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get students report by course id
const getStudentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const enrollments = await Enrollment.findAll({
      where: { CourseId: courseId },
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title"] }
      ],
    });

    if (!enrollments.length) {
      return res.status(404).json({ message: "No enrollments found for this course" });
    }

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllStudentReports,
  getStudentsByCourse,
};
