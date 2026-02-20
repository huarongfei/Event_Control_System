# Event Control System 部署指南

## 前置要求

- Node.js 20 LTS 或更高版本
- Docker 和 Docker Compose
- MongoDB 6.x
- Redis 7.x

## 本地开发部署

### 1. 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或者分别安装
npm install
cd client && npm install
cd ../server && npm install
```

### 2. 配置环境变量

```bash
# 创建 .env 文件
cat > .env << EOF
# 服务器配置
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/event-control
MONGO_USERNAME=admin
MONGO_PASSWORD=password123
MONGO_DATABASE=event_control

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-secret-key-change-in-production-use-32-chars-or-more
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# 前端
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
CLIENT_URL=http://localhost:5173
EOF
```

### 3. 启动数据库

```bash
# MongoDB
docker run -d \
  --name event-control-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:6

# Redis
docker run -d \
  --name event-control-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 4. 启动应用

```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:server  # 后端: http://localhost:3001
npm run dev:client  # 前端: http://localhost:5173
```

### 5. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001
- API 健康检查: http://localhost:3001/api/health

## Docker 部署

### 1. 使用 Docker Compose

```bash
# 配置环境变量
cp .env.docker .env
# 编辑 .env 文件，修改默认密码

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

### 2. 服务说明

Docker Compose 启动以下服务：

- **mongodb**: MongoDB 7.0 数据库
  - 端口: 27017
  - 数据卷: mongodb_data

- **redis**: Redis 7.2 缓存
  - 端口: 6379
  - 数据卷: redis_data

- **server**: 后端服务
  - 端口: 3001
  - 依赖: mongodb, redis

- **client**: 前端服务（Nginx）
  - 端口: 80
  - 依赖: server

- **nginx**: 反向代理（生产环境）
  - 端口: 443, 8080
  - 依赖: client, server

### 3. 生产环境配置

生产环境使用 Nginx 反向代理，包含以下配置：

- HTTPS 支持
- SSL/TLS 配置
- Gzip 压缩
- 静态资源缓存
- 安全头部

```bash
# 启动生产环境
docker-compose --profile production up -d

# 确保有以下文件:
# - nginx/nginx.conf
# - nginx/ssl/fullchain.pem
# - nginx/ssl/privkey.pem
```

## PM2 部署

### 1. 安装 PM2

```bash
npm install -g pm2
```

### 2. 创建 PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'event-control-server',
      script: './server/dist/app.js',
      cwd: './server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
};
```

### 3. 启动应用

```bash
# 构建项目
cd server
npm run build
cd ..

# 启动 PM2
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启
pm2 restart event-control-server

# 停止
pm2 stop event-control-server
```

## 性能优化

### 1. 数据库优化

```bash
# MongoDB 连接池配置
MONGODB_URI=mongodb://user:pass@host:27017/db?poolSize=20&maxIdleTimeMS=30000

# Redis 连接池配置
REDIS_URL=redis://host:6379?max_retries=3&retry_strategy=delay
```

### 2. Node.js 优化

```bash
# 设置环境变量
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. 负载均衡

```nginx
# Nginx 负载均衡配置
upstream backend {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## 监控和日志

### 1. 应用日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f server
docker-compose logs -f client
```

### 2. 数据库日志

```bash
# MongoDB 日志
docker logs event-control-mongodb

# Redis 日志
docker logs event-control-redis
```

### 3. 审计日志

```bash
# 导出审计日志
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/audit/export > audit-logs.json
```

## 备份和恢复

### 1. MongoDB 备份

```bash
# 备份
docker exec event-control-mongodb mongodump --db event-control --out /backup

# 恢复
docker exec event-control-mongodb mongorestore /backup/event-control
```

### 2. Redis 备份

```bash
# 备份
docker exec event-control-redis redis-cli SAVE
docker cp event-control-redis:/data/dump.rdb ./redis-backup.rdb

# 恢复
docker cp ./redis-backup.rdb event-control-redis:/data/dump.rdb
docker exec event-control-redis redis-cli --rdb /data/dump.rdb
```

## 故障排查

### 1. 常见问题

**问题**: 无法连接 MongoDB
```bash
# 检查 MongoDB 是否运行
docker ps | grep mongodb

# 检查日志
docker logs event-control-mongodb

# 重启 MongoDB
docker restart event-control-mongodb
```

**问题**: 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep 3001

# 修改端口
export PORT=3002
```

**问题**: 审计日志过多
```bash
# 清理旧日志（保留30天）
curl -X POST http://localhost:3001/api/audit/cleanup \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30}'
```

### 2. 健康检查

```bash
# API 健康检查
curl http://localhost:3001/api/health

# WebSocket 检查
wscat -c ws://localhost:3001/socket.io/?EIO=4&transport=websocket

# 数据库检查
mongosh mongodb://admin:password123@localhost:27017/event-control
```

## 安全建议

1. **修改默认密码**
   - 修改 .env 中的所有默认密码
   - 使用强密码（至少16位）

2. **启用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 重定向

3. **限制访问**
   - 配置防火墙规则
   - 限制数据库远程访问

4. **定期备份**
   - 设置自动备份任务
   - 验证备份完整性

5. **监控和告警**
   - 配置监控指标
   - 设置告警阈值

## 更新和维护

### 1. 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

### 2. 清理旧数据

```bash
# 清理 Docker 镜像
docker image prune -a

# 清理 Docker 卷
docker volume prune

# 清理审计日志（自动90天清理）
# 或手动清理:
curl -X POST http://localhost:3001/api/audit/cleanup \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 30}'
```

## 支持

如有问题，请联系：

- 📧 邮箱: support@eventcontrol.com
- 📚 文档: https://docs.eventcontrol.com
- 💬 论坛: https://forum.eventcontrol.com
