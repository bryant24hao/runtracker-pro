# RunTracker Pro 部署指南

## 环境变量配置

创建 `.env.local` 文件（生产环境用 `.env.production`）：

```env
# 数据库配置 - 生产环境推荐使用 PostgreSQL
DATABASE_URL="postgresql://user:password@host:port/database"

# 或者本地开发使用 SQLite
# DATABASE_URL="file:./local.db"

# Next.js 配置
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-here"
```

## 部署选项

### 1. Vercel 部署（推荐）

最简单的部署方式：

1. 创建 GitHub 仓库并推送代码
2. 访问 [vercel.com](https://vercel.com) 并连接 GitHub
3. 导入项目
4. 设置环境变量
5. 部署

数据库选择：
- **Neon PostgreSQL**（免费层）
- **Supabase**（免费层）
- **PlanetScale**（免费层）

### 2. Railway 部署

一体化平台，包含数据库：

```bash
npm install -g @railway/cli
railway login
railway init
railway add postgresql
railway deploy
```

### 3. Docker 部署

适合自托管：

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 数据库迁移

生产环境需要 PostgreSQL，运行以下 SQL 创建表：

```sql
-- 见 scripts/001-create-tables.sql
```

## 构建优化

确保生产构建正常：

```bash
npm run build
npm start
``` 