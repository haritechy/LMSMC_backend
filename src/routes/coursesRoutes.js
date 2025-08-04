const express = require("express");
const router = express.Router();
const controller = require("../controllers/coursesController");
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/socketAuth");

// ✅ Create course (with token verification)
router.post(
  "/creates",
  verifyToken,
  upload.fields([
    { name: 'courseThumbnail', maxCount: 1 },
    ...Array.from({ length: 20 }, (_, i) => ({
      name: `classThumbnail${i}`,
      maxCount: 1
    }))
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

// ✅ Enroll student (protected, or you can allow public if open)
router.post("/:id/enroll", verifyToken, controller.enrollStudent);

module.exports = router;
