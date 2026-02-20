/**
 * 数据分析控制器
 */
import { Request, Response } from 'express';
import { AnalyticsEngine } from '../analytics/index.js';
import { MatchAnalyzer } from '../analytics/index.js';
import Match from '../models/Match.js';

// 全局分析引擎实例
const analyticsEngine = new AnalyticsEngine();
const matchAnalyzer = new MatchAnalyzer();

/**
 * 记录指标
 */
export const recordMetric = async (req: Request, res: Response) => {
  try {
    const { name, type, value, metadata } = req.body;

    const metric = analyticsEngine.recordMetric({
      name,
      type,
      value,
      metadata
    });

    return res.json({
      success: true,
      data: metric
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取指标值
 */
export const getMetricValue = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { latest = true } = req.query;

    const value = analyticsEngine.getMetricValue(name, latest === 'true');

    return res.json({
      success: true,
      data: {
        name,
        value
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 创建时间序列
 */
export const createTimeSeries = async (req: Request, res: Response) => {
  try {
    const { metricName, aggregation, granularity, startDate, endDate } = req.body;

    const timeSeries = analyticsEngine.createTimeSeries({
      metricName,
      aggregation,
      granularity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return res.json({
      success: true,
      data: timeSeries
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 分析趋势
 */
export const analyzeTrend = async (req: Request, res: Response) => {
  try {
    const { metricName } = req.params;
    const { windowSize } = req.query;

    const trend = analyticsEngine.analyzeTrend(
      metricName,
      windowSize ? parseInt(windowSize as string) : undefined
    );

    return res.json({
      success: true,
      data: trend
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 分析比赛
 */
export const analyzeMatch = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate('homeTeam')
      .populate('awayTeam')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    // 获取得分事件（需要从计分引擎获取）
    // 这里简化处理，实际应该从计分引擎获取
    const matchData = {
      id: match._id,
      sport: match.sport,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      scoreEvents: [] // 需要从计分引擎获取
    };

    const analysis = matchAnalyzer.analyzeMatch(matchData);

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取球队统计
 */
export const getTeamStatistics = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // 获取球队的比赛数据
    const matches = await Match.find({
      $or: [
        { 'homeTeam.id': teamId },
        { 'awayTeam.id': teamId }
      ]
    }).lean();

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到比赛数据'
      });
    }

    // 构建统计数据
    const teamMatches = matches.map((match: any) => {
      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.homeTeam.score : match.awayTeam.score;
      const opponentScore = isHome ? match.awayTeam.score : match.homeTeam.score;

      return {
        teamId,
        teamName: isHome ? match.homeTeam.name : match.awayTeam.name,
        points: teamScore,
        result: teamScore > opponentScore ? 'win' :
                 teamScore < opponentScore ? 'loss' : 'draw',
        isHome
      };
    });

    const statistics = analyticsEngine.calculateTeamStatistics(teamMatches);

    return res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取球员统计
 */
export const getPlayerStatistics = async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;

    // 这里简化处理，实际应该从计分引擎获取球员数据
    const matchData = []; // 需要从计分引擎获取

    if (matchData.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到球员数据'
      });
    }

    const statistics = analyticsEngine.calculatePlayerStatistics(matchData);

    return res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取仪表板数据
 */
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // 获取实时数据
    const liveMatches = await Match.find({ status: 'live' });
    const scheduledMatches = await Match.find({ status: 'scheduled' });
    const completedMatches = await Match.find({ status: 'finished' });

    // 记录指标
    analyticsEngine.recordMetric({
      name: 'live_matches',
      type: 'gauge',
      value: liveMatches.length
    });

    analyticsEngine.recordMetric({
      name: 'scheduled_matches',
      type: 'gauge',
      value: scheduledMatches.length
    });

    analyticsEngine.recordMetric({
      name: 'completed_matches',
      type: 'counter',
      value: completedMatches.length
    });

    // 获取趋势
    const liveMatchesTrend = analyticsEngine.analyzeTrend('live_matches');

    return res.json({
      success: true,
      data: {
        summary: {
          liveMatches: liveMatches.length,
          scheduledMatches: scheduledMatches.length,
          completedMatches: completedMatches.length
        },
        matches: {
          live: liveMatches,
          scheduled: scheduledMatches,
          completed: completedMatches.slice(0, 10) // 最近10场
        },
        trends: {
          liveMatches: liveMatchesTrend
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
