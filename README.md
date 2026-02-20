# Event Control System v2.0.0-pro

企业级赛事计分、计时、数据分析与审计控制系统

## 🏆 系统概述

Event Control System 是一款专为专业体育赛事设计的完整解决方案，提供从计分计时到数据分析的全套功能。系统采用微服务化单体架构，支持篮球、足球等多种运动类型，实现实时数据同步和完整操作审计。

## ✨ 核心特性

### 🏟️ 专项计分引擎
- **篮球计分引擎**：罚球(1分)、两分球(2分)、三分球(3分)计分
- **足球计分引擎**：进球、点球、乌龙球支持
- **规则校验**：篮球24秒进攻时钟、足球越位规则、黄牌累积(2张=红牌)
- **犯规管理**：普通犯规、技术犯规、进攻犯规等类型
- **暂停控制**：主客队暂停管理
- **事件撤销**：支持得分事件撤销，防止误操作

### ⏱️ 高精度计时系统
- 毫秒级精度计时（10ms）
- 支持倒计时/正计时/秒表三种模式
- 多计时器并发管理（主时钟、节次时钟、进攻时钟）
- 快速时间调整（±1/±10秒或自定义）
- 自动同步机制

### 📊 数据分析模块
- 实时统计计算（投篮命中率、三分命中率、罚球命中率）
- 比赛表现分析
- 关键时刻识别
- 动量计算
- 得分高潮检测
- 时间序列趋势分析

### 🔍 操作审计系统
- 完整的操作日志记录（所有API操作）
- 多维度查询（用户、资源、操作类型、时间范围）
- 日志统计分析（今日操作、活跃用户、错误数）
- 日志导出（JSON格式）
- 自动清理（90天TTL过期）

### 📱 多界面系统
- **Dashboard** - 控制台首页，实时统计概览
- **MatchList** - 赛事管理，比赛CRUD操作
- **MatchControl** - 比赛控制台，得分、犯规、计时控制
- **ScoreHistory** - 得分历史，事件时间线、筛选
- **TimerControl** - 计时器管理，多计时器并发控制
- **DisplayScreen** - 大屏展示，实时比分、全屏显示
- **Analytics** - 数据分析，统计图表、趋势分析
- **AuditLogs** - 审计日志，操作记录、查询导出

### 🐳 容器化部署
- Docker多阶段构建
- Docker Compose完整编排
- MongoDB 7.0 数据库
- Redis 7.2 缓存
- Nginx反向代理

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **UI 组件**: Ant Design 5.x + Ant Design Icons
- **状态管理**: Zustand
- **实时通信**: WebSocket Hook
- **样式**: Tailwind CSS + CSS Modules

### 后端
- **运行时**: Node.js 20 LTS
- **框架**: Express.js 4.x + TypeScript
- **实时通信**: WebSocket
- **数据库**: MongoDB 7.x（主数据）+ Redis 7.x（缓存）
- **认证**: JWT + bcrypt
- **部署**: Docker + Docker Compose

## 📦 项目结构

```
Event_Control_System/
├── client/                           # 前端项目
│   ├── src/
│   │   ├── components/               # 公共组件
│   │   ├── pages/                    # 页面组件
│   │   │   ├── Login.tsx             # 登录页
│   │   │   ├── Dashboard.tsx         # 控制台
│   │   │   ├── MatchList.tsx         # 赛事列表
│   │   │   ├── MatchControl.tsx      # 比赛控制台
│   │   │   ├── ScoreHistory.tsx      # 得分历史
│   │   │   ├── TimerControl.tsx      # 计时器管理
│   │   │   ├── DisplayScreen.tsx     # 大屏展示
│   │   │   ├── Analytics.tsx         # 数据分析
│   │   │   └── AuditLogs.tsx         # 审计日志
│   │   ├── stores/                   # 状态管理
│   │   ├── services/                 # API 服务
│   │   │   ├── match.ts              # 比赛API
│   │   │   ├── scoreEngine.ts        # 计分引擎API
│   │   │   ├── timer.ts              # 计时器API
│   │   │   ├── analytics.ts         # 分析API
│   │   │   └── audit.ts              # 审计API
│   │   ├── hooks/                    # 自定义Hooks
│   │   │   └── useWebSocket.ts       # WebSocket Hook
│   │   └── App.tsx                   # 根组件
│   ├── Dockerfile                    # 前端Docker配置
│   ├── nginx.conf                    # Nginx配置
│   └── package.json
├── server/                           # 后端项目
│   ├── src/
│   │   ├── config/                   # 配置文件
│   │   ├── controllers/              # 控制器
│   │   │   ├── matchController.ts    # 比赛控制器
│   │   │   ├── scoreEngineController.ts  # 计分引擎控制器
│   │   │   ├── timerController.ts    # 计时器控制器
│   │   │   ├── analyticsController.ts # 分析控制器
│   │   │   └── auditController.ts    # 审计控制器
│   │   ├── docs/                     # 文档
│   │   │   └── score-engine.md       # 计分引擎文档
│   │   ├── engines/                  # 计分引擎
│   │   │   ├── ScoreEngine.ts        # 计分引擎基类
│   │   │   ├── BasketballScoreEngine.ts  # 篮球计分引擎
│   │   │   ├── FootballScoreEngine.ts     # 足球计分引擎
│   │   │   └── ScoreEngineFactory.ts      # 引擎工厂
│   │   ├── timers/                   # 计时器
│   │   │   ├── Timer.ts              # 计时器基类
│   │   │   ├── MatchTimerManager.ts  # 计时器管理器
│   │   │   └── TimerManagerFactory.ts     # 计时器工厂
│   │   ├── analytics/                # 数据分析
│   │   │   ├── AnalyticsEngine.ts    # 分析引擎
│   │   │   └── MatchAnalyzer.ts      # 比赛分析器
│   │   ├── audit/                    # 审计日志
│   │   │   ├── AuditLogger.ts        # 审计日志记录器
│   │   │   └── index.ts
│   │   ├── models/                   # 数据模型
│   │   │   ├── Match.ts              # 比赛模型
│   │   │   └── AuditLog.ts           # 审计日志模型
│   │   ├── middleware/               # 中间件
│   │   │   ├── auth.ts               # 认证中间件
│   │   │   └── audit.ts              # 审计中间件
│   │   ├── routes/                   # 路由
│   │   │   ├── match.ts              # 比赛路由
│   │   │   ├── scoreEngine.ts        # 计分引擎路由
│   │   │   ├── timer.ts              # 计时器路由
│   │   │   ├── analytics.ts          # 分析路由
│   │   │   └── audit.ts              # 审计路由
│   │   ├── types/                    # 类型定义
│   │   │   ├── scoreEngine.ts        # 计分引擎类型
│   │   │   ├── timer.ts              # 计时器类型
│   │   │   ├── analytics.ts          # 分析类型
│   │   │   └── audit.ts              # 审计类型
│   │   ├── examples/                 # 示例代码
│   │   │   └── scoreEngineUsage.ts   # 计分引擎示例
│   │   └── app.ts                    # 入口文件
│   ├── Dockerfile                    # 后端Docker配置
│   └── package.json
├── nginx/                            # Nginx 配置
│   └── nginx.conf                    # 生产环境 Nginx 配置
├── docs/                             # 文档目录
├── docker-compose.yml                # Docker 编排
├── .dockerignore                     # Docker忽略文件
├── .env.docker                       # Docker环境变量模板
└── DEPLOYMENT.md                     # 部署文档
```

## 🚀 快速开始

### 前置要求

- Node.js 20 LTS 或更高版本
- MongoDB 7.x
- Redis 7.x
- Docker & Docker Compose（可选，用于容器化部署）

### 安装步骤

#### 方式一：Docker部署（推荐）

1. **克隆项目**
```bash
git clone https://github.com/huarongfei/Event_Control_System.git
cd Event_Control_System
```

2. **配置环境变量**
```bash
cp .env.docker .env
# 编辑 .env 文件，配置数据库连接和密钥
```

3. **启动所有服务**
```bash
docker-compose up -d
```

4. **访问应用**
- 前端: http://localhost:80
- 后端 API: http://localhost:5000

#### 方式二：本地开发

1. **安装依赖**
```bash
npm run install:all
```

2. **启动数据库服务**
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

3. **配置环境变量**
```bash
cp .env.docker .env
# 编辑 .env 文件
```

4. **启动应用**
```bash
# 开发模式（同时启动前端和后端）
npm run dev

# 或分别启动
npm run dev:server  # 后端
npm run dev:client  # 前端
```

5. **访问应用**
- 前端: http://localhost:5173
- 后端 API: http://localhost:5000

## 📝 API 文档

### 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "operator"
}
```

### 赛事接口

#### 创建赛事
```http
POST /api/matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "NBA Finals Game 1",
  "sport": "basketball",
  "homeTeam": {
    "name": "Lakers",
    "primaryColor": "#552583",
    "jerseyColor": "#FDB927"
  },
  "awayTeam": {
    "name": "Celtics",
    "primaryColor": "#008348",
    "jerseyColor": "#FFFFFF"
  },
  "startTime": "2024-06-06T20:00:00Z"
}
```

#### 获取赛事列表
```http
GET /api/matches?page=1&limit=10&status=live
Authorization: Bearer <token>
```

### 计分引擎接口

#### 添加得分事件
```http
POST /api/score-engine/matches/:matchId/score-events
Authorization: Bearer <token>
Content-Type: application/json

{
  "team": "home",
  "eventType": "two_point_make",
  "playerId": "player123",
  "playerName": "Stephen Curry",
  "playerNumber": 30,
  "period": 1,
  "shotClock": 10
}
```

#### 撤销得分事件
```http
DELETE /api/score-engine/matches/:matchId/score-events/:eventId
Authorization: Bearer <token>
```

#### 获取得分历史
```http
GET /api/score-engine/matches/:matchId/score-history
Authorization: Bearer <token>
```

#### 获取比赛统计
```http
GET /api/score-engine/matches/:matchId/stats
Authorization: Bearer <token>
```

#### 记录犯规
```http
POST /api/score-engine/matches/:matchId/foul
Authorization: Bearer <token>
Content-Type: application/json

{
  "team": "home",
  "playerId": "player123",
  "playerName": "Player Name",
  "playerNumber": 4,
  "foulType": "technical",
  "period": 1
}
```

#### 记录暂停
```http
POST /api/score-engine/matches/:matchId/timeout
Authorization: Bearer <token>
Content-Type: application/json

{
  "team": "home"
}
```

#### 足球 - 发放黄牌
```http
POST /api/score-engine/matches/:matchId/yellow-card
Authorization: Bearer <token>
Content-Type: application/json

{
  "team": "home",
  "playerId": "player123",
  "playerName": "Player Name",
  "playerNumber": 4
}
```

### 计时器接口

#### 启动计时器
```http
POST /api/timers/matches/:matchId/timers/:timerId/start
Authorization: Bearer <token>
```

#### 暂停计时器
```http
POST /api/timers/matches/:matchId/timers/:timerId/pause
Authorization: Bearer <token>
```

#### 重置计时器
```http
POST /api/timers/matches/:matchId/timers/:timerId/reset
Authorization: Bearer <token>
```

#### 调整时间
```http
POST /api/timers/matches/:matchId/timers/:timerId/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "seconds": 10
}
```

#### 设置时长
```http
PUT /api/timers/matches/:matchId/timers/:timerId/duration
Authorization: Bearer <token>
Content-Type: application/json

{
  "duration": 720
}
```

### 数据分析接口

#### 获取仪表板统计
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

#### 获取比赛统计
```http
GET /api/analytics/matches/:matchId
Authorization: Bearer <token>
```

#### 获取趋势数据
```http
GET /api/analytics/trends?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### 审计日志接口

#### 查询审计日志
```http
GET /api/audit/logs?page=1&limit=20&action=CREATE&resource=Match
Authorization: Bearer <token>
```

#### 导出审计日志
```http
GET /api/audit/logs/export?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### 获取统计信息
```http
GET /api/audit/stats
Authorization: Bearer <token>
```

#### 清理旧日志
```http
POST /api/audit/clean
Authorization: Bearer <token>
```

详细的计分引擎文档请参考: [server/docs/score-engine.md](server/docs/score-engine.md)

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | 5000 |
| `NODE_ENV` | 运行环境 | development |
| `MONGODB_URI` | MongoDB 连接字符串 | mongodb://localhost:27017/event-control |
| `REDIS_URL` | Redis 连接字符串 | redis://localhost:6379 |
| `JWT_SECRET` | JWT 签名密钥 | change-me-in-production |
| `JWT_EXPIRES_IN` | Token 过期时间 | 24h |
| `CLIENT_URL` | 前端 URL | http://localhost:5173 |
| `CORS_ORIGIN` | CORS 允许源 | http://localhost:5173 |

### 前端环境变量 (client/.env)

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_URL` | 后端 API 地址 | http://localhost:5000/api |
| `VITE_WS_URL` | WebSocket 地址 | ws://localhost:5000 |

## 🐳 Docker 部署

详细部署文档请参考: [DEPLOYMENT.md](DEPLOYMENT.md)

### 快速部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 📊 系统性能

| 指标 | 数值 |
|------|------|
| 响应延迟 | < 100ms |
| 计时精度 | 10ms |
| 并发连接 | 50+ |
| 日志保留 | 90天（自动清理） |
| 可用性 | 7×24小时 |

## 🎯 前端路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录 | 用户登录 |
| `/dashboard` | 控制台 | 数据概览 |
| `/matches` | 赛事列表 | 比赛管理 |
| `/matches/:id/control` | 比赛控制 | 得分、犯规控制 |
| `/matches/:id/history` | 得分历史 | 事件记录 |
| `/matches/:id/timers` | 计时器管理 | 时间控制 |
| `/display/:id` | 大屏展示 | 实时比分 |
| `/analytics` | 数据分析 | 统计图表 |
| `/audit-logs` | 审计日志 | 操作记录 |

## 🔐 安全特性

- JWT + RBAC 权限控制
- 操作审计日志（所有操作可追溯）
- 密码 bcrypt 加密
- 速率限制和防刷
- CORS 和 Helmet 安全头
- 环境变量配置敏感信息

## 📚 文档

- [部署指南](DEPLOYMENT.md)
- [计分引擎文档](server/docs/score-engine.md)
- [项目总结](docs/PROJECT_SUMMARY.md)
- [快速启动](QUICKSTART.md)

## 🧪 测试

### 单元测试
```bash
cd server
npm test
```

### 测试计分引擎
```bash
cd server
npm run test:score-engine
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🏅 版本历史

- **v2.0.0-pro** (2026-02-20)
  - ✅ 篮球/足球专项计分引擎
  - ✅ 高精度计时系统（10ms）
  - ✅ 数据分析模块
  - ✅ 操作审计日志系统
  - ✅ 8个前端页面完整实现
  - ✅ Docker容器化部署
  - ✅ 完整API接口文档
  - ✅ TypeScript类型安全

---

<div align="center">
  <sub>Built with ❤️ by the Event Control Team</sub>
  <p><strong>专业 · 稳定 · 实时</strong></p>
</div>
