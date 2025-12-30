# Deployment Guide

This document describes how to deploy the Time Zone Clocks application to the S3 bucket.

## Prerequisites

1. **AWS CLI**: Install and configure the AWS CLI
   ```bash
   # Install AWS CLI (if not already installed)
   # Linux/macOS
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS credentials
   aws configure
   ```

2. **AWS Credentials**: Ensure you have appropriate credentials configured with permissions for:
   - `s3:PutObject`
   - `s3:PutObjectAcl`
   - `s3:DeleteObject`
   - `s3:ListBucket`

3. **Git**: Ensure you have git installed and have push access to the remote repository

## Deployment Target

- **S3 Bucket**: `s3://clock.360balancedliving.com`
- **Access**: Public read access (configured at bucket level)
- **Website Hosting**: Should be enabled on the S3 bucket

## Recommended Workflow

The deployment script enforces best practices by ensuring tags are only created on the `main` branch:

1. **Work on feature branch**:
   ```bash
   git checkout -b feature-name
   # Make your changes
   git add .
   git commit -m "Description of changes"
   ```

2. **Test your changes** on the feature branch

3. **Merge to main**:
   ```bash
   git checkout main
   git pull origin main
   git merge feature-name
   ```

4. **Deploy from main**:
   ```bash
   ./deploy.sh
   ```

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

Use the included deployment script which handles tagging and deployment:

```bash
./deploy.sh
```

The script will:
1. Verify git and AWS CLI are installed
2. Check you're in a git repository
3. **Check current branch** (warns if not on `main`)
4. Check for uncommitted changes
5. Prompt for a version number (e.g., 1.2.0)
6. Create a git tag with optional message
7. Push tag to remote (with confirmation)
8. Sync files to S3 bucket (with confirmation)
9. Set proper content types for HTML, CSS, and JS files
10. Verify deployment

**Branch Protection**: The script will warn you if you're not on the `main` branch and provide the recommended workflow. You can override this, but tags should only be created on `main` after merging tested changes.

### Method 2: Manual Deployment

If you need to deploy manually:

1. **Ensure working directory is clean**:
   ```bash
   git status
   ```

2. **Create a git tag**:
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

3. **Deploy to S3**:
   ```bash
   aws s3 sync . s3://clock.360balancedliving.com \
     --exclude ".git/*" \
     --exclude ".idea/*" \
     --exclude ".gitignore" \
     --exclude "*.md" \
     --exclude "deploy.sh" \
     --delete
   ```

4. **Set proper content types** (if needed):
   ```bash
   # HTML files
   aws s3 cp s3://clock.360balancedliving.com/index.html \
     s3://clock.360balancedliving.com/index.html \
     --content-type "text/html" \
     --metadata-directive REPLACE

   # CSS files
   aws s3 cp s3://clock.360balancedliving.com/css/ \
     s3://clock.360balancedliving.com/css/ \
     --recursive \
     --exclude "*" \
     --include "*.css" \
     --content-type "text/css" \
     --metadata-directive REPLACE

   # JavaScript files
   aws s3 cp s3://clock.360balancedliving.com/js/ \
     s3://clock.360balancedliving.com/js/ \
     --recursive \
     --exclude "*" \
     --include "*.js" \
     --content-type "application/javascript" \
     --metadata-directive REPLACE
   ```

## Files Deployed

The following files and directories are deployed to S3:

```
index.html
css/
  └── clocks.css
js/
  └── clocks.js
images/
  ├── 360-bal-logo-no-text-transparent.png
  └── clock.ico
```

## Files Excluded from Deployment

The following are excluded from S3 deployment:
- `.git/` - Git repository data
- `.idea/` - IDE configuration
- `.gitignore` - Git ignore file
- `*.md` - Documentation files (README, CHANGELOG, DEPLOYMENT)
- `deploy.sh` - Deployment script
- `*.pyc`, `__pycache__/` - Python artifacts

## Post-Deployment Verification

After deployment, verify the application:

1. **Check S3 upload**:
   ```bash
   aws s3 ls s3://clock.360balancedliving.com --recursive
   ```

2. **Test the website**:
   - Navigate to: http://clock.360balancedliving.com (or https if SSL configured)
   - Verify all clocks display correctly
   - Test time adjustment buttons
   - Check 12/24 hour format toggle
   - Verify responsive design on mobile

3. **Check browser console** for any JavaScript errors

## Rollback Procedure

If you need to rollback to a previous version:

1. **List available versions (tags)**:
   ```bash
   git tag -l
   ```

2. **Checkout previous version**:
   ```bash
   git checkout v1.1.0
   ```

3. **Redeploy**:
   ```bash
   aws s3 sync . s3://clock.360balancedliving.com \
     --exclude ".git/*" \
     --exclude ".idea/*" \
     --exclude ".gitignore" \
     --exclude "*.md" \
     --exclude "deploy.sh" \
     --delete
   ```

4. **Return to main branch**:
   ```bash
   git checkout main
   ```

## Troubleshooting

### Issue: Script warns "You are not on the 'main' branch"

**Cause**: You're running `./deploy.sh` from a feature branch

**Solution**: This is expected behavior. The script prevents accidental tagging of feature branches. Follow the recommended workflow:
```bash
git checkout main
git pull origin main
git merge your-feature-branch
./deploy.sh
```

**Override** (not recommended): If you need to tag a non-main branch for testing, you can answer 'y' when prompted, but production tags should only be created on `main`.

### Issue: Access Denied Error

**Solution**: Check AWS credentials and S3 bucket permissions
```bash
aws s3 ls s3://clock.360balancedliving.com
```

### Issue: Files Not Updating

**Solution**: Clear CloudFront cache (if using CDN) or force browser refresh (Ctrl+Shift+R)

### Issue: Incorrect MIME Types

**Solution**: Use the `--content-type` flag when uploading specific file types (see Manual Deployment section)

### Issue: 404 Error

**Solution**: Ensure S3 bucket static website hosting is enabled and index document is set to `index.html`

## S3 Bucket Configuration

The S3 bucket should be configured with:

1. **Static Website Hosting**: Enabled
   - Index document: `index.html`
   - Error document: `index.html` (optional)

2. **Bucket Policy**: Allow public read access
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::clock.360balancedliving.com/*"
       }
     ]
   }
   ```

3. **CORS Configuration** (if needed for API calls):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

## CloudFront Integration (Optional)

If using CloudFront for CDN:

1. Create a CloudFront distribution pointing to the S3 bucket
2. Add invalidation to deployment script:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

## Security Considerations

- Keep AWS credentials secure and never commit them to the repository
- Review S3 bucket policies regularly
- Enable S3 bucket logging for audit trails
- Consider enabling versioning on the S3 bucket for easy rollbacks
- Use HTTPS (configure CloudFront with SSL certificate)

## Maintenance

- Review and update deployment procedures as needed
- Keep AWS CLI updated to the latest version
- Monitor S3 bucket usage and costs
- Regularly check for and remove unused/old deployments