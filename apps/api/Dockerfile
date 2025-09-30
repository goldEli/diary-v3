# 后端 API Dockerfile - 生产环境
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:18-alpine AS runner

# 安装 dumb-init 用于信号处理
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 只安装生产依赖
RUN pnpm install --frozen-lockfile --prod

# 从构建阶段复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]