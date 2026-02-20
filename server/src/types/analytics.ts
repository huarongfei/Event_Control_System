/**
 * 数据分析类型定义
 */

export enum MetricType {
  COUNTER = 'counter',           // 计数器
  GAUGE = 'gauge',               // 仪表盘
  HISTOGRAM = 'histogram',       // 直方图
  SUMMARY = 'summary',           // 摘要
  TREND = 'trend'                // 趋势
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface TimeSeries {
  metricId: string;
  metricName: string;
  dataPoints: DataPoint[];
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
  granularity: TimeGranularity;
}

export interface ComparisonData {
  label: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

export interface TeamStatistics {
  teamId: string;
  teamName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  homeWins: number;
  awayWins: number;
  currentStreak: number;
  longestWinStreak: number;
}

export interface PlayerStatistics {
  playerId: string;
  playerName: string;
  teamId: string;
  matches: number;
  totalPoints: number;
  avgPointsPerMatch: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  fieldGoals: {
    made: number;
    attempted: number;
    percentage: number;
  };
  threePointers: {
    made: number;
    attempted: number;
    percentage: number;
  };
  freeThrows: {
    made: number;
    attempted: number;
    percentage: number;
  };
}

export interface MatchAnalytics {
  matchId: string;
  sport: string;
  homeTeam: {
    id: string;
    name: string;
    score: number;
    statistics: any;
  };
  awayTeam: {
    id: string;
    name: string;
    score: number;
    statistics: any;
  };
  keyMoments: Array<{
    time: number;
    type: string;
    description: string;
    impact: number;
  }>;
  momentum: DataPoint[];
  scoringRuns: Array<{
    team: string;
    start: number;
    end: number;
    points: number;
    duration: number;
  }>;
}

export interface TrendAnalysis {
  metricId: string;
  metricName: string;
  trend: 'up' | 'down' | 'stable';
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  dataPoints: DataPoint[];
  prediction?: DataPoint[];
}

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
  label?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'match' | 'player' | 'team' | 'season';
  generatedAt: Date;
  generatedBy: string;
  data: any;
  format: 'pdf' | 'excel' | 'json';
}
