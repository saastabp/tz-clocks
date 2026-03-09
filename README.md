# Time Zone Clocks

A web application for displaying and synchronizing multiple time zones simultaneously. Designed for coordinating across global teams and managing international schedules.

## Features

- **11 Time Zones**: Hawaii, Alaska, US Pacific, Arizona, US Mountain, US Central, US Eastern, United Kingdom, Philippines, New Zealand, and South Africa
- **Manual Time Entry**: Click on any hour or minute field to type in a custom time - all other clocks automatically synchronize
- **DST Awareness**: Clock labels dynamically reflect each zone's current DST state (e.g., PST/PDT, GMT/BST, NZST/NZDT)
- **Time Format Toggle**: Switch between 12-hour and 24-hour time formats (preference saved across sessions)
- **AM/PM Toggle**: Quickly switch between AM and PM with a single button
- **Time Adjustment**: Increment/decrement all clocks simultaneously by 1 hour or 15 minutes
- **15-Minute Intervals**: All time adjustments automatically snap to 15-minute intervals (00, 15, 30, 45)
- **Real-time Updates**: Clocks update automatically every second when in live mode (auto-update pauses when editing)
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

- **Manual Time Entry**: Click on any hour or minute field and type a time - press Enter or click away to sync all clocks
- **Reset Clocks**: Click "Reset Clocks" to sync all clocks to current time and start live updates
- **Adjust Time**: Use +1/-1 Hour or +15/-15 Minutes buttons to adjust all clocks (automatically snaps to 15-minute intervals)
- **AM/PM Toggle**: Click "AM/PM ⇄" to quickly switch between morning and afternoon
- **Toggle Format**: Click "12/24 Hour Format" to switch between time formats
- **View Offsets**: Check the offset table (Standard Time or Daylight Time) to see hour differences from Hawaii

## How It Works

### Time Zone Management

The application uses JavaScript's `Intl.DateTimeFormat` API to handle time zone conversions accurately, accounting for:
- Daylight Saving Time transitions
- Different DST schedules in Northern vs Southern Hemisphere
- Time zones that don't observe DST (e.g., Arizona, Hawaii)

### DST Detection

Each time zone's DST status is determined independently by comparing its UTC offset in January, July, and the current date. If the January and July offsets differ, the zone observes DST. The current offset is then compared to determine whether the zone is currently in standard or daylight saving time. This works correctly for all hemispheres and DST schedules.

Clock labels automatically update to reflect the correct abbreviation (e.g., PST→PDT, GMT→BST, NZST→NZDT).

### Offset Table

A single dynamic offset table shows hour differences from the selected base timezone, calculated using actual current offsets.

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