# Ad-Revenue 💰

A simple and intuitive web application for tracking and analyzing advertising revenue across different platforms and ad types.

## Features

- 📢 **Ad Management**: Add, view, and delete ads from different platforms (Google, Facebook, etc.)
- 💵 **Revenue Tracking**: Track daily revenue with impressions and clicks data
- 📊 **Performance Analytics**: View real-time statistics and CTR (Click-Through Rate) for each ad
- 💾 **Persistent Storage**: All data is saved locally in a JSON file
- 🎨 **Modern UI**: Clean and responsive interface that works on all devices

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hartensteindominic/Ad-Revenue.git
cd Ad-Revenue
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Adding an Ad
1. Enter the ad name, platform, and type
2. Click "Add Ad" button
3. The ad will appear in the "Manage Ads" section

### Tracking Revenue
1. Select an ad from the dropdown
2. Enter the revenue amount, impressions, and clicks
3. Select the date (defaults to today)
4. Click "Add Revenue" button
5. View the entry in the "Track Revenue" section

### Viewing Analytics
- See overall statistics in the dashboard cards at the top
- View performance metrics for each ad in the "Performance by Ad" section
- Monitor CTR (Click-Through Rate) to optimize ad performance

## API Endpoints

- `GET /api/ads` - Get all ads
- `POST /api/ads` - Create a new ad
- `DELETE /api/ads/:id` - Delete an ad
- `GET /api/revenue` - Get all revenue entries
- `POST /api/revenue` - Create a revenue entry
- `DELETE /api/revenue/:id` - Delete a revenue entry
- `GET /api/stats` - Get statistics and performance metrics

## Development

For development with auto-reload:
```bash
npm run dev
```

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: JSON file-based storage

## License

MIT
