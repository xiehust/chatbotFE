# Token 自动刷新机制说明

## 概述

应用现在支持自动 token 刷新机制，当 access token 即将过期时会自动使用 refresh token 获取新的 access token，无需用户重新登录。

## ✅ 功能特性

### 1. 自动刷新
- ✅ Token 过期前 5 分钟自动刷新
- ✅ API 调用失败（401）时自动刷新
- ✅ 刷新成功后自动重试失败的请求
- ✅ 多个并发请求共享同一个刷新过程

### 2. 用户提示
- ✅ Session 即将过期时显示警告（5分钟前）
- ✅ Session 过期后显示对话框要求重新登录
- ✅ 手动刷新按钮
- ✅ 倒计时显示剩余时间

### 3. 错误处理
- ✅ 刷新失败自动清除认证状态
- ✅ 重定向到登录页面
- ✅ 显示友好的错误提示

---

## 🔧 技术实现

### 架构组件

```
┌────────────────────────┐
│  useTokenRefresh Hook  │  ← 定时检查 token
│  - 调度自动刷新        │
│  - 监控过期时间        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  API Interceptor       │  ← 拦截 API 调用
│  - 请求前检查          │
│  - 401 响应处理        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  refreshAccessToken()  │  ← 刷新 token
│  - 调用 Cognito        │
│  - 获取新 tokens       │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Update Auth State     │  ← 更新认证状态
│  - localStorage        │
│  - React Context       │
└────────────────────────┘
```

### 核心文件

| 文件 | 功能 |
|------|------|
| `src/common/oauth-utils.js` | Token 刷新、过期检查函数 |
| `src/common/use-token-refresh.js` | 自动刷新 hook |
| `src/common/api-interceptor.js` | Axios 拦截器 |
| `src/pages/commons/session-expiration-handler.jsx` | UI 提示组件 |
| `src/pages/commons/use-auth.js` | 集成 token 刷新 |

---

## 📋 刷新流程

### 场景 1: 定时自动刷新

```
应用启动
    ↓
useTokenRefresh 初始化
    ↓
检查 token 过期时间
    ↓
调度刷新（过期前 5 分钟）
    ↓
时间到达
    ↓
调用 refreshAccessToken()
    ↓
Cognito 返回新 tokens
    ↓
更新 localStorage 和 Context
    ↓
重新调度下次刷新
```

### 场景 2: API 调用触发刷新

```
用户发起 API 请求
    ↓
API Interceptor (请求前)
    ↓
检查 token 是否过期
    ↓
Token 即将过期？
    ├─ Yes → 刷新 token
    │         ↓
    │    使用新 token 发送请求
    │
    └─ No → 直接发送请求

服务器返回 401？
    ├─ Yes → 刷新 token
    │         ↓
    │    重试原始请求
    │
    └─ No → 返回响应
```

### 场景 3: 刷新失败

```
Token 刷新失败
    ↓
清除认证状态
    ↓
显示 "Session Expired" 对话框
    ↓
用户点击 "Sign In Again"
    ↓
重定向到登录页面
```

---

## 🔍 主要函数说明

### 1. refreshAccessToken(refreshToken)

**功能**: 使用 refresh token 获取新的 access token

**参数**:
- `refreshToken` - Cognito refresh token

**返回**:
```javascript
{
  access_token: "new-access-token",
  id_token: "new-id-token",
  refresh_token: "refresh-token"  // 可能是新的或原来的
}
```

**使用示例**:
```javascript
import { refreshAccessToken } from './oauth-utils';

try {
  const newTokens = await refreshAccessToken(currentRefreshToken);
  // 更新存储的 tokens
} catch (error) {
  // 刷新失败，需要重新登录
}
```

### 2. isTokenExpired(token, bufferSeconds)

**功能**: 检查 token 是否已过期或即将过期

**参数**:
- `token` - JWT access token
- `bufferSeconds` - 缓冲时间（秒），默认 300（5分钟）

**返回**: `true` 如果已过期或将在 buffer 时间内过期

**使用示例**:
```javascript
import { isTokenExpired } from './oauth-utils';

// 检查是否已过期
if (isTokenExpired(accessToken, 0)) {
  console.log('Token has expired');
}

// 检查是否将在 5 分钟内过期
if (isTokenExpired(accessToken, 300)) {
  console.log('Token will expire soon');
}
```

### 3. useTokenRefresh(updateAuthCallback)

**功能**: React hook，自动管理 token 刷新

**参数**:
- `updateAuthCallback` - 回调函数，用于更新认证状态

**返回**:
```javascript
{
  refreshToken: Function,  // 手动触发刷新
  isRefreshing: Boolean    // 是否正在刷新
}
```

**使用示例**:
```javascript
import { useTokenRefresh } from './use-token-refresh';

function MyComponent() {
  const { refreshToken, isRefreshing } = useTokenRefresh(updateAuthState);

  const handleManualRefresh = async () => {
    await refreshToken();
  };

  return <Button disabled={isRefreshing}>Refresh</Button>;
}
```

### 4. setupApiInterceptors(onTokenExpired)

**功能**: 设置 Axios 拦截器处理 token 刷新

**参数**:
- `onTokenExpired` - Token 过期回调函数

**功能**:
- 请求前检查 token
- 401 响应自动刷新并重试
- 防止并发刷新冲突

---

## ⚙️ 配置

### Token 刷新时机

可以在代码中调整刷新时机：

```javascript
// oauth-utils.js
export function isTokenExpired(token, bufferSeconds = 300) {
  // 默认 300 秒（5分钟）
  // 可改为：
  // - 600 (10分钟) - 更早刷新
  // - 60 (1分钟) - 更晚刷新
}
```

### Cognito Token 有效期

在 Cognito User Pool 设置：
- **Access Token**: 默认 1 小时
- **ID Token**: 默认 1 小时
- **Refresh Token**: 默认 30 天

修改路径：
AWS Console → Cognito → User Pool → App Integration → App Client Settings → Token Expiration

---

## 🧪 测试

### 测试自动刷新

1. **登录应用**
   ```bash
   yarn start
   # 访问 http://localhost:3000
   # 使用 Cognito 登录
   ```

2. **查看控制台**
   ```javascript
   // 应该看到：
   "Token expires in 3600s, scheduling refresh in 3300s"
   ```

3. **等待或手动触发**
   - 等待接近过期时间
   - 或手动修改 token 的 exp 时间进行测试

### 测试 401 响应刷新

```javascript
// 在浏览器控制台
// 1. 手动过期 token
localStorage.setItem('chatbot-tokendata', JSON.stringify({
  ...JSON.parse(localStorage.getItem('chatbot-tokendata')),
  token: 'expired-token'
}));

// 2. 发起 API 调用
// 应该看到自动刷新并重试
```

### 测试 session 过期提示

```javascript
// 在浏览器控制台
// 模拟即将过期（5分钟内）
const auth = JSON.parse(localStorage.getItem('chatbot-tokendata'));
const decoded = JSON.parse(atob(auth.token.split('.')[1]));
decoded.exp = Math.floor(Date.now() / 1000) + 250; // 250秒后过期

// 应该看到警告对话框
```

---

## 🎨 用户体验

### Token 即将过期（< 5分钟）

显示对话框：
```
┌──────────────────────────────────┐
│ ⚠️  Session Expiring Soon        │
├──────────────────────────────────┤
│ Your session will expire in      │
│ approximately 4m 30s.            │
│                                  │
│ Your session will be             │
│ automatically refreshed, or you  │
│ can refresh it now.              │
├──────────────────────────────────┤
│          [Dismiss] [Refresh Now] │
└──────────────────────────────────┘
```

### Token 已过期

显示对话框（无法关闭）：
```
┌──────────────────────────────────┐
│ ❌  Session Expired               │
├──────────────────────────────────┤
│ Your session has expired for     │
│ security reasons.                │
│                                  │
│ Please sign in again to continue │
│ using the application.           │
├──────────────────────────────────┤
│        [Sign In Again]           │
└──────────────────────────────────┘
```

---

## 💡 最佳实践

### 1. Refresh Token 安全存储

**当前实现**: localStorage
**生产建议**:
- 考虑使用 HttpOnly cookies
- 或在后端代理 token 刷新

### 2. Token 过期时间设置

**推荐配置**:
- Access Token: 1 小时（平衡安全和用户体验）
- ID Token: 1 小时
- Refresh Token: 30 天

### 3. 用户活动检测

可以添加用户活动检测，仅在用户活跃时刷新：

```javascript
// 示例：检测用户活动
let lastActivity = Date.now();

window.addEventListener('mousedown', () => {
  lastActivity = Date.now();
});

// 在刷新前检查
if (Date.now() - lastActivity < 300000) {  // 5分钟内有活动
  performTokenRefresh();
}
```

### 4. 刷新失败重试

当前实现不重试，可以添加：

```javascript
async function refreshWithRetry(refreshToken, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await refreshAccessToken(refreshToken);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 🐛 故障排除

### 问题 1: Token 不自动刷新

**检查**:
1. refresh_token 是否存在
   ```javascript
   const auth = JSON.parse(localStorage.getItem('chatbot-tokendata'));
   console.log('Refresh token:', auth.refresh_token);
   ```

2. 查看控制台日志
   - 应该有 "scheduling refresh" 消息
   - 检查是否有错误

3. 验证 Cognito 配置
   - Refresh token 是否启用
   - App Client 是否配置正确

### 问题 2: 刷新后仍然 401

**原因**: 新 token 也无效或配置错误

**检查**:
1. Cognito token endpoint 是否正确
2. Client ID 和 Secret 是否正确
3. 查看 Cognito CloudWatch 日志

### 问题 3: 无限刷新循环

**原因**: 刷新逻辑有问题

**检查**:
1. isRefreshing 标志是否正确设置
2. _retry 标志是否正确处理
3. 控制台是否有重复的刷新消息

### 问题 4: 对话框不显示

**原因**: SessionExpirationHandler 未正确挂载

**检查**:
1. App.js 中是否导入并使用
2. 组件是否在 ProvideAuth 内部
3. 浏览器控制台是否有错误

---

## 📊 监控和调试

### Console 日志

启用详细日志以调试 token 刷新：

```javascript
// 在 oauth-utils.js 和 api-interceptor.js 中
console.log('Token refresh initiated');
console.log('Token expires in:', expirationTime);
console.log('Scheduling refresh in:', refreshIn);
console.log('Token refreshed successfully');
```

### 关键日志消息

成功流程：
```
Token expires in 3600s, scheduling refresh in 3300s
Refreshing access token...
Token refreshed successfully
```

失败流程：
```
Received 401 Unauthorized, attempting token refresh...
Token refresh failed: 400 invalid_grant
Token expired, signing out...
Redirecting to login...
```

### Browser DevTools

```javascript
// 查看存储的 tokens
localStorage.getItem('chatbot-tokendata')

// 查看 token 过期时间
const auth = JSON.parse(localStorage.getItem('chatbot-tokendata'));
const decoded = JSON.parse(atob(auth.token.split('.')[1]));
console.log('Expires at:', new Date(decoded.exp * 1000));

// 查看剩余时间
const now = Math.floor(Date.now() / 1000);
console.log('Time remaining:', decoded.exp - now, 'seconds');
```

---

## 🔐 安全考虑

### 1. Refresh Token 存储

**当前**: localStorage
**风险**: XSS 攻击可能窃取 token
**缓解**:
- 使用 Content Security Policy (CSP)
- 定期轮换 tokens
- 监控异常活动

**未来改进**: 使用 HttpOnly cookies（需要后端支持）

### 2. Token 轮换

Cognito 支持 refresh token 轮换：
- 每次刷新都会发放新的 refresh token
- 旧的 refresh token 立即失效
- 防止 token 重放攻击

**启用方式**: Cognito Console → App Client → Advanced Authentication Settings → Enable token revocation

### 3. Refresh Token 过期

如果 refresh token 也过期：
- 自动清除认证状态
- 提示用户重新登录
- 不尝试无限重试

### 4. 并发请求处理

实现了队列机制：
- 第一个请求触发刷新
- 其他请求排队等待
- 刷新成功后批量更新所有请求
- 防止多次并发刷新

---

## 🎯 Cognito 配置要求

### App Client 设置

确保以下设置已启用：

1. **OAuth Flows**
   - ✅ Authorization code grant
   - ✅ Refresh token auth flow（重要！）

2. **OAuth Scopes**
   - ✅ openid
   - ✅ email
   - ✅ profile

3. **Token 配置**
   - Access Token: 1 hour
   - ID Token: 1 hour
   - Refresh Token: 30 days
   - ✅ Enable token revocation（推荐）

### 配置路径

AWS Console → Cognito → User Pools → us-east-1_Sq3IYsy06 → App Integration → App Client Settings

---

## 📈 性能影响

### Token 刷新开销

| 操作 | 延迟 |
|------|------|
| 检查 token 过期 | < 1ms |
| 调用 Cognito refresh | 200-500ms |
| 更新存储 | < 5ms |
| **总计** | ~250-500ms |

### 优化建议

1. **刷新时机**
   - 当前: 过期前 5 分钟
   - 可调整为更早（如 10 分钟）

2. **缓存策略**
   - Token 刷新后立即可用
   - 无需等待下次请求

3. **用户感知**
   - 后台刷新，用户无感知
   - 仅在失败时显示提示

---

## 🧪 测试清单

- [ ] 登录成功后 token 自动调度刷新
- [ ] 接近过期时显示警告对话框
- [ ] 手动点击 "Refresh Now" 可以刷新
- [ ] Token 过期后显示 "Session Expired" 对话框
- [ ] 点击 "Sign In Again" 重定向到登录页
- [ ] API 调用返回 401 时自动刷新
- [ ] 刷新成功后自动重试失败的请求
- [ ] 刷新失败时正确处理（清除状态、显示提示）
- [ ] 多个并发请求不会触发多次刷新
- [ ] 控制台日志清晰反映刷新过程

---

## 📚 相关文档

- **OAuth 配置**: `COGNITO_SETUP.md`
- **完整集成**: `COMPLETE_COGNITO_INTEGRATION.md`
- **API 使用**: `CLAUDE.md`

---

## 🎉 总结

Token 自动刷新机制已完全实现！

**主要特性**:
- ✅ 自动后台刷新
- ✅ API 错误自动处理
- ✅ 用户友好的提示
- ✅ 安全的错误处理
- ✅ 防并发刷新

**用户体验**:
- 😊 无缝的长会话
- 😊 无需频繁登录
- 😊 清晰的过期提示
- 😊 一键重新登录

Token 刷新让用户可以长时间使用应用而无需重复登录，同时保持安全性！
