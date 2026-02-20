/**
 * 计分引擎类型定义
 */

export enum SportEngine {
  BASKETBALL = 'basketball',
  FOOTBALL = 'football'
}

export enum ScoreEventType {
  // 篮球得分事件
  FREE_THROW_MAKE = 'free_throw_make',
  FREE_THROW_MISS = 'free_throw_miss',
  TWO_POINT_MAKE = 'two_point_make',
  TWO_POINT_MISS = 'two_point_miss',
  THREE_POINT_MAKE = 'three_point_make',
  THREE_POINT_MISS = 'three_point_miss',

  // 足球得分事件
  GOAL = 'goal',
  PENALTY_GOAL = 'penalty_goal',
  OWN_GOAL = 'own_goal',
  MISSED_PENALTY = 'missed_penalty',

  // 其他事件
  TIMEOUT = 'timeout',
  SUBSTITUTION = 'substitution',
  FOUL = 'foul',
  TECHNICAL_FOUL = 'technical_foul',
  FLAGRANT_FOUL = 'flagrant_foul',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card'
}

export interface ScoreEvent {
  id: string;
  matchId: string;
  team: 'home' | 'away';
  eventType: ScoreEventType;
  points: number;
  playerId?: string;
  playerName?: string;
  playerNumber?: number;
  period: number;
  timestamp: Date; // 比赛时间戳
  gameClock: number; // 比赛时钟（秒）
  shotClock?: number; // 进攻时钟（秒，仅篮球）
  isValid: boolean;
  validationError?: string;
  metadata: Record<string, any>;
}

export interface ScoreRule {
  sport: SportEngine;
  eventType: ScoreEventType;
  points: number;
  requiresPlayer: boolean;
  requiresShotClock: boolean;
  allowedPeriods: number[];
  validation?: (event: ScoreEvent, context: MatchContext) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface MatchContext {
  sport: SportEngine;
  currentPeriod: number;
  periodDuration: number;
  gameClock: number;
  shotClock?: number;
  isOvertime: boolean;
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  homeTimeouts: number;
  awayTimeouts: number;
  periodScores: Array<{ period: number; home: number; away: number }>;
}

export interface ScoreHistory {
  matchId: string;
  sport: SportEngine;
  events: ScoreEvent[];
  summary: {
    totalEvents: number;
    byPeriod: Array<{ period: number; homeEvents: number; awayEvents: number }>;
    byType: Record<ScoreEventType, number>;
  };
}

export interface RuleViolation {
  type: 'foul' | 'violation' | 'technical';
  severity: 'warning' | 'personal' | 'technical' | 'flagrant';
  team: 'home' | 'away';
  playerId?: string;
  description: string;
  period: number;
  gameClock: number;
}

// 篮球特定规则
export interface BasketballRules {
  maxFoulsPerPeriod: number;
  maxFoulsPerPlayer: number;
  freeThrowFoulLimit: number; // 超过此犯规次数每犯规送两次罚球
  shotClockDuration: number;
  shotClockResetOnOffensiveRebound: number;
  bonusFoulThreshold: number;
  doubleBonusFoulThreshold: number;
}

// 足球特定规则
export interface FootballRules {
  maxYellowCardsBeforeRed: number;
  directRedCardEjection: boolean;
  offsideRule: boolean;
  extraTimePenaltyFormat: 'golden_goal' | 'silver_goal' | 'full_time';
}

export interface EngineConfig {
  sport: SportEngine;
  rules: BasketballRules | FootballRules;
  enableAutoValidation: boolean;
  enableShotClock: boolean;
}
