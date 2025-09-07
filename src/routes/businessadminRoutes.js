const express = require("express");
const router = express.Router();
const businessAdminController = require("../controllers/bussnesadminController");
const { verifyToken } = require("../middleware/socketAuth");
router.get("/student-reports", businessAdminController.getAllStudentReports);
router.get("/courses/:courseId/students", businessAdminController.getStudentsByCourse);

module.exports = router;
