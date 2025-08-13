// routes/coursesRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/coursesController");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/socketAuth");

// ✅ Create course (with token verification and file upload)
router.post(
  "/creates",
  verifyToken,
  upload.fields([
    { name: "courseThumbnail", maxCount: 1 },
    ...Array.from({ length: 20 }, (_, i) => ({
      name: `classThumbnail${i}`,
      maxCount: 1,
    })),
  ]),
  controller.createCourse
);

// ✅ Get all courses (usually public, no token required)
router.get("/all", controller.getAllCourses);

// ✅ Get single course (usually public, no token required)
router.get("/all/:id", controller.getCourse);

// ✅ Update course (protected)
router.put("/edit/:id", verifyToken, controller.updateCourse);

// ✅ Delete course (protected)
router.delete("/delete/:id", verifyToken, controller.deleteCourse);


// ✅ Enroll student (protected)
router.post("/:id/enroll", verifyToken, controller.enrollStudent);
router.get('/:studentid/trainers', verifyToken, controller.getTrainersForStudentCourses);
router.get('/:trainerid/students', verifyToken, controller.getStudentsForTrainer);
// ✅ Get active/enrolled courses for logged-in student (protected)
router.get(
  "/active",
  verifyToken, // makes sure we have authenticated student info
  controller.getActiveCoursesForStudent
);

module.exports = router;
