/**
 * 计时器控制器
 */
import { Request, Response } from 'express';
import { TimerManagerFactory } from '../timers/index.js';
import { Match } from '../models/Match.js';

/**
 * 获取或创建计时器管理器
 */
async function getTimerManager(matchId: string) {
  const match = await Match.findById(matchId);
  if (!match) {
    throw new Error('比赛不存在');
  }

  return TimerManagerFactory.getMatchTimerManager(
    matchId,
    match.sport as 'basketball' | 'football' | 'ice_hockey' | 'esports',
    match.sport === 'basketball' ? 4 : 2
  );
}

/**
 * 启动当前节次
 */
export const startTimer = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const manager = await getTimerManager(matchId);

    manager.startCurrentPeriod();

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 暂停计时器
 */
export const pauseTimer = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const manager = await getTimerManager(matchId);

    manager.pauseCurrentPeriod();

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 进入下一节
 */
export const nextPeriod = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const manager = await getTimerManager(matchId);

    manager.nextPeriod();

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 设置时间
 */
export const setTime = async (req: Request, res: Response) => {
  try {
    const { matchId, timerType } = req.params;
    const { time } = req.body;

    const manager = await getTimerManager(matchId);

    if (timerType === 'game') {
      const states = manager.getAllStates();
      const gameTimer = (manager as any).gameTimer;
      gameTimer.setTime(time);
    }

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 增加时间
 */
export const addTime = async (req: Request, res: Response) => {
  try {
    const { matchId, timerType } = req.params;
    const { amount } = req.body;

    const manager = await getTimerManager(matchId);

    if (timerType === 'game') {
      const gameTimer = (manager as any).gameTimer;
      gameTimer.addTime(amount);
    }

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 减少时间
 */
export const subtractTime = async (req: Request, res: Response) => {
  try {
    const { matchId, timerType } = req.params;
    const { amount } = req.body;

    const manager = await getTimerManager(matchId);

    if (timerType === 'game') {
      const gameTimer = (manager as any).gameTimer;
      gameTimer.subtractTime(amount);
    }

    return res.json({
      success: true,
      data: manager.getAllStates()
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

    const manager = await getTimerManager(matchId);
    manager.resetShotClock(type);

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 获取计时器状态
 */
export const getTimerStatus = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const manager = await getTimerManager(matchId);

    return res.json({
      success: true,
      data: manager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 重置所有计时器
 */
export const resetTimers = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const manager = await getTimerManager(matchId);

    // 移除旧的管理器并创建新的
    TimerManagerFactory.removeMatchTimerManager(matchId);

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: '比赛不存在'
      });
    }

    const newManager = TimerManagerFactory.getMatchTimerManager(
      matchId,
      match.sport as 'basketball' | 'football' | 'ice_hockey' | 'esports'
    );

    return res.json({
      success: true,
      data: newManager.getAllStates()
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
