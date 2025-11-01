// src/controllers/earnController.js
const prisma = require('../config/database');

const MAX_BONUS = parseInt(process.env.MAX_BONUS_COINS_PER_MONTH || '500', 10);

async function creditBonus(tx, userId, amount, description, meta) {
  const wallet = await tx.wallet.findFirst({ where: { userId } });
  const newBonus = wallet.bonusEarned + amount;
  if (newBonus > MAX_BONUS) {
    const remaining = MAX_BONUS - wallet.bonusEarned;
    if (remaining <= 0) return { credited: 0 };
    amount = remaining;
  }

  const updated = await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      currentBalance: wallet.currentBalance + amount,
      bonusEarned: wallet.bonusEarned + amount,
    },
  });

  await tx.transaction.create({
    data: {
      userId,
      type: 'bonus',
      amount,
      description,
      balanceAfter: updated.currentBalance,
    },
  });

  await tx.earnEvent.create({
    data: {
      userId,
      type: 'ad',
      amount,
      meta,
    },
  });

  await tx.notification.create({
    data: {
      userId,
      type: 'wallet',
      title: 'Bonus Earned',
      message: `You earned ${amount} GroCoins!`,
    },
  });

  return { credited: amount };
}

async function earnAd(req, res) {
  try {
    const userId = req.user?.userId;
    const { adId } = req.body;
    const amount = 10; // per ad view
    const result = await prisma.$transaction((tx) =>
      creditBonus(tx, userId, amount, 'Ad view reward', { adId })
    );
    return res.json({ success: true, ...result });
  } catch {
    return res.status(500).json({ error: 'Failed to earn' });
  }
}

async function earnSurvey(req, res) {
  try {
    const userId = req.user?.userId;
    const { surveyId } = req.body;
    const amount = 25;
    const result = await prisma.$transaction((tx) =>
      creditBonus(tx, userId, amount, 'Survey reward', { surveyId })
    );
    return res.json({ success: true, ...result });
  } catch {
    return res.status(500).json({ error: 'Failed to earn' });
  }
}

async function earnReferral(req, res) {
  try {
    const userId = req.user?.userId;
    const { referredPhone } = req.body;
    const amount = 50;
    const result = await prisma.$transaction((tx) =>
      creditBonus(tx, userId, amount, 'Referral reward', { referredPhone })
    );
    return res.json({ success: true, ...result });
  } catch {
    return res.status(500).json({ error: 'Failed to earn' });
  }
}

module.exports = { earnAd, earnSurvey, earnReferral };
