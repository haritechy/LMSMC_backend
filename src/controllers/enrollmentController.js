const Enrollment = require("../models/enrollment");
const User = require("../models/userModel");
const Course = require("../models/course");
const CoursePriceOption = require("../models/courseOptionModel");
const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    const order = await razorpayInstance.orders.create({ amount: amount * 100, currency, receipt });
    res.json(order);
  } catch (err) {
    console.error("❌ Razorpay order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// Verify payment & create enrollment
exports.verifyAndCreateEnrollment = async (req, res) => {
  try {
    const { studentId, courseId, selectedOptionId, amount, paymentMethod, razorpay_order_id, razorpay_payment_id } = req.body;

    const student = await User.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const selectedOption = selectedOptionId
      ? await CoursePriceOption.findByPk(selectedOptionId)
      : null;

    // Initialize default course stages
    const defaultStages = course.stages || []; // assume course.stages is JSON in course model

    const enrollment = await Enrollment.create({
      studentName: student.name,
      studentEmail: student.email,
      studentId,
      courseId,
      selectedOptionId: selectedOptionId || null,
      amount,
      paymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      courseStages: defaultStages,
    });

    res.status(201).json({ message: "Enrollment created", enrollment });
  } catch (err) {
    console.error("❌ Enrollment creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all enrollments
exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, as: "course", attributes: ["id", "title"] },
        { model: CoursePriceOption, as: "selectedOption" },
      ],
    });
    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get enrollment by ID
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        { model: User, as: "student", attributes: ["id", "name", "email"] },
        { model: Course, as: "course", attributes: ["id", "title"] },
        { model: CoursePriceOption, as: "selectedOption" },
      ],
    });
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update course progress
exports.updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { stageId, completed, feedback } = req.body;

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    let stages = enrollment.courseStages || [];
    stages = stages.map((stage) =>
      stage.id === stageId ? { ...stage, completed, feedback } : stage
    );

    enrollment.courseStages = stages;
    await enrollment.save();

    res.json({ message: "Progress updated", stages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getStudentEnrollments = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Fetch enrollments with course and selected option details
    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        { model: Course, attributes: ["id", "title"] },
        { model: CoursePriceOption, as: "selectedOption" },
      ],
    });

    if (enrollments.length === 0) {
      return res.status(404).json({ message: "No enrollments found for this student." });
    }

    res.json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
