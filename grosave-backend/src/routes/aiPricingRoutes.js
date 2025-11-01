// src/routes/aiPricingRoutes.js
const express = require('express');
const router = express.Router();
const { suggestPrice } = require('../controllers/aiPricingController');

router.get('/health', (req, res) => res.json({ ok: true }));
router.post('/suggest', suggestPrice);

module.exports = router;
