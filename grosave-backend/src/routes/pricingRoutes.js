// src/routes/pricingRoutes.js
const express = require("express");
const { postSuggestPrice } = require("../controllers/pricingController");
const router = express.Router();

// You can add auth middleware if you want this protected
router.post("/suggest", postSuggestPrice);

module.exports = router;

