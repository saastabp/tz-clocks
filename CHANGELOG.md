# Changelog

All notable changes to the Time Zone Clocks project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2025-12-30

### Added
- `--invalidate-only` option for deploy.sh to invalidate CloudFront cache without full deployment
- CHANGELOG.md now deployed to S3 and fetched dynamically by version modal

### Changed
- Changelog modal now fetches and parses CHANGELOG.md from server (single source of truth)
- Removed hardcoded JavaScript CHANGELOG object (no longer needed)
- CloudFront distribution lookup now supports both standard S3 and S3 website endpoint origins
- deploy.sh now uploads CHANGELOG.md to S3 (only excludes README.md, DEPLOYMENT.md, CLAUDE.md)

### Fixed
- CloudFront distribution lookup now correctly finds distributions using S3 website endpoints

### Removed
- JavaScript CHANGELOG object (replaced with dynamic markdown parsing)

## [1.2.1] - 2025-12-30

### Added
- Version display in lower left corner showing "Courtesy of 360BalancedLiving.com - version"
- Clickable version number that displays changelog in a modal popup
- Link to 360BalancedLiving.com website from version display
- CloudFront cache invalidation in deployment script
- Automatic CloudFront distribution lookup based on S3 bucket origin

### Changed
- Deployment script now automatically updates version in index.html
- Deployment script now automatically updates CHANGELOG.md with release date
- Enhanced deployment script to commit version changes before tagging
- Deployment script now suggests next version number based on latest tag

### Notes
- When preparing a release, update the CHANGELOG object in js/clocks.js with the new version's changes before running deploy.sh

## [1.2.0] - 2025-12-30

### Added
- **Manual time entry**: Users can now click on hour/minute fields and type in custom times
- Enter key support for time input fields (blur and sync on Enter)
- AM/PM toggle button for quick switching between morning/afternoon
- Automatic synchronization when manually editing any clock
- Auto-update pause when user manually edits time
- Project documentation (README.md, CHANGELOG.md, DEPLOYMENT.md)
- Automated deployment script with git tagging

### Changed
- Made offset table dynamic to show different values for Standard vs Daylight time
- Reorganized files into cleaner directory structure
- Updated Arizona offset calculation from Hawaii
- Removed spinner arrows from number inputs for cleaner interface

### Fixed
- Fixed AM/PM display issues in 12-hour format

## [1.1.0] - 2025-11-28

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