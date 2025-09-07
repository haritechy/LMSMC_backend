const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");


router.post("/order", enrollmentController.createOrder);        // Step 1: Create Razorpay order
router.post("/verify", enrollmentController.verifyAndCreateEnrollment); // ✅ new route
router.get("/", enrollmentController.getAllEnrollments);
router.get("/:id", enrollmentController.getEnrollmentById);

module.exports = router;
