# AWS Cognito OAuth 2.0 快速开始指南

## 🚀 5 分钟快速配置

### 步骤 1: 检查 .env 文件

`.env` 文件已经配置好 AWS Cognito 设置：

```bash
# AWS Cognito OAuth 2.0 配置
REACT_APP_OIDC_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06
REACT_APP_OIDC_CLIENT_ID=682bjuqrjenmreflci9h5189s4
REACT_APP_OIDC_CLIENT_SECRET=1079kpils6bmvbkgeotreq7mcbiceq8kmgh2fhs904t8229fbhar
REACT_APP_OIDC_REDIRECT_URI=http://localhost:3000/oauth/callback
REACT_APP_OIDC_AUTHORIZATION_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/authorize
REACT_APP_OIDC_TOKEN_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/token
REACT_APP_OIDC_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Sq3IYsy06/.well-known/jwks.json
REACT_APP_OIDC_USERINFO_ENDPOINT=https://us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com/oauth2/userInfo
```

**配置信息：**
- **User Pool ID**: us-east-1_Sq3IYsy06
- **Region**: us-east-1
- **已配置的 Client ID 和 Secret**: 已设置

### 步骤 2: 启动应用

```bash
yarn start
```

### 步骤 3: 测试登录

1. 打开浏览器访问：`http://localhost:3000/login`
2. 点击 **"Sign in with AWS Cognito"** 按钮
3. 在 AWS Cognito 托管 UI 页面输入您的凭证
4. 登录成功后会自动跳转回应用

## ✅ 已完成的工作

- ✅ OAuth 2.0 认证流程（PKCE）
- ✅ Amazon Federate 集成
- ✅ 登录页面 UI 更新
- ✅ 回调处理器 (`/oauth/callback`)
- ✅ 用户信息提取
- ✅ Token 管理
- ✅ 向后兼容（旧登录方式仍可用）

## 📁 新增文件

```
src/
├── common/
│   └── oauth-utils.js                 # OAuth 工具函数
└── pages/
    └── login/
        └── oauth-callback.jsx         # OAuth 回调处理器

docs/
├── OAUTH_SETUP.md                     # 详细配置指南
├── OAUTH_MIGRATION_GUIDE.md           # 迁移指南
├── IMPLEMENTATION_SUMMARY.md          # 实施摘要
└── QUICK_START_OAUTH.md               # 本文件
```

## 🔧 修改的文件

- `.env.sample` - 添加 OAuth 配置模板
- `src/pages/login/login.jsx` - 添加 OAuth 登录按钮
- `src/pages/commons/use-auth.js` - 添加 OAuth 认证方法
- `src/App.js` - 添加 OAuth 回调路由
- `CLAUDE.md` - 更新架构文档

## 🎯 AWS Cognito 配置说明

当前使用的 Cognito User Pool 配置：

- **User Pool ID**: `us-east-1_Sq3IYsy06`
- **Region**: `us-east-1`
- **App Client ID**: `682bjuqrjenmreflci9h5189s4`
- **Cognito Domain**: `us-east-1sq3iysy06.auth.us-east-1.amazoncognito.com`

### 回调 URL 配置

确保在 Cognito App Client 中配置了以下回调 URL：
- 开发环境：`http://localhost:3000/oauth/callback`
- 生产环境：`https://your-domain.com/oauth/callback`

### 允许的 OAuth Scopes

应该启用以下 scopes：
- ✅ openid
- ✅ email
- ✅ profile

## 🔒 安全提示

- ⚠️ **永远不要提交 `.env` 文件**到版本控制
- ⚠️ Client Secret 必须保密
- ⚠️ 生产环境必须使用 HTTPS
- ⚠️ 定期轮换 Client Secret

## 🐛 常见问题

### 问题 1: "Missing client_id or client_secret"

**解决：** 检查 `.env` 文件中的配置是否正确，重启开发服务器。

### 问题 2: "Redirect URI mismatch"

**解决：** 确保 Amazon Federate 中注册的回调 URL 与 `.env` 中的完全一致。

### 问题 3: "Token exchange failed"

**解决：** 验证 Client ID 和 Client Secret 是否正确。

## 📖 详细文档

- **AWS Cognito 配置**: 查看 `COGNITO_SETUP.md` ⭐（推荐）
- **OAuth 通用指南**: 查看 `OAUTH_SETUP.md`
- **迁移指南**: 查看 `OAUTH_MIGRATION_GUIDE.md`
- **实施摘要**: 查看 `IMPLEMENTATION_SUMMARY.md`

## 🎉 完成！

现在您可以使用 OAuth 2.0 登录了！登录页面支持三种方式：

1. **OAuth 2.0** - 推荐使用 ⭐
2. **用户名/密码** - 传统方式（仍可用）
3. **匿名登录** - 测试用途

---

**需要帮助？** 查看详细文档或联系技术支持。
