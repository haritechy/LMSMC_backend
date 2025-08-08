const enrollmentService = require("../services/enrollmentService");

const createEnrollment = async (req, res) => {
  try {
    const { studentName, studentid, selectedOptionId ,courseId} = req.body;
    const enrollment = await enrollmentService.createEnrollment({ studentName, studentid, selectedOptionId,courseId });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await enrollmentService.getEnrollmentById(id);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById
};
