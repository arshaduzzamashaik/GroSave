// src/controllers/productController.js — images, nutritionInfo etc. are JSON-compatible
const prisma = require('../config/database');

async function getProducts(req, res) {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };

    // Category filter (keep "All" as no-op for compatibility)
    if (category && category !== 'All') where.category = category;

    // Text search across name/brand (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { expiryDate: 'asc' },
        take,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        hasMore: parseInt(page) * take < total,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json(product);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { _all: true },
    });

    const formatted = categories.map((c) => ({
      id: c.category.toLowerCase().replace(/\s+/g, '-'),
      name: c.category,
      productCount: c._count._all,
    }));

    // Keep "All" synthetic category for UI that relies on it
    return res.json({ categories: [{ id: 'all', name: 'All', productCount: -1 }, ...formatted] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

module.exports = { getProducts, getProductById, getCategories };
