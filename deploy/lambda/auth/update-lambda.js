#!/usr/bin/env node

/**
 * Lambda Authorizer Update Script (Node.js)
 * Cross-platform deployment script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  functionName: process.env.LAMBDA_FUNCTION_NAME || process.argv[2],
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-1_Sq3IYsy06',
  cognitoRegion: process.env.COGNITO_REGION || 'us-east-1',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
};

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
};

// Execute shell command
function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'inherit', ...options });
  } catch (error) {
    log.error(`Command failed: ${command}`);
    throw error;
  }
}

// Create zip file
function createZip(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      log.success(`Deployment package created: ${outputPath} (${size} MB)`);
      resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    // Add all files except .zip files
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['*.zip'],
    });

    archive.finalize();
  });
}

// Main deployment function
async function deploy() {
  console.log(`${colors.blue}================================================${colors.reset}`);
  console.log(`${colors.blue}  Lambda Authorizer Update Script${colors.reset}`);
  console.log(`${colors.blue}================================================${colors.reset}\n`);

  // Validate function name
  if (!CONFIG.functionName) {
    log.error('Lambda function name not provided');
    console.log('\nUsage:');
    console.log('  Method 1: Environment variable');
    console.log('    export LAMBDA_FUNCTION_NAME=your-auth-function-name');
    console.log('    node update-lambda.js');
    console.log('\n  Method 2: Command line argument');
    console.log('    node update-lambda.js your-auth-function-name');
    console.log('\n  Method 3: Auto-detect');
    console.log('    node update-lambda.js --auto-detect\n');
    process.exit(1);
  }

  // Auto-detect function name
  if (CONFIG.functionName === '--auto-detect') {
    log.info('Auto-detecting Lambda function name...');
    try {
      const result = execSync(
        `aws lambda list-functions --region ${CONFIG.awsRegion} --query "Functions[?contains(FunctionName, 'lambda_auth') || contains(FunctionName, 'auth')].FunctionName" --output text`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      CONFIG.functionName = result.trim().split('\t')[0];
      if (!CONFIG.functionName) {
        throw new Error('No function found');
      }
      log.success(`Detected function: ${CONFIG.functionName}`);
    } catch (error) {
      log.error('Could not auto-detect Lambda function name');
      process.exit(1);
    }
  }

  log.info('Configuration:');
  console.log(`  - Lambda Function: ${CONFIG.functionName}`);
  console.log(`  - Cognito User Pool: ${CONFIG.cognitoUserPoolId}`);
  console.log(`  - Cognito Region: ${CONFIG.cognitoRegion}`);
  console.log(`  - AWS Region: ${CONFIG.awsRegion}\n`);

  const scriptDir = __dirname;
  const buildDir = path.join(scriptDir, 'build');
  const zipFile = path.join(buildDir, 'lambda-auth.zip');

  try {
    // Step 1: Install dependencies
    log.info('Step 1: Installing Node.js dependencies...');
    if (!fs.existsSync(path.join(scriptDir, 'node_modules'))) {
      exec('npm install', { cwd: scriptDir });
      log.success('Dependencies installed');
    } else {
      log.info('Dependencies already installed');
    }
    console.log();

    // Step 2: Create build directory
    log.info('Step 2: Preparing build directory...');
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });
    log.success('Build directory ready');
    console.log();

    // Step 3: Copy files
    log.info('Step 3: Copying Lambda files...');
    fs.copyFileSync(path.join(scriptDir, 'index.js'), path.join(buildDir, 'index.js'));
    fs.copyFileSync(path.join(scriptDir, 'package.json'), path.join(buildDir, 'package.json'));
    log.success('Files copied');
    console.log();

    // Step 4: Install production dependencies
    log.info('Step 4: Installing production dependencies...');
    exec('npm install --production --no-package-lock', { cwd: buildDir, stdio: 'ignore' });
    log.success('Production dependencies installed');
    console.log();

    // Step 5: Create deployment package
    log.info('Step 5: Creating deployment package...');
    await createZip(buildDir, zipFile);
    console.log();

    // Step 6: Update Lambda function code
    log.info('Step 6: Updating Lambda function code...');
    exec(
      `aws lambda update-function-code --function-name ${CONFIG.functionName} --zip-file fileb://${zipFile} --region ${CONFIG.awsRegion} --no-cli-pager`,
      { stdio: 'ignore' }
    );
    log.success('Lambda function code updated');
    console.log();

    // Step 7: Update environment variables
    log.info('Step 7: Updating environment variables...');
    exec(
      `aws lambda update-function-configuration --function-name ${CONFIG.functionName} --environment "Variables={COGNITO_USER_POOL_ID=${CONFIG.cognitoUserPoolId},COGNITO_REGION=${CONFIG.cognitoRegion}}" --region ${CONFIG.awsRegion} --no-cli-pager`,
      { stdio: 'ignore' }
    );
    log.success('Environment variables updated');
    console.log();

    // Step 8: Wait for function to be active
    log.info('Step 8: Waiting for Lambda function to be active...');
    try {
      exec(
        `aws lambda wait function-updated --function-name ${CONFIG.functionName} --region ${CONFIG.awsRegion}`,
        { stdio: 'ignore' }
      );
      log.success('Lambda function is active');
    } catch (error) {
      log.warning('Timeout waiting for function to be active (it may still be updating)');
    }
    console.log();

    // Step 9: Get function info
    log.info('Step 9: Retrieving function information...');
    const info = JSON.parse(
      execSync(
        `aws lambda get-function-configuration --function-name ${CONFIG.functionName} --region ${CONFIG.awsRegion} --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}' --output json`,
        { encoding: 'utf8', stdio: 'pipe' }
      )
    );
    console.log(JSON.stringify(info, null, 2));
    console.log();

    // Step 10: Cleanup
    log.info('Step 10: Cleaning up...');
    fs.rmSync(buildDir, { recursive: true, force: true });
    log.success('Cleanup completed');
    console.log();

    // Summary
    console.log(`${colors.green}================================================${colors.reset}`);
    console.log(`${colors.green}  Deployment Successful! ✓${colors.reset}`);
    console.log(`${colors.green}================================================${colors.reset}\n`);

    console.log('Next steps:');
    console.log(`  1. Test the Lambda function:`);
    console.log(`     aws lambda invoke --function-name ${CONFIG.functionName} \\`);
    console.log(`       --payload file://test-event-example.json \\`);
    console.log(`       --region ${CONFIG.awsRegion} \\`);
    console.log(`       response.json\n`);
    console.log(`  2. Check CloudWatch logs:`);
    console.log(`     aws logs tail /aws/lambda/${CONFIG.functionName} --follow\n`);
    console.log(`  3. Test with API Gateway:`);
    console.log(`     curl -X GET https://your-api-gateway-url/prompt_hub \\`);
    console.log(`       -H "Authorization: Bearer <cognito-token>"\n`);
  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Check if archiver is installed
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'archiver'))) {
  log.warning('archiver module not found, installing...');
  exec('npm install archiver --save-dev', { cwd: __dirname });
}

// Run deployment
deploy().catch((error) => {
  log.error(error.message);
  process.exit(1);
});
