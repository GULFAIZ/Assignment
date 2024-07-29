const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const axios = require('axios');

// Initialize database
router.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    await Transaction.insertMany(response.data);
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List transactions
router.get('/', async (req, res) => {
  const { month, search, page = 1, perPage = 10 } = req.query;
  const query = {
    dateOfSale: { $regex: `-${month}-` },
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { price: { $regex: search, $options: 'i' } }
    ]
  };

  try {
    const transactions = await Transaction.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistics
router.get('/statistics', async (req, res) => {
  const { month } = req.query;
  try {
    const totalSaleAmount = await Transaction.aggregate([
      { $match: { dateOfSale: { $regex: `-${month}-` } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const soldItems = await Transaction.countDocuments({ dateOfSale: { $regex: `-${month}-` }, sold: true });
    const notSoldItems = await Transaction.countDocuments({ dateOfSale: { $regex: `-${month}-` }, sold: false });
    res.json({ totalSaleAmount: totalSaleAmount[0]?.total || 0, soldItems, notSoldItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bar chart data
router.get('/barchart', async (req, res) => {
  const { month } = req.query;
  try {
    const ranges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      // ... add other ranges
      { min: 901, max: Infinity }
    ];

    const result = await Promise.all(ranges.map(async range => {
      const count = await Transaction.countDocuments({
        dateOfSale: { $regex: `-${month}-` },
        price: { $gte: range.min, $lte: range.max }
      });
      return { range: `${range.min} - ${range.max === Infinity ? 'above' : range.max}`, count };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pie chart data
router.get('/piechart', async (req, res) => {
  const { month } = req.query;
  try {
    const result = await Transaction.aggregate([
      { $match: { dateOfSale: { $regex: `-${month}-` } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Combined data
router.get('/combined', async (req, res) => {
  const { month } = req.query;
  try {
    const transactions = await axios.get(`http://localhost:5000/api/transactions?month=${month}`);
    const statistics = await axios.get(`http://localhost:5000/api/transactions/statistics?month=${month}`);
    const barChart = await axios.get(`http://localhost:5000/api/transactions/barchart?month=${month}`);
    const pieChart = await axios.get(`http://localhost:5000/api/transactions/piechart?month=${month}`);

    res.json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;