// src/controllers/userController.js
// Controller: Users
//
// Notes:
// - `address` in your schema is a scalar STRING column, so we only ever write a string to it.
//   If the client sends an object (e.g., { street, city, pincode }), we take `street` for the `address` column,
//   while `city` and `pincode` go to their dedicated columns.
// - We never pass `undefined` into Prisma `data` (we build the update object dynamically).
// - We normalize income range strings to your Prisma enum.
// - We always use the authenticated user id from req.user.userId.

const prisma = require('../config/database');
let IncomeRangeEnum;

// Prisma enum import (guarded to avoid runtime issues if not present on older client builds)
try {
  ({ IncomeRange: IncomeRangeEnum } = require('@prisma/client'));
} catch {
  // Fallback dummy so normalizeIncomeRange() can still function without exploding in non-enum environments
  IncomeRangeEnum = {
    BELOW_1_5_LPA: 'BELOW_1_5_LPA',
    BETWEEN_1_5_2_5_LPA: 'BETWEEN_1_5_2_5_LPA',
    BETWEEN_2_5_3_5_LPA: 'BETWEEN_2_5_3_5_LPA',
    ABOVE_3_5_LPA: 'ABOVE_3_5_LPA',
  };
}

/**
 * Normalize different income range inputs into the Prisma enum.
 * Supports:
 *  - Friendly keys: 'below-1.5' | '1.5-2.5' | '2.5-3.5' | 'above-3.5'
 *  - Loose forms like '1_5_2_5', '2_5_3_5'
 *  - Exact enum strings like 'BELOW_1_5_LPA'
 */
function normalizeIncomeRange(val) {
  if (!val) return null;
  const raw = String(val).trim();

  // Friendly map (keeps compatibility with existing UI payloads)
  const friendlyMap = {
    'below-1.5': IncomeRangeEnum.BELOW_1_5_LPA,
    '1.5-2.5': IncomeRangeEnum.BETWEEN_1_5_2_5_LPA,
    '2.5-3.5': IncomeRangeEnum.BETWEEN_2_5_3_5_LPA,
    'above-3.5': IncomeRangeEnum.ABOVE_3_5_LPA,
  };
  if (friendlyMap[raw]) return friendlyMap[raw];

  // Upper/loose normalization
  const upper = raw.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  // Loose map (for '1_5_2_5', etc.)
  const looseMap = {
    '1_5_2_5': IncomeRangeEnum.BETWEEN_1_5_2_5_LPA,
    '2_5_3_5': IncomeRangeEnum.BETWEEN_2_5_3_5_LPA,
  };
  if (looseMap[upper]) return looseMap[upper];

  // Exact enum name passthrough if it exists
  if (IncomeRangeEnum[upper]) return IncomeRangeEnum[upper];

  return null;
}

/**
 * Build a Prisma-safe "data" object:
 * - Only include defined fields.
 * - Coerce types where appropriate.
 * - For address: accept string or object; write only a string to DB.
 */
function buildUserUpdateData(body = {}) {
  const {
    name,
    aadhaarLast4,
    incomeRange,
    schoolGoingChildren,
    address,
    city,
    pincode,
    isVerified,
    eligibilityStatus,
    language,
    notificationPrefs,
  } = body;

  const data = {};

  if (typeof name === 'string' && name.trim()) data.name = name.trim();

  if (typeof aadhaarLast4 === 'string') {
    const last4 = aadhaarLast4.trim();
    if (/^\d{0,4}$/.test(last4)) data.aadhaarLast4 = last4;
  }

  const normIncome = normalizeIncomeRange(incomeRange);
  if (normIncome) data.incomeRange = normIncome;

  if (Number.isFinite(+schoolGoingChildren) && +schoolGoingChildren >= 0) {
    data.schoolGoingChildren = +schoolGoingChildren;
  }

  // address column is a STRING in DB
  if (address && typeof address === 'object') {
    if (typeof address.street === 'string' && address.street.trim()) {
      data.address = address.street.trim();
    }
  } else if (typeof address === 'string' && address.trim()) {
    data.address = address.trim();
  }

  if (typeof city === 'string' && city.trim()) data.city = city.trim();
  if (typeof pincode === 'string' && pincode.trim()) data.pincode = pincode.trim();

  if (typeof isVerified === 'boolean') data.isVerified = isVerified;

  if (typeof eligibilityStatus === 'string' && eligibilityStatus.trim()) {
    data.eligibilityStatus = eligibilityStatus.trim();
  }

  if (typeof language === 'string' && language.trim()) data.language = language.trim();

  // Allow JSON for notificationPrefs if you store it as a JSON column; if it's TEXT, stringify upstream.
  if (notificationPrefs !== undefined) data.notificationPrefs = notificationPrefs;

  return data;
}

/**
 * POST /api/user/register (or complete profile/verification)
 * Marks user verified + saves profile fields.
 */
async function registerUser(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Build data; force verified + approved for this flow.
    const base = buildUserUpdateData(req.body);
    const data = {
      ...base,
      isVerified: true,
      eligibilityStatus: base.eligibilityStatus || 'approved',
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error('registerUser error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

/**
 * GET /api/user/profile
 */
async function getUserProfile(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        isVerified: true,
        eligibilityStatus: true,
        incomeRange: true,
        schoolGoingChildren: true,
        address: true,
        city: true,
        pincode: true,
        language: true,
        notificationPrefs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, user });
  } catch (error) {
    console.error('getUserProfile error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
}

/**
 * PUT /api/user/profile
 * Partial update; only writes provided fields.
 */
async function updateUserProfile(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const data = buildUserUpdateData(req.body);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error('updateUserProfile error:', error);
    return res.status(500).json({ success: false, error: 'Update failed' });
  }
}

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile,
};
