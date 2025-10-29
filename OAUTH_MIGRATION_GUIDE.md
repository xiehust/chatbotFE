# OAuth 2.0 Migration Guide

## 概述 (Overview)

本指南帮助您从传统的用户名/密码认证迁移到 OAuth 2.0 / OIDC 认证。

This guide helps you migrate from traditional username/password authentication to OAuth 2.0 / OIDC authentication.

## 什么改变了？ (What Changed?)

### 新增功能 (New Features)

1. **OAuth 2.0 登录按钮** - 登录页面现在有一个 "Sign in with Amazon Federate" 按钮
2. **PKCE 安全流程** - 使用行业标准的 PKCE 流程保护授权码
3. **回调处理器** - 新增 `/oauth/callback` 路由处理 OAuth 重定向
4. **JWT Token 支持** - 支持解析和使用 ID tokens 中的用户信息

### 保留的功能 (Preserved Features)

- ✅ 旧的用户名/密码登录仍然可用
- ✅ 匿名登录仍然可用
- ✅ 所有现有的 API 调用保持不变
- ✅ 现有的用户授权和权限检查保持不变

## 快速开始 (Quick Start)

### 步骤 1: 安装依赖 (Step 1: Install Dependencies)

依赖已自动安装。如需手动安装：

```bash
yarn add jose
```

### 步骤 2: 配置环境变量 (Step 2: Configure Environment Variables)

更新您的 `.env` 文件：

```bash
# 复制示例配置文件
cp .env.sample .env

# 编辑 .env 文件，添加以下配置：
REACT_APP_OIDC_ISSUER=https://idp.federate.amazon.com
REACT_APP_OIDC_CLIENT_ID=your_client_id_here
REACT_APP_OIDC_CLIENT_SECRET=your_client_secret_here
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/oauth/callback
REACT_APP_OIDC_AUTHORIZATION_ENDPOINT=https://idp.federate.amazon.com/api/oauth2/v1/authorize
REACT_APP_OIDC_TOKEN_ENDPOINT=https://idp.federate.amazon.com/api/oauth2/v2/token
REACT_APP_OIDC_JWKS_URI=https://idp.federate.amazon.com/api/oauth2/v2/certs
```

### 步骤 3: 获取 OAuth 凭证 (Step 3: Obtain OAuth Credentials)

联系您的管理员以获取：
- Client ID
- Client Secret
- 确保您的回调 URL 已在 Amazon Federate 中注册

### 步骤 4: 启动应用 (Step 4: Start Application)

```bash
yarn start
```

访问 `http://localhost:3000/login`，您将看到新的 OAuth 登录选项。

## 技术细节 (Technical Details)

### 新增文件 (New Files)

```
src/
├── common/
│   └── oauth-utils.js          # OAuth 工具函数
├── pages/
│   └── login/
│       └── oauth-callback.jsx  # OAuth 回调处理器
```

### 修改文件 (Modified Files)

1. **`src/pages/login/login.jsx`**
   - 添加 OAuth 登录按钮
   - 导入 `initiateOAuthLogin` 函数

2. **`src/pages/commons/use-auth.js`**
   - 添加 `signinWithOAuth(authData)` 方法

3. **`src/App.js`**
   - 添加 `/oauth/callback` 路由

### OAuth 流程说明 (OAuth Flow)

```
用户点击 "Sign in with Amazon Federate"
    ↓
生成 PKCE 参数 (code_verifier, code_challenge)
    ↓
重定向到 Amazon Federate 授权页面
    ↓
用户在 Amazon Federate 登录
    ↓
重定向回应用 /oauth/callback
    ↓
使用授权码交换 tokens
    ↓
提取用户信息并设置认证状态
    ↓
重定向到主应用 (/prompt_hub)
```

## API 变化 (API Changes)

### 新增的 API 函数

在 `src/common/oauth-utils.js` 中：

```javascript
// 启动 OAuth 登录流程
initiateOAuthLogin()

// 交换授权码获取 tokens
exchangeCodeForTokens(code, state)

// 解码 JWT token
decodeJWT(token)

// 从 ID token 提取用户信息
extractUserInfo(idToken)

// 退出登录并清除 tokens
logout()

// 获取 OAuth 配置
getOAuthConfig()
```

### 认证 Hook 更新

在 `src/pages/commons/use-auth.js` 中：

```javascript
const auth = useAuth();

// 新增方法
auth.signinWithOAuth(authData); // OAuth 登录

// 现有方法保持不变
auth.signin(username, password);
auth.signout();
auth.signup(username, email, password);
auth.confirm_signup(username, confirmcode);
```

## 安全考虑 (Security Considerations)

1. **PKCE 保护** - 使用 SHA256 哈希的 code challenge 防止授权码拦截
2. **State 参数** - 防止 CSRF 攻击
3. **Token 存储** - Access token 和 ID token 安全存储在 localStorage
4. **Client Secret** - 仅在服务器端使用，不暴露在客户端代码中

## 故障排除 (Troubleshooting)

### 问题：重定向 URI 不匹配

**错误信息：** "redirect_uri_mismatch"

**解决方案：**
1. 检查 `.env` 中的 `REACT_APP_OIDC_REDIRECT_URI` 是否正确
2. 确保该 URI 已在 Amazon Federate 中注册
3. URL 必须完全匹配（包括协议、域名、端口、路径）

### 问题：Token 交换失败

**错误信息：** "Token exchange failed: 401"

**解决方案：**
1. 验证 Client ID 和 Client Secret 是否正确
2. 检查 Token endpoint URL 是否正确
3. 确认 code_verifier 正确存储在 sessionStorage 中

### 问题：用户信息提取失败

**错误信息：** "Failed to extract user information"

**解决方案：**
1. 检查 ID token 格式是否正确
2. 确认 ID token 包含必要的声明（sub, groups 等）
3. 查看浏览器控制台的详细错误信息

### 问题：CORS 错误

**解决方案：**
1. 确保 Amazon Federate 配置允许您的域名
2. 检查请求头是否正确
3. 在生产环境中使用 HTTPS

## 向后兼容性 (Backward Compatibility)

✅ **完全向后兼容** - 所有现有功能继续工作：

- 用户名/密码登录
- 匿名登录
- 所有 API 端点
- 用户权限和授权
- Token 管理

## 生产部署清单 (Production Deployment Checklist)

- [ ] 获取生产环境的 OAuth 凭证
- [ ] 在 Amazon Federate 中注册生产环境的回调 URL
- [ ] 更新生产环境的 `.env` 文件
- [ ] 设置 `REACT_APP_OIDC_REDIRECT_URI` 为生产域名
- [ ] 确保使用 HTTPS
- [ ] 测试完整的 OAuth 流程
- [ ] 验证 token 刷新机制（如果实现）
- [ ] 配置日志和监控
- [ ] 文档化回滚计划

## 下一步 (Next Steps)

1. **Token 刷新** - 考虑实现 refresh token 机制以延长会话
2. **单点登出** - 实现从 Amazon Federate 的单点登出
3. **多因素认证** - 配置 MFA 要求
4. **用户属性映射** - 根据需要映射更多用户属性
5. **审计日志** - 记录 OAuth 登录事件

## 支持 (Support)

如有问题，请：
1. 查看 `OAUTH_SETUP.md` 详细配置说明
2. 检查浏览器控制台错误
3. 查看网络请求详情
4. 联系您的系统管理员

## 参考资料 (References)

- [OAuth 2.0 规范](https://oauth.net/2/)
- [OIDC 规范](https://openid.net/connect/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Amazon Federate OIDC 配置](https://idp.federate.amazon.com/.well-known/openid-configuration)
