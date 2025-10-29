#!/bin/bash

# Lambda Authorizer Update Script
# This script packages and deploys the auth Lambda function without redeploying the entire CDK stack

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAMBDA_FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-us-east-1_Sq3IYsy06}"
COGNITO_REGION="${COGNITO_REGION:-us-east-1}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="$SCRIPT_DIR/build"
ZIP_FILE="$BUILD_DIR/lambda-auth.zip"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Lambda Authorizer Update Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print colored messages
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

# Check if Lambda function name is provided
if [ -z "$LAMBDA_FUNCTION_NAME" ]; then
    print_error "Lambda function name not provided"
    echo ""
    echo "Usage:"
    echo "  Method 1: Set environment variable"
    echo "    export LAMBDA_FUNCTION_NAME=your-auth-function-name"
    echo "    ./update-lambda.sh"
    echo ""
    echo "  Method 2: Use inline"
    echo "    LAMBDA_FUNCTION_NAME=your-auth-function-name ./update-lambda.sh"
    echo ""
    echo "  Method 3: Find function name automatically (requires AWS CLI)"
    echo "    ./update-lambda.sh --auto-detect"
    echo ""
    exit 1
fi

# Auto-detect function name if requested
if [ "$1" == "--auto-detect" ]; then
    print_info "Auto-detecting Lambda function name..."
    LAMBDA_FUNCTION_NAME=$(aws lambda list-functions \
        --region "$AWS_REGION" \
        --query "Functions[?contains(FunctionName, 'lambda_auth') || contains(FunctionName, 'auth')].FunctionName" \
        --output text | head -1)

    if [ -z "$LAMBDA_FUNCTION_NAME" ]; then
        print_error "Could not auto-detect Lambda function name"
        exit 1
    fi
    print_success "Detected function: $LAMBDA_FUNCTION_NAME"
fi

print_info "Configuration:"
echo "  - Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "  - Cognito User Pool: $COGNITO_USER_POOL_ID"
echo "  - Cognito Region: $COGNITO_REGION"
echo "  - AWS Region: $AWS_REGION"
echo ""

# Step 1: Install dependencies
print_info "Step 1: Installing Node.js dependencies..."
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    npm install
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed (use 'npm install' to update)"
fi
echo ""

# Step 2: Create build directory
print_info "Step 2: Preparing build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
print_success "Build directory ready"
echo ""

# Step 3: Copy files
print_info "Step 3: Copying Lambda files..."
cp "$SCRIPT_DIR/index.js" "$BUILD_DIR/"
cp "$SCRIPT_DIR/package.json" "$BUILD_DIR/"
print_success "Files copied"
echo ""

# Step 4: Install production dependencies
print_info "Step 4: Installing production dependencies..."
cd "$BUILD_DIR"
npm install --production --no-package-lock
print_success "Production dependencies installed"
echo ""

# Step 5: Create deployment package
print_info "Step 5: Creating deployment package..."
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . -x "*.zip" > /dev/null
PACKAGE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
print_success "Deployment package created: $ZIP_FILE ($PACKAGE_SIZE)"
echo ""

# Step 6: Update Lambda function code
print_info "Step 6: Updating Lambda function code..."
aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

if [ $? -eq 0 ]; then
    print_success "Lambda function code updated"
else
    print_error "Failed to update Lambda function code"
    exit 1
fi
echo ""

# Step 7: Update environment variables
print_info "Step 7: Updating environment variables..."
aws lambda update-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --environment "Variables={COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID,COGNITO_REGION=$COGNITO_REGION}" \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

if [ $? -eq 0 ]; then
    print_success "Environment variables updated"
else
    print_error "Failed to update environment variables"
    exit 1
fi
echo ""

# Step 8: Wait for Lambda to be active
print_info "Step 8: Waiting for Lambda function to be active..."
aws lambda wait function-updated \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    print_success "Lambda function is active"
else
    print_warning "Timeout waiting for function to be active (it may still be updating)"
fi
echo ""

# Step 9: Get function info
print_info "Step 9: Retrieving function information..."
FUNCTION_INFO=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION" \
    --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' \
    --output json)

echo "$FUNCTION_INFO" | jq '.'
echo ""

# Step 10: Cleanup
print_info "Step 10: Cleaning up..."
cd "$SCRIPT_DIR"
rm -rf "$BUILD_DIR"
print_success "Cleanup completed"
echo ""

# Summary
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Deployment Successful! ✓${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the Lambda function:"
echo "     aws lambda invoke --function-name $LAMBDA_FUNCTION_NAME \\"
echo "       --payload file://test-event-example.json \\"
echo "       --region $AWS_REGION \\"
echo "       response.json"
echo ""
echo "  2. Check CloudWatch logs:"
echo "     aws logs tail /aws/lambda/$LAMBDA_FUNCTION_NAME --follow"
echo ""
echo "  3. Test with API Gateway:"
echo "     curl -X GET https://your-api-gateway-url/prompt_hub \\"
echo "       -H \"Authorization: Bearer <cognito-token>\""
echo ""

exit 0
