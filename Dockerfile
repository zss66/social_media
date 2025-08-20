# 多阶段构建
# Stage 1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV CI=true

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# Stage 2: 运行时阶段
FROM node:18-alpine AS runtime

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 安装运行时系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    xvfb

# 设置 Chromium 环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 创建必要的目录
RUN mkdir -p /app/logs /app/data /app/cache && \
    chown -R nextjs:nodejs /app

# 切换到应用用户
USER nextjs

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 启动命令
CMD ["npm", "start"]

# 开发环境镜像
FROM node:18-alpine AS development

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=8080

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    xvfb

# 设置 Chromium 环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs data cache

# 暴露端口
EXPOSE 8080 9229

# 启动开发服务器
CMD ["npm", "run", "serve"]

# Electron 构建镜像
FROM electronuserland/builder:wine AS electron-builder

# 设置工作目录
WORKDIR /project

# 复制源代码
COPY . .

# 安装依赖
RUN npm ci

# 构建应用
RUN npm run build

# 构建 Electron 应用
RUN npm run electron:build

# 输出构建产物
CMD ["sh", "-c", "cp -r dist_electron/* /output/"]