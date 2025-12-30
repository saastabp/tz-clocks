# Time Zone Clocks

A web application for displaying and synchronizing multiple time zones simultaneously. Designed for coordinating across global teams and managing international schedules.

## Features

- **11 Time Zones**: Hawaii, Alaska, US Pacific, Arizona, US Mountain, US Central, US Eastern, United Kingdom, Philippines, New Zealand, and South Africa
- **DST Awareness**: Automatically shows/hides Arizona clock and switches offset tables based on Daylight Saving Time
- **Time Format Toggle**: Switch between 12-hour and 24-hour time formats
- **Time Adjustment**: Increment/decrement all clocks simultaneously by 1 hour or 15 minutes
- **Real-time Updates**: Clocks update automatically every second when in live mode
- **Offset Tables**: Dynamic display of time zone offsets from Hawaii (base timezone)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- HTML5
- CSS3 (with responsive design)
- Vanilla JavaScript (ES6+)
- No build tools or dependencies required

## Project Structure

```
tz-clocks/
├── index.html          # Main HTML file
├── css/
│   └── clocks.css      # Stylesheet
├── js/
│   └── clocks.js       # Application logic
├── images/
│   ├── 360-bal-logo-no-text-transparent.png
│   └── clock.ico
├── README.md           # This file
├── CHANGELOG.md        # Version history
├── DEPLOYMENT.md       # Deployment instructions
└── deploy.sh           # Deployment script
```

## Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tz-clocks
   ```

2. Open `index.html` in a web browser:
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Node.js
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

### Usage

- **Reset Clocks**: Click "Reset Clocks" to sync all clocks to current time and start live updates
- **Adjust Time**: Use +/- buttons to adjust all clocks forward or backward
- **Toggle Format**: Click "12/24 Hour Format" to switch between time formats
- **View Offsets**: Check the offset table (Standard Time or Daylight Time) to see hour differences from Hawaii

## How It Works

### Time Zone Management

The application uses JavaScript's `Intl.DateTimeFormat` API to handle time zone conversions accurately, accounting for:
- Daylight Saving Time transitions
- Different DST schedules in Northern vs Southern Hemisphere
- Time zones that don't observe DST (e.g., Arizona, Hawaii)

### DST Detection

DST status is calculated based on US DST rules:
- Starts: Second Sunday in March at 2:00 AM
- Ends: First Sunday in November at 2:00 AM

When DST is active, the Arizona clock becomes visible (since Arizona doesn't observe DST, it aligns differently with other zones during summer).

### Offset Tables

Two offset tables are generated:
- **Standard Time**: Based on January 15 reference date
- **Daylight Time**: Based on July 15 reference date

All offsets are calculated relative to Hawaii (HST).

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with responsive design

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions to S3.

## Version History

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.

## License

Copyright 360 Balanced Living

## Contact

For issues or questions, please contact the development team.