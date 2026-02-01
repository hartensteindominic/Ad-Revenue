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
  // Validate required fields
  if (!req.body.name || !req.body.platform || !req.body.type) {
    return res.status(400).json({ error: 'Missing required fields: name, platform, type' });
  }
  
  const ad = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: req.body.name.trim(),
    platform: req.body.platform.trim(),
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
  // Validate required fields
  if (!req.body.adId || req.body.amount == null || req.body.impressions == null || req.body.clicks == null) {
    return res.status(400).json({ error: 'Missing required fields: adId, amount, impressions, clicks' });
  }
  
  // Validate that adId exists
  const adExists = data.ads.some(ad => ad.id === req.body.adId);
  if (!adExists) {
    return res.status(404).json({ error: 'Ad not found' });
  }
  
  // Validate numeric values
  const amount = parseFloat(req.body.amount);
  const impressions = parseInt(req.body.impressions);
  const clicks = parseInt(req.body.clicks);
  
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ error: 'Invalid amount: must be a non-negative number' });
  }
  if (isNaN(impressions) || impressions < 0) {
    return res.status(400).json({ error: 'Invalid impressions: must be a non-negative integer' });
  }
  if (isNaN(clicks) || clicks < 0) {
    return res.status(400).json({ error: 'Invalid clicks: must be a non-negative integer' });
  }
  
  const revenue = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    adId: req.body.adId,
    amount: amount,
    impressions: impressions,
    clicks: clicks,
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
    const totals = adRevenue.reduce((acc, r) => {
      acc.revenue += r.amount;
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      return acc;
    }, { revenue: 0, impressions: 0, clicks: 0 });
    
    return {
      id: ad.id,
      name: ad.name,
      platform: ad.platform,
      type: ad.type,
      revenue: totals.revenue,
      impressions: totals.impressions,
      clicks: totals.clicks,
      ctr: totals.impressions > 0 
        ? (totals.clicks / totals.impressions * 100).toFixed(2)
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
