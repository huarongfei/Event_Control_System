# Event Control System v2.0.0-pro

企业级赛事计分、计时、得分分析与大屏投放控制系统

## 🏆 系统概述

Event Control System 是一款专为专业体育赛事设计的完整解决方案，提供从计分计时到数据分析和大屏投放的全套功能。系统采用微服务化单体架构，确保在高并发场景下的稳定性和实时性。

## ✨ 核心特性

### 🎮 多角色权限管理
- 基于 RBAC 的权限控制模型
- 支持 6 种预设角色：超级管理员、赛事运维、计时员、计分员、解说员、导播
- 操作日志留痕，所有数据变更可追溯
- JWT 认证 + Redis 会话管理

### 🏟️ 赛事全周期管理
- 支持篮球、足球、冰球、电竞（MOBA类）等多种运动类型
- 完整的赛事生命周期管理：创建、配置、进行中、结束
- 多赛事并行管理，独立锁定机制
- WebSocket 实时状态同步

### 📊 专业计分板系统
- **篮球专项**：1/2/3分计分、个人/全队犯规、暂停管理、24秒计时器
- **足球专项**：进球记录、红黄牌、伤停补时、换人管理
- 三级操作撤回机制，防止误触
- 支持比分快照保存

### ⏱️ 毫秒级计时系统
- 毫秒级精度计时引擎
- 倒计时/正计时模式切换
- 硬件物理按键控制接口（串口/网络）
- NTP 时间同步，确保多终端时间一致性

### 📈 实时数据分析
- 个人技术统计（得分、篮板、助攻等）
- 团队数据对比（投篮命中率、控球率等）
- 比分变化曲线、球员热区图、控球时间轴
- 赛后自动生成 PDF 分析报告

### 🎬 大屏导播控制
- 多场景布局模板（全屏比分、比分+统计、画中画等）
- 支持 4K/8K 分辨率输出
- 外部视频源接入（HDMI/SDI采集卡）
- PTP/NTP 帧级同步机制
- 一键黑屏/冻结画面等紧急预案

### 🔗 第三方系统集成
- LED 控制卡协议（NovaStar/Linsn）
- 专业计时设备对接（Omega/Swiss Timing）
- 官方数据 API 推送
- 鹰眼系统/门线技术信号接入

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript + Vite
- **UI 组件**: Ant Design Pro + Ant Design Icons
- **状态管理**: Zustand + React Query
- **实时通信**: Socket.io-client
- **图表**: ECharts + Recharts
- **样式**: Tailwind CSS + CSS Modules

### 后端
- **运行时**: Node.js 20 LTS
- **框架**: Express.js 4.x + TypeScript
- **实时通信**: Socket.io 4.x
- **数据库**: MongoDB 6.x（主数据）+ Redis 7.x（缓存/实时数据）
- **认证**: JWT + bcrypt + Redis 会话管理
- **部署**: Docker + Docker Compose

## 📦 项目结构

```
Event_Control_System/
├── client/                           # 前端项目
│   ├── src/
│   │   ├── components/               # 公共组件
│   │   ├── pages/                    # 页面
│   │   ├── stores/                   # 状态管理
│   │   ├── services/                 # API 服务
│   │   └── App.tsx                   # 根组件
│   ├── package.json
│   └── vite.config.ts
├── server/                           # 后端项目
│   ├── src/
│   │   ├── config/                   # 配置文件
│   │   ├── controllers/              # 控制器
│   │   ├── models/                   # 数据模型
│   │   ├── middleware/               # 中间件
│   │   ├── sockets/                  # WebSocket 处理
│   │   ├── routes/                   # 路由
│   │   └── app.ts                    # 入口文件
│   ├── package.json
│   └── tsconfig.json
├── shared/                           # 共享类型和常量
│   └── types/
└── docker-compose.yml                # Docker 编排
```

## 🚀 快速开始

### 前置要求

- Node.js 20 LTS 或更高版本
- MongoDB 6.x
- Redis 7.x

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd Event_Control_System
```

2. **安装依赖**
```bash
npm run install:all
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. **启动数据库服务**
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:6

# Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

5. **启动应用**
```bash
# 开发模式（同时启动前端和后端）
npm run dev

# 或分别启动
npm run dev:server  # 后端
npm run dev:client  # 前端
```

6. **访问应用**
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001
- API 文档: http://localhost:3001/api/health

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
  "role": "score_operator"
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

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | 3001 |
| `MONGODB_URI` | MongoDB 连接字符串 | mongodb://localhost:27017/event-control |
| `REDIS_URL` | Redis 连接字符串 | redis://localhost:6379 |
| `JWT_SECRET` | JWT 签名密钥 | your-secret-key-change-in-production |
| `JWT_EXPIRES_IN` | Token 过期时间 | 24h |
| `CLIENT_URL` | 前端 URL | http://localhost:5173 |

## 🐳 Docker 部署

### 构建镜像
```bash
docker-compose build
```

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

## 📊 性能指标

- **响应延迟**: < 100ms（操作端到屏幕显示）
- **并发支持**: 50+ 操作端同时连接
- **可用性**: 7×24 小时连续运行
- **数据同步**: WebSocket 实时通信，Redis Pub/Sub 消息总线

## 🧪 测试

### 单元测试
```bash
cd server
npm test
```

### 集成测试
```bash
# 启动测试环境
npm run test:integration
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🆘 技术支持

- 📧 邮箱: support@eventcontrol.com
- 💬 论坛: https://forum.eventcontrol.com
- 📚 文档: https://docs.eventcontrol.com

## 🏅 版本历史

- **v2.0.0-pro** (2026-02-20)
  - 企业级版本发布
  - 完整的计分计时系统
  - 实时数据分析功能
  - 大屏导播控制
  - 多角色权限管理

---

<div align="center">
  <sub>Built with ❤️ by the Event Control Team</sub>
  <p><strong>专业 · 稳定 · 实时</strong></p>
</div>
