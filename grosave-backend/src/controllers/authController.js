// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { generateOTP, storeOTP, verifyOTP } = require('../utils/generateOTP');

async function sendOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const otp = generateOTP();
    storeOTP(phone, otp);
    console.log(`OTP for ${phone}: ${otp}`);

    return res.json({ success: true, message: 'OTP sent', otp });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

async function verifyOTPAndLogin(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

    const isValid = verifyOTP(phone, otp);
    if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: { phone },
      });

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await prisma.wallet.create({
        data: {
          userId: user.id,
          currentBalance: parseInt(process.env.MONTHLY_COIN_ALLOCATION || '4000', 10),
          monthlyCredit: parseInt(process.env.MONTHLY_COIN_ALLOCATION || '4000', 10),
          spent: 0,
          bonusEarned: 0,
          refillDate: nextMonth,
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({ success: true, token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { sendOTP, verifyOTPAndLogin };
