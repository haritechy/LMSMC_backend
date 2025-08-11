const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require("../models/userModel");
const Class = require("../models/class");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");



exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      defaultPrice,
      rating,
      trainerId,
    } = req.body;

    const rawClasses = req.body.classes;
    const courseThumbnail = req.files?.courseThumbnail?.[0]?.filename;

  
    let trainer = null;
    if (trainerId) {
      trainer = await User.findOne({
        where: { id: trainerId }, 
      });
      if (!trainer) {
        return res.status(400).json({ error: "Invalid trainer ID or user is not a trainer." });
      }
    }

    // Create Course
    const course = await Course.create({
      title,
      description,
      defaultPrice: parseFloat(defaultPrice),
      rating: parseFloat(rating) || 0,
      thumbnail: courseThumbnail || null,
      duration: 0,
      TrainerId: trainerId ,
    });

    let totalDuration = 0;

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

    await course.update({ duration: totalDuration });

    const completeCourse = await Course.findByPk(course.id, {
      include: [
        { model: Class, order: [['order', 'ASC']] },
        Enrollment,
        { model: User, as: "Trainer", attributes: ['id', 'name', 'email','specialist'] }
      ],
    });

    res.status(201).json({
      course: completeCourse,
      message: "✅ Course and classes created successfully with trainer assigned"
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
        { model: Class, order: [['order', 'ASC']] },
        Enrollment,
        { model: User, as: "Trainer", attributes: ['id', 'name', 'email','specialist'] }
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
        { model: Class, order: [['order', 'ASC']] },
        Enrollment,
        { model: User, as: "Trainer", attributes: ['id', 'name', 'email'] }
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

    // Validate trainer update if applicable
    if (req.body.trainerId) {
      const trainer = await User.findOne({ where: { id: req.body.trainerId, roleId: 4 } });
      if (!trainer) {
        return res.status(400).json({ error: "Invalid trainer ID or user is not a trainer." });
      }
      req.body.TrainerId = trainer.id;
    }

    await course.update({
      title: req.body.title,
      description: req.body.description,
      defaultPrice: parseFloat(req.body.defaultPrice),
      rating: parseFloat(req.body.rating) || 0,
      TrainerId: req.body.TrainerId !== undefined ? req.body.TrainerId : course.TrainerId,
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
        { model: Class },
        Enrollment,
        { model: User, as: "Trainer", attributes: ['id', 'name', 'email'] }
      ]
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
    const { studentName, studentid } = req.body;

    if (!studentName || studentName.trim() === '') {
      return res.status(400).json({ error: "Student name is required" });
    }
    if (!studentid) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    const course = await Course.findByPk(req.params.id, {
      include: [{ model: Enrollment }]
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

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

    const enrollment = await Enrollment.create({
      studentName: studentName.trim(),
      studentid,
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

exports.getActiveCoursesForStudent = async (req, res) => {
  try {
    const studentId = req.user?.id || req.body.studentid;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    const enrolledCourses = await Course.findAll({
      include: [
        {
          model: Enrollment,
          where: { studentid: studentId },
          required: true,
        },
        {
          model: Class,
          order: [['order', 'ASC']],
        },
        { model: User, as: "Trainer", attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const coursesWithUrls = enrolledCourses.map(course => {
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
    console.error('Get active courses for student error:', err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};


const { Op } = require("sequelize");
const Message = require("../models/messageModel");

// ✅ Get Trainers for Student Courses + last message + unread count
exports.getTrainersForStudentCourses = async (req, res) => {
  try {
    const studentId = req.user?.id || req.query.studentid || req.body.studentid;
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // 1️⃣ Find all courses where student is enrolled
    const courses = await Course.findAll({
      include: [
        {
          model: Enrollment,
          where: { studentid: studentId },
          required: true,
        },
        {
          model: User,
          as: "Trainer",
          attributes: ["id", "name", "email", "specialist"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // 2️⃣ Extract unique trainers
    const trainersMap = new Map();
    courses.forEach(course => {
      if (course.Trainer && !trainersMap.has(course.Trainer.id)) {
        trainersMap.set(course.Trainer.id, course.Trainer);
      }
    });
    const trainers = Array.from(trainersMap.values());

    // 3️⃣ Add last message + unread count for each trainer
    const enrichedTrainers = await Promise.all(
      trainers.map(async (trainer) => {
        const lastMsg = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: trainer.id, receiverId: studentId },
              { senderId: studentId, receiverId: trainer.id }
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        const unreadCount = await Message.count({
          where: {
            senderId: trainer.id,
            receiverId: studentId,
            read: false,
          },
        });

        return {
          ...trainer.toJSON(),
          lastMessage: lastMsg ? lastMsg.content : "No messages yet",
          lastSeen: lastMsg ? lastMsg.createdAt : null,
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


// ✅ Get Students for Trainer Courses + last message + unread count
exports.getStudentsForTrainer = async (req, res) => {
  try {
    const trainerId = req.user?.id || req.query.trainerId || req.body.trainerId;
    if (!trainerId) {
      return res.status(400).json({ error: "Trainer ID is required" });
    }

    // 1️⃣ Find enrollments where the course belongs to this trainer
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: Course,
          where: { TrainerId: trainerId },
          attributes: ["id", "title"],
          required: true,
        },
        {
          model: User,
          as: "student",
          attributes: ["id", "name", "email"],
          required: true,
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // 2️⃣ Extract unique students
    const studentsMap = new Map();
    enrollments.forEach(enrollment => {
      if (enrollment.student && !studentsMap.has(enrollment.student.id)) {
        studentsMap.set(enrollment.student.id, enrollment.student);
      }
    });
    const students = Array.from(studentsMap.values());

    // 3️⃣ Add last message + unread count for each student
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const lastMsg = await Message.findOne({
          where: {
            [Op.or]: [
              { senderId: student.id, receiverId: trainerId },
              { senderId: trainerId, receiverId: student.id }
            ],
          },
          order: [["createdAt", "DESC"]],
        });

        const unreadCount = await Message.count({
          where: {
            senderId: student.id,
            receiverId: trainerId,
            read: false,
          },
        });

        return {
          ...student.toJSON(),
          lastMessage: lastMsg ? lastMsg.content : "No messages yet",
          lastSeen: lastMsg ? lastMsg.createdAt : null,
          unreadCount,
        };
      })
    );

    res.json({ students: enrichedStudents, message: "Students fetched successfully" });

  } catch (err) {
    console.error("Get students for trainer courses error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
};
