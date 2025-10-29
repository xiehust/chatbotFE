# Lambda Authorizer 更新总结

## 🎉 Lambda Authorizer 已更新以支持 AWS Cognito

Lambda authorizer (`deploy/lambda/auth/`) 已成功更新，现在可以验证来自 AWS Cognito 的 JWT tokens。

---

## ✅ 完成的工作

### 1. Lambda Authorizer 代码更新

#### 文件: `deploy/lambda/auth/index.js`

**新功能：**
- ✅ 使用 JWKS (JSON Web Key Set) 验证 Cognito JWT tokens
- ✅ 从 Cognito 获取公钥进行签名验证
- ✅ 验证 token 的 issuer、过期时间、token_use 等声明
- ✅ 提取用户信息（username, email, groups）
- ✅ 将用户上下文传递给后端 Lambda 函数
- ✅ JWKS 公钥缓存（10分钟）以提高性能

**安全增强：**
- 🔒 从对称密钥加密升级到非对称密钥（更安全）
- 🔒 完整的 token 验证（签名、过期、issuer、claims）
- 🔒 支持 Cognito Groups 进行权限控制

### 2. 依赖项更新

#### 文件: `deploy/lambda/auth/package.json`

新增依赖：
```json
{
  "jsonwebtoken": "^9.0.0",      // 现有
  "jwks-rsa": "^3.1.0",          // 新增 - JWKS 客户端
  "node-fetch": "^2.7.0"         // 新增 - HTTP 客户端
}
```

### 3. CDK 部署配置更新

#### 文件: `deploy/lib/lambda_stack.js`

添加了 Cognito 环境变量：
```javascript
environment: {
  ...commonProps.environment,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || 'us-east-1_Sq3IYsy06',
  COGNITO_REGION: process.env.COGNITO_REGION || 'us-east-1',
}
```

更新了打包配置：
```javascript
bundling: {
  externalModules: ["@aws-sdk"],
  nodeModules: ["jsonwebtoken", "jwks-rsa", "node-fetch"],  // 新增依赖
}
```

### 4. 文档创建

新建了完整的文档：

| 文档 | 说明 |
|------|------|
| `deploy/lambda/auth/README.md` | Lambda authorizer 详细文档和故障排除 |
| `deploy/lambda/auth/test-event-example.json` | 测试事件示例 |
| `deploy/COGNITO_DEPLOYMENT.md` | CDK 部署指南 |
| `LAMBDA_AUTHORIZER_UPDATE.md` | 本更新总结文档 |

---

## 🔧 技术架构

### 认证流程

```
┌─────────────────┐
│  前端应用        │
│  (Cognito登录)  │
└────────┬────────┘
         │ 1. 获取 access_token
         ▼
┌─────────────────────────┐
│  API Gateway            │
│  /prompt_hub            │
└────────┬────────────────┘
         │ 2. Authorization: Bearer <token>
         ▼
┌─────────────────────────────────┐
│  Lambda Authorizer              │
│  - 解码 token 获取 kid          │
│  - 从 JWKS 获取公钥             │
│  - 验证签名和声明               │
│  - 提取用户信息                 │
└────────┬────────────────────────┘
         │ 3. Allow/Deny Policy
         │    + User Context
         ▼
┌─────────────────────────────────┐
│  后端 Lambda                    │
│  event.requestContext.authorizer│
│  - username                     │
│  - email                        │
│  - groups                       │
└─────────────────────────────────┘
```

### Token 验证过程

1. **提取 Token**: 从 `Authorization: Bearer <token>` 中提取
2. **解码 Header**: 获取 `kid` (Key ID)
3. **获取公钥**: 从 Cognito JWKS endpoint 获取对应的公钥
4. **验证签名**: 使用公钥验证 token 签名
5. **验证声明**:
   - `iss`: 必须匹配 Cognito User Pool
   - `exp`: Token 未过期
   - `token_use`: 必须是 'access' 或 'id'
6. **提取用户信息**: 从 token claims 中提取
7. **生成策略**: 返回 Allow/Deny IAM 策略

---

## 📋 部署步骤

### 步骤 1: 安装依赖

```bash
cd deploy/lambda/auth
npm install
```

### 步骤 2: 配置环境变量

在 `deploy/.env` 文件中添加（如果不存在则创建）：

```bash
# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_Sq3IYsy06
COGNITO_REGION=us-east-1

# 其他现有变量保持不变
TOKEN_KEY=your-token-key
UPLOAD_BUCKET=your-bucket
...
```

### 步骤 3: 部署 CDK Stack

```bash
cd deploy
npm install  # 如果还没安装 CDK 依赖
cdk deploy
```

部署将会：
- 打包 Lambda 函数及其依赖
- 创建/更新 Lambda 函数
- 设置环境变量
- 配置 API Gateway authorizer
- 设置必要的 IAM 权限

### 步骤 4: 验证部署

```bash
# 检查 Lambda 函数
aws lambda get-function --function-name <your-auth-function-name>

# 检查环境变量
aws lambda get-function-configuration \
  --function-name <your-auth-function-name> \
  --query 'Environment.Variables'
```

---

## 🧪 测试

### 在 Lambda Console 测试

1. 进入 Lambda Console
2. 选择 authorizer 函数
3. 创建测试事件：

```json
{
  "type": "TOKEN",
  "authorizationToken": "Bearer <your-cognito-token>",
  "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/prompt_hub"
}
```

4. 点击 "Test"

**成功响应：**
```json
{
  "principalId": "user-sub-id",
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [{
      "Action": "execute-api:Invoke",
      "Effect": "Allow",
      "Resource": "arn:aws:execute-api:..."
    }]
  },
  "context": {
    "username": "testuser",
    "email": "test@example.com",
    "groups": "[\"admin\"]"
  }
}
```

### 端到端测试

```bash
# 使用 Cognito token 调用 API
curl -X GET https://your-api-gateway-url/prompt_hub \
  -H "Authorization: Bearer <cognito-access-token>"
```

**成功**: 返回数据（200 OK）
**失败**: 返回 Unauthorized（401/403）

---

## 🔍 后端如何使用用户上下文

在您的后端 Lambda 函数中，可以这样访问用户信息：

```javascript
exports.handler = async (event) => {
  // 获取用户上下文（由 authorizer 传递）
  const userContext = event.requestContext.authorizer;

  const username = userContext.username;
  const email = userContext.email;
  const groups = JSON.parse(userContext.groups);  // 需要 parse

  console.log('Current user:', username);
  console.log('User email:', email);
  console.log('User groups:', groups);

  // 基于用户信息的业务逻辑
  if (groups.includes('admin')) {
    // 管理员权限
  }

  // 您的业务逻辑...
};
```

---

## 🚨 重要注意事项

### 1. IAM 权限

Lambda authorizer 需要以下权限：
- ✅ **Internet 访问** - 获取 JWKS
- ✅ **CloudWatch Logs** - 记录日志
- ✅ **DynamoDB** - 如果需要读取用户表

如果 Lambda 在 VPC 中：
- 需要 NAT Gateway 访问互联网，或
- 配置 VPC Endpoint for Cognito

### 2. Token 类型

Authorizer 接受两种 token：
- ✅ **Access Token** - 用于 API 授权（推荐）
- ✅ **ID Token** - 包含用户信息

**不接受**：
- ❌ Refresh Token

### 3. 缓存

API Gateway 可以缓存 authorizer 结果：

**优点**: 减少 Lambda 调用，提高性能
**缺点**: 如果用户权限变更，缓存可能过期

建议 TTL: 5 分钟

```javascript
// 在 CDK 中配置
authorizer.authorizerResultTtlInSeconds = 300;
```

### 4. 性能考虑

**首次调用**（冷启动）:
- 500-1000ms（需要下载依赖）

**后续调用**（热启动）:
- 100-200ms

**优化建议**：
- 增加内存（512MB 而不是 256MB）
- 启用 provisioned concurrency
- 使用 API Gateway 缓存

---

## 📊 监控

### CloudWatch Logs

```bash
# 实时查看日志
aws logs tail /aws/lambda/<auth-function-name> --follow
```

**关键日志消息**：
- `Auth event:` - 授权请求
- `Token verified successfully` - 验证成功
- `Authorization successful` - 策略生成
- `Authorization failed:` - 验证失败（含错误详情）

### CloudWatch Metrics

监控指标：
- **Invocations** - 总调用次数
- **Errors** - 错误次数
- **Duration** - 执行时间
- **Throttles** - 限流次数

### 告警设置

```bash
# 错误率告警
aws cloudwatch put-metric-alarm \
  --alarm-name auth-high-error-rate \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --threshold 0.05 \
  --comparison-operator GreaterThanThreshold
```

---

## 🐛 故障排除

### 问题 1: "Token verification failed: invalid signature"

**原因**: Token 签名无效

**解决**：
1. 确认 token 来自正确的 Cognito User Pool
2. 检查 `COGNITO_USER_POOL_ID` 环境变量
3. 验证 token 未被截断或修改

### 问题 2: "Error getting signing key"

**原因**: 无法从 Cognito 获取 JWKS

**解决**：
1. 检查 Lambda 是否有互联网访问
2. 如果在 VPC 中，配置 NAT Gateway
3. 验证 JWKS URI 正确

### 问题 3: Authorization Always Fails

**检查**：
1. 前端是否发送正确的 token
2. Token 格式: `Bearer <token>`
3. Token 未过期
4. Cognito 配置正确

**调试**：
```bash
# 解码 token 查看 claims
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('YOUR_TOKEN', {complete: true}), null, 2))"
```

---

## 📚 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| Lambda Authorizer README | `deploy/lambda/auth/README.md` | 详细功能和故障排除 |
| CDK 部署指南 | `deploy/COGNITO_DEPLOYMENT.md` | 部署步骤和配置 |
| Cognito 前端配置 | `COGNITO_SETUP.md` | 前端 OAuth 配置 |
| 测试事件示例 | `deploy/lambda/auth/test-event-example.json` | Lambda 测试事件 |

---

## 🎯 下一步

1. ✅ **部署 Lambda Authorizer**
   ```bash
   cd deploy
   cdk deploy
   ```

2. ✅ **测试授权流程**
   - 在 Lambda Console 测试
   - 使用真实 Cognito token 测试 API

3. ✅ **监控和告警**
   - 设置 CloudWatch 告警
   - 监控错误率和延迟

4. ✅ **更新后端 Lambda**
   - 更新代码以使用 `event.requestContext.authorizer`
   - 提取用户信息进行业务逻辑

5. ✅ **文档化**
   - 记录自定义配置
   - 更新团队 runbook

---

## 💡 最佳实践

### 1. 安全
- ✅ 使用短期 token（1小时）
- ✅ 实现 token 刷新机制
- ✅ 启用 CloudTrail 审计
- ✅ 定期轮换 secrets

### 2. 性能
- ✅ 启用 API Gateway 缓存
- ✅ 增加 Lambda 内存
- ✅ 使用 provisioned concurrency

### 3. 监控
- ✅ 设置关键指标告警
- ✅ 监控失败的授权尝试
- ✅ 跟踪 JWKS 获取错误

### 4. 成本优化
- ✅ 使用缓存减少 Lambda 调用
- ✅ 监控 Lambda 使用情况
- ✅ 优化超时配置

---

## 🎉 总结

Lambda authorizer 已成功更新以支持 AWS Cognito JWT 验证！

**主要改进：**
- 🔒 更安全的非对称密钥验证
- ✅ 完整的 Cognito 集成
- 📊 用户组支持
- 🚀 性能优化（JWKS 缓存）

**现在可以：**
- 用户通过 Cognito OAuth 登录
- 前端获取 access token
- API Gateway 使用 Lambda authorizer 验证 token
- 后端接收验证后的用户上下文

下一步：部署并测试完整的认证流程！
