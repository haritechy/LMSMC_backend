const Enrollment = require("../models/enrollment");
const CoursePriceOption = require("../models/courseOptionModel");

const createEnrollment = async ({ studentName, studentid, selectedOptionId,courseId }) => {
  const option = await CoursePriceOption.findByPk(selectedOptionId);
  if (!option) {
    throw new Error("Invalid selectedOptionId");
  }

  const enrollment = await Enrollment.create({
    studentName,
    studentid,
    selectedOptionId,
    CourseId: courseId 
  });

  return enrollment;
};

const getAllEnrollments = async () => {
  return await Enrollment.findAll({
    include: {
      model: CoursePriceOption,
      as: "selectedOption"
    }
  });
};

const getEnrollmentById = async (id) => {
  return await Enrollment.findByPk(id, {
    include: {
      model: CoursePriceOption,
      as: "selectedOption"
    }
  });
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById
};
