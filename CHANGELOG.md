# Changelog

All notable changes to the Time Zone Clocks project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project documentation (README.md, CHANGELOG.md, DEPLOYMENT.md)
- Automated deployment script with git tagging

### Changed
- Made offset table dynamic to show different values for Standard vs Daylight time
- Reorganized files into cleaner directory structure
- Updated Arizona offset calculation from Hawaii

### Fixed
- Fixed AM/PM display issues in 12-hour format

## [1.1.0] - 2024-XX-XX

### Added
- South Africa time zone (SAST)
- Dynamic offset tables for Standard and Daylight Saving Time
- DST-aware Arizona clock visibility toggle

### Changed
- Improved offset calculations for accuracy across DST transitions
- Enhanced responsive design for mobile devices

### Fixed
- Time zone offset calculations for international zones
- DST detection and display logic

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Multiple time zone display (Hawaii, Alaska, US Pacific, US Mountain, US Central, US Eastern, UK, Philippines, New Zealand)
- Real-time clock updates
- 12/24 hour format toggle
- Time adjustment controls (+/- 1 hour, +/- 15 minutes)
- Offset table showing hour differences from Hawaii
- Responsive design for mobile and desktop
- Background logo from 360 Balanced Living

### Features
- Auto-update mode for real-time synchronization
- Manual time adjustment with 15-minute interval snapping
- DST awareness for US time zones
- Clean, modern UI with semi-transparent containers

---

## Version History Notes

### Version Numbering
- **Major** (X.0.0): Breaking changes or significant feature additions
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, minor improvements

### Deployment
Each version should be tagged in git and deployed to S3 using the deployment script:
```bash
./deploy.sh
```

### Maintenance
- Review and update this changelog with each release
- Use git tags to mark release points
- Follow semantic versioning principles