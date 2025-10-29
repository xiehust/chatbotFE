# 后端 Lambda 函数更新指南

## 概述

为了支持 Cognito JWT token 认证，所有后端 Lambda 函数需要更新 `decode_token()` 函数。

Lambda authorizer 已经验证了 Cognito token 并将用户信息传递到 `event.requestContext.authorizer` 中。

## ✅ 已更新的函数

- ✅ `lambda_prompthub/app.py` - 已更新

## 📋 需要更新的其他函数

需要检查并更新以下 Lambda 函数中的 `decode_token()` 函数：

| Lambda 函数 | 文件 | 状态 |
|------------|------|------|
| lambda_modelhub | `lambda_modelhub/app.py` | ⚠️ 待更新 |
| lambda_feedback_us | `lambda_feedback_us/app.py` | ⚠️ 待更新 |
| lambda_chat_py | `lambda_chat_py/app.py` | ⚠️ 待更新 |
| lambda_automatic_prompt | `lambda_automatic_prompt/app.py` | ⚠️ 待更新 |
| 其他使用认证的 Lambda | - | ⚠️ 待检查 |

## 🔧 更新方法

### 新的 decode_token() 实现

将现有的 `decode_token()` 函数替换为以下实现：

```python
def decode_token(event):
    """
    Extract user information from the request context.
    The Lambda authorizer has already verified the Cognito JWT token
    and passed user information through requestContext.authorizer
    """
    try:
        # Get user context from authorizer (set by Lambda authorizer)
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})

        if authorizer_context:
            # User info was validated by Lambda authorizer
            logger.info(f"User context from authorizer: {authorizer_context}")

            # Parse groups back to list (it was JSON stringified in authorizer)
            groups_str = authorizer_context.get('groups', '[]')
            try:
                groups = json.loads(groups_str) if isinstance(groups_str, str) else []
            except:
                groups = []

            decoded_token = {
                'username': authorizer_context.get('username'),
                'sub': authorizer_context.get('sub'),
                'email': authorizer_context.get('email', ''),
                'groups': groups,
                'token_use': authorizer_context.get('token_use', ''),
                'payload': authorizer_context.get('username')  # For backward compatibility
            }

            logger.info(f"Decoded user info: {decoded_token}")
            return decoded_token

        # Fallback: Try old token validation method (for backward compatibility)
        # This should not be used in production with Cognito
        logger.warning("No authorizer context found, falling back to direct token validation")

        auth = event.get('headers', {}).get('Authorization') or event.get('headers', {}).get('authorization')
        if not auth:
            logger.error("No Authorization header found")
            return None

        token = auth.split(' ')[1] if ' ' in auth else auth
        logger.info("Attempting direct token validation (legacy mode)")

        # Try to validate with old method (only for backward compatibility)
        token_key = os.environ.get('TOKEN_KEY')
        if token_key:
            try:
                decoded_token = jwt.decode(token, token_key, algorithms=["HS256"])
                logger.info(f"Token validated with legacy method: {decoded_token}")
                return decoded_token
            except jwt.ExpiredSignatureError:
                logger.error("Token has expired")
                return None
            except jwt.InvalidTokenError:
                logger.error("Invalid token")
                return None
        else:
            logger.error("No TOKEN_KEY configured and no authorizer context available")
            return None

    except Exception as e:
        logger.error(f"Error in decode_token: {str(e)}")
        return None
```

### 关键改进

1. **优先使用 authorizer context**
   - Token 已由 Lambda authorizer 验证
   - 用户信息直接从 `event.requestContext.authorizer` 获取
   - 无需重复验证 JWT

2. **向后兼容**
   - 如果没有 authorizer context，回退到旧方法
   - 保持现有代码不中断

3. **用户组支持**
   - 从 Cognito `cognito:groups` 提取用户组
   - 支持基于组的权限控制

4. **更好的错误处理**
   - 详细的日志记录
   - 清晰的错误消息

## 📝 使用示例

### 获取用户信息

```python
def handler(event, lambda_context):
    # 获取用户信息
    decoded_token = decode_token(event)

    if not decoded_token:
        return {
            'statusCode': 401,
            'headers': cors_headers,
            'body': 'Unauthorized'
        }

    # 提取用户字段
    username = decoded_token.get('username')
    email = decoded_token.get('email')
    groups = decoded_token.get('groups', [])

    logger.info(f"User: {username}, Email: {email}, Groups: {groups}")

    # 您的业务逻辑...
```

### 权限检查

```python
def handler(event, lambda_context):
    decoded_token = decode_token(event)

    if not decoded_token:
        return {'statusCode': 401, 'body': 'Unauthorized'}

    # 检查管理员权限
    groups = decoded_token.get('groups', [])
    is_admin = 'admin' in groups

    if not is_admin:
        return {
            'statusCode': 403,
            'body': 'Forbidden: Admin access required'
        }

    # 管理员操作...
```

### 获取用户特定数据

```python
def handler(event, lambda_context):
    decoded_token = decode_token(event)
    username = decoded_token.get('username')

    # 查询用户数据
    table = dynamodb.Table('user_data_table')
    response = table.get_item(Key={'username': username})

    # 返回用户数据...
```

## 🔍 event 结构示例

### 经过 Lambda Authorizer 后的 event

```python
{
    "httpMethod": "GET",
    "resource": "/prompt_hub",
    "headers": {
        "Authorization": "Bearer eyJraWQiOiJ..."
    },
    "requestContext": {
        "authorizer": {
            "username": "john.doe",
            "sub": "12345678-1234-1234-1234-123456789012",
            "email": "john.doe@example.com",
            "groups": "[\"admin\", \"users\"]",  # JSON string
            "token_use": "access",
            "client_id": "abc123xyz"
        },
        "requestId": "...",
        "accountId": "..."
    },
    # ... 其他字段
}
```

## 🧪 测试

### 本地测试事件

创建测试事件 `test-event.json`:

```json
{
  "httpMethod": "GET",
  "resource": "/prompt_hub",
  "headers": {
    "Authorization": "Bearer fake-token"
  },
  "requestContext": {
    "authorizer": {
      "username": "testuser",
      "sub": "test-sub-id",
      "email": "test@example.com",
      "groups": "[\"admin\"]",
      "token_use": "access",
      "client_id": "test-client"
    }
  },
  "queryStringParameters": {
    "company": "default"
  }
}
```

### 测试命令

```bash
# 本地测试
python -c "
import json
from app import handler

with open('test-event.json', 'r') as f:
    event = json.load(f)

result = handler(event, None)
print(json.dumps(result, indent=2))
"

# Lambda 测试
aws lambda invoke \
  --function-name your-lambda-function \
  --payload file://test-event.json \
  response.json

cat response.json | jq '.'
```

## 🐛 故障排除

### 问题 1: decoded_token 为 None

**原因**: authorizer context 不存在且无法回退验证

**检查**:
```python
logger.info(f"Event: {json.dumps(event)}")
logger.info(f"Request context: {event.get('requestContext')}")
logger.info(f"Authorizer: {event.get('requestContext', {}).get('authorizer')}")
```

**解决方案**:
- 确认 Lambda authorizer 已正确配置
- 检查 API Gateway 路由是否附加了 authorizer
- 验证 authorizer 返回的 policy 包含 context

### 问题 2: groups 字段为空

**原因**: Cognito 用户没有分配组

**解决方案**:
- 在 Cognito User Pool 中为用户分配组
- 或在代码中提供默认组:
  ```python
  groups = decoded_token.get('groups', ['users'])  # 默认组
  ```

### 问题 3: 向后兼容模式失败

**原因**: TOKEN_KEY 环境变量未设置

**解决方案**:
- 设置 TOKEN_KEY 环境变量（仅用于向后兼容）
- 或移除回退逻辑，强制使用 authorizer context

### 问题 4: 日志中看到 "falling back to direct token validation"

**原因**: authorizer context 为空

**检查**:
1. Lambda authorizer 是否正确部署
2. API Gateway 路由是否使用了 authorizer
3. 测试时是否绕过了 API Gateway

## 📊 监控

### CloudWatch Logs 查询

查找认证相关的日志：

```
# 查找所有认证日志
fields @timestamp, @message
| filter @message like /User context from authorizer/
| sort @timestamp desc
| limit 100

# 查找认证失败
fields @timestamp, @message
| filter @message like /No authorizer context found/
| sort @timestamp desc
| limit 100

# 查找特定用户
fields @timestamp, @message
| filter @message like /username.*john.doe/
| sort @timestamp desc
| limit 100
```

### 关键指标

监控以下指标：

1. **认证成功率** - 有 authorizer context 的请求比例
2. **回退使用率** - 使用旧方法验证的请求数
3. **认证失败** - decode_token 返回 None 的次数
4. **错误率** - decode_token 中的异常

## 📋 更新清单

对每个后端 Lambda 函数：

- [ ] 定位 `decode_token()` 函数
- [ ] 备份原始代码
- [ ] 替换为新实现
- [ ] 测试本地功能
- [ ] 部署到 dev 环境
- [ ] 测试 dev 环境
- [ ] 查看 CloudWatch 日志
- [ ] 部署到 prod 环境
- [ ] 监控错误率

## 🚀 批量更新脚本

创建脚本 `update-all-lambdas.sh`:

```bash
#!/bin/bash

# Lambda 函数列表
LAMBDAS=(
  "lambda_modelhub"
  "lambda_feedback_us"
  "lambda_chat_py"
  "lambda_automatic_prompt"
)

for lambda in "${LAMBDAS[@]}"; do
  echo "Updating $lambda..."

  # 更新 decode_token 函数
  # 这里需要手动编辑 app.py 文件

  # 部署
  cd "deploy/lambda/$lambda"

  if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt -t .
  fi

  zip -r function.zip .

  aws lambda update-function-code \
    --function-name "$lambda" \
    --zip-file fileb://function.zip

  rm function.zip
  cd -

  echo "$lambda updated"
done
```

## 💡 最佳实践

1. **逐步迁移**
   - 先更新一个 Lambda
   - 测试通过后再更新其他

2. **保持向后兼容**
   - 保留回退逻辑直到所有系统迁移完成

3. **详细日志**
   - 记录认证来源（authorizer vs legacy）
   - 记录用户信息供审计

4. **监控和告警**
   - 设置告警监控认证失败率
   - 监控回退方法使用率

5. **文档化**
   - 记录每个 Lambda 的更新日期
   - 记录遇到的问题和解决方案

## 📚 相关文档

- [Lambda Authorizer README](./auth/README.md)
- [Lambda Authorizer Update Summary](../LAMBDA_AUTHORIZER_UPDATE.md)
- [Cognito Setup Guide](../COGNITO_SETUP.md)
- [Deployment Guide](./COGNITO_DEPLOYMENT.md)

## 🆘 需要帮助？

如果遇到问题：
1. 查看 CloudWatch 日志
2. 检查 API Gateway 配置
3. 验证 Lambda authorizer 正常工作
4. 查阅本文档的故障排除部分
