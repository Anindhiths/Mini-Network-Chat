#!/bin/bash

# Mini Network Chat - Vercel Deployment Script
# Automates the deployment process to Vercel

echo "🚀 Mini Network Chat - Vercel Deployment"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        print_error "Failed to install Vercel CLI"
        echo "Please install manually: npm install -g vercel"
        exit 1
    fi
    print_success "Vercel CLI installed"
else
    print_success "Vercel CLI found"
fi

# Verify project structure
print_info "Verifying project structure..."

required_files=(
    "public/index.html"
    "api/join.js"
    "api/message.js" 
    "api/messages.js"
    "api/send-message.js"  
    "vercel.json"
    "package.json"
)


for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        echo "Please ensure all Vercel files are created before deploying."
        exit 1
    fi
done

print_success "All required files found"

# Ask for deployment type
echo ""
echo "Choose deployment type:"
echo "1) Development deployment (preview)"
echo "2) Production deployment" 
echo "3) Local development server"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        print_info "Starting development deployment..."
        vercel
        if [ $? -eq 0 ]; then
            print_success "Development deployment completed!"
            echo "Your chat is available at the preview URL shown above."
        else
            print_error "Development deployment failed"
            exit 1
        fi
        ;;
    2)
        print_info "Starting production deployment..."
        vercel --prod
        if [ $? -eq 0 ]; then
            print_success "Production deployment completed!"
            echo "Your chat is live at the production URL shown above."
        else
            print_error "Production deployment failed"
            exit 1
        fi
        ;;
    3)
        print_info "Starting local development server..."
        print_info "This will start the chat at http://localhost:3000"
        vercel dev
        ;;
    *)
        print_error "Invalid choice. Please select 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
print_success "Deployment process completed!"
echo ""
echo "📚 Next Steps:"
echo "  • Test your chat by opening multiple browser tabs"
echo "  • Share the URL with others to test multi-user functionality"  
echo "  • Check Vercel dashboard for analytics and logs"
echo "  • Consider adding a database for message persistence"
echo ""
echo "📖 Documentation:"
echo "  • VERCEL_README.md - Deployment guide"
echo "  • Original README.md - WebSocket version"
echo ""
echo "🎯 Happy chatting!"
