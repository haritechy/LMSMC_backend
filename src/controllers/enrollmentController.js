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

// 🔹 Get enrollment by ID
const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollment = await enrollmentService.getEnrollmentById(id);
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyAndCreateEnrollment,
  getAllEnrollments,
  getEnrollmentById,
};
