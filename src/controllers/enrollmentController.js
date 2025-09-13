
const Enrollment = require("../models/enrollment");
const Course = require("../models/course");
const User = require("../models/userModel");

const enrollmentService = require("../services/enrollmentService");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
  try {

    const { studentName, studentid, selectedOptionId, courseId } = req.body;
    
    // Validation
    if (!studentName || !studentid || !courseId) {
      return res.status(400).json({ 
        error: "Student name, student ID, and course ID are required" 
      });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if student exists
    const student = await User.findByPk(studentid);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      where: { studentid, CourseId: courseId }
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        error: "Student is already enrolled in this course" 
      });
    }

    // Calculate pricing based on enrollment count
    const enrollmentCount = await Enrollment.count({
      where: { CourseId: courseId }
    });

    let finalPrice = course.defaultPrice;
    if (enrollmentCount === 0) {
      finalPrice *= 3; // First student pays 3x
    } else if (enrollmentCount === 1) {
      finalPrice *= 2; // Second student pays 2x
    }
    // Third+ students pay default price

    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentid,
      selectedOptionId,
      CourseId: courseId,
      finalPrice,
      enrollmentDate: new Date()
    });

    const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title", "description"] }
      ]
    });

    res.status(201).json({
      enrollment: enrollmentWithDetails,
      message: "Student enrolled successfully",
      finalPrice,
      enrollmentCount: enrollmentCount + 1
    });

    const { amount, currency = "INR" } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency,
      payment_capture: 1,
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyAndCreateEnrollment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentName,
      studentid,
      studentEmail,
      courseId,
      selectedOptionId,
      amount,
      paymentMethod,
      enrollmentDate,
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const enrollment = await enrollmentService.createEnrollment({
      studentName,
      studentid,
      studentEmail,
      courseId,
      selectedOptionId,
      amount,
      paymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      enrollmentDate,
    });

    res.status(201).json({ message: "Enrollment successful", enrollment });

  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title", "description", "defaultPrice"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      enrollments,
      message: "All enrollments fetched successfully"
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Get enrollment by ID
const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
   
    const enrollment = await Enrollment.findByPk(id, {
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title", "description", "defaultPrice"] }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json({
      enrollment,
      message: "Enrollment fetched successfully"
    });
  } catch (error) {
    console.error('Get enrollment by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all students report (all enrollments with student info)
const getAllStudentReports = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title", "description", "defaultPrice"] }
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      enrollments,
      message: "Student reports fetched successfully"
    });
  } catch (error) {
    console.error('Get all student reports error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get students report by course id
const getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.findAll({
      where: { CourseId: courseId },
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, attributes: ["id", "title", "description", "defaultPrice"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    if (!enrollments.length) {
      return res.status(404).json({ 
        message: "No enrollments found for this course" 
      });
    }

    res.status(200).json({
      enrollments,
      courseId,
      totalEnrollments: enrollments.length,
      message: "Course enrollments fetched successfully"
    });

    const enrollment = await enrollmentService.getEnrollmentById(id);
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);

  } catch (error) {
    console.error('Get students by course error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyAndCreateEnrollment,
  getAllEnrollments,
  getEnrollmentById,

  getAllStudentReports,
  getStudentsByCourse
};


