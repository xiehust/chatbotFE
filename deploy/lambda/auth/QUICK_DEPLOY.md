# Lambda Authorizer 快速部署指南 ⚡

## 🚀 最快部署方式（推荐）

```bash
cd deploy/lambda/auth
npm install
npm run deploy:auto
```

就这么简单！脚本会自动检测 Lambda 函数名并部署。

---

## 📝 三种部署方式

### 方式 1: 使用 npm 脚本（推荐）✅

```bash
# 自动检测函数名（最简单）
npm run deploy:auto

# 或手动指定函数名
export LAMBDA_FUNCTION_NAME=your-auth-function-name
npm run deploy
```

### 方式 2: 使用 Bash 脚本（Linux/macOS）

```bash
# 自动检测
./update-lambda.sh --auto-detect

# 或指定函数名
export LAMBDA_FUNCTION_NAME=your-auth-function-name
./update-lambda.sh
```

### 方式 3: 使用 Node.js 脚本

```bash
# 自动检测
node update-lambda.js --auto-detect

# 或指定函数名
node update-lambda.js your-auth-function-name
```

---

## ⚙️ 配置（可选）

默认配置已经设置好，如需自定义：

```bash
export LAMBDA_FUNCTION_NAME=your-auth-function-name
export COGNITO_USER_POOL_ID=us-east-x
export COGNITO_REGION=us-east-1
export AWS_REGION=us-east-1
```

---

## ✅ 验证部署

### 1. 测试 Lambda

```bash
aws lambda invoke \
  --function-name your-function-name \
  --payload file://test-event-example.json \
  response.json && cat response.json | jq '.'
```

### 2. 查看日志

```bash
aws logs tail /aws/lambda/your-function-name --follow
```

### 3. 测试 API

```bash
curl -X GET https://your-api-url/prompt_hub \
  -H "Authorization: Bearer <your-cognito-token>"
```

---

## 🐛 常见问题

| 问题 | 解决方案 |
|------|----------|
| "Function not found" | 运行 `aws lambda list-functions` 确认函数名 |
| "Permission denied" | 运行 `chmod +x update-lambda.sh` |
| "Access Denied" | 配置 AWS 凭证：`aws configure` |
| "npm not found" | 安装 Node.js |

---

## 📋 部署清单

- [ ] 已安装 Node.js 和 npm
- [ ] 已配置 AWS CLI (`aws configure`)
- [ ] 已知 Lambda 函数名（或使用 `--auto-detect`）
- [ ] 在 `deploy/lambda/auth` 目录下
- [ ] 运行 `npm install`（首次）
- [ ] 运行 `npm run deploy:auto`
- [ ] 验证部署成功
- [ ] 测试 API 调用

---

## ⏱️ 部署时间

- **首次部署**: ~2 分钟（包含依赖安装）
- **后续部署**: ~30-60 秒

---

## 🔄 完整工作流程

```bash
# 1. 进入目录
cd deploy/lambda/auth

# 2. 首次安装依赖
npm install

# 3. 部署（自动检测函数名）
npm run deploy:auto

# 4. 等待完成（约 30-60 秒）
# ✓ Deployment Successful!

# 5. 测试
aws lambda invoke \
  --function-name <detected-function-name> \
  --payload file://test-event-example.json \
  response.json
```

---

## 💡 提示

- ✅ 使用 `npm run deploy:auto` 无需记住函数名
- ✅ 脚本会自动安装依赖、打包、部署
- ✅ 部署完成后会显示详细信息和测试命令
- ✅ 可以多次运行，每次都会更新到最新代码

---

## 📚 更多信息

- **详细文档**: 查看 [DEPLOYMENT_SCRIPTS.md](./DEPLOYMENT_SCRIPTS.md)
- **Lambda 配置**: 查看 [README.md](./README.md)
- **CDK 部署**: 查看 [../../COGNITO_DEPLOYMENT.md](../../COGNITO_DEPLOYMENT.md)

---

**准备好了吗？开始部署！** 🚀

```bash
npm run deploy:auto
```
