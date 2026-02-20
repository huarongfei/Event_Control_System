/**
 * 高精度计时器类
 */
import {
  TimerConfig,
  TimerState,
  TimerMode,
  TimerStatus,
  TimerType,
  TimerEvent
} from '../types/timer.js';
import { v4 as uuidv4 } from 'uuid';

export class Timer {
  private config: TimerConfig;
  private state: TimerState;
  private intervalId: NodeJS.Timeout | null = null;
  private syncIntervalId: NodeJS.Timeout | null = null;
  private events: TimerEvent[] = [];
  private listeners: Map<string, Array<(state: TimerState, event?: TimerEvent) => void>> = new Map();

  constructor(config: TimerConfig) {
    this.config = config;
    this.state = {
      id: config.id,
      matchId: config.matchId,
      type: config.type,
      mode: config.mode,
      status: TimerStatus.IDLE,
      currentTime: config.initialTime,
      elapsedTime: 0,
      remainingTime: config.initialTime,
      initialTime: config.initialTime,
      lastUpdated: new Date()
    };

    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * 启动计时器
   */
  public start(): void {
    if (this.state.status === TimerStatus.RUNNING) {
      return;
    }

    this.state.status = TimerStatus.RUNNING;
    this.state.startedAt = new Date();

    // 如果是从暂停恢复，调整开始时间
    if (this.state.pausedAt) {
      const pauseDuration = Date.now() - this.state.pausedAt.getTime();
      this.state.startedAt = new Date(this.state.startedAt.getTime() + pauseDuration);
      this.state.pausedAt = undefined;
    }

    // 记录事件
    this.recordEvent('start');

    // 启动计时
    this.intervalId = setInterval(() => {
      this.tick();
    }, 10); // 10ms精度

    // 启动时间同步（如果启用）
    if (this.config.syncEnabled) {
      this.startSync();
    }

    this.notifyListeners();
  }

  /**
   * 暂停计时器
   */
  public pause(): void {
    if (this.state.status !== TimerStatus.RUNNING) {
      return;
    }

    this.state.status = TimerStatus.PAUSED;
    this.state.pausedAt = new Date();

    // 停止计时
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // 停止同步
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // 记录事件
    this.recordEvent('pause');

    this.notifyListeners();
  }

  /**
   * 停止计时器
   */
  public stop(): void {
    if (this.state.status === TimerStatus.IDLE || this.state.status === TimerStatus.STOPPED) {
      return;
    }

    this.state.status = TimerStatus.STOPPED;
    this.state.stoppedAt = new Date();

    // 清除所有定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // 记录事件
    this.recordEvent('stop');

    this.notifyListeners();
  }

  /**
   * 重置计时器
   */
  public reset(): void {
    const previousStatus = this.state.status;

    // 先停止
    this.stop();

    // 重置状态
    this.state.status = TimerStatus.IDLE;
    this.state.currentTime = this.config.initialTime;
    this.state.elapsedTime = 0;
    this.state.remainingTime = this.config.initialTime;
    this.state.startedAt = undefined;
    this.state.pausedAt = undefined;
    this.state.stoppedAt = undefined;
    this.state.lastUpdated = new Date();

    // 记录事件
    this.recordEvent('reset');

    this.notifyListeners();

    // 如果之前在运行且配置了自动启动，重新启动
    if (previousStatus === TimerStatus.RUNNING && this.config.autoReset) {
      this.start();
    }
  }

  /**
   * 设置时间
   */
  public setTime(time: number): void {
    const wasRunning = this.state.status === TimerStatus.RUNNING;

    if (wasRunning) {
      this.pause();
    }

    this.state.currentTime = Math.max(0, time);
    this.state.lastUpdated = new Date();

    // 更新其他时间字段
    this.updateTimeFields();

    this.notifyListeners();

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * 增加时间
   */
  public addTime(amount: number): void {
    const wasRunning = this.state.status === TimerStatus.RUNNING;

    if (wasRunning) {
      this.pause();
    }

    this.state.currentTime += amount;
    this.state.lastUpdated = new Date();

    this.updateTimeFields();

    this.notifyListeners();

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * 减少时间
   */
  public subtractTime(amount: number): void {
    this.addTime(-amount);
  }

  /**
   * 计时器滴答
   */
  private tick(): void {
    const now = Date.now();
    const elapsed = now - this.state.startedAt!.getTime();

    this.state.elapsedTime = elapsed;
    this.state.lastUpdated = now;

    if (this.config.mode === TimerMode.COUNTDOWN) {
      this.state.currentTime = this.state.initialTime - elapsed;
      this.state.remainingTime = Math.max(0, this.state.currentTime);

      // 检查是否完成
      if (this.state.remainingTime <= 0) {
        this.complete();
      }
    } else if (this.config.mode === TimerMode.COUNTUP) {
      this.state.currentTime = elapsed;
      this.state.remainingTime = elapsed;
    } else if (this.config.mode === TimerMode.STOPWATCH) {
      this.state.currentTime = elapsed;
      this.state.remainingTime = elapsed;
    }

    this.notifyListeners();
  }

  /**
   * 计时完成
   */
  private complete(): void {
    this.state.status = TimerStatus.COMPLETED;
    this.state.currentTime = 0;
    this.state.remainingTime = 0;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    // 记录事件
    this.recordEvent('complete');

    this.notifyListeners();

    // 播放声音（如果启用）
    if (this.config.soundEnabled) {
      this.playSound();
    }

    // 自动重置（如果配置）
    if (this.config.autoReset) {
      setTimeout(() => {
        this.reset();
      }, 1000);
    }
  }

  /**
   * 更新时间字段
   */
  private updateTimeFields(): void {
    if (this.config.mode === TimerMode.COUNTDOWN) {
      this.state.remainingTime = this.state.currentTime;
      this.state.elapsedTime = this.state.initialTime - this.state.currentTime;
    } else {
      this.state.elapsedTime = this.state.currentTime;
      this.state.remainingTime = this.state.currentTime;
    }
  }

  /**
   * 记录事件
   */
  private recordEvent(type: TimerEvent['type'], data?: any): void {
    const event: TimerEvent = {
      id: uuidv4(),
      timerId: this.state.id,
      matchId: this.state.matchId,
      type,
      timestamp: new Date(),
      data
    };

    this.events.push(event);
  }

  /**
   * 播放声音
   */
  private playSound(): void {
    // TODO: 实现声音播放
    if (this.config.soundFile) {
      console.log(`播放声音: ${this.config.soundFile}`);
    }
  }

  /**
   * 启动时间同步
   */
  private startSync(): void {
    this.syncIntervalId = setInterval(() => {
      this.recordEvent('sync', {
        serverTime: Date.now(),
        currentTime: this.state.currentTime,
        elapsedTime: this.state.elapsedTime,
        remainingTime: this.state.remainingTime
      });
    }, this.config.syncInterval || 1000);
  }

  /**
   * 注册监听器
   */
  public on(event: string, callback: (state: TimerState, event?: TimerEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 移除监听器
   */
  public off(event: string, callback: (state: TimerState, event?: TimerEvent) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    const callbacks = this.listeners.get('change');
    if (callbacks) {
      callbacks.forEach(callback => callback(this.state));
    }
  }

  /**
   * 获取当前状态
   */
  public getState(): TimerState {
    return { ...this.state };
  }

  /**
   * 获取配置
   */
  public getConfig(): TimerConfig {
    return { ...this.config };
  }

  /**
   * 获取事件历史
   */
  public getEvents(): TimerEvent[] {
    return [...this.events];
  }

  /**
   * 销毁计时器
   */
  public destroy(): void {
    this.stop();
    this.listeners.clear();
    this.events = [];
  }
}
