// src/routes/adminDemoRoutes.js
const express = require('express');
const { forceTransition, seedExtraProduct } = require('../controllers/adminDemoController');

const router = express.Router();

/**
 * POST /api/demo-admin/orders/:orderId/force
 * Header: Authorization: DemoAdmin <DEMO_ADMIN_TOKEN>
 * Body: { "to": "ready" }  // confirmed|ready|scanned|completed|cancelled
 */
router.post('/orders/:orderId/force', forceTransition);

/**
 * POST /api/demo-admin/seed/product
 * Header: Authorization: DemoAdmin <DEMO_ADMIN_TOKEN>
 */
router.post('/seed/product', seedExtraProduct);

module.exports = router;
