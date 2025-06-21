# RunTracker Pro 🏃‍♂️

一个现代化的跑步目标追踪应用，支持移动端和桌面端使用。

## 功能特性

- 📱 **移动优先设计** - iOS风格的响应式界面
- 🎯 **目标管理** - 设置和追踪跑步目标
- 📊 **活动记录** - 记录每次跑步的详细数据
- 📈 **统计分析** - 可视化数据和进度追踪
- 🍎 **Apple Fitness集成** - 支持从Apple Health导入数据
- 📸 **图片上传** - 记录跑步路线和风景
- 🌙 **暗黑模式** - 自适应主题切换

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **样式**: Tailwind CSS, Radix UI
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **部署**: Vercel / Docker / Railway

## 快速开始

### 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd Running\ Goal\ App

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 部署

#### 选项1: 一键部署脚本

```bash
./deploy.sh
```

#### 选项2: Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入项目
4. 设置环境变量：
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```
5. 部署完成

#### 选项3: Docker 部署

```bash
# 构建并启动
docker-compose up --build -d

# 访问应用
open http://localhost:3000
```

#### 选项4: Railway 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并部署
railway login
railway init
railway add postgresql
railway deploy
```

## 环境变量配置

创建 `.env.local` 文件：

```env
# 数据库连接 (生产环境)
DATABASE_URL="postgresql://user:password@host:port/database"

# 或者使用本地 SQLite (开发环境)
# DATABASE_URL="file:./local.db"

# Next.js 配置
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
```

## 数据库设置

### PostgreSQL (生产环境)

推荐的数据库提供商：
- [Neon](https://neon.tech) - 免费层
- [Supabase](https://supabase.com) - 免费层  
- [Railway](https://railway.app) - 包含部署平台

运行初始化脚本：
```sql
-- 参见 scripts/001-create-tables.sql
```

### SQLite (开发环境)

应用会自动创建 `local.db` 文件并初始化表结构。

## API 接口

### 目标管理
- `GET /api/goals` - 获取所有目标
- `POST /api/goals` - 创建新目标
- `PUT /api/goals/[id]` - 更新目标
- `DELETE /api/goals/[id]` - 删除目标

### 活动记录
- `GET /api/activities` - 获取活动记录
- `POST /api/activities` - 创建新活动
- `PUT /api/activities/[id]` - 更新活动
- `DELETE /api/activities/[id]` - 删除活动

### 统计数据
- `GET /api/stats` - 获取统计信息

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页面
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   └── ...               # 业务组件
├── lib/                  # 工具库
├── scripts/              # 数据库脚本
├── public/               # 静态资源
└── styles/               # 样式文件
```

## 开发指南

### 添加新功能

1. 在 `components/` 中创建组件
2. 在 `app/api/` 中添加 API 路由
3. 更新数据库模式（如需要）
4. 添加类型定义到 `lib/types.ts`

### 移动端开发

应用使用响应式设计，在移动端自动切换到专门的 UI：
- iOS 风格的导航和卡片
- 底部标签栏
- 手势友好的交互

### Apple HealthKit 集成

需要在 iOS 设备上使用 Capacitor 构建原生应用：

```bash
npm install -g @capacitor/cli
cap add ios
cap sync
cap open ios
```

## 部署环境

### 推荐配置

**Vercel + Neon PostgreSQL**
- 前端：Vercel (免费)
- 数据库：Neon (免费 0.5GB)
- 总成本：$0/月

**Railway 一体化**
- 应用 + 数据库：Railway
- 总成本：~$5/月

**自托管 Docker**
- 服务器：VPS (~$5/月)
- 数据库：自托管 PostgreSQL
- 总成本：~$5/月

## 性能优化

- 使用 Next.js 15 App Router
- 图片懒加载和优化
- API 路由缓存
- 数据库连接池
- 静态生成优化

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请：
- 创建 [Issue](https://github.com/your-username/runtracker-pro/issues)
- 发送邮件到 your-email@example.com

---

**RunTracker Pro** - 让跑步变得更有目标 🎯 