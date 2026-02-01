const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize data storage
let data = {
  ads: [],
  revenue: []
};

// Load data from file if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(fileData);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// API Routes

// Get all ads
app.get('/api/ads', (req, res) => {
  res.json(data.ads);
});

// Add new ad
app.post('/api/ads', (req, res) => {
  const ad = {
    id: Date.now().toString(),
    name: req.body.name,
    platform: req.body.platform,
    type: req.body.type,
    createdAt: new Date().toISOString()
  };
  data.ads.push(ad);
  saveData();
  res.status(201).json(ad);
});

// Delete ad
app.delete('/api/ads/:id', (req, res) => {
  const index = data.ads.findIndex(ad => ad.id === req.params.id);
  if (index !== -1) {
    data.ads.splice(index, 1);
    // Also remove associated revenue entries
    data.revenue = data.revenue.filter(r => r.adId !== req.params.id);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Ad not found' });
  }
});

// Get all revenue entries
app.get('/api/revenue', (req, res) => {
  res.json(data.revenue);
});

// Add revenue entry
app.post('/api/revenue', (req, res) => {
  const revenue = {
    id: Date.now().toString(),
    adId: req.body.adId,
    amount: parseFloat(req.body.amount),
    impressions: parseInt(req.body.impressions),
    clicks: parseInt(req.body.clicks),
    date: req.body.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  data.revenue.push(revenue);
  saveData();
  res.status(201).json(revenue);
});

// Delete revenue entry
app.delete('/api/revenue/:id', (req, res) => {
  const index = data.revenue.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    data.revenue.splice(index, 1);
    saveData();
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Revenue entry not found' });
  }
});

// Get revenue statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalAds: data.ads.length,
    totalRevenue: data.revenue.reduce((sum, r) => sum + r.amount, 0),
    totalImpressions: data.revenue.reduce((sum, r) => sum + r.impressions, 0),
    totalClicks: data.revenue.reduce((sum, r) => sum + r.clicks, 0)
  };
  
  // Calculate by ad
  stats.byAd = data.ads.map(ad => {
    const adRevenue = data.revenue.filter(r => r.adId === ad.id);
    return {
      id: ad.id,
      name: ad.name,
      platform: ad.platform,
      type: ad.type,
      revenue: adRevenue.reduce((sum, r) => sum + r.amount, 0),
      impressions: adRevenue.reduce((sum, r) => sum + r.impressions, 0),
      clicks: adRevenue.reduce((sum, r) => sum + r.clicks, 0),
      ctr: adRevenue.reduce((sum, r) => sum + r.impressions, 0) > 0 
        ? (adRevenue.reduce((sum, r) => sum + r.clicks, 0) / adRevenue.reduce((sum, r) => sum + r.impressions, 0) * 100).toFixed(2)
        : 0
    };
  });
  
  res.json(stats);
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Ad Revenue Tracking Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;
