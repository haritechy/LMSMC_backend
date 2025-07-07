const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoute");
const trainerRoutes = require("./trainerRoute");
const messageRoutes=require('./messageRoute')
router.use("/", authRoutes);
router.use("/", trainerRoutes);
router.use("/chat",messageRoutes)

module.exports = router;
