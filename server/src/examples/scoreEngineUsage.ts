/**
 * 计分引擎使用示例
 */

import {
  ScoreEngineFactory,
  SportEngine,
  ScoreEventType,
  MatchContext
} from '../engines/index.js';

// ==================== 篮球示例 ====================

console.log('=== 篮球计分引擎示例 ===\n');

// 1. 创建比赛上下文
const basketballMatchContext: MatchContext = {
  sport: SportEngine.BASKETBALL,
  currentPeriod: 1,
  periodDuration: 720, // 12分钟 = 720秒
  gameClock: 600,      // 比赛剩余时间（秒）
  isOvertime: false,
  homeScore: 0,
  awayScore: 0,
  homeFouls: 0,
  awayFouls: 0,
  homeTimeouts: 3,
  awayTimeouts: 3,
  periodScores: []
};

// 2. 创建篮球计分引擎
const basketballEngine = ScoreEngineFactory.createBasketballEngine(basketballMatchContext, {
  maxFoulsPerPeriod: 5,
  shotClockDuration: 24,
  freeThrowFoulLimit: 4
});

// 3. 记录两分球命中
console.log('1. 记录两分球命中（主队）');
const twoPointEvent = basketballEngine.addScoreEvent({
  matchId: 'basketball-match-001',
  team: 'home',
  eventType: ScoreEventType.TWO_POINT_MAKE,
  points: 2,
  playerId: 'player-001',
  playerName: 'Stephen Curry',
  playerNumber: 30,
  period: 1,
  gameClock: 600,
  shotClock: 8,
  metadata: { isFastBreak: true }
});
console.log(`   结果: ${twoPointEvent.isValid ? '✓' : '✗'} ${twoPointEvent.validationError || ''}`);
console.log(`   主队得分: ${basketballEngine.getMatchContext().homeScore}\n`);

// 4. 记录三分球命中
console.log('2. 记录三分球命中（客队）');
const threePointEvent = basketballEngine.addScoreEvent({
  matchId: 'basketball-match-001',
  team: 'away',
  eventType: ScoreEventType.THREE_POINT_MAKE,
  points: 3,
  playerId: 'player-002',
  playerName: 'Kevin Durant',
  playerNumber: 7,
  period: 1,
  gameClock: 580,
  shotClock: 5,
  metadata: {}
});
console.log(`   结果: ${threePointEvent.isValid ? '✓' : '✗'}`);
console.log(`   客队得分: ${basketballEngine.getMatchContext().awayScore}\n`);

// 5. 记录犯规
console.log('3. 记录主队犯规');
basketballEngine.recordFoul('home', 'player-003');
console.log(`   主队犯规次数: ${basketballEngine.getMatchContext().homeFouls}\n`);

// 6. 检查罚球状态
console.log('4. 检查罚球状态');
const isInBonus = basketballEngine.isInBonus('home');
console.log(`   主队是否进入罚球状态: ${isInBonus ? '是' : '否'}\n`);

// 7. 记录暂停
console.log('5. 记录主队暂停');
const timeoutEvent = basketballEngine.addScoreEvent({
  matchId: 'basketball-match-001',
  team: 'home',
  eventType: ScoreEventType.TIMEOUT,
  points: 0,
  period: 1,
  gameClock: 500,
  metadata: {}
});
console.log(`   主队剩余暂停: ${basketballEngine.getMatchContext().homeTimeouts}\n`);

// 8. 获取统计数据
console.log('6. 获取主队统计数据');
const homeStats = basketballEngine.getBasketballStats('home');
console.log(`   投篮命中率: ${homeStats.fieldGoalPercentage}%`);
console.log(`   三分命中率: ${homeStats.threePointPercentage}%`);
console.log(`   罚球命中率: ${homeStats.freeThrowPercentage}%`);
console.log(`   犯规次数: ${homeStats.fouls}`);
console.log(`   剩余暂停: ${homeStats.timeouts}\n`);

// 9. 获取得分历史
console.log('7. 获取得分历史');
const history = basketballEngine.getScoreHistory();
console.log(`   总事件数: ${history.summary.totalEvents}`);
console.log(`   按类型统计:`, history.summary.byType);
console.log(`   按节次统计:`, history.summary.byPeriod);

// ==================== 足球示例 ====================

console.log('\n\n=== 足球计分引擎示例 ===\n');

// 1. 创建比赛上下文
const footballMatchContext: MatchContext = {
  sport: SportEngine.FOOTBALL,
  currentPeriod: 1,
  periodDuration: 2700, // 45分钟 = 2700秒
  gameClock: 1800,      // 比赛进行时间（秒）
  isOvertime: false,
  homeScore: 0,
  awayScore: 0,
  homeFouls: 0,
  awayFouls: 0,
  homeTimeouts: 0,
  awayTimeouts: 0,
  periodScores: []
};

// 2. 创建足球计分引擎
const footballEngine = ScoreEngineFactory.createFootballEngine(footballMatchContext, {
  maxYellowCardsBeforeRed: 2,
  offsideRule: true
});

// 3. 记录进球
console.log('1. 记录进球（主队）');
const goalEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'home',
  eventType: ScoreEventType.GOAL,
  points: 1,
  playerId: 'player-001',
  playerName: 'Lionel Messi',
  playerNumber: 10,
  period: 1,
  gameClock: 1800,
  metadata: { isLeftFoot: true }
});
console.log(`   结果: ${goalEvent.isValid ? '✓' : '✗'}`);
console.log(`   主队得分: ${footballEngine.getMatchContext().homeScore}\n`);

// 4. 记录黄牌
console.log('2. 记录黄牌（客队）');
const yellowCardEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'away',
  eventType: ScoreEventType.YELLOW_CARD,
  points: 0,
  playerId: 'player-002',
  playerName: 'Cristiano Ronaldo',
  playerNumber: 7,
  period: 1,
  gameClock: 1700,
  metadata: {}
});
console.log(`   结果: ${yellowCardEvent.isValid ? '✓' : '✗'}`);
console.log(`   客队黄牌: ${footballEngine.getTeamYellowCards('away')}\n`);

// 5. 第二张黄牌（自动红牌）
console.log('3. 第二张黄牌（自动转为红牌）');
const secondYellowEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'away',
  eventType: ScoreEventType.YELLOW_CARD,
  points: 0,
  playerId: 'player-002',
  playerName: 'Cristiano Ronaldo',
  playerNumber: 7,
  period: 1,
  gameClock: 1600,
  metadata: {}
});
console.log(`   结果: ${secondYellowEvent.isValid ? '✓' : '✗'}`);
console.log(`   球员是否被罚下: ${footballEngine.isPlayerSentOff('player-002') ? '是' : '否'}`);
console.log(`   客队红牌: ${footballEngine.getTeamRedCards('away')}\n`);

// 6. 记录乌龙球
console.log('4. 记录乌龙球（主队）');
const ownGoalEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'home',
  eventType: ScoreEventType.OWN_GOAL,
  points: 1,
  playerId: 'player-003',
  playerName: 'Defender',
  playerNumber: 4,
  period: 1,
  gameClock: 1500,
  metadata: {}
});
console.log(`   结果: ${ownGoalEvent.isValid ? '✓' : '✗'}`);
console.log(`   主队得分: ${footballEngine.getMatchContext().homeScore}`);
console.log(`   客队得分: ${footballEngine.getMatchContext().awayScore}（乌龙球给对方加分）\n`);

// 7. 记录点球
console.log('5. 记录点球进球（客队）');
const penaltyGoalEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'away',
  eventType: ScoreEventType.PENALTY_GOAL,
  points: 1,
  playerId: 'player-004',
  playerName: 'Penalty Taker',
  playerNumber: 9,
  period: 2,
  gameClock: 2700,
  metadata: {}
});
console.log(`   结果: ${penaltyGoalEvent.isValid ? '✓' : '✗'}`);
console.log(`   客队得分: ${footballEngine.getMatchContext().awayScore}\n`);

// 8. 获取足球统计
console.log('6. 获取客队统计数据');
const awayStats = footballEngine.getFootballStats('away');
console.log(`   进球数: ${awayStats.goals}`);
console.log(`   黄牌: ${awayStats.yellowCards}`);
console.log(`   红牌: ${awayStats.redCards}`);
console.log(`   场上球员: ${awayStats.playersOnField}人`);
console.log(`   点球命中率: ${awayStats.penaltyConversionRate}%\n`);

// 9. 越位检查
console.log('7. 越位检查示例');
const offsideGoalEvent = footballEngine.addScoreEvent({
  matchId: 'football-match-001',
  team: 'home',
  eventType: ScoreEventType.GOAL,
  points: 1,
  playerId: 'player-005',
  playerName: 'Striker',
  playerNumber: 9,
  period: 2,
  gameClock: 2600,
  metadata: { isOffside: true }
});
console.log(`   结果: ${offsideGoalEvent.isValid ? '✓' : '✗'}`);
console.log(`   错误: ${offsideGoalEvent.validationError}\n`);

// ==================== 事件撤销示例 ====================

console.log('=== 事件撤销示例 ===\n');

console.log('1. 撤销最后一个事件');
const allHistory = footballEngine.getScoreHistory();
const lastEvent = allHistory.events[allHistory.events.length - 1];
console.log(`   要撤销的事件: ${lastEvent.eventType} (${lastEvent.team})`);

const success = footballEngine.undoEvent(lastEvent.id);
console.log(`   撤销${success ? '成功' : '失败'}`);
console.log(`   当前得分: ${footballEngine.getMatchContext().homeScore} - ${footballEngine.getMatchContext().awayScore}\n`);

// ==================== 批量操作示例 ====================

console.log('=== 批量操作示例 ===\n');

console.log('1. 模拟一节比赛的得分');
const quarterEvents = [
  { team: 'home', type: ScoreEventType.TWO_POINT_MAKE, points: 2 },
  { team: 'away', type: ScoreEventType.TWO_POINT_MAKE, points: 2 },
  { team: 'home', type: ScoreEventType.THREE_POINT_MAKE, points: 3 },
  { team: 'home', type: ScoreEventType.FREE_THROW_MAKE, points: 1 },
  { team: 'away', type: ScoreEventType.TWO_POINT_MAKE, points: 2 },
];

let gameTime = 720;
quarterEvents.forEach((eventData, index) => {
  const event = basketballEngine.addScoreEvent({
    matchId: 'basketball-match-002',
    team: eventData.team as 'home' | 'away',
    eventType: eventData.type,
    points: eventData.points,
    playerId: `player-${index + 1}`,
    period: 2,
    gameClock: gameTime,
    shotClock: 24,
    metadata: {}
  });

  console.log(`   ${index + 1}. ${eventData.team} ${eventData.eventType} (${eventData.points}分) - ${event.isValid ? '✓' : '✗'}`);
  gameTime -= 60;
});

const context = basketballEngine.getMatchContext();
console.log(`\n   最终比分: 主队 ${context.homeScore} - 客队 ${context.awayScore}\n`);

console.log('=== 示例结束 ===');
