/**
 * 计时器类型定义
 */

export enum TimerMode {
  COUNTDOWN = 'countdown',    // 倒计时模式
  COUNTUP = 'countup',        // 正计时模式
  STOPWATCH = 'stopwatch'      // 秒表模式
}

export enum TimerStatus {
  IDLE = 'idle',              // 未开始
  RUNNING = 'running',         // 运行中
  PAUSED = 'paused',          // 已暂停
  STOPPED = 'stopped',        // 已停止
  COMPLETED = 'completed'     // 已完成
}

export enum TimerType {
  GAME = 'game',              // 比赛时钟
  PERIOD = 'period',          // 节次时钟
  SHOT_CLOCK = 'shot_clock',  // 进攻时钟（篮球）
  POSSESSION = 'possession',   // 控球时钟
  TIMEOUT = 'timeout',        // 暂停时钟
  INTERVAL = 'interval'       // 间隔时钟
}

export interface TimerConfig {
  id: string;
  matchId: string;
  type: TimerType;
  mode: TimerMode;
  initialTime: number;        // 初始时间（毫秒）
  currentTime: number;        // 当前时间（毫秒）
  status: TimerStatus;
  autoStart?: boolean;       // 是否自动开始
  autoReset?: boolean;       // 是否自动重置
  soundEnabled?: boolean;     // 是否启用声音
  soundFile?: string;        // 声音文件路径
  syncEnabled?: boolean;     // 是否启用时间同步
  syncInterval?: number;     // 同步间隔（毫秒）
}

export interface TimerEvent {
  id: string;
  timerId: string;
  matchId: string;
  type: 'start' | 'pause' | 'stop' | 'reset' | 'sync' | 'complete';
  timestamp: Date;
  data?: {
    time?: number;
    elapsedTime?: number;
    remainingTime?: number;
  };
  userId?: string;
}

export interface TimerState {
  id: string;
  matchId: string;
  type: TimerType;
  mode: TimerMode;
  status: TimerStatus;
  currentTime: number;
  elapsedTime: number;
  remainingTime: number;
  initialTime: number;
  lastUpdated: Date;
  startedAt?: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
}

export interface PeriodTimer {
  number: number;
  type: 'quarter' | 'half' | 'overtime';
  duration: number;
  timerState: TimerState;
  isCompleted: boolean;
  score: {
    home: number;
    away: number;
  };
}

export interface MatchTimers {
  matchId: string;
  gameTimer: TimerState;
  periodTimers: PeriodTimer[];
  shotClock?: TimerState;
  possessionTimer?: TimerState;
  timeoutTimer?: TimerState;
  currentPeriod: number;
  isOvertime: boolean;
}

export interface TimerSyncData {
  timerId: string;
  serverTime: number;
  clientTime: number;
  timeOffset: number;
  latency: number;
}

export interface TimerAction {
  type: 'start' | 'pause' | 'stop' | 'reset' | 'setTime' | 'addTime' | 'subtractTime';
  timerId: string;
  data?: {
    time?: number;
    amount?: number;
  };
}
