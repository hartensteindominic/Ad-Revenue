// API base URL
const API_URL = '/api';

// Set today's date as default
document.getElementById('revenueDate').valueAsDate = new Date();

// Load initial data
loadData();

// Load all data
async function loadData() {
    await Promise.all([
        loadAds(),
        loadRevenue(),
        loadStats()
    ]);
}

// Load ads
async function loadAds() {
    try {
        const response = await fetch(`${API_URL}/ads`);
        const ads = await response.json();
        
        // Update ads list
        const adsList = document.getElementById('adsList');
        if (ads.length === 0) {
            adsList.innerHTML = '<div class="empty-state">No ads yet. Add your first ad above!</div>';
        } else {
            adsList.innerHTML = ads.map(ad => `
                <div class="item">
                    <div class="item-info">
                        <strong>${ad.name}</strong>
                        <span>Platform: ${ad.platform} | Type: ${ad.type}</span>
                    </div>
                    <button onclick="deleteAd('${ad.id}')" class="btn btn-danger">Delete</button>
                </div>
            `).join('');
        }
        
        // Update revenue ad selector
        const selector = document.getElementById('revenueAdId');
        selector.innerHTML = '<option value="">Select Ad</option>' + 
            ads.map(ad => `<option value="${ad.id}">${ad.name}</option>`).join('');
    } catch (err) {
        console.error('Error loading ads:', err);
    }
}

// Add new ad
async function addAd() {
    const name = document.getElementById('adName').value.trim();
    const platform = document.getElementById('adPlatform').value.trim();
    const type = document.getElementById('adType').value;
    
    if (!name || !platform) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/ads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, platform, type })
        });
        
        if (response.ok) {
            document.getElementById('adName').value = '';
            document.getElementById('adPlatform').value = '';
            document.getElementById('adType').value = 'banner';
            await loadData();
        }
    } catch (err) {
        console.error('Error adding ad:', err);
        alert('Failed to add ad');
    }
}

// Delete ad
async function deleteAd(id) {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    
    try {
        const response = await fetch(`${API_URL}/ads/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadData();
        }
    } catch (err) {
        console.error('Error deleting ad:', err);
        alert('Failed to delete ad');
    }
}

// Load revenue entries
async function loadRevenue() {
    try {
        const [revenueResponse, adsResponse] = await Promise.all([
            fetch(`${API_URL}/revenue`),
            fetch(`${API_URL}/ads`)
        ]);
        
        const revenue = await revenueResponse.json();
        const ads = await adsResponse.json();
        
        const revenueList = document.getElementById('revenueList');
        if (revenue.length === 0) {
            revenueList.innerHTML = '<div class="empty-state">No revenue entries yet. Track your first revenue above!</div>';
        } else {
            revenueList.innerHTML = revenue.map(r => {
                const ad = ads.find(a => a.id === r.adId);
                return `
                    <div class="item">
                        <div class="item-info">
                            <strong>${ad ? ad.name : 'Unknown Ad'}</strong>
                            <span>$${r.amount.toFixed(2)} | ${r.impressions} impressions | ${r.clicks} clicks | Date: ${r.date}</span>
                        </div>
                        <button onclick="deleteRevenue('${r.id}')" class="btn btn-danger">Delete</button>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error('Error loading revenue:', err);
    }
}

// Add revenue entry
async function addRevenue() {
    const adId = document.getElementById('revenueAdId').value;
    const amount = document.getElementById('revenueAmount').value;
    const impressions = document.getElementById('revenueImpressions').value;
    const clicks = document.getElementById('revenueClicks').value;
    const date = document.getElementById('revenueDate').value;
    
    if (!adId || !amount || !impressions || !clicks || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/revenue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId, amount, impressions, clicks, date })
        });
        
        if (response.ok) {
            document.getElementById('revenueAdId').value = '';
            document.getElementById('revenueAmount').value = '';
            document.getElementById('revenueImpressions').value = '';
            document.getElementById('revenueClicks').value = '';
            document.getElementById('revenueDate').valueAsDate = new Date();
            await loadData();
        }
    } catch (err) {
        console.error('Error adding revenue:', err);
        alert('Failed to add revenue');
    }
}

// Delete revenue entry
async function deleteRevenue(id) {
    if (!confirm('Are you sure you want to delete this revenue entry?')) return;
    
    try {
        const response = await fetch(`${API_URL}/revenue/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadData();
        }
    } catch (err) {
        console.error('Error deleting revenue:', err);
        alert('Failed to delete revenue');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        // Update summary stats
        document.getElementById('totalAds').textContent = stats.totalAds;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;
        document.getElementById('totalImpressions').textContent = stats.totalImpressions.toLocaleString();
        document.getElementById('totalClicks').textContent = stats.totalClicks.toLocaleString();
        
        // Update performance by ad
        const performanceList = document.getElementById('performanceList');
        if (stats.byAd.length === 0) {
            performanceList.innerHTML = '<div class="empty-state">Add ads and revenue to see performance metrics</div>';
        } else {
            performanceList.innerHTML = stats.byAd.map(ad => `
                <div class="performance-card">
                    <h3>${ad.name}</h3>
                    <div class="performance-metrics">
                        <div class="metric">
                            <div class="metric-label">Revenue</div>
                            <div class="metric-value">$${ad.revenue.toFixed(2)}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Impressions</div>
                            <div class="metric-value">${ad.impressions.toLocaleString()}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Clicks</div>
                            <div class="metric-value">${ad.clicks.toLocaleString()}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">CTR</div>
                            <div class="metric-value">${ad.ctr}%</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}
