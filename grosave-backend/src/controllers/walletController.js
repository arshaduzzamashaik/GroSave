// src/controllers/walletController.js
const prisma = require('../config/database');

async function getWalletBalance(req, res) {
  try {
    const userId = req.user?.userId;
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const now = new Date();
    const refillDate = wallet.refillDate ? new Date(wallet.refillDate) : null;
    const daysUntilRefill = refillDate
      ? Math.max(0, Math.ceil((refillDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.json({
      currentBalance: wallet.currentBalance,
      monthlyCredit: wallet.monthlyCredit,
      spent: wallet.spent,
      refillDate: wallet.refillDate,
      daysUntilRefill,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch wallet' });
  }
}

async function getTransactions(req, res) {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return res.json({
      transactions,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

module.exports = { getWalletBalance, getTransactions };
