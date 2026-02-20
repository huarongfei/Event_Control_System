/**
 * 比赛计时器管理器
 * 管理一场比赛的所有计时器
 */
import { Timer } from './Timer.js';
import {
  TimerConfig,
  TimerState,
  TimerMode,
  TimerStatus,
  TimerType,
  MatchTimers,
  PeriodTimer,
  TimerEvent
} from '../types/timer.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../app.js';

export class MatchTimerManager {
  private matchId: string;
  private gameTimer: Timer;
  private periodTimers: Map<number, Timer> = new Map();
  private shotClock?: Timer;
  private possessionTimer?: Timer;
  private timeoutTimer?: Timer;
  private currentPeriod: number = 1;
  private isOvertime: boolean = false;
  private sport: 'basketball' | 'football' | 'ice_hockey' | 'esports';
  private periodCount: number;

  constructor(
    matchId: string,
    sport: 'basketball' | 'football' | 'ice_hockey' | 'esports',
    periodCount: number = 4
  ) {
    this.matchId = matchId;
    this.sport = sport;
    this.periodCount = periodCount;

    // 创建比赛主计时器
    const gameDuration = this.getGameDuration();
    this.gameTimer = this.createTimer({
      id: `${matchId}-game`,
      matchId,
      type: TimerType.GAME,
      mode: TimerMode.COUNTDOWN,
      initialTime: gameDuration,
      autoStart: false,
      syncEnabled: true
    });

    // 创建节次计时器
    const periodDuration = this.getPeriodDuration();
    for (let i = 1; i <= periodCount; i++) {
      this.periodTimers.set(i, this.createTimer({
        id: `${matchId}-period-${i}`,
        matchId,
        type: TimerType.PERIOD,
        mode: TimerMode.COUNTDOWN,
        initialTime: periodDuration,
        autoStart: false,
        syncEnabled: true
      }));
    }

    // 篮球专用计时器
    if (sport === 'basketball') {
      this.shotClock = this.createTimer({
        id: `${matchId}-shot-clock`,
        matchId,
        type: TimerType.SHOT_CLOCK,
        mode: TimerMode.COUNTDOWN,
        initialTime: 24 * 1000,
        autoStart: false,
        syncEnabled: false
      });
    }

    // 设置事件监听
    this.setupEventListeners();
  }

  /**
   * 创建计时器
   */
  private createTimer(config: TimerConfig): Timer {
    const timer = new Timer(config);

    timer.on('change', (state) => {
      this.broadcastTimerUpdate(config.type, state);
    });

    return timer;
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 当前节次结束监听
    this.getCurrentPeriodTimer().on('change', (state) => {
      if (state.status === TimerStatus.COMPLETED) {
        this.handlePeriodComplete();
      }
    });

    // 比赛结束监听
    this.gameTimer.on('change', (state) => {
      if (state.status === TimerStatus.COMPLETED) {
        this.handleGameComplete();
      }
    });
  }

  /**
   * 获取比赛时长
   */
  private getGameDuration(): number {
    switch (this.sport) {
      case 'basketball':
        return 48 * 60 * 1000; // 48分钟
      case 'football':
        return 90 * 60 * 1000; // 90分钟
      case 'ice_hockey':
        return 60 * 60 * 1000; // 60分钟
      case 'esports':
        return 60 * 60 * 1000; // 60分钟（默认）
      default:
        return 48 * 60 * 1000;
    }
  }

  /**
   * 获取节次时长
   */
  private getPeriodDuration(): number {
    switch (this.sport) {
      case 'basketball':
        return 12 * 60 * 1000; // 12分钟
      case 'football':
        return 45 * 60 * 1000; // 45分钟
      case 'ice_hockey':
        return 20 * 60 * 1000; // 20分钟
      case 'esports':
        return 15 * 60 * 1000; // 15分钟（默认）
      default:
        return 12 * 60 * 1000;
    }
  }

  /**
   * 获取加时赛时长
   */
  private getOvertimeDuration(): number {
    switch (this.sport) {
      case 'basketball':
        return 5 * 60 * 1000; // 5分钟
      case 'football':
        return 15 * 60 * 1000; // 15分钟
      case 'ice_hockey':
        return 20 * 60 * 1000; // 20分钟
      case 'esports':
        return 5 * 60 * 1000; // 5分钟
      default:
        return 5 * 60 * 1000;
    }
  }

  /**
   * 启动当前节次
   */
  public startCurrentPeriod(): void {
    const currentTimer = this.getCurrentPeriodTimer();
    currentTimer.start();
    this.gameTimer.start();
  }

  /**
   * 暂停当前节次
   */
  public pauseCurrentPeriod(): void {
    const currentTimer = this.getCurrentPeriodTimer();
    currentTimer.pause();
    this.gameTimer.pause();
  }

  /**
   * 结束当前节次
   */
  public endCurrentPeriod(): void {
    const currentTimer = this.getCurrentPeriodTimer();
    currentTimer.stop();
    this.gameTimer.pause();
  }

  /**
   * 进入下一节
   */
  public nextPeriod(): void {
    // 结束当前节次
    this.endCurrentPeriod();

    // 增加节次
    this.currentPeriod++;

    // 检查是否进入加时赛
    if (this.currentPeriod > this.periodCount && !this.isOvertime) {
      this.isOvertime = true;
      this.createOvertimePeriod();
    }

    // 启动新节次
    this.startCurrentPeriod();
  }

  /**
   * 创建加时赛节次
   */
  private createOvertimePeriod(): void {
    const overtimeNumber = this.currentPeriod;
    const overtimeTimer = this.createTimer({
      id: `${this.matchId}-ot-${overtimeNumber}`,
      matchId: this.matchId,
      type: TimerType.PERIOD,
      mode: TimerMode.COUNTDOWN,
      initialTime: this.getOvertimeDuration(),
      autoStart: false,
      syncEnabled: true
    });

    this.periodTimers.set(overtimeNumber, overtimeTimer);
  }

  /**
   * 处理节次完成
   */
  private handlePeriodComplete(): void {
    const periodTimer = this.getCurrentPeriodTimer();
    const periodState = periodTimer.getState();

    // 广播节次完成事件
    io.to(`match:${this.matchId}`).emit('timer:period:complete', {
      matchId: this.matchId,
      period: this.currentPeriod,
      finalTime: periodState.elapsedTime
    });
  }

  /**
   * 处理比赛完成
   */
  private handleGameComplete(): void {
    const gameTimer = this.gameTimer.getState();

    // 广播比赛完成事件
    io.to(`match:${this.matchId}`).emit('timer:game:complete', {
      matchId: this.matchId,
      finalTime: gameTimer.elapsedTime,
      periods: this.getPeriodsSummary()
    });
  }

  /**
   * 获取当前节次计时器
   */
  public getCurrentPeriodTimer(): Timer {
    return this.periodTimers.get(this.currentPeriod)!;
  }

  /**
   * 重置进攻时钟（篮球）
   */
  public resetShotClock(type: 'full' | 'offensive_rebound' = 'full'): void {
    if (!this.shotClock) return;

    if (type === 'full') {
      this.shotClock.reset();
    } else if (type === 'offensive_rebound') {
      this.shotClock.setTime(14 * 1000); // 进攻篮板重置为14秒
    }
  }

  /**
   * 获取所有计时器状态
   */
  public getAllStates(): MatchTimers {
    const periodTimersData: PeriodTimer[] = [];

    this.periodTimers.forEach((timer, number) => {
      periodTimersData.push({
        number,
        type: number > this.periodCount ? 'overtime' :
               this.sport === 'basketball' ? 'quarter' : 'half',
        duration: timer.getConfig().initialTime,
        timerState: timer.getState(),
        isCompleted: number < this.currentPeriod,
        score: { home: 0, away: 0 } // 需要从计分引擎获取
      });
    });

    return {
      matchId: this.matchId,
      gameTimer: this.gameTimer.getState(),
      periodTimers: periodTimersData,
      shotClock: this.shotClock?.getState(),
      possessionTimer: this.possessionTimer?.getState(),
      timeoutTimer: this.timeoutTimer?.getState(),
      currentPeriod: this.currentPeriod,
      isOvertime: this.isOvertime
    };
  }

  /**
   * 获取节次摘要
   */
  private getPeriodsSummary(): any[] {
    const summary: any[] = [];

    this.periodTimers.forEach((timer, number) => {
      const state = timer.getState();
      summary.push({
        period: number,
        type: number > this.periodCount ? 'overtime' :
               this.sport === 'basketball' ? 'quarter' : 'half',
        elapsedTime: state.elapsedTime,
        status: state.status
      });
    });

    return summary;
  }

  /**
   * 广播计时器更新
   */
  private broadcastTimerUpdate(type: TimerType, state: TimerState): void {
    io.to(`match:${this.matchId}`).emit('timer:update', {
      matchId: this.matchId,
      timerType: type,
      state
    });
  }

  /**
   * 获取当前节次
   */
  public getCurrentPeriod(): number {
    return this.currentPeriod;
  }

  /**
   * 是否在加时赛
   */
  public isInOvertime(): boolean {
    return this.isOvertime;
  }

  /**
   * 销毁所有计时器
   */
  public destroy(): void {
    this.gameTimer.destroy();
    this.periodTimers.forEach(timer => timer.destroy());
    this.shotClock?.destroy();
    this.possessionTimer?.destroy();
    this.timeoutTimer?.destroy();
  }
}
