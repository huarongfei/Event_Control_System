/**
 * 计分引擎控制器
 */
import { Request, Response } from 'express';
import { ScoreEngineFactory, SportEngine, ScoreEventType } from '../engines/index.js';
import { Match } from '../models/Match.js';

// 存储比赛的计分引擎实例
const scoreEngineInstances = new Map<string, any>();

/**
 * 获取或创建计分引擎
 */
async function getScoreEngine(matchId: string) {
  if (scoreEngineInstances.has(matchId)) {
    return scoreEngineInstances.get(matchId);
  }

  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }

  // 构建比赛上下文
  const matchContext = {
    sport: match.sport as SportEngine,
    currentPeriod: match.currentPeriod,
    periodDuration: match.settings.periodDuration,
    gameClock: 0, // 从计时器获取
    isOvertime: match.currentPeriod > 4,
    homeScore: match.homeTeam.score,
    awayScore: match.awayTeam.score,
    homeFouls: 0,
    awayFouls: 0,
    homeTimeouts: match.settings.timeoutsPerHalf,
    awayTimeouts: match.settings.timeoutsPerHalf,
    periodScores: match.periods.map(p => ({
      period: p.number,
      home: p.homeScore,
      away: p.awayScore
    }))
  };

  // 创建引擎
  const engine = ScoreEngineFactory.createEngine(match.sport as SportEngine, matchContext);
  scoreEngineInstances.set(matchId, engine);

  return engine;
}

/**
 * 添加得分事件
 */
export const addScoreEvent = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team, eventType, playerId, playerName, playerNumber, period, shotClock, metadata } = req.body;

    if (!team || !eventType || !period) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const engine = await getScoreEngine(matchId);

    // 获取比赛上下文
    const context = engine.getMatchContext();

    // 确定得分
    let points = 0;
    const eventTypeValue = eventType as ScoreEventType;
    switch (eventTypeValue) {
      case ScoreEventType.FREE_THROW_MAKE:
        points = 1;
        break;
      case ScoreEventType.TWO_POINT_MAKE:
        points = 2;
        break;
      case ScoreEventType.THREE_POINT_MAKE:
        points = 3;
        break;
      case ScoreEventType.GOAL:
      case ScoreEventType.PENALTY_GOAL:
      case ScoreEventType.OWN_GOAL:
        points = 1;
        break;
    }

    // 添加事件
    const event = engine.addScoreEvent({
      matchId,
      team,
      eventType: eventTypeValue,
      points,
      playerId,
      playerName,
      playerNumber,
      period,
      gameClock: context.gameClock,
      shotClock,
      metadata: metadata || {}
    });

    // 更新数据库中的比分
    const match = await Match.findById(matchId);
    if (match) {
      match.homeTeam.score = context.homeScore;
      match.awayTeam.score = context.awayScore;
      await match.save();
    }

    return res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 撤销得分事件
 */
export const undoEvent = async (req: Request, res: Response) => {
  try {
    const { matchId, eventId } = req.params;

    const engine = await getScoreEngine(matchId);
    const success = engine.undoEvent(eventId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '事件不存在'
      });
    }

    // 更新数据库
    const context = engine.getMatchContext();
    const match = await Match.findById(matchId);
    if (match) {
      match.homeTeam.score = context.homeScore;
      match.awayTeam.score = context.awayScore;
      await match.save();
    }

    return res.json({
      success: true,
      message: '事件已撤销'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取得分历史
 */
export const getScoreHistory = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const engine = await getScoreEngine(matchId);
    const history = engine.getScoreHistory();
    history.matchId = matchId;

    return res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取比赛统计
 */
export const getMatchStats = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const engine = await getScoreEngine(matchId);
    const context = engine.getMatchContext();

    let stats: any = {
      sport: context.sport,
      currentPeriod: context.currentPeriod,
      homeScore: context.homeScore,
      awayScore: context.awayScore,
      gameClock: context.gameClock,
      periodScores: context.periodScores
    };

    // 根据运动类型获取特定统计
    if (context.sport === SportEngine.BASKETBALL) {
      stats.basketball = engine.getBasketballStats('home');
      stats.basketballAway = engine.getBasketballStats('away');
    } else if (context.sport === SportEngine.FOOTBALL) {
      stats.football = engine.getFootballStats('home');
      stats.footballAway = engine.getFootballStats('away');
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 更新比赛时钟
 */
export const updateGameClock = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { gameClock, shotClock } = req.body;

    const engine = await getScoreEngine(matchId);
    engine.updateMatchContext({ gameClock });

    if (shotClock !== undefined) {
      engine.updateMatchContext({ shotClock } as any);
    }

    return res.json({
      success: true,
      data: engine.getMatchContext()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 记录犯规
 */
export const recordFoul = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team, playerId, foulType } = req.body;

    if (!team) {
      return res.status(400).json({
        success: false,
        message: '缺少球队参数'
      });
    }

    const engine = await getScoreEngine(matchId);

    // 篮球特定方法
    if (engine.recordFoul) {
      engine.recordFoul(team, playerId);
    }

    // 添加犯规事件
    let eventType = ScoreEventType.FOUL;
    if (foulType === 'technical') {
      eventType = ScoreEventType.TECHNICAL_FOUL;
    } else if (foulType === 'flagrant') {
      eventType = ScoreEventType.FLAGRANT_FOUL;
    }

    const context = engine.getMatchContext();
    const event = engine.addScoreEvent({
      matchId,
      team,
      eventType,
      points: 0,
      playerId,
      period: context.currentPeriod,
      gameClock: context.gameClock,
      metadata: { foulType }
    });

    return res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 记录暂停
 */
export const recordTimeout = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team } = req.body;

    if (!team) {
      return res.status(400).json({
        success: false,
        message: '缺少球队参数'
      });
    }

    const engine = await getScoreEngine(matchId);

    // 篮球特定方法
    if (engine.recordTimeout) {
      engine.recordTimeout(team);
    }

    // 添加暂停事件
    const context = engine.getMatchContext();
    const event = engine.addScoreEvent({
      matchId,
      team,
      eventType: ScoreEventType.TIMEOUT,
      points: 0,
      period: context.currentPeriod,
      gameClock: context.gameClock,
      metadata: {}
    });

    return res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 重置进攻时钟（篮球）
 */
export const resetShotClock = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { type } = req.body; // 'full' or 'offensive_rebound'

    const engine = await getScoreEngine(matchId);

    if (type === 'offensive_rebound' && engine.resetShotClockOnOffensiveRebound) {
      engine.resetShotClockOnOffensiveRebound();
    } else if (engine.resetShotClock) {
      engine.resetShotClock();
    }

    return res.json({
      success: true,
      data: engine.getMatchContext()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 记录黄牌（足球）
 */
export const recordYellowCard = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team, playerId, playerName, playerNumber } = req.body;

    if (!team || !playerId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const engine = await getScoreEngine(matchId);
    const context = engine.getMatchContext();

    const event = engine.addScoreEvent({
      matchId,
      team,
      eventType: ScoreEventType.YELLOW_CARD,
      points: 0,
      playerId,
      playerName,
      playerNumber,
      period: context.currentPeriod,
      gameClock: context.gameClock,
      metadata: {}
    });

    // 检查是否自动红牌
    const isSentOff = engine.isPlayerSentOff && engine.isPlayerSentOff(playerId);

    return res.json({
      success: true,
      data: event,
      sentOff: isSentOff
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 记录红牌（足球）
 */
export const recordRedCard = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { team, playerId, playerName, playerNumber } = req.body;

    if (!team || !playerId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const engine = await getScoreEngine(matchId);
    const context = engine.getMatchContext();

    const event = engine.addScoreEvent({
      matchId,
      team,
      eventType: ScoreEventType.RED_CARD,
      points: 0,
      playerId,
      playerName,
      playerNumber,
      period: context.currentPeriod,
      gameClock: context.gameClock,
      metadata: {}
    });

    return res.json({
      success: true,
      data: event
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取引擎状态
 */
export const getEngineStatus = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    const engine = await getScoreEngine(matchId);
    const context = engine.getMatchContext();

    return res.json({
      success: true,
      data: {
        sport: context.sport,
        context: context,
        hasEngine: true
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
