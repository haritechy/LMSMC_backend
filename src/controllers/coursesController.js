// controllers/coursesController.js
const Class = require("../models/class");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, defaultPrice, rating ,thumbnail} = req.body;
    const rawClasses = req.body.classes;

    const courseThumbnail = req.files?.courseThumbnail?.[0]?.filename;

    // Step 1: Create course
    const course = await Course.create({
      title,
      description,
      defaultPrice: parseFloat(defaultPrice),
      rating: parseFloat(rating) || 0,
      thumbnail: courseThumbnail || null,
      duration: 0 // Will be updated later
    });

    let totalDuration = 0;

    // Step 2: Parse classes and insert
    if (rawClasses && rawClasses !== 'undefined') {
      const parsedClasses = typeof rawClasses === "string" ? JSON.parse(rawClasses) : rawClasses;

      const classList = parsedClasses.map((cls, index) => {
        const duration = parseInt(cls.duration) || 0;
        totalDuration += duration;

    const classThumbnail = req.files?.[`classThumbnail${index}`]?.[0]?.filename || null;


        return {
          title: cls.title,
          description: cls.description,
          content: cls.content || cls.description,
          order: index + 1,
          day: index + 1,
          duration,
          thumbnail: classThumbnail,
          CourseId: course.id
        };
      });

      await Class.bulkCreate(classList);
    }

    // Step 3: Update course duration
    await course.update({ duration: totalDuration });

    // Step 4: Fetch course with relationships
    const completeCourse = await Course.findByPk(course.id, {
      include: [Class, Enrollment]
    });

    res.status(201).json({
      course: completeCourse,
      message: "✅ Course and classes created successfully"
    });
  } catch (err) {
    console.error("❌ Create course error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};


exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: Class,
          order: [['order', 'ASC']]
        },
        Enrollment
      ],
      order: [['createdAt', 'DESC']]
    });

    const coursesWithUrls = courses.map(course => {
      const courseData = course.toJSON();
      if (courseData.thumbnail) {
        courseData.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${courseData.thumbnail}`;
      }

      if (courseData.Classes) {
        courseData.Classes = courseData.Classes.map(cls => {
          if (cls.thumbnail) {
            cls.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${cls.thumbnail}`;
          }
          return cls;
        });
      }

      return courseData;
    });

    res.json(coursesWithUrls);
  } catch (err) {
    console.error('Get all courses error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Class,
          order: [['order', 'ASC']]
        },
        Enrollment
      ],
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseData = course.toJSON();
    if (courseData.thumbnail) {
      courseData.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${courseData.thumbnail}`;
    }

    if (courseData.Classes) {
      courseData.Classes = courseData.Classes.map(cls => {
        if (cls.thumbnail) {
          cls.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${cls.thumbnail}`;
        }
        return cls;
      });
    }

    res.json(courseData);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await course.update({
      title: req.body.title,
      description: req.body.description,
      defaultPrice: parseFloat(req.body.defaultPrice),
      rating: parseFloat(req.body.rating) || 0,
    });

    if (req.body.classes) {
      await Class.destroy({ where: { CourseId: course.id } });

      const classList = req.body.classes.map((cls, index) => ({
        title: cls.title,
        description: cls.description,
        content: cls.content || cls.description,
        order: index + 1,
        CourseId: course.id,
        duration: parseInt(cls.duration) || 0,
        day: index + 1,
        thumbnail: cls.thumbnail || null,
      }));

      await Class.bulkCreate(classList);

      const totalDuration = classList.reduce((sum, cls) => sum + cls.duration, 0);
      await course.update({ duration: totalDuration });
    }

    const updatedCourse = await Course.findByPk(course.id, {
      include: [Class, Enrollment]
    });

    res.json({ 
      course: updatedCourse, 
      message: "Course updated successfully" 
    });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await course.destroy();

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentName, studentid } = req.body;  // get studentid from body

    if (!studentName || studentName.trim() === '') {
      return res.status(400).json({ error: "Student name is required" });
    }
    if (!studentid) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Include Enrollments plural (assuming correct association)
    const course = await Course.findByPk(req.params.id, { 
      include: [{ model: Enrollment }] 
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if the student is already enrolled (case insensitive)
    const existingEnrollment = course.Enrollments.find(
      enrollment => enrollment.studentName.toLowerCase() === studentName.trim().toLowerCase()
    );

    if (existingEnrollment) {
      return res.status(400).json({ error: "Student is already enrolled in this course" });
    }

    const studentCount = course.Enrollments.length + 1;
    let finalPrice = course.defaultPrice;

    if (studentCount === 1) {
      finalPrice *= 3;
    } else if (studentCount === 2) {
      finalPrice *= 2;
    }

    // Create enrollment including studentid
    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentid,             // save studentid here
      finalPrice,
      CourseId: course.id,
    });

    res.status(201).json({ 
      enrollment, 
      message: "Student enrolled successfully",
      finalPrice,
      studentCount,
    });
  } catch (err) {
    console.error('Enroll student error:', err);
    res.status(500).json({ error: err.message });
  }
};
