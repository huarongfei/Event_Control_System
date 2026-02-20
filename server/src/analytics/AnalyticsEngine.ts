/**
 * 数据分析引擎
 */
import {
  Metric,
  MetricType,
  DataPoint,
  TimeSeries,
  TimeGranularity,
  TeamStatistics,
  PlayerStatistics,
  MatchAnalytics,
  TrendAnalysis,
  HeatmapData
} from '../types/analytics.js';
import { v4 as uuidv4 } from 'uuid';

export class AnalyticsEngine {
  private metrics: Map<string, Metric[]> = new Map();
  private timeSeries: Map<string, TimeSeries> = new Map();

  /**
   * 记录指标
   */
  public recordMetric(data: {
    name: string;
    type: MetricType;
    value: number;
    metadata?: Record<string, any>;
  }): Metric {
    const metricId = uuidv4();
    const metric: Metric = {
      id: metricId,
      name: data.name,
      type: data.type,
      value: data.value,
      timestamp: new Date(),
      metadata: data.metadata
    };

    if (!this.metrics.has(data.name)) {
      this.metrics.set(data.name, []);
    }

    this.metrics.get(data.name)!.push(metric);

    return metric;
  }

  /**
   * 获取指标值
   */
  public getMetricValue(name: string, latest: boolean = true): number | null {
    const metrics = this.metrics.get(name);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    if (latest) {
      return metrics[metrics.length - 1].value;
    }

    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  /**
   * 创建时间序列
   */
  public createTimeSeries(config: {
    metricName: string;
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
    granularity: TimeGranularity;
    startDate?: Date;
    endDate?: Date;
  }): TimeSeries {
    const metrics = this.metrics.get(config.metricName);
    if (!metrics) {
      throw new Error(`指标 ${config.metricName} 不存在`);
    }

    const dataPoints = this.aggregateDataPoints(
      metrics,
      config.aggregation,
      config.granularity,
      config.startDate,
      config.endDate
    );

    const timeSeries: TimeSeries = {
      metricId: uuidv4(),
      metricName: config.metricName,
      dataPoints,
      aggregation: config.aggregation,
      granularity: config.granularity
    };

    const key = `${config.metricName}-${config.aggregation}-${config.granularity}`;
    this.timeSeries.set(key, timeSeries);

    return timeSeries;
  }

  /**
   * 聚合数据点
   */
  private aggregateDataPoints(
    metrics: Metric[],
    aggregation: string,
    granularity: TimeGranularity,
    startDate?: Date,
    endDate?: Date
  ): DataPoint[] {
    let filtered = metrics;

    if (startDate) {
      filtered = filtered.filter(m => m.timestamp >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(m => m.timestamp <= endDate);
    }

    // 按时间粒度分组
    const groups = new Map<string, Metric[]>();

    filtered.forEach(metric => {
      const key = this.getTimeKey(metric.timestamp, granularity);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    // 聚合数据
    const dataPoints: DataPoint[] = [];

    groups.forEach((groupMetrics, key) => {
      let value: number;

      switch (aggregation) {
        case 'sum':
          value = groupMetrics.reduce((sum, m) => sum + m.value, 0);
          break;
        case 'avg':
          value = groupMetrics.reduce((sum, m) => sum + m.value, 0) / groupMetrics.length;
          break;
        case 'min':
          value = Math.min(...groupMetrics.map(m => m.value));
          break;
        case 'max':
          value = Math.max(...groupMetrics.map(m => m.value));
          break;
        case 'count':
          value = groupMetrics.length;
          break;
        default:
          value = 0;
      }

      dataPoints.push({
        timestamp: this.parseTimeKey(key, granularity),
        value
      });
    });

    return dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * 获取时间分组键
   */
  private getTimeKey(date: Date, granularity: TimeGranularity): string {
    const d = new Date(date);

    switch (granularity) {
      case TimeGranularity.MINUTE:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
      case TimeGranularity.HOUR:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      case TimeGranularity.DAY:
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      case TimeGranularity.WEEK:
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      case TimeGranularity.MONTH:
        return `${d.getFullYear()}-${d.getMonth()}`;
      default:
        return d.getTime().toString();
    }
  }

  /**
   * 解析时间分组键
   */
  private parseTimeKey(key: string, granularity: TimeGranularity): Date {
    const parts = key.split('-').map(Number);

    switch (granularity) {
      case TimeGranularity.MINUTE:
        return new Date(parts[0], parts[1], parts[2], parts[3], parts[4]);
      case TimeGranularity.HOUR:
        return new Date(parts[0], parts[1], parts[2], parts[3]);
      case TimeGranularity.DAY:
        return new Date(parts[0], parts[1], parts[2]);
      case TimeGranularity.WEEK:
        return new Date(parts[0], parts[1], parts[2]);
      case TimeGranularity.MONTH:
        return new Date(parts[0], parts[1], 1);
      default:
        return new Date(parseInt(key));
    }
  }

  /**
   * 分析趋势
   */
  public analyzeTrend(metricName: string, windowSize: number = 5): TrendAnalysis {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length < 2) {
      throw new Error('数据不足，无法分析趋势');
    }

    const recentMetrics = metrics.slice(-windowSize);
    const current = recentMetrics[recentMetrics.length - 1].value;
    const previous = recentMetrics[recentMetrics.length - 2].value;

    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0.05 * previous) trend = 'up';
    else if (change < -0.05 * previous) trend = 'down';

    // 创建时间序列
    const timeSeries = this.createTimeSeries({
      metricName,
      aggregation: 'avg',
      granularity: TimeGranularity.MINUTE
    });

    return {
      metricId: uuidv4(),
      metricName,
      trend,
      current,
      previous,
      change,
      changePercentage,
      dataPoints: timeSeries.dataPoints
    };
  }

  /**
   * 计算球队统计
   */
  public calculateTeamStatistics(matches: any[]): TeamStatistics {
    if (matches.length === 0) {
      throw new Error('没有比赛数据');
    }

    const teamId = matches[0].teamId;
    const teamName = matches[0].teamName;

    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const draws = matches.filter(m => m.result === 'draw').length;
    const totalPoints = matches.reduce((sum, m) => sum + m.points, 0);

    // 计算连胜/连败
    let currentStreak = 0;
    let longestWinStreak = 0;
    let tempWinStreak = 0;

    for (let i = matches.length - 1; i >= 0; i--) {
      if (matches[i].result === 'win') {
        if (currentStreak >= 0) currentStreak++;
        else currentStreak = 1;
        tempWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      } else if (matches[i].result === 'loss') {
        if (currentStreak <= 0) currentStreak--;
        else currentStreak = -1;
        tempWinStreak = 0;
      }
    }

    return {
      teamId,
      teamName,
      totalMatches: matches.length,
      wins,
      losses,
      draws,
      winRate: matches.length > 0 ? (wins / matches.length) * 100 : 0,
      totalPoints,
      avgPointsPerMatch: matches.length > 0 ? totalPoints / matches.length : 0,
      homeWins: matches.filter(m => m.isHome && m.result === 'win').length,
      awayWins: matches.filter(m => !m.isHome && m.result === 'win').length,
      currentStreak,
      longestWinStreak
    };
  }

  /**
   * 计算球员统计
   */
  public calculatePlayerStatistics(matchData: any[]): PlayerStatistics {
    const playerId = matchData[0].playerId;
    const playerName = matchData[0].playerName;
    const teamId = matchData[0].teamId;

    const matches = matchData.length;
    const totalPoints = matchData.reduce((sum, m) => sum + (m.points || 0), 0);
    const totalRebounds = matchData.reduce((sum, m) => sum + (m.rebounds || 0), 0);
    const totalAssists = matchData.reduce((sum, m) => sum + (m.assists || 0), 0);
    const totalSteals = matchData.reduce((sum, m) => sum + (m.steals || 0), 0);
    const totalBlocks = matchData.reduce((sum, m) => sum + (m.blocks || 0), 0);

    const fieldGoalsMade = matchData.reduce((sum, m) => sum + (m.fieldGoalsMade || 0), 0);
    const fieldGoalsAttempted = matchData.reduce((sum, m) => sum + (m.fieldGoalsAttempted || 0), 0);
    const threePointersMade = matchData.reduce((sum, m) => sum + (m.threePointersMade || 0), 0);
    const threePointersAttempted = matchData.reduce((sum, m) => sum + (m.threePointersAttempted || 0), 0);
    const freeThrowsMade = matchData.reduce((sum, m) => sum + (m.freeThrowsMade || 0), 0);
    const freeThrowsAttempted = matchData.reduce((sum, m) => sum + (m.freeThrowsAttempted || 0), 0);

    return {
      playerId,
      playerName,
      teamId,
      matches,
      totalPoints,
      avgPointsPerMatch: matches > 0 ? totalPoints / matches : 0,
      totalRebounds,
      totalAssists,
      totalSteals,
      totalBlocks,
      fieldGoals: {
        made: fieldGoalsMade,
        attempted: fieldGoalsAttempted,
        percentage: fieldGoalsAttempted > 0 ? (fieldGoalsMade / fieldGoalsAttempted) * 100 : 0
      },
      threePointers: {
        made: threePointersMade,
        attempted: threePointersAttempted,
        percentage: threePointersAttempted > 0 ? (threePointersMade / threePointersAttempted) * 100 : 0
      },
      freeThrows: {
        made: freeThrowsMade,
        attempted: freeThrowsAttempted,
        percentage: freeThrowsAttempted > 0 ? (freeThrowsMade / freeThrowsAttempted) * 100 : 0
      }
    };
  }

  /**
   * 生成热力图数据
   */
  public generateHeatmapData(
    data: Array<{ x: string; y: string; value: number }>
  ): HeatmapData[] {
    return data.map(d => ({
      x: d.x,
      y: d.y,
      value: d.value
    }));
  }

  /**
   * 清除所有数据
   */
  public clearAll(): void {
    this.metrics.clear();
    this.timeSeries.clear();
  }

  /**
   * 清除指定指标的数据
   */
  public clearMetric(name: string): void {
    this.metrics.delete(name);
    this.timeSeries.forEach((series, key) => {
      if (key.startsWith(name)) {
        this.timeSeries.delete(key);
      }
    });
  }
}
