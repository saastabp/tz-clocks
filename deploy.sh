#!/bin/bash

# Deployment script for Time Zone Clocks application
# Deploys to S3 and creates git tags
#
# Usage:
#   ./deploy.sh                    # Full deployment
#   ./deploy.sh --invalidate-only  # Only invalidate CloudFront cache

set -e  # Exit on error

# Configuration
S3_BUCKET="s3://clock.360balancedliving.com"
MAIN_BRANCH="main"

# Parse command-line arguments
INVALIDATE_ONLY=false
if [[ "$1" == "--invalidate-only" ]]; then
    INVALIDATE_ONLY=true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Update version in HTML file
update_html_version() {
    print_info "Updating version in index.html to $VERSION"

    # Use sed to replace the version in the HTML file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/$VERSION/g" index.html
    else
        # Linux
        sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/$VERSION/g" index.html
    fi

    print_success "Version updated in index.html"
}

# Update CHANGELOG with release date and version
update_changelog() {
    local release_date=$(date +%Y-%m-%d)
    local version_without_v="${VERSION#v}"  # Remove 'v' prefix for CHANGELOG

    print_info "Updating CHANGELOG.md with version $version_without_v and date: $release_date"

    # Replace [Unreleased] - RELEASE_DATE with [$VERSION] - $release_date
    # and add a new [Unreleased] section at the top
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/## \[Unreleased\] - RELEASE_DATE/## [Unreleased]\n\n## [$version_without_v] - $release_date/g" CHANGELOG.md
    else
        # Linux
        sed -i "s/## \[Unreleased\] - RELEASE_DATE/## [Unreleased]\n\n## [$version_without_v] - $release_date/g" CHANGELOG.md
    fi

    print_success "CHANGELOG.md updated with version $version_without_v"
}

# Get CloudFront distribution ID for the S3 bucket
get_cloudfront_distribution() {
    print_info "Looking up CloudFront distribution for bucket..."

    # Extract bucket name from S3_BUCKET
    local bucket_name=$(echo "$S3_BUCKET" | sed 's|s3://||')

    # Try multiple origin patterns:
    # 1. Standard S3 bucket: bucket-name.s3.amazonaws.com
    # 2. S3 website endpoint: bucket-name.s3-website-*.amazonaws.com

    # First try: Standard S3 bucket origin
    CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='${bucket_name}.s3.amazonaws.com']].Id | [0]" --output text 2>/dev/null)

    # Second try: S3 website endpoint (check if origin domain contains bucket name and s3-website)
    if [[ -z "$CLOUDFRONT_ID" || "$CLOUDFRONT_ID" == "None" ]]; then
        print_info "Trying S3 website endpoint pattern..."
        CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?contains(DomainName, '${bucket_name}') && contains(DomainName, 's3-website')]].Id | [0]" --output text 2>/dev/null)
    fi

    if [[ -z "$CLOUDFRONT_ID" || "$CLOUDFRONT_ID" == "None" ]]; then
        print_warning "No CloudFront distribution found for bucket: $bucket_name"
        print_info "Searched for: ${bucket_name}.s3.amazonaws.com and ${bucket_name}.s3-website-*.amazonaws.com"
        return 1
    fi

    print_success "Found CloudFront distribution: $CLOUDFRONT_ID"
    return 0
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    if ! get_cloudfront_distribution; then
        print_warning "Skipping CloudFront invalidation"
        return
    fi

    print_info "Creating CloudFront invalidation for distribution: $CLOUDFRONT_ID"

    read -p "Invalidate CloudFront cache? (Y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_warning "CloudFront invalidation skipped"
        return
    fi

    # Create invalidation for all paths
    local invalidation_output=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_ID" \
        --paths "/*" \
        --output json 2>&1)

    if [[ $? -eq 0 ]]; then
        local invalidation_id=$(echo "$invalidation_output" | grep -o '"Id": "[^"]*"' | head -1 | sed 's/"Id": "\(.*\)"/\1/')
        print_success "CloudFront invalidation created: $invalidation_id"
        print_info "Invalidation may take several minutes to complete"
    else
        print_error "Failed to create CloudFront invalidation"
        print_info "Error: $invalidation_output"
    fi
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        echo "Please install AWS CLI first:"
        echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git is installed"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository"
        exit 1
    fi
    print_success "Git repository detected"
}

# Check for uncommitted changes
check_uncommitted_changes() {
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes:"
        git status -s
        echo ""
        read -p "Do you want to continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deployment cancelled"
            exit 0
        fi
    else
        print_success "Working directory is clean"
    fi
}

# Get current branch
get_current_branch() {
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: $CURRENT_BRANCH"
}

# Check if on main branch
check_main_branch() {
    if [[ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]]; then
        print_warning "You are not on the '$MAIN_BRANCH' branch"
        print_info "Current branch: $CURRENT_BRANCH"
        echo ""
        echo "Version tags should only be created on the '$MAIN_BRANCH' branch."
        echo "Please merge your changes to '$MAIN_BRANCH' first."
        echo ""
        read -p "Do you want to continue tagging on '$CURRENT_BRANCH' anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Deployment cancelled"
            echo ""
            print_info "Suggested workflow:"
            echo "  1. Commit your changes on '$CURRENT_BRANCH'"
            echo "  2. git checkout $MAIN_BRANCH"
            echo "  3. git pull origin $MAIN_BRANCH"
            echo "  4. git merge $CURRENT_BRANCH"
            echo "  5. Run ./deploy.sh"
            exit 0
        fi
        print_warning "Proceeding with tag on non-main branch"
    else
        print_success "On main branch"
    fi
}

# Prompt for version number
get_version() {
    echo ""
    print_info "Current tags:"
    git tag -l | tail -5 || echo "  No tags found"
    echo ""

    # Get the latest tag and suggest next version
    latest_tag=$(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)

    if [[ -n "$latest_tag" ]]; then
        # Extract version numbers (remove 'v' prefix)
        version_no_v="${latest_tag#v}"

        # Split into major.minor.patch
        IFS='.' read -r major minor patch <<< "$version_no_v"

        # Increment patch version for suggestion
        suggested_patch=$((patch + 1))
        suggested_version="v${major}.${minor}.${suggested_patch}"

        print_info "Latest tag: $latest_tag"
        read -p "Enter version number [$suggested_version]: " VERSION

        # Use suggested version if user just pressed Enter
        if [[ -z "$VERSION" ]]; then
            VERSION="$suggested_version"
        fi
    else
        read -p "Enter version number (e.g., 1.0.0): " VERSION

        if [[ -z "$VERSION" ]]; then
            print_error "Version number is required"
            exit 1
        fi
    fi

    # Add 'v' prefix if not present
    if [[ ! "$VERSION" =~ ^v ]]; then
        VERSION="v$VERSION"
    fi

    # Check if tag already exists
    if git rev-parse "$VERSION" >/dev/null 2>&1; then
        print_error "Tag $VERSION already exists"
        exit 1
    fi

    print_success "Version set to: $VERSION"
}

# Create git tag
create_git_tag() {
    print_info "Creating git tag: $VERSION"

    read -p "Enter tag message (or press Enter for default): " TAG_MESSAGE

    if [[ -z "$TAG_MESSAGE" ]]; then
        TAG_MESSAGE="Release $VERSION"
    fi

    git tag -a "$VERSION" -m "$TAG_MESSAGE"
    print_success "Tag created: $VERSION"
}

# Push tag to remote
push_tag() {
    print_info "Pushing tag to remote..."

    read -p "Push tag to remote? (Y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_warning "Tag not pushed to remote"
        print_info "You can push it later with: git push origin $VERSION"
        return
    fi

    git push origin "$VERSION"
    print_success "Tag pushed to remote"
}

# Deploy to S3
deploy_to_s3() {
    print_info "Deploying to S3 bucket: $S3_BUCKET"

    read -p "Proceed with S3 deployment? (Y/n) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_warning "S3 deployment skipped"
        return
    fi

    # Test S3 access
    if ! aws s3 ls "$S3_BUCKET" > /dev/null 2>&1; then
        print_error "Cannot access S3 bucket: $S3_BUCKET"
        print_info "Please check your AWS credentials and bucket permissions"
        exit 1
    fi

    print_success "S3 bucket access verified"

    # Sync files to S3
    print_info "Syncing files to S3..."

    aws s3 sync . "$S3_BUCKET" \
        --exclude ".git/*" \
        --exclude ".idea/*" \
        --exclude ".gitignore" \
        --exclude "README.md" \
        --exclude "DEPLOYMENT.md" \
        --exclude "CLAUDE.md" \
        --exclude "deploy.sh" \
        --exclude "__pycache__/*" \
        --exclude "*.pyc" \
        --exclude ".env" \
        --exclude "venv/*" \
        --exclude "*.iml" \
        --delete

    print_success "Files synced to S3"

    # Set content types for specific files
    print_info "Setting content types..."

    # HTML files
    aws s3 cp "$S3_BUCKET/index.html" "$S3_BUCKET/index.html" \
        --content-type "text/html" \
        --metadata-directive REPLACE 2>/dev/null || true

    # CSS files
    for file in $(aws s3 ls "$S3_BUCKET/css/" --recursive | awk '{print $4}'); do
        if [[ $file == *.css ]]; then
            aws s3 cp "$S3_BUCKET/$file" "$S3_BUCKET/$file" \
                --content-type "text/css" \
                --metadata-directive REPLACE 2>/dev/null || true
        fi
    done

    # JavaScript files
    for file in $(aws s3 ls "$S3_BUCKET/js/" --recursive | awk '{print $4}'); do
        if [[ $file == *.js ]]; then
            aws s3 cp "$S3_BUCKET/$file" "$S3_BUCKET/$file" \
                --content-type "application/javascript" \
                --metadata-directive REPLACE 2>/dev/null || true
        fi
    done

    print_success "Content types set"
}

# Verify deployment
verify_deployment() {
    print_info "Verifying deployment..."

    echo ""
    print_info "Files in S3 bucket:"
    aws s3 ls "$S3_BUCKET" --recursive --human-readable | tail -10

    echo ""
    print_success "Deployment verification complete"
}

# Invalidation-only flow
invalidate_only() {
    print_header "CloudFront Cache Invalidation (Standalone)"

    # Check AWS CLI
    check_aws_cli

    # CloudFront Invalidation
    print_header "CloudFront Cache Invalidation"
    invalidate_cloudfront

    # Summary
    print_header "Invalidation Summary"
    print_success "S3 Bucket: $S3_BUCKET"
    if [[ -n "$CLOUDFRONT_ID" ]]; then
        print_success "CloudFront Distribution: $CLOUDFRONT_ID"
    fi

    echo ""
    print_info "Website URL: http://clock.360balancedliving.com"
    print_info "Cache invalidation may take 5-15 minutes to propagate"

    echo ""
    print_header "Invalidation Complete!"
}

# Main deployment flow
main() {
    print_header "Time Zone Clocks Deployment Script"

    # Pre-flight checks
    print_header "Pre-flight Checks"
    check_git
    check_git_repo
    check_aws_cli
    get_current_branch
    check_main_branch
    check_uncommitted_changes

    # Version and tagging
    print_header "Version Tagging"
    get_version

    # Update files with version
    print_header "Updating Files"
    update_html_version
    update_changelog

    # Commit version changes
    print_info "Committing version updates..."
    git add index.html CHANGELOG.md
    git commit -m "Release $VERSION" || print_warning "No changes to commit"

    create_git_tag
    push_tag

    # S3 Deployment
    print_header "S3 Deployment"
    deploy_to_s3
    verify_deployment

    # CloudFront Invalidation
    print_header "CloudFront Cache Invalidation"
    invalidate_cloudfront

    # Summary
    print_header "Deployment Summary"
    print_success "Version: $VERSION"
    print_success "Branch: $CURRENT_BRANCH"
    print_success "S3 Bucket: $S3_BUCKET"
    if [[ -n "$CLOUDFRONT_ID" ]]; then
        print_success "CloudFront Distribution: $CLOUDFRONT_ID"
    fi

    echo ""
    print_info "Website URL: http://clock.360balancedliving.com"
    print_info "Verify the deployment by visiting the URL above"

    echo ""
    print_header "Deployment Complete!"
}

# Run appropriate function based on arguments
if [[ "$INVALIDATE_ONLY" == true ]]; then
    invalidate_only
else
    main
fi