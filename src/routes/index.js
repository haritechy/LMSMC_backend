const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoute");
const trainerRoutes = require("./trainerRoute");

router.use("/", authRoutes);
router.use("/", trainerRoutes);

module.exports = router;
