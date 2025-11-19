#!/bin/bash

# ================================================================
# AromaPulse Production Deployment Script
# ================================================================
# Purpose: 프로덕션 환경에 SNS & O2O 기능 배포
# Date: 2024-01-15
# ================================================================

set -e  # Exit on error

echo "🚀 AromaPulse Production Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Cloudflare authentication
echo -e "${BLUE}[1/4] Checking Cloudflare authentication...${NC}"
if ! npx wrangler whoami &>/dev/null; then
    echo -e "${RED}❌ Cloudflare authentication failed!${NC}"
    echo ""
    echo "Please set up your Cloudflare API key first:"
    echo "1. Go to Deploy tab in the sidebar"
    echo "2. Create API token in Cloudflare Dashboard"
    echo "3. Save the token in Deploy tab"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Step 2: Deploy database schema and sample data
echo -e "${BLUE}[2/4] Deploying database (schema + sample data)...${NC}"
echo "This will create tables and insert sample data to production database."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

npx wrangler d1 execute aromapulse-production --remote --file=./deploy_production.sql
echo -e "${GREEN}✅ Database deployed${NC}"
echo ""

# Step 3: Build application
echo -e "${BLUE}[3/4] Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}"
echo ""

# Step 4: Deploy to Cloudflare Pages
echo -e "${BLUE}[4/4] Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name aromapulse
echo -e "${GREEN}✅ Deployment completed${NC}"
echo ""

# Summary
echo "================================================================"
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "================================================================"
echo ""
echo "📊 Deployed Features:"
echo "  ✅ SNS Channel Tracking (Blog, Instagram, YouTube)"
echo "  ✅ O2O Conversion Analytics"
echo "  ✅ 5 New Dashboard Charts"
echo "  ✅ Sample Data (45 SNS visits + 29 O2O conversions)"
echo ""
echo "🌐 Access URLs:"
echo "  Production: https://www.aromapulse.kr"
echo "  Admin Dashboard: https://www.aromapulse.kr/static/admin-dashboard"
echo ""
echo "📝 Next Steps:"
echo "  1. Open admin dashboard"
echo "  2. Login with admin credentials"
echo "  3. Navigate to Dashboard tab"
echo "  4. Verify SNS & O2O charts display data"
echo ""
echo "================================================================"
