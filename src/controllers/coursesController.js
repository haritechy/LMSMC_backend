const { Op } = require("sequelize");
const User = require("../models/userModel");
const Class = require("../models/class");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const Message = require("../models/messageModel");
const CoursePriceOption = require("../models/courseOptionModel");

// ========================= CREATE COURSE =========================
exports.createCourse = async (req, res) => {
  try {
    const { title, description, rating } = req.body;
    const rawClasses = req.body.classes;
    const courseThumbnail = req.files?.courseThumbnail?.[0]?.filename;

    const course = await Course.create({
      title,
      description,
      rating: parseFloat(rating) || 0,
      thumbnail: courseThumbnail || null,
      duration: 0,
    });

    let totalDuration = 0;

    if (rawClasses && rawClasses !== "undefined") {
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
          CourseId: course.id,
        };
      });

      await Class.bulkCreate(classList);
    }

    await course.update({ duration: totalDuration });

    const completeCourse = await Course.findByPk(course.id, {
      include: [
        { model: Class, as: "classes", order: [["order", "ASC"]] },
        { model: Enrollment, as: "courseEnrollments" },
        { model: User, as: "trainer", attributes: ["id", "name", "email"] },
      ],
    });

    res.status(201).json({ course: completeCourse, message: "✅ Course and classes created successfully" });
  } catch (err) {
    console.error("❌ Create course error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};

// ========================= GET ALL COURSES =========================
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: Class, as: "classes", order: [['order', 'ASC']] },
        { model: Enrollment, as: "courseEnrollments" },
        { model: User, as: "trainer", attributes: ['id', 'name', 'email','specialist'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const coursesWithUrls = courses.map(course => {
      const courseData = course.toJSON();
      if (courseData.thumbnail) courseData.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${courseData.thumbnail}`;
      if (courseData.classes) {
        courseData.classes = courseData.classes.map(cls => {
          if (cls.thumbnail) cls.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${cls.thumbnail}`;
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

// ========================= GET SINGLE COURSE =========================
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Class, as: "classes", order: [['order', 'ASC']] },
        { model: Enrollment, as: "courseEnrollments" },
        { model: User, as: "trainer", attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const courseData = course.toJSON();
    if (courseData.thumbnail) courseData.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${courseData.thumbnail}`;
    if (courseData.classes) {
      courseData.classes = courseData.classes.map(cls => {
        if (cls.thumbnail) cls.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${cls.thumbnail}`;
        return cls;
      });
    }

    res.json(courseData);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========================= UPDATE COURSE =========================
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if (req.body.trainerId) {
      const trainer = await User.findOne({ where: { id: req.body.trainerId } });
      if (!trainer) return res.status(400).json({ error: "Invalid trainer ID" });
      req.body.trainerId = trainer.id;
    }

    await course.update({
      title: req.body.title,
      description: req.body.description,
      rating: parseFloat(req.body.rating) || 0,
      TrainerId: req.body.trainerId ?? course.TrainerId,
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
      include: [
        { model: Class, as: "classes" },
        { model: Enrollment, as: "courseEnrollments" },
        { model: User, as: "trainer", attributes: ['id', 'name', 'email'] },
      ]
    });

    res.json({ course: updatedCourse, message: "Course updated successfully" });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========================= DELETE COURSE =========================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    await course.destroy();
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========================= ENROLL STUDENT =========================
exports.enrollStudent = async (req, res) => {
  try {
    const { studentName, studentId } = req.body;
    if (!studentName || !studentId) return res.status(400).json({ error: "Student name and ID are required" });

    const course = await Course.findByPk(req.params.id, {
      include: [{ model: Enrollment, as: "courseEnrollments" }]
    });

    if (!course) return res.status(404).json({ error: "Course not found" });

    const existingEnrollment = course.courseEnrollments.find(
      e => e.studentId === studentId
    );

    if (existingEnrollment) return res.status(400).json({ error: "Student is already enrolled" });

    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentId,
      courseId: course.id,
    });

    res.status(201).json({ enrollment, message: "Student enrolled successfully" });
  } catch (err) {
    console.error('Enroll student error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ========================= GET ACTIVE COURSES FOR STUDENT =========================
exports.getActiveCoursesForStudent = async (req, res) => {
  try {
    const studentId = req.user?.id || req.body.studentId;
    if (!studentId) return res.status(400).json({ error: "Student ID is required" });

    const enrolledCourses = await Course.findAll({
      include: [
        { model: Enrollment, as: "courseEnrollments", where: { studentId }, required: true },
        { model: Class, as: "classes", order: [['order', 'ASC']] },
        { model: User, as: "trainer", attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const coursesWithUrls = enrolledCourses.map(course => {
      const courseData = course.toJSON();
      if (courseData.thumbnail) courseData.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${courseData.thumbnail}`;
      if (courseData.classes) {
        courseData.classes = courseData.classes.map(cls => {
          if (cls.thumbnail) cls.thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/${cls.thumbnail}`;
          return cls;
        });
      }
      return courseData;
    });

    res.json(coursesWithUrls);
  } catch (err) {
    console.error('Get active courses for student error:', err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};

// ========================= GET TRAINERS FOR STUDENT =========================
exports.getTrainersForStudentCourses = async (req, res) => {
  try {
    const studentId = req.user?.id || req.query.studentId || req.body.studentId;
    if (!studentId) return res.status(400).json({ error: "Student ID is required" });

    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        {
          model: User,
          as: "trainer",
          attributes: ["id", "name", "email", "specialist"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const trainersMap = new Map();
    enrollments.forEach(enrollment => {
      if (enrollment.trainer && !trainersMap.has(enrollment.trainer.id)) {
        trainersMap.set(enrollment.trainer.id, enrollment.trainer);
      }
    });
    const trainers = Array.from(trainersMap.values());

    const enrichedTrainers = await Promise.all(
      trainers.map(async trainer => {
        const lastMsg = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: trainer.id, receiverId: studentId },
              { senderId: studentId, receiverId: trainer.id },
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        const unreadCount = await Message.count({
          where: { senderId: trainer.id, receiverId: studentId, read: false },
        });

        return {
          ...trainer.toJSON(),
          lastMessage: lastMsg?.content || "No messages yet",
          lastSeen: lastMsg?.createdAt || null,
          unreadCount,
        };
      })
    );

    res.json({ trainers: enrichedTrainers, message: "Trainers fetched successfully" });
  } catch (err) {
    console.error("Get trainers for student courses error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};

// ========================= GET STUDENTS FOR TRAINER =========================
exports.getStudentsForTrainer = async (req, res) => {
  try {
    const trainerId = req.user?.id || req.query.trainerId || req.body.trainerId;
    if (!trainerId) return res.status(400).json({ error: "Trainer ID is required" });

   const enrollments = await Enrollment.findAll({
      where: { trainerId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "name", "email", "specialist"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const studentsMap = new Map();
    enrollments.forEach(e => { 
      if (e.student && !studentsMap.has(e.student.id)) studentsMap.set(e.student.id, e.student); 
    });
    const students = Array.from(studentsMap.values());

    const enrichedStudents = await Promise.all(
      students.map(async student => {
        const lastMsg = await Message.findOne({
          where: { [Op.or]: [{ senderId: student.id, receiverId: trainerId }, { senderId: trainerId, receiverId: student.id }] },
          order: [["createdAt", "DESC"]],
        });
        const unreadCount = await Message.count({ where: { senderId: student.id, receiverId: trainerId, read: false } });
        return { ...student.toJSON(), lastMessage: lastMsg?.content || "No messages yet", lastSeen: lastMsg?.createdAt || null, unreadCount };
      })
    );

    res.json({ students: enrichedStudents, message: "Students fetched successfully" });
  } catch (err) {
    console.error("Get students for trainer courses error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};

// ========================= COURSE PRICE OPTIONS =========================
exports.getCourseOptions = async (req, res) => {
  try {
    const options = await CoursePriceOption.findAll();
    res.status(200).json(options);
  } catch (err) {
    console.error("Error fetching course options:", err);
    res.status(500).json({ message: "Failed to fetch course options" });
  }
};
