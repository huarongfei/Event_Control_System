/**
 * 计分引擎单元测试
 */
import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ScoreEngineFactory,
  SportEngine,
  ScoreEventType,
  BasketballScoreEngine,
  FootballScoreEngine
} from '../engines/index.js';

describe('BasketballScoreEngine', () => {
  let engine: BasketballScoreEngine;
  let matchContext: any;

  beforeEach(() => {
    matchContext = {
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
      periodScores: [],
      shotClock: 24
    };

    engine = ScoreEngineFactory.createBasketballEngine(matchContext);
  });

  test('应该正确记录两分球命中', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.TWO_POINT_MAKE,
      points: 2,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 23,
      period: 1,
      gameClock: 600,
      shotClock: 10,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(event.points).toBe(2);
    expect(engine.getMatchContext().homeScore).toBe(2);
  });

  test('应该正确记录三分球命中', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'away',
      eventType: ScoreEventType.THREE_POINT_MAKE,
      points: 3,
      playerId: 'player2',
      playerName: 'Player 2',
      playerNumber: 24,
      period: 1,
      gameClock: 600,
      shotClock: 5,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(event.points).toBe(3);
    expect(engine.getMatchContext().awayScore).toBe(3);
  });

  test('应该正确记录罚球命中', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.FREE_THROW_MAKE,
      points: 1,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 23,
      period: 1,
      gameClock: 600,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(event.points).toBe(1);
    expect(engine.getMatchContext().homeScore).toBe(1);
  });

  test('应该拒绝无效的投篮事件（缺少进攻时钟）', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.TWO_POINT_MAKE,
      points: 2,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 23,
      period: 1,
      gameClock: 600,
      metadata: {}
    });

    expect(event.isValid).toBe(false);
    expect(event.validationError).toContain('进攻时钟');
  });

  test('应该正确处理犯规并更新状态', () => {
    engine.recordFoul('home', 'player1');

    const context = engine.getMatchContext();
    expect(context.homeFouls).toBe(1);
  });

  test('应该正确检测罚球状态', () => {
    // 添加4次犯规
    for (let i = 0; i < 4; i++) {
      engine.recordFoul('home', `player${i}`);
    }

    expect(engine.isInBonus('home')).toBe(true);
  });

  test('应该正确计算投篮命中率', () => {
    // 添加命中和未中
    engine.addScoreEvent({
      matchId: 'test',
      team: 'home',
      eventType: ScoreEventType.TWO_POINT_MAKE,
      points: 2,
      playerId: 'p1',
      period: 1,
      gameClock: 600,
      shotClock: 10,
      metadata: {}
    });

    engine.addScoreEvent({
      matchId: 'test',
      team: 'home',
      eventType: ScoreEventType.TWO_POINT_MISS,
      points: 0,
      playerId: 'p1',
      period: 1,
      gameClock: 600,
      shotClock: 10,
      metadata: {}
    });

    const percentage = engine.getTeamFieldGoalPercentage('home');
    expect(percentage).toBe(50);
  });

  test('应该能够撤销事件', () => {
    const event = engine.addScoreEvent({
      matchId: 'test',
      team: 'home',
      eventType: ScoreEventType.TWO_POINT_MAKE,
      points: 2,
      playerId: 'p1',
      period: 1,
      gameClock: 600,
      shotClock: 10,
      metadata: {}
    });

    expect(engine.getMatchContext().homeScore).toBe(2);

    engine.undoEvent(event.id);
    expect(engine.getMatchContext().homeScore).toBe(0);
  });

  test('应该正确处理暂停', () => {
    const event = engine.addScoreEvent({
      matchId: 'test',
      team: 'home',
      eventType: ScoreEventType.TIMEOUT,
      points: 0,
      period: 1,
      gameClock: 600,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(engine.getMatchContext().homeTimeouts).toBe(2);
  });

  test('应该拒绝超限的暂停请求', () => {
    // 用完所有暂停
    engine.recordTimeout('home');
    engine.recordTimeout('home');
    engine.recordTimeout('home');

    const event = engine.addScoreEvent({
      matchId: 'test',
      team: 'home',
      eventType: ScoreEventType.TIMEOUT,
      points: 0,
      period: 1,
      gameClock: 600,
      metadata: {}
    });

    expect(event.isValid).toBe(false);
    expect(event.validationError).toContain('暂停次数');
  });
});

describe('FootballScoreEngine', () => {
  let engine: FootballScoreEngine;
  let matchContext: any;

  beforeEach(() => {
    matchContext = {
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

    engine = ScoreEngineFactory.createFootballEngine(matchContext);
  });

  test('应该正确记录进球', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.GOAL,
      points: 1,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 9,
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(event.points).toBe(1);
    expect(engine.getMatchContext().homeScore).toBe(1);
  });

  test('应该正确记录点球进球', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'away',
      eventType: ScoreEventType.PENALTY_GOAL,
      points: 1,
      playerId: 'player2',
      playerName: 'Player 2',
      playerNumber: 10,
      period: 1,
      gameClock: 2400,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(event.points).toBe(1);
    expect(engine.getMatchContext().awayScore).toBe(1);
  });

  test('应该正确处理乌龙球', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.OWN_GOAL,
      points: 1,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 4,
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    // 乌龙球应该给对方加分
    expect(engine.getMatchContext().awayScore).toBe(1);
    expect(engine.getMatchContext().homeScore).toBe(0);
  });

  test('应该正确处理黄牌', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.YELLOW_CARD,
      points: 0,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 4,
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(engine.getTeamYellowCards('home')).toBe(1);
  });

  test('第二张黄牌应该自动转为红牌', () => {
    // 第一张黄牌
    engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.YELLOW_CARD,
      points: 0,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 4,
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    // 第二张黄牌
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.YELLOW_CARD,
      points: 0,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 4,
      period: 1,
      gameClock: 1500,
      metadata: {}
    });

    expect(event.isValid).toBe(true);
    expect(engine.isPlayerSentOff('player1')).toBe(true);
    expect(engine.getTeamRedCards('home')).toBe(1);
  });

  test('应该正确计算点球命中率', () => {
    // 点球命中
    engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.PENALTY_GOAL,
      points: 1,
      playerId: 'p1',
      period: 1,
      gameClock: 2400,
      metadata: {}
    });

    // 点球未进
    engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.MISSED_PENALTY,
      points: 0,
      playerId: 'p1',
      period: 1,
      gameClock: 2400,
      metadata: {}
    });

    const stats = engine.getFootballStats('home');
    expect(stats.penaltyConversionRate).toBe(50);
  });

  test('应该正确计算场上球员数量', () => {
    expect(engine.getPlayersOnField('home')).toBe(11);

    // 一张红牌
    engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.RED_CARD,
      points: 0,
      playerId: 'p1',
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    expect(engine.getPlayersOnField('home')).toBe(10);
  });

  test('应该拒绝越位进球', () => {
    const event = engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.GOAL,
      points: 1,
      playerId: 'player1',
      playerName: 'Player 1',
      playerNumber: 9,
      period: 1,
      gameClock: 1800,
      metadata: {
        isOffside: true
      }
    });

    expect(event.isValid).toBe(false);
    expect(event.validationError).toContain('越位');
  });

  test('应该正确获取足球统计数据', () => {
    // 进球
    engine.addScoreEvent({
      matchId: 'test-match',
      team: 'home',
      eventType: ScoreEventType.GOAL,
      points: 1,
      playerId: 'p1',
      period: 1,
      gameClock: 1800,
      metadata: {}
    });

    const stats = engine.getFootballStats('home');
    expect(stats.goals).toBe(1);
    expect(stats.yellowCards).toBe(0);
    expect(stats.redCards).toBe(0);
  });
});

describe('ScoreEngineFactory', () => {
  test('应该正确创建篮球引擎', () => {
    const context = {
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

    const engine = ScoreEngineFactory.createEngine(SportEngine.BASKETBALL, context);
    expect(engine).toBeInstanceOf(BasketballScoreEngine);
  });

  test('应该正确创建足球引擎', () => {
    const context = {
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

    const engine = ScoreEngineFactory.createEngine(SportEngine.FOOTBALL, context);
    expect(engine).toBeInstanceOf(FootballScoreEngine);
  });

  test('应该支持自定义规则', () => {
    const context = {
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

    const engine = ScoreEngineFactory.createBasketballEngine(context, {
      maxFoulsPerPeriod: 6, // 自定义规则
      shotClockDuration: 30
    });

    const stats = engine.getBasketballStats('home');
    expect(stats.shotClock).toBe(30);
  });
});
