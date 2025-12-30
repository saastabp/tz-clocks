# Claude Developer Guide

This document provides context for Claude Code sessions working on the Time Zone Clocks project.

## Project Overview

A static web application displaying synchronized clocks across 11 time zones. Built with vanilla HTML/CSS/JavaScript, deployed to S3 with CloudFront CDN.

**Live URL**: http://clock.360balancedliving.com

## Key Features

- 11 synchronized time zones (Hawaii, Alaska, US Pacific, Arizona, US Mountain, US Central, US Eastern, UK, Philippines, New Zealand, South Africa)
- Manual time entry with automatic synchronization across all clocks
- 12/24 hour format toggle
- AM/PM quick toggle
- Time adjustments in 1-hour or 15-minute increments (auto-snaps to 15-min intervals)
- DST-aware (shows/hides Arizona clock, switches offset tables)
- Real-time auto-update (pauses when manually editing)
- Clickable version display with changelog modal

## File Structure

```
tz-clocks/
├── index.html              # Main HTML (contains version number)
├── css/
│   └── clocks.css          # All styles including modal
├── js/
│   └── clocks.js           # Application logic + CHANGELOG object
├── images/
│   ├── 360-bal-logo-no-text-transparent.png
│   └── clock.ico
├── README.md               # User-facing documentation
├── CHANGELOG.md            # Version history (with placeholders)
├── DEPLOYMENT.md           # Deployment guide
├── deploy.sh               # Automated deployment script
└── CLAUDE.md               # This file
```

## Version System

### Version Display (index.html)

Located at line ~119:
```html
<div class="version-info">
    Courtesy of <a href="https://360balancedliving.com">360BalancedLiving.com</a> -
    <a href="#" id="version-link">v0.0.0</a>
</div>
```

- Shows as "Courtesy of 360BalancedLiving.com - v0.0.0"
- Version number starts as `v0.0.0` (placeholder)
- `deploy.sh` automatically updates this to actual version

### Changelog System

**CHANGELOG.md**:
- Single source of truth for all version history
- Uses `[Unreleased] - RELEASE_DATE` format for work-in-progress
- `deploy.sh` converts `[Unreleased]` → `[X.Y.Z]` and `RELEASE_DATE` → actual date
- Creates new empty `[Unreleased]` section after deployment
- **Deployed to S3** (not excluded like other .md files)

**js/clocks.js** (lines ~577-628):
```javascript
function parseChangelog(markdown) {
    // Parses CHANGELOG.md into structured data
    // Automatically handles version headers, sections, and bullet points
}
```

- Fetches CHANGELOG.md from server when modal opens
- Parses markdown dynamically (no hardcoded data)
- **No manual updates needed** - always in sync with CHANGELOG.md
- Skips `[Unreleased]` section, only shows released versions

## Deployment Workflow

### Pre-Deployment Checklist

1. **Update CHANGELOG.md**: Add changes under `[Unreleased] - RELEASE_DATE`
2. **Update js/clocks.js**: Add new version to CHANGELOG object
3. **Commit all changes**: Ensure working directory is clean
4. **Be on main branch**: Deploy only from main

### Running deploy.sh

```bash
./deploy.sh
```

**The script will**:
1. Check git/AWS CLI installation
2. Verify on main branch (warns if not)
3. Check for uncommitted changes
4. Show recent tags and suggest next version (e.g., v1.2.1)
5. **Auto-update index.html**: Replace `v0.0.0` → entered version
6. **Auto-update CHANGELOG.md**:
   - Replace `[Unreleased] - RELEASE_DATE` → `[1.2.1] - 2025-12-30`
   - Add new `[Unreleased]` section at top
7. Commit version updates
8. Create git tag
9. Push tag to remote
10. Deploy to S3 (excludes .git, .md files, deploy.sh)
11. Set proper content types (text/html, text/css, application/javascript)
12. **Auto-find CloudFront distribution** (queries AWS for distribution with S3 origin)
13. Invalidate CloudFront cache
14. Display summary

### Version Suggestion Logic

Script looks at latest tag and suggests next patch version:
- Latest tag: v1.2.0 → Suggests: v1.2.1
- User can override by typing different version
- Press Enter to accept suggestion

### CloudFront Integration

- Distribution ID is **not** hardcoded
- Script queries: `aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='bucket.s3.amazonaws.com']].Id"`
- Prompts to confirm invalidation
- Returns invalidation ID for tracking

## Important Patterns

### Version Number Format

- Git tags: `v1.2.3` (with 'v' prefix)
- CHANGELOG.md: `[1.2.3]` (without 'v' prefix)
- HTML/JS: `v1.2.3` (with 'v' prefix)
- Script handles conversion automatically

### File Editing by deploy.sh

**index.html**:
```bash
sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/$VERSION/g" index.html
```

**CHANGELOG.md**:
```bash
sed -i "s/## \[Unreleased\] - RELEASE_DATE/## [Unreleased]\n\n## [$version_without_v] - $release_date/g"
```

### Modal Changelog Display

When user clicks version number:
1. JavaScript reads version from `#version-link` element
2. Looks up version in CHANGELOG object
3. Populates modal with Added/Changed/Fixed sections
4. Shows modal overlay

## Common Tasks

### Adding a New Feature

1. Implement feature in code
2. Update CHANGELOG.md under `[Unreleased] - RELEASE_DATE`
3. Test locally
4. Commit changes
5. Before deploy: Add to CHANGELOG object in clocks.js

### Preparing a Release

1. Review all changes since last release
2. Ensure CHANGELOG.md [Unreleased] section is complete and accurate
3. Commit any final changes: `git add -A && git commit -m "Prepare for release"`
4. Run: `./deploy.sh`
5. Enter version or press Enter to accept suggestion
6. Follow prompts

**That's it!** No need to update JavaScript - the changelog modal fetches CHANGELOG.md automatically.

### Emergency Rollback

```bash
# List tags
git tag -l

# Checkout previous version
git checkout v1.2.0

# Redeploy manually
aws s3 sync . s3://clock.360balancedliving.com \
  --exclude ".git/*" --exclude "*.md" --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <ID> --paths "/*"

# Return to main
git checkout main
```

## AWS Resources

- **S3 Bucket**: clock.360balancedliving.com
- **CloudFront**: Auto-detected (currently: EOWY15U305R87)
- **Region**: Configured in AWS CLI

## Testing Locally

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server

# Then visit http://localhost:8000
```

## Git Workflow

- **Main branch**: Production-ready code
- **Feature branches**: Development work
- **Tags**: Mark releases (v1.2.0, v1.2.1, etc.)
- **Commits on deploy**: Automated "Release vX.Y.Z" commits

## Troubleshooting

### deploy.sh says "Tag already exists"
- Script prevents duplicate tags
- Either use different version or delete existing tag: `git tag -d v1.2.1`

### CloudFront not found
- Script queries for distribution with S3 bucket as origin
- Check AWS credentials and distribution configuration
- Can skip invalidation if needed

### Version not updating on website
- Check browser cache (Ctrl+Shift+R)
- Wait for CloudFront invalidation (5-15 minutes)
- Verify files uploaded: `aws s3 ls s3://clock.360balancedliving.com`

### Changelog modal shows "No changelog available"
- Ensure version key in CHANGELOG object matches HTML exactly
- Check browser console for JavaScript errors

## Code Conventions

- **No build tools**: Pure vanilla JS, no transpilation
- **ES6+ syntax**: Modern JavaScript features OK
- **No external dependencies**: Self-contained application
- **Comments**: Use sparingly, code should be self-documenting
- **Formatting**: Consistent indentation, clear variable names

## Future Enhancements

Consider documenting if implemented:
- GitHub Actions for automated deployment
- Automated CHANGELOG object update from CHANGELOG.md
- Multiple changelog version support in modal
- Version history viewer
- Analytics integration

## Notes for Claude

- Always read this file first when resuming work on this project
- Version numbers are critical - triple-check format (v1.2.3 vs 1.2.3)
- Test deploy.sh changes carefully - it modifies files automatically
- CHANGELOG.md uses semantic versioning and Keep a Changelog format
- User prefers minimal dependencies and simple solutions
- S3 deployment excludes .md files - changelog only accessible via modal