const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

// Razorpay payment & enrollment
router.post("/order", enrollmentController.createOrder);
router.post("/verify", enrollmentController.verifyAndCreateEnrollment);

// Enrollment CRUD
router.post("/student-enrollments", enrollmentController.getStudentEnrollments);
router.get("/", enrollmentController.getAllEnrollments);
router.get("/:id", enrollmentController.getEnrollmentById);

// Progress update
router.put("/:enrollmentId/progress", enrollmentController.updateProgress);

module.exports = router;
