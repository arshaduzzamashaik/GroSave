// src/routes/index.js
const express = require('express');
const router = express.Router();

const { sendOTP, verifyOTPAndLogin } = require('../controllers/authController');
const { registerUser, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { getWalletBalance, getTransactions } = require('../controllers/walletController');
const { getProducts, getProductById, getCategories } = require('../controllers/productController');
const {
  createOrder,
  getActiveOrders,
  getPastOrders,
  cancelOrder,
  markReady,
  markScanned,
  completeOrder,
} = require('../controllers/orderController');
const { getPickupLocations, getPickupSlots } = require('../controllers/pickupController');
const { listNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');
const { getImpact } = require('../controllers/impactController');
const { earnAd, earnSurvey, earnReferral } = require('../controllers/earnController');

const { authenticate } = require('../middleware/auth');

// Auth
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTPAndLogin);

// User
router.post('/users/register', authenticate, registerUser);
router.get('/users/profile', authenticate, getUserProfile);
router.put('/users/profile', authenticate, updateUserProfile);

// Wallet
router.get('/wallet/balance', authenticate, getWalletBalance);
router.get('/wallet/transactions', authenticate, getTransactions);

// Products
router.get('/products', getProducts);
router.get('/products/categories', getCategories);
router.get('/products/:id', getProductById);

// Pickup
router.get('/pickup-locations', getPickupLocations);
router.get('/pickup-slots', getPickupSlots); // ?pickupLocationId=...&date=YYYY-MM-DD

// Orders
router.post('/orders/reserve', authenticate, createOrder);
router.get('/orders/active', authenticate, getActiveOrders);
router.get('/orders/past', authenticate, getPastOrders);
router.post('/orders/:id/cancel', authenticate, cancelOrder);
router.post('/orders/:id/ready', authenticate, markReady);
router.post('/orders/:id/scanned', authenticate, markScanned);
router.post('/orders/:id/complete', authenticate, completeOrder);

// Notifications
router.get('/notifications', authenticate, listNotifications);
router.post('/notifications/:id/read', authenticate, markNotificationRead);
router.post('/notifications/read-all', authenticate, markAllNotificationsRead);

// Impact
router.get('/impact', authenticate, getImpact);

// Earn
router.post('/earn/ad', authenticate, earnAd);
router.post('/earn/survey', authenticate, earnSurvey);
router.post('/earn/referral', authenticate, earnReferral);

module.exports = router;
