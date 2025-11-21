// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { registrar } = require("../controllers/authController");

router.post("/register", registrar);

module.exports = router;
