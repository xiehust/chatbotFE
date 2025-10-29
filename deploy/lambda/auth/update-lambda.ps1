# Lambda Authorizer Update Script (PowerShell)
# This script packages and deploys the auth Lambda function without redeploying the entire CDK stack

param(
    [Parameter(Mandatory=$false)]
    [string]$FunctionName = $env:LAMBDA_FUNCTION_NAME,

    [Parameter(Mandatory=$false)]
    [string]$CognitoUserPoolId = $env:COGNITO_USER_POOL_ID,

    [Parameter(Mandatory=$false)]
    [string]$CognitoRegion = $env:COGNITO_REGION,

    [Parameter(Mandatory=$false)]
    [string]$AwsRegion = $env:AWS_REGION,

    [Parameter(Mandatory=$false)]
    [switch]$AutoDetect
)

# Set defaults
if (-not $CognitoUserPoolId) { $CognitoUserPoolId = "us-east-1_Sq3IYsy06" }
if (-not $CognitoRegion) { $CognitoRegion = "us-east-1" }
if (-not $AwsRegion) { $AwsRegion = "us-east-1" }

# Colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Header
Write-ColorOutput "================================================" $InfoColor
Write-ColorOutput "  Lambda Authorizer Update Script" $InfoColor
Write-ColorOutput "================================================" $InfoColor
Write-Host ""

# Auto-detect function name if requested
if ($AutoDetect) {
    Write-ColorOutput "[INFO] Auto-detecting Lambda function name..." $InfoColor
    $detectedFunctions = aws lambda list-functions `
        --region $AwsRegion `
        --query "Functions[?contains(FunctionName, 'lambda_auth') || contains(FunctionName, 'auth')].FunctionName" `
        --output text

    if ($detectedFunctions) {
        $FunctionName = ($detectedFunctions -split "`t")[0]
        Write-ColorOutput "[SUCCESS] Detected function: $FunctionName" $SuccessColor
    } else {
        Write-ColorOutput "[ERROR] Could not auto-detect Lambda function name" $ErrorColor
        exit 1
    }
}

# Check if function name is provided
if (-not $FunctionName) {
    Write-ColorOutput "[ERROR] Lambda function name not provided" $ErrorColor
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  Method 1: Set environment variable"
    Write-Host "    `$env:LAMBDA_FUNCTION_NAME = 'your-auth-function-name'"
    Write-Host "    .\update-lambda.ps1"
    Write-Host ""
    Write-Host "  Method 2: Use parameter"
    Write-Host "    .\update-lambda.ps1 -FunctionName your-auth-function-name"
    Write-Host ""
    Write-Host "  Method 3: Auto-detect"
    Write-Host "    .\update-lambda.ps1 -AutoDetect"
    Write-Host ""
    exit 1
}

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildDir = Join-Path $ScriptDir "build"
$ZipFile = Join-Path $BuildDir "lambda-auth.zip"

Write-ColorOutput "[INFO] Configuration:" $InfoColor
Write-Host "  - Lambda Function: $FunctionName"
Write-Host "  - Cognito User Pool: $CognitoUserPoolId"
Write-Host "  - Cognito Region: $CognitoRegion"
Write-Host "  - AWS Region: $AwsRegion"
Write-Host ""

# Step 1: Install dependencies
Write-ColorOutput "[INFO] Step 1: Installing Node.js dependencies..." $InfoColor
$nodeModulesPath = Join-Path $ScriptDir "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    npm install
    Write-ColorOutput "[SUCCESS] Dependencies installed" $SuccessColor
} else {
    Write-ColorOutput "[INFO] Dependencies already installed (use 'npm install' to update)" $InfoColor
}
Write-Host ""

# Step 2: Create build directory
Write-ColorOutput "[INFO] Step 2: Preparing build directory..." $InfoColor
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
New-Item -ItemType Directory -Path $BuildDir | Out-Null
Write-ColorOutput "[SUCCESS] Build directory ready" $SuccessColor
Write-Host ""

# Step 3: Copy files
Write-ColorOutput "[INFO] Step 3: Copying Lambda files..." $InfoColor
Copy-Item (Join-Path $ScriptDir "index.js") $BuildDir
Copy-Item (Join-Path $ScriptDir "package.json") $BuildDir
Write-ColorOutput "[SUCCESS] Files copied" $SuccessColor
Write-Host ""

# Step 4: Install production dependencies
Write-ColorOutput "[INFO] Step 4: Installing production dependencies..." $InfoColor
Push-Location $BuildDir
npm install --production --no-package-lock
Pop-Location
Write-ColorOutput "[SUCCESS] Production dependencies installed" $SuccessColor
Write-Host ""

# Step 5: Create deployment package
Write-ColorOutput "[INFO] Step 5: Creating deployment package..." $InfoColor
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile
}

# Use PowerShell's Compress-Archive
$files = Get-ChildItem -Path $BuildDir -Recurse | Where-Object { $_.Extension -ne ".zip" }
Compress-Archive -Path $files.FullName -DestinationPath $ZipFile -Force
$packageSize = (Get-Item $ZipFile).Length / 1MB
Write-ColorOutput "[SUCCESS] Deployment package created: $ZipFile ($([math]::Round($packageSize, 2)) MB)" $SuccessColor
Write-Host ""

# Step 6: Update Lambda function code
Write-ColorOutput "[INFO] Step 6: Updating Lambda function code..." $InfoColor
try {
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$ZipFile" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    Write-ColorOutput "[SUCCESS] Lambda function code updated" $SuccessColor
} catch {
    Write-ColorOutput "[ERROR] Failed to update Lambda function code: $_" $ErrorColor
    exit 1
}
Write-Host ""

# Step 7: Update environment variables
Write-ColorOutput "[INFO] Step 7: Updating environment variables..." $InfoColor
try {
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment "Variables={COGNITO_USER_POOL_ID=$CognitoUserPoolId,COGNITO_REGION=$CognitoRegion}" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    Write-ColorOutput "[SUCCESS] Environment variables updated" $SuccessColor
} catch {
    Write-ColorOutput "[ERROR] Failed to update environment variables: $_" $ErrorColor
    exit 1
}
Write-Host ""

# Step 8: Wait for Lambda to be active
Write-ColorOutput "[INFO] Step 8: Waiting for Lambda function to be active..." $InfoColor
try {
    aws lambda wait function-updated `
        --function-name $FunctionName `
        --region $AwsRegion
    Write-ColorOutput "[SUCCESS] Lambda function is active" $SuccessColor
} catch {
    Write-ColorOutput "[WARNING] Timeout waiting for function to be active (it may still be updating)" $WarningColor
}
Write-Host ""

# Step 9: Get function info
Write-ColorOutput "[INFO] Step 9: Retrieving function information..." $InfoColor
$functionInfo = aws lambda get-function-configuration `
    --function-name $FunctionName `
    --region $AwsRegion `
    --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' `
    --output json | ConvertFrom-Json

Write-Host "Runtime: $($functionInfo.Runtime)"
Write-Host "Memory Size: $($functionInfo.MemorySize) MB"
Write-Host "Timeout: $($functionInfo.Timeout) seconds"
Write-Host "Last Modified: $($functionInfo.LastModified)"
Write-Host ""

# Step 10: Cleanup
Write-ColorOutput "[INFO] Step 10: Cleaning up..." $InfoColor
Remove-Item -Recurse -Force $BuildDir
Write-ColorOutput "[SUCCESS] Cleanup completed" $SuccessColor
Write-Host ""

# Summary
Write-ColorOutput "================================================" $SuccessColor
Write-ColorOutput "  Deployment Successful! ✓" $SuccessColor
Write-ColorOutput "================================================" $SuccessColor
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Test the Lambda function:"
Write-Host "     aws lambda invoke --function-name $FunctionName \"
Write-Host "       --payload file://test-event-example.json \"
Write-Host "       --region $AwsRegion \"
Write-Host "       response.json"
Write-Host ""
Write-Host "  2. Check CloudWatch logs:"
Write-Host "     aws logs tail /aws/lambda/$FunctionName --follow"
Write-Host ""
Write-Host "  3. Test with API Gateway:"
Write-Host "     curl -X GET https://your-api-gateway-url/prompt_hub \"
Write-Host "       -H `"Authorization: Bearer <cognito-token>`""
Write-Host ""
