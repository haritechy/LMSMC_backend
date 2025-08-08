const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoute");
const trainerRoutes = require("./trainerRoute");
const messageRoutes=require('./messageRoute')
const adminRoutes=require('./adminRoutes')
const courseRoutes=require('./coursesRoutes');
const enrollRoutes =require("./enrollmentRoutes");

router.use("/", authRoutes);
router.use("/courses", courseRoutes);
router.use("/", trainerRoutes);
router.use("/chat",messageRoutes)
router.use("/admin",adminRoutes);
router.use("/enrollment",enrollRoutes);
module.exports = router;
