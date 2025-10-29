# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based frontend application for a GenAI chatbot/assistant platform called "GCR GenAI Juggle Hub". The application provides multiple features including:
- AI chat interface with knowledge base integration
- Prompt engineering hub and playground
- Model hub for browsing and managing AI models
- Agent/Assistant creation and management
- Asset/Demo hub for sharing solutions
- Feedback management system
- User administration (admin-only)

The backend is deployed using AWS CDK with Lambda functions, API Gateway (HTTP and WebSocket), and DynamoDB.

## Development Commands

### Frontend Development
```bash
# Install dependencies
yarn install

# Start development server (runs on port 3000)
yarn start

# Build for production
yarn build

# Run tests
yarn test
```

### Backend Deployment (AWS CDK)
The backend infrastructure is in the `/deploy` directory:
```bash
cd deploy
npm install
cdk deploy
```

### Production Deployment (PM2)
For production deployment on EC2:
```bash
yarn build
pm2 start yarn --name "chatbotFE" -- start
pm2 list
pm2 startup systemd
```

## Architecture Overview

### Frontend Structure
- **Pages**: Main application modules located in `src/pages/`
  - `chatbot/` - Main chat interface
  - `agents/` and `agents_chat/` - Assistant creation and chat interface
  - `prompt_hub/` and `prompt_playground/` - Prompt engineering features
  - `model_hub/` - Model catalog and details
  - `demo_hub/` - Asset/demo sharing platform
  - `feedback/` - User feedback management
  - `admin/` - User management (admin only)
  - `login/` - Authentication
  - `commons/` - Shared components and utilities

- **Common Utilities** (`src/common/`)
  - `api-gateway.js` - All API calls to backend
  - `use-auth.js` - Authentication hooks and context
  - `i18n.js` - Internationalization (English and Chinese)
  - `store.js` - Redux store configuration

### API Communication
- **HTTP API**: `REACT_APP_API_http` - REST endpoints for CRUD operations
- **WebSocket API**: `REACT_APP_API_socket` - Real-time chat streaming
- **Authentication**: JWT token-based, stored in localStorage with key from `src/common/shared.js`

All API calls are centralized in `src/pages/commons/api-gateway.js`. Key functions:
- `remoteGetCall()`, `remotePostCall()` - Generic HTTP requests
- `remote_auth()` - Authentication
- `listTemplate()`, `addTemplate()` - Prompt template management
- `listAgents()`, `addAgent()` - Agent management
- `getPrompts()`, `addPrompt()` - Prompt hub operations
- `getModelCards()`, `addModelCard()` - Model hub operations
- `uploadS3()`, `uploadFile2()` - File upload to S3

### Authentication & Authorization
- **Multiple authentication methods supported:**
  - **OAuth 2.0 / OIDC** with Amazon Federate (recommended)
  - Legacy username/password authentication
  - Anonymous sign-in for testing
- Authentication context provider in `src/pages/commons/use-auth.js`
- OAuth utilities in `src/common/oauth-utils.js` (PKCE flow, token exchange, JWT handling)
- OAuth callback handler at `/oauth/callback` route
- Private routes use `<RequireAuth>` wrapper with optional `requireAdmin` prop
- User info stored in localStorage and accessed via hooks:
  - `useAuthToken()` - Get authorization header
  - `useAuthUserInfo()` - Get current user details
  - `useAuthorizedHeader()` - Get complete request headers
- See `OAUTH_SETUP.md` for detailed OAuth configuration instructions

### UI Framework
- **Cloudscape Design System** (`@cloudscape-design/components`) - Primary UI library
- **Material-UI** (`@mui/material`) - Secondary UI components
- Custom app layout wrapper in `src/pages/commons/common-components.jsx`

### Internationalization
- i18next with browser language detection
- Supported languages: English (en), Chinese (zh)
- Translation strings in `src/common/i18n.js`
- Use `useTranslation()` hook for translations

### State Management
- Redux Toolkit for global state (minimal usage)
- React Context for authentication state
- Local state with hooks for component-specific data

## Configuration

### Environment Variables
Create `.env` file from `.env.sample`:
```
REACT_APP_API_http=https://{apiid}.execute-api.{region}.amazonaws.com/prod
REACT_APP_API_socket=wss://{apiid}.execute-api.{region}.amazonaws.com/Prod
REACT_APP_DEFAULT_UPLOAD_BUCKET=
```

These values come from the AWS CDK deployment output.

### Backend Lambda Functions
Located in `/deploy/lambda/`:
- `auth/`, `login/`, `signup/` - Authentication
- `lambda_handle_chat/`, `lambda_chat_py/` - Chat processing
- `lambda_prompthub/` - Prompt template management
- `lambda_modelhub/` - Model hub operations
- `lambda_feedback_us/` - Feedback management
- `lambda_automatic_prompt/` - Auto prompt optimization
- `admin_users/` - User administration

## Key Features Implementation

### Prompt Templates
- Users can create custom LLM prompt templates with variables: `{system_role_prompt}`, `{question}`, `{role_bot}`, `{chat_history}`, `{context}`
- Templates support different LLM instruction formats
- See `HowToUsePromptTemplate.md` for details

### File Upload
- Direct S3 upload via presigned URLs (`uploadFile2()`)
- SDK-based upload with dual paths: user folder + bedrock-kb folder (`uploadS3()`)
- Metadata includes username, company for organization

### Chat Interface
- WebSocket connection for streaming responses
- Support for multi-round conversations
- Image upload capability
- Reference document display
- Feedback collection on responses

### Agents/Assistants
- Custom assistants with configurable capabilities: web search, code executor, image generation
- Knowledge base integration
- Opening questions/dialog configuration
- Separate chat interface in `agents_chat/`

## Routing Structure
Main routes (see `src/App.js`):
- `/` or `/login` - Login page
- `/oauth/callback` - OAuth callback handler (for Amazon Federate login)
- `/prompt_hub` - Prompt library
- `/prompt_hub/create` - Create new prompt template
- `/prompt_playground/:id` - Test prompts
- `/model_hub` - Model catalog
- `/asset_hub` - Demo/asset sharing
- `/feedback` - Feedback management
- `/admin/user` - User management (admin only)
- `/signout` - Logout

## Backend Database
- DynamoDB tables for users, templates, agents, models, feedback
- User authentication with JWT tokens
- Admin users have `groupname: "admin"` field
