// routes/billRoutes.js
const router = require("express").Router();
const { generateBill } = require("../controllers/billController");

router.post("/generate", generateBill);

module.exports = router;
