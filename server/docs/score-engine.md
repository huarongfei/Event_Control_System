# 计分引擎

## 概述

计分引擎模块提供了篮球和足球专项计分功能，包含规则校验、历史记录和统计分析功能。

## 架构

### 核心组件

1. **BaseScoreEngine** - 计分引擎基类
2. **BasketballScoreEngine** - 篮球计分引擎
3. **FootballScoreEngine** - 足球计分引擎
4. **ScoreEngineFactory** - 计分引擎工厂

## 功能特性

### 篮球计分引擎

#### 得分类型
- **罚球命中** (FREE_THROW_MAKE) - 1分
- **罚球未中** (FREE_THROW_MISS) - 0分
- **两分球命中** (TWO_POINT_MAKE) - 2分
- **两分球未中** (TWO_POINT_MISS) - 0分
- **三分球命中** (THREE_POINT_MAKE) - 3分
- **三分球未中** (THREE_POINT_MISS) - 0分

#### 规则校验
- 进攻时钟规则（24秒）
- 罚球状态检测（Bonus/Double Bonus）
- 犯规上限控制（每节5次）
- 球员犯满离场（6次犯规）
- 暂停次数管理

#### 统计功能
- 投篮命中率（FG%）
- 三分命中率（3P%）
- 罚球命中率（FT%）
- 犯规统计
- 暂停统计

### 足球计分引擎

#### 得分类型
- **进球** (GOAL) - 1分
- **点球进球** (PENALTY_GOAL) - 1分
- **乌龙球** (OWN_GOAL) - 1分（对方得分）
- **点球未进** (MISSED_PENALTY) - 0分

#### 规则校验
- 越位规则
- 黄牌累积规则（2张=红牌）
- 红牌直接罚下
- 场上人数限制（最少7人）

#### 统计功能
- 进球统计
- 点球命中率
- 黄牌/红牌统计
- 场上人数统计
- 换人记录

## API 接口

### 基础得分操作

#### 添加得分事件
```http
POST /api/score-engine/matches/:matchId/score-events
```

请求体：
```json
{
  "team": "home",
  "eventType": "two_point_make",
  "playerId": "player123",
  "playerName": "Player Name",
  "playerNumber": 23,
  "period": 1,
  "shotClock": 10,
  "metadata": {}
}
```

#### 撤销事件
```http
DELETE /api/score-engine/matches/:matchId/score-events/:eventId
```

#### 获取得分历史
```http
GET /api/score-engine/matches/:matchId/score-history
```

#### 获取比赛统计
```http
GET /api/score-engine/matches/:matchId/stats
```

### 时钟控制

#### 更新比赛时钟
```http
PUT /api/score-engine/matches/:matchId/game-clock
```

请求体：
```json
{
  "gameClock": 600,
  "shotClock": 24
}
```

#### 重置进攻时钟（篮球）
```http
POST /api/score-engine/matches/:matchId/reset-shot-clock
```

请求体：
```json
{
  "type": "full" // 或 "offensive_rebound"
}
```

### 犯规和暂停

#### 记录犯规
```http
POST /api/score-engine/matches/:matchId/foul
```

请求体：
```json
{
  "team": "home",
  "playerId": "player123",
  "foulType": "technical" // 可选: "technical", "flagrant"
}
```

#### 记录暂停
```http
POST /api/score-engine/matches/:matchId/timeout
```

请求体：
```json
{
  "team": "home"
}
```

### 足球特定操作

#### 记录黄牌
```http
POST /api/score-engine/matches/:matchId/yellow-card
```

请求体：
```json
{
  "team": "home",
  "playerId": "player123",
  "playerName": "Player Name",
  "playerNumber": 4
}
```

#### 记录红牌
```http
POST /api/score-engine/matches/:matchId/red-card
```

请求体：
```json
{
  "team": "home",
  "playerId": "player123",
  "playerName": "Player Name",
  "playerNumber": 4
}
```

## 使用示例

### 创建篮球计分引擎

```typescript
import { ScoreEngineFactory, SportEngine } from './engines/index.js';

const matchContext = {
  sport: SportEngine.BASKETBALL,
  currentPeriod: 1,
  periodDuration: 720,
  gameClock: 600,
  isOvertime: false,
  homeScore: 0,
  awayScore: 0,
  homeFouls: 0,
  awayFouls: 0,
  homeTimeouts: 3,
  awayTimeouts: 3,
  periodScores: []
};

const engine = ScoreEngineFactory.createBasketballEngine(matchContext);

// 记录两分球
const event = engine.addScoreEvent({
  matchId: 'match-123',
  team: 'home',
  eventType: ScoreEventType.TWO_POINT_MAKE,
  points: 2,
  playerId: 'player-001',
  playerName: 'Stephen Curry',
  playerNumber: 30,
  period: 1,
  gameClock: 600,
  shotClock: 8,
  metadata: {}
});

console.log(`得分: ${event.points}, 主队总分: ${engine.getMatchContext().homeScore}`);
```

### 创建足球计分引擎

```typescript
import { ScoreEngineFactory, SportEngine } from './engines/index.js';

const matchContext = {
  sport: SportEngine.FOOTBALL,
  currentPeriod: 1,
  periodDuration: 2700,
  gameClock: 1800,
  isOvertime: false,
  homeScore: 0,
  awayScore: 0,
  homeFouls: 0,
  awayFouls: 0,
  homeTimeouts: 0,
  awayTimeouts: 0,
  periodScores: []
};

const engine = ScoreEngineFactory.createFootballEngine(matchContext);

// 记录进球
const event = engine.addScoreEvent({
  matchId: 'match-456',
  team: 'home',
  eventType: ScoreEventType.GOAL,
  points: 1,
  playerId: 'player-001',
  playerName: 'Lionel Messi',
  playerNumber: 10,
  period: 1,
  gameClock: 1800,
  metadata: {}
});

console.log(`进球! 主队比分: ${engine.getMatchContext().homeScore}`);
```

### 自定义规则

```typescript
const engine = ScoreEngineFactory.createBasketballEngine(matchContext, {
  maxFoulsPerPeriod: 6,        // 每节6次犯规
  shotClockDuration: 30,       // 30秒进攻时钟
  freeThrowFoulLimit: 5        // 5次犯规进入罚球状态
});
```

### 获取统计

```typescript
// 篮球统计
const basketballStats = engine.getBasketballStats('home');
console.log({
  fieldGoalPercentage: basketballStats.fieldGoalPercentage,
  threePointPercentage: basketballStats.threePointPercentage,
  freeThrowPercentage: basketballStats.freeThrowPercentage,
  isInBonus: basketballStats.isInBonus,
  fouls: basketballStats.fouls,
  timeouts: basketballStats.timeouts
});

// 足球统计
const footballStats = engine.getFootballStats('home');
console.log({
  goals: footballStats.goals,
  yellowCards: footballStats.yellowCards,
  redCards: footballStats.redCards,
  playersOnField: footballStats.playersOnField,
  penaltyConversionRate: footballStats.penaltyConversionRate
});
```

### 撤销事件

```typescript
// 撤销最后一次得分事件
const history = engine.getScoreHistory();
const lastEvent = history.events[history.events.length - 1];
const success = engine.undoEvent(lastEvent.id);

if (success) {
  console.log('事件已撤销');
}
```

## 规则配置

### 篮球默认规则

```typescript
const defaultBasketballRules = {
  maxFoulsPerPeriod: 5,           // 每节最多5次犯规
  maxFoulsPerPlayer: 6,          // 每个球员最多6次犯规
  freeThrowFoulLimit: 4,          // 4次犯规进入罚球状态
  shotClockDuration: 24,          // 24秒进攻时钟
  shotClockResetOnOffensiveRebound: 14, // 进攻篮板重置为14秒
  bonusFoulThreshold: 5,          // Bonus犯规阈值
  doubleBonusFoulThreshold: 8     // Double Bonus犯规阈值
};
```

### 足球默认规则

```typescript
const defaultFootballRules = {
  maxYellowCardsBeforeRed: 2,     // 2张黄牌=红牌
  directRedCardEjection: true,    // 红牌直接罚下
  offsideRule: true,              // 启用越位规则
  extraTimePenaltyFormat: 'full_time' // 加时赛点球决胜方式
};
```

## 测试

运行单元测试：

```bash
npm test
```

测试覆盖：
- ✓ 得分事件添加和校验
- ✓ 犯规和暂停处理
- ✓ 统计计算
- ✓ 事件撤销
- ✓ 规则验证
- ✓ 自定义规则支持

## 错误处理

### 常见错误

1. **无效的得分事件类型**
   ```json
   {
     "success": false,
     "message": "不支持的得分事件类型: xxx"
   }
   ```

2. **缺少必要参数**
   ```json
   {
     "success": false,
     "message": "此操作需要指定球员"
   }
   ```

3. **规则违规**
   ```json
   {
     "success": false,
     "message": "越位，进球无效"
   }
   ```

4. **暂停次数用尽**
   ```json
   {
     "success": false,
     "message": "主队没有剩余暂停次数"
   }
   ```

## 性能优化

- 使用内存缓存存储计分引擎实例
- 事件历史支持分页查询
- 统计数据实时计算并缓存

## 未来扩展

- [ ] 冰球计分引擎
- [ ] 电竞计分引擎
- [ ] 实时分析功能
- [ ] AI预测支持
