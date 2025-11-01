const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const adminDemoRoutes = require('./routes/adminDemoRoutes');
const pricingRoutes = require("./routes/pricingRoutes");
const aiPricingRoutes = require('./routes/aiPricingRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use("/api/pricing", pricingRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
app.use('/api/demo-admin', adminDemoRoutes);
app.use('/api/ai/pricing', aiPricingRoutes);