# Lambda Authorizer 部署脚本使用指南

本目录包含三个部署脚本，用于单独更新 Lambda authorizer 函数，无需重新部署整个 CDK stack。

## 📁 可用脚本

| 脚本 | 平台 | 说明 |
|------|------|------|
| `update-lambda.sh` | Linux/macOS | Bash 脚本 |
| `update-lambda.ps1` | Windows | PowerShell 脚本 |
| `update-lambda.js` | 跨平台 | Node.js 脚本（推荐）✅ |

## 🚀 快速开始

### 推荐方式：使用 Node.js 脚本

```bash
# 设置 Lambda 函数名
export LAMBDA_FUNCTION_NAME=your-auth-function-name

# 运行部署
npm run deploy

# 或者自动检测函数名
npm run deploy:auto
```

### 方式 1：Bash 脚本（Linux/macOS）

```bash
cd deploy/lambda/auth

# 方法 1: 使用环境变量
export LAMBDA_FUNCTION_NAME=your-auth-function-name
./update-lambda.sh

# 方法 2: 自动检测
./update-lambda.sh --auto-detect
```

### 方式 2：PowerShell 脚本（Windows）

```powershell
cd deploy\lambda\auth

# 方法 1: 使用参数
.\update-lambda.ps1 -FunctionName your-auth-function-name

# 方法 2: 自动检测
.\update-lambda.ps1 -AutoDetect
```

### 方式 3：Node.js 脚本（推荐，跨平台）

```bash
cd deploy/lambda/auth

# 方法 1: 使用环境变量
export LAMBDA_FUNCTION_NAME=your-auth-function-name
node update-lambda.js

# 方法 2: 命令行参数
node update-lambda.js your-auth-function-name

# 方法 3: 自动检测
node update-lambda.js --auto-detect
```

## 🔍 如何找到 Lambda 函数名

### 方法 1: AWS Console

1. 打开 AWS Lambda Console
2. 搜索包含 "auth" 或 "lambda_auth" 的函数
3. 复制函数名

### 方法 2: AWS CLI

```bash
aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'auth')].FunctionName" \
  --output table
```

### 方法 3: 自动检测（脚本内置）

所有脚本都支持 `--auto-detect` 参数，会自动查找包含 "auth" 的 Lambda 函数。

## ⚙️ 配置选项

### 环境变量

所有脚本支持以下环境变量：

```bash
# 必需
export LAMBDA_FUNCTION_NAME=your-auth-function-name

# 可选（有默认值）
export COGNITO_USER_POOL_ID=us-east-1_Sq3IYsy06
export COGNITO_REGION=us-east-1
export AWS_REGION=us-east-1
```

### Node.js 脚本参数

```bash
# 基本用法
node update-lambda.js <function-name>

# 使用环境变量
export LAMBDA_FUNCTION_NAME=my-function
node update-lambda.js

# 自动检测
node update-lambda.js --auto-detect
```

### PowerShell 脚本参数

```powershell
.\update-lambda.ps1 `
  -FunctionName your-auth-function-name `
  -CognitoUserPoolId us-east-1_Sq3IYsy06 `
  -CognitoRegion us-east-1 `
  -AwsRegion us-east-1
```

### Bash 脚本环境变量

```bash
LAMBDA_FUNCTION_NAME=my-function \
COGNITO_USER_POOL_ID=us-east-1_Sq3IYsy06 \
COGNITO_REGION=us-east-1 \
AWS_REGION=us-east-1 \
./update-lambda.sh
```

## 📋 部署步骤说明

每个脚本执行以下步骤：

1. **安装依赖** - 安装 Node.js 依赖包
2. **准备构建目录** - 创建临时构建目录
3. **复制文件** - 复制 Lambda 代码
4. **安装生产依赖** - 仅安装生产环境依赖
5. **创建部署包** - 打包成 ZIP 文件
6. **更新函数代码** - 上传新代码到 Lambda
7. **更新环境变量** - 设置 Cognito 配置
8. **等待激活** - 等待 Lambda 更新完成
9. **获取函数信息** - 显示函数配置
10. **清理** - 删除临时文件

## ✅ 成功部署后

部署成功后，脚本会显示：

```
================================================
  Deployment Successful! ✓
================================================

Next steps:
  1. Test the Lambda function:
     aws lambda invoke --function-name your-function ...

  2. Check CloudWatch logs:
     aws logs tail /aws/lambda/your-function --follow

  3. Test with API Gateway:
     curl -X GET https://your-api.com/endpoint ...
```

## 🧪 测试部署

### 1. 测试 Lambda 函数

```bash
aws lambda invoke \
  --function-name your-auth-function-name \
  --payload file://test-event-example.json \
  --region us-east-1 \
  response.json

# 查看响应
cat response.json | jq '.'
```

### 2. 查看 CloudWatch 日志

```bash
aws logs tail /aws/lambda/your-auth-function-name --follow
```

### 3. 测试 API Gateway

```bash
# 获取 Cognito token（通过登录）
TOKEN="your-cognito-access-token"

# 测试 API 调用
curl -X GET https://your-api-gateway-url/prompt_hub \
  -H "Authorization: Bearer $TOKEN" \
  -v
```

## 🐛 故障排除

### 问题 1: "Command not found: npm"

**解决方案**：安装 Node.js
```bash
# Ubuntu/Debian
sudo apt-get install nodejs npm

# macOS
brew install node

# Windows
# 从 nodejs.org 下载安装包
```

### 问题 2: "Permission denied"

**解决方案（Linux/macOS）**：
```bash
chmod +x update-lambda.sh
./update-lambda.sh
```

### 问题 3: "Access Denied" 更新 Lambda

**原因**：AWS 凭证不足

**解决方案**：
```bash
# 配置 AWS 凭证
aws configure

# 或使用环境变量
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

### 问题 4: "Function not found"

**原因**：Lambda 函数名错误

**解决方案**：
```bash
# 列出所有函数
aws lambda list-functions --query "Functions[].FunctionName"

# 使用正确的函数名
export LAMBDA_FUNCTION_NAME=correct-function-name
```

### 问题 5: ZIP 文件太大

**原因**：包含了不必要的文件

**解决方案**：
- 删除 `node_modules` 后重新安装
- 确保使用 `--production` 标志安装依赖
- 检查 `.npmrc` 配置

### 问题 6: "archiver module not found"

**原因**：Node.js 脚本缺少 archiver 依赖

**解决方案**：
```bash
npm install archiver --save-dev
```

## 🔧 高级用法

### 批量部署到多个环境

```bash
#!/bin/bash
# deploy-all-envs.sh

environments=("dev" "staging" "prod")

for env in "${environments[@]}"; do
  echo "Deploying to $env..."
  LAMBDA_FUNCTION_NAME="my-auth-$env" \
  AWS_REGION="us-east-1" \
  ./update-lambda.sh
done
```

### CI/CD 集成

#### GitHub Actions

```yaml
name: Deploy Lambda Authorizer

on:
  push:
    paths:
      - 'deploy/lambda/auth/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Deploy Lambda
        run: |
          cd deploy/lambda/auth
          npm install
          node update-lambda.js --auto-detect
```

#### GitLab CI

```yaml
deploy-lambda:
  stage: deploy
  image: node:18
  before_script:
    - apt-get update && apt-get install -y awscli
  script:
    - cd deploy/lambda/auth
    - npm install
    - node update-lambda.js --auto-detect
  only:
    changes:
      - deploy/lambda/auth/**
```

### 自定义配置文件

创建 `.env.deploy` 文件：

```bash
LAMBDA_FUNCTION_NAME=my-auth-function
COGNITO_USER_POOL_ID=us-east-1_Sq3IYsy06
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
```

使用配置文件：

```bash
# 加载配置
source .env.deploy

# 运行部署
./update-lambda.sh
```

## 📊 性能对比

| 方法 | 部署时间 | 优点 | 缺点 |
|------|---------|------|------|
| CDK Deploy | 3-5 分钟 | 完整部署，更新所有资源 | 慢，更新不相关的资源 |
| 脚本部署 | 30-60 秒 | 快速，仅更新 Lambda | 不更新其他资源 |

**建议**：
- 代码更新 → 使用脚本
- 配置更改（如 IAM、API Gateway）→ 使用 CDK

## 📝 最佳实践

### 1. 版本控制

在部署前创建 Git tag：

```bash
git tag -a v1.0.1 -m "Update Lambda authorizer for Cognito"
git push origin v1.0.1
```

### 2. 备份

部署前导出当前 Lambda 配置：

```bash
aws lambda get-function \
  --function-name your-auth-function \
  > backup-$(date +%Y%m%d).json
```

### 3. 测试

始终在非生产环境先测试：

```bash
# Dev 环境
LAMBDA_FUNCTION_NAME=auth-dev ./update-lambda.sh

# 测试通过后再部署到生产
LAMBDA_FUNCTION_NAME=auth-prod ./update-lambda.sh
```

### 4. 监控

部署后监控 CloudWatch metrics：

```bash
# 实时日志
aws logs tail /aws/lambda/your-function --follow

# 错误统计
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=your-function \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 🔐 安全注意事项

1. **不要提交凭证** - 确保 `.env` 文件在 `.gitignore` 中
2. **使用 IAM roles** - 在 EC2/ECS 上使用 IAM roles 而不是访问密钥
3. **最小权限原则** - 部署用户只需要 Lambda 更新权限
4. **审计日志** - 启用 CloudTrail 记录部署操作

## 📚 相关文档

- [Lambda Authorizer README](./README.md)
- [CDK Deployment Guide](../../COGNITO_DEPLOYMENT.md)
- [Lambda Authorizer Update Summary](../../../LAMBDA_AUTHORIZER_UPDATE.md)

## 💡 提示

- 使用 `npm run deploy:auto` 最简单，无需手动输入函数名
- 脚本会自动检测并跳过已安装的依赖
- 所有脚本都支持彩色输出，便于查看进度
- 部署通常在 1 分钟内完成

## 🆘 获取帮助

如果遇到问题：

1. 查看脚本输出的错误信息
2. 检查 CloudWatch 日志
3. 验证 AWS 凭证和权限
4. 查阅 [故障排除](#-故障排除) 部分
5. 查看 [README.md](./README.md) 的故障排除章节
