# Diary-v3 — 简易日记管理 H5 项目

一个用于登录、写日记、查看日记、编辑/删除日记并可通过 Docker 部署到云端随时访问的全栈示例项目。

目标：在保证简单易用的同时，具备基础的认证、安全、分页、搜索与部署能力，便于个人或小团队快速上云。

## 功能需求
- 登录/注册（邮箱 + 密码，JWT 认证）
- 写日记（标题、内容、心情/标签、日期）
- 查看日记（列表 + 详情，支持搜索与分页）
- 编辑/删除日记（仅作者可操作）
- 通过 Docker 部署到云端，公网可访问

## 技术栈
- 前端：Next.js（App Router）+ Tailwind CSS + Shadcn UI + JWT（基于 HttpOnly Cookie 或 Authorization Header）
- 后端：NestJS + TypeORM + MySQL
- 部署：Docker / Docker Compose（可选 Nginx 反向代理）
- 其他：ESLint、Prettier、Jest（单元测试）、Rate Limit、Helmet

## 系统架构
- Web（Next.js）：
  - H5 响应式页面，Shadcn UI 组件搭建页面与表单
  - 与后端交互：`fetch`/`axios` 调用 REST API
  - 认证：
    - 简化方案：登录成功后，后端设置 HttpOnly Cookie（`access_token`），前端只需携带 Cookie；
    - 或使用 `Authorization: Bearer <token>` 方案（需在前端安全存储）。
- API（NestJS）：
  - 模块：`AuthModule`、`UsersModule`、`DiariesModule`
  - 安全：JWT 守卫（`@nestjs/passport` + `passport-jwt`）、密码哈希（bcrypt）、Helmet、CORS
  - 数据：TypeORM 连接 MySQL，实体包含用户与日记，按用户隔离数据
- 数据库（MySQL）：`users`、`diaries` 两张核心表
- 部署：Docker 化前后端与数据库，Compose 一键启动；可选 Nginx 暴露前后端路由

## 目录结构规划
```
/diary-v3
  ├── apps
  │   ├── web/           # Next.js 前端
  │   └── api/           # NestJS 后端
  ├── docker/            # Dockerfile 与 Nginx 配置示例
  ├── .env.example       # 项目根环境变量示例（可选）
  ├── docker-compose.yml # 编排前后端与数据库
  └── README.md
```

## 数据库设计（TypeORM 实体）
- users
  - id (PK, bigint, auto-increment)
  - email (varchar, unique, not null)
  - password_hash (varchar, not null)
  - created_at (datetime)
  - updated_at (datetime)
- diaries
  - id (PK, bigint, auto-increment)
  - user_id (FK → users.id)
  - title (varchar, not null)
  - content (text, not null)
  - mood (varchar, nullable) 或 tags (json/text，后续可扩展)
  - journal_date (date, not null)
  - created_at (datetime)
  - updated_at (datetime)

索引建议：
- `users.email` 唯一索引
- `diaries.user_id, diaries.journal_date` 复合索引（便于按日期与用户查询）

## API 设计（REST）
- Auth
  - `POST /auth/register`：注册，body：`{ email, password }`
  - `POST /auth/login`：登录，返回 JWT；
    - Cookie 方案：设置 `Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax`
    - Header 方案：响应体返回 `{ accessToken }`
  - `GET /auth/profile`：获取当前用户信息（需认证）
  - `POST /auth/logout`：清除 Cookie（如使用 Cookie 方案）
- Diaries（需认证）
  - `GET /diaries?search=&page=&limit=&date=`：分页与搜索列表
  - `POST /diaries`：创建，body：`{ title, content, mood, journalDate }`
  - `GET /diaries/:id`：详情（仅作者可读）
  - `PATCH /diaries/:id`：编辑（仅作者可改）
  - `DELETE /diaries/:id`：删除（仅作者可删）

错误约定：
- 统一返回结构：`{ code, message, data }`
- 常见错误码：400 参数错误、401 未认证、403 无权限、404 未找到、429 频率限制、500 服务器错误

## 前端页面与路由（Next.js App Router）
- 路由与页面
  - `/login`：登录页（邮箱 + 密码）
  - `/register`：注册页（邮箱 + 密码）
  - `/`：日记列表页（分页、搜索、按日期筛选、创建入口）
  - `/diary/new`：新建日记页
  - `/diary/:id`：日记详情页（编辑/删除入口）
- 组件与样式
  - Tailwind：快速布局与响应式
  - Shadcn UI：`Button`、`Input`、`Textarea`、`Card`、`Dialog`、`Dropdown`、`Pagination` 等组件
- 状态与数据
  - 轻量：直接在组件中请求或使用轻量数据层（如 SWR）
  - 认证态：从 Cookie 或本地存储读取，必要时做服务端渲染保护

## 权限与认证
- 登录后签发 JWT：`sub: userId, email`
- 存储策略优选：HttpOnly Cookie（降低 XSS 风险）
- NestJS 守卫：`AuthGuard('jwt')` 保护需要认证的路由
- 仅作者可读写自己的日记（`diaries.user_id === req.user.id`）

## 开发环境准备
- Node.js `>= 18`
- npm 或 pnpm/yarn（示例使用 npm）
- Docker 与 Docker Compose（用于本地与线上运行）
- 可选：全局 Nest CLI（`npm i -g @nestjs/cli`）

## 初始化与安装（示例命令）
### 前端（Next.js + Tailwind + Shadcn UI）
```bash
# 创建项目
npx create-next-app@latest apps/web --typescript --eslint --tailwind --src-dir --app

#（如未启用 Tailwind，可手动安装）
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 初始化 Shadcn UI
npx shadcn@latest init
# 选择使用的组件（示例）
npx shadcn@latest add button input textarea card dialog dropdown-menu pagination form toast
```

### 后端（NestJS + TypeORM + MySQL + JWT）
```bash
# 创建项目
nest new apps/api

# 安装依赖
cd apps/api
npm i @nestjs/typeorm typeorm mysql2
npm i @nestjs/jwt passport @nestjs/passport passport-jwt bcrypt
npm i @nestjs/config helmet rate-limiter-flexible
npm i -D @types/bcrypt
```

### 环境变量示例
- `apps/api/.env`
```
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=diary_user
DB_PASSWORD=diary_pass
DB_NAME=diary

# JWT
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```
- `apps/web/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 运行与开发
### 本地不使用 Docker（开发）
```bash
# 启动 MySQL（本机或容器）
# 确保 .env 指向可连接的数据库

# 启动后端
cd apps/api
npm run start:dev

# 启动前端
cd ../web
npm run dev
```

### 使用 Docker（开发/生产）
- `docker-compose.yml`（示例）：
```yaml
version: '3.9'
services:
  db:
    image: mysql:8.0
    container_name: diary_mysql
    environment:
      MYSQL_DATABASE: diary
      MYSQL_USER: diary_user
      MYSQL_PASSWORD: diary_pass
      MYSQL_ROOT_PASSWORD: root_pass
    ports:
      - '3306:3306'
    volumes:
      - db_data:/var/lib/mysql
    command: ["--default-authentication-plugin=mysql_native_password"]

  api:
    build: ./apps/api
    container_name: diary_api
    env_file:
      - ./apps/api/.env
    depends_on:
      - db
    ports:
      - '3001:3001'

  web:
    build: ./apps/web
    container_name: diary_web
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3001
    depends_on:
      - api
    ports:
      - '3000:3000'

volumes:
  db_data:
```

- 典型 Dockerfile（后端 `apps/api/Dockerfile`）：
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- 典型 Dockerfile（前端 `apps/web/Dockerfile`）：
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
```

- 运行：
```bash
docker compose up -d --build
# 前端 http://localhost:3000
# 后端 http://localhost:3001
```

## 关键实现点（后端）
- AuthModule：注册/登录、JWT 签发与校验、Cookie/Header 两种模式支持
- UsersModule：创建与查询用户、邮箱唯一约束
- DiariesModule：CRUD 与权限校验（按 userId 过滤）
- 安全：
  - `bcrypt` 哈希密码
  - `Helmet` 基础安全头
  - `rate-limiter-flexible` 登录与敏感接口限流
  - CORS 严格来源控制

## 关键实现点（前端）
- 登录/注册表单：Shadcn Form + Zod 验证（可选）
- 列表页：分页、搜索、按日期筛选；行卡片展示（Card）
- 详情页：查看、编辑、删除对话框（Dialog）
- 数据请求：SWR/简单 fetch；错误与加载态处理；Toast 提示
- 鉴权：路由级别保护（服务端/客户端），未登录跳转登录页

## 测试与质量
- 单元测试：Nest（Jest）覆盖 Auth 与 Diaries 逻辑
- 前端组件测试：React Testing Library（可选）
- Lint & 格式：ESLint + Prettier
- 提交规范：可选 `commitlint` 与 `lint-staged`

## 运维与部署建议
- 云上运行：
  - 使用云服务器（Ubuntu）安装 Docker 与 Compose，拉取镜像后 `docker compose up -d`。
  - 配置 Nginx：将 `web` 暴露到 80/443，`api` 使用子路径或子域名（如 `api.example.com`）。
  - 申请并配置 HTTPS 证书（Let’s Encrypt）。
- 备份与迁移：MySQL 定期备份（volume 或云数据库），保证数据安全。
- 监控与日志：Docker logs、进程健康检查、必要时接入 APM（可选）。

## Roadmap（可选后续迭代）
- 刷新令牌与自动续期（减少频繁登录）
- 标签/心情枚举、按标签过滤
- 富文本编辑（例如 tiptap）与图片上传（对象存储）
- 导出/导入（Markdown/JSON）
- PWA 支持离线草稿

## 开发提示
- 先从后端 Auth/Users/Diaries 的最小可用链路开始，确保 JWT 与权限OK，再迭代 UI。
- 前端先构建基础路由与表单，数据联通后再美化交互与状态管理。
- Docker 本地联调后再上云，确保 `.env` 与环境变量一致。

---
本 README 旨在作为实现前的技术与步骤说明书。接下来可按此计划逐步落地代码。