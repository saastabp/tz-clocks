#!/bin/bash

# Deployment script for Time Zone Clocks application
# Deploys to S3 and creates git tags

set -e  # Exit on error

# Configuration
S3_BUCKET="s3://clock.360balancedliving.com"
MAIN_BRANCH="main"

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

    read -p "Enter version number (e.g., 1.2.0): " VERSION

    if [[ -z "$VERSION" ]]; then
        print_error "Version number is required"
        exit 1
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
        --exclude "*.md" \
        --exclude "deploy.sh" \
        --exclude "__pycache__/*" \
        --exclude "*.pyc" \
        --exclude ".env" \
        --exclude "venv/*" \
        --exclude "*.iml" \
        --delete \
        --acl public-read

    print_success "Files synced to S3"

    # Set content types for specific files
    print_info "Setting content types..."

    # HTML files
    aws s3 cp "$S3_BUCKET/index.html" "$S3_BUCKET/index.html" \
        --content-type "text/html" \
        --metadata-directive REPLACE \
        --acl public-read 2>/dev/null || true

    # CSS files
    for file in $(aws s3 ls "$S3_BUCKET/css/" --recursive | awk '{print $4}'); do
        if [[ $file == *.css ]]; then
            aws s3 cp "$S3_BUCKET/$file" "$S3_BUCKET/$file" \
                --content-type "text/css" \
                --metadata-directive REPLACE \
                --acl public-read 2>/dev/null || true
        fi
    done

    # JavaScript files
    for file in $(aws s3 ls "$S3_BUCKET/js/" --recursive | awk '{print $4}'); do
        if [[ $file == *.js ]]; then
            aws s3 cp "$S3_BUCKET/$file" "$S3_BUCKET/$file" \
                --content-type "application/javascript" \
                --metadata-directive REPLACE \
                --acl public-read 2>/dev/null || true
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
    create_git_tag
    push_tag

    # S3 Deployment
    print_header "S3 Deployment"
    deploy_to_s3
    verify_deployment

    # Summary
    print_header "Deployment Summary"
    print_success "Version: $VERSION"
    print_success "Branch: $CURRENT_BRANCH"
    print_success "S3 Bucket: $S3_BUCKET"

    echo ""
    print_info "Website URL: http://clock.360balancedliving.com"
    print_info "Verify the deployment by visiting the URL above"

    echo ""
    print_header "Deployment Complete!"
}

# Run main function
main