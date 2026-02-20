export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  EVENT_OPERATOR = 'event_operator',
  TIMER_OPERATOR = 'timer_operator',
  SCORE_OPERATOR = 'score_operator',
  COMMENTATOR = 'commentator',
  DIRECTOR = 'director'
}

export interface Match {
  id: string;
  name: string;
  sport: SportType;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  startTime: Date;
  endTime?: Date;
  currentPeriod: number;
  periods: Period[];
  settings: MatchSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum SportType {
  BASKETBALL = 'basketball',
  FOOTBALL = 'football',
  ICE_HOCKEY = 'ice_hockey',
  ESPORTS = 'esports'
}

export enum MatchStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  PAUSED = 'paused',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  jerseyColor: string;
  score: number;
  stats: TeamStats;
  players: Player[];
}

export interface TeamStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  isActive: boolean;
  stats: PlayerStats;
  fouls: number;
}

export interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  minutesPlayed: number;
}

export interface Period {
  number: number;
  type: PeriodType;
  startTime?: Date;
  endTime?: Date;
  homeScore: number;
  awayScore: number;
  isCompleted: boolean;
}

export enum PeriodType {
  QUARTER = 'quarter',
  HALF = 'half',
  OVERTIME = 'overtime'
}

export interface MatchSettings {
  periodDuration: number;
  overtimeDuration: number;
  maxFouls: number;
  timeoutsPerHalf: number;
  shotClockDuration: number;
}

export interface ScoreUpdate {
  matchId: string;
  teamId: string;
  points: number;
  type: ScoreType;
  playerId?: string;
  timestamp: Date;
  period: number;
}

export enum ScoreType {
  FREE_THROW = 'free_throw',
  FIELD_GOAL = 'field_goal',
  THREE_POINTER = 'three_pointer',
  OWN_GOAL = 'own_goal'
}

export interface TimerState {
  matchId: string;
  elapsedTime: number;
  remainingTime: number;
  isRunning: boolean;
  startTime?: Date;
  lastUpdate?: Date;
}

export interface ShotClockState {
  matchId: string;
  timeRemaining: number;
  isRunning: boolean;
  teamId?: string;
}

export interface OperationLog {
  id: string;
  matchId: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: number;
}

export interface BroadcastLayout {
  id: string;
  name: string;
  type: LayoutType;
  components: LayoutComponent[];
  isActive: boolean;
  settings: LayoutSettings;
}

export enum LayoutType {
  FULL_SCOREBOARD = 'full_scoreboard',
  SCORE_WITH_STATS = 'score_with_stats',
  SCORE_WITH_COMPARISON = 'score_with_comparison',
  DATA_VISUALIZATION = 'data_visualization'
}

export interface LayoutComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number; width: number; height: number };
  settings: Record<string, any>;
}

export enum ComponentType {
  SCOREBOARD = 'scoreboard',
  TIMER = 'timer',
  TEAM_STATS = 'team_stats',
  PLAYER_STATS = 'player_stats',
  ADVERTISEMENT = 'advertisement',
  VIDEO_FEED = 'video_feed',
  DATA_CHART = 'data_chart'
}

export interface LayoutSettings {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  resolution: { width: number; height: number };
}
