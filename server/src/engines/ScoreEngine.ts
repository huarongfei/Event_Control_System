/**
 * 计分引擎基类
 */
import {
  ScoreEvent,
  ScoreEventType,
  ScoreRule,
  ValidationResult,
  MatchContext,
  ScoreHistory,
  RuleViolation,
  SportEngine
} from '../types/scoreEngine.js';

export abstract class BaseScoreEngine {
  protected rules: ScoreRule[];
  protected matchContext: MatchContext;
  protected scoreHistory: ScoreEvent[];
  protected violations: RuleViolation[];

  constructor(matchContext: MatchContext) {
    this.matchContext = matchContext;
    this.scoreHistory = [];
    this.violations = [];
    this.rules = this.initializeRules();
  }

  /**
   * 初始化规则（子类实现）
   */
  protected abstract initializeRules(): ScoreRule[];

  /**
   * 添加得分事件
   */
  public addScoreEvent(event: Omit<ScoreEvent, 'id' | 'isValid' | 'validationError' | 'timestamp'>): ScoreEvent {
    const fullEvent: ScoreEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      isValid: false,
      validationError: undefined
    };

    // 验证事件
    const validation = this.validateEvent(fullEvent);
    fullEvent.isValid = validation.isValid;
    fullEvent.validationError = validation.error;

    // 如果有效，更新比分
    if (fullEvent.isValid) {
      this.updateScore(fullEvent);
      this.scoreHistory.push(fullEvent);
    }

    return fullEvent;
  }

  /**
   * 验证得分事件
   */
  protected validateEvent(event: ScoreEvent): ValidationResult {
    // 检查规则是否存在
    const rule = this.rules.find(r => r.eventType === event.eventType);
    if (!rule) {
      return { isValid: false, error: `不支持的得分事件类型: ${event.eventType}` };
    }

    // 检查当前节次是否允许
    if (!rule.allowedPeriods.includes(event.period)) {
      return { isValid: false, error: `当前节次不允许此操作` };
    }

    // 检查是否需要球员
    if (rule.requiresPlayer && !event.playerId) {
      return { isValid: false, error: `此操作需要指定球员` };
    }

    // 执行自定义验证
    if (rule.validation) {
      return rule.validation(event, this.matchContext);
    }

    return { isValid: true };
  }

  /**
   * 更新比分
   */
  protected updateScore(event: ScoreEvent): void {
    if (event.team === 'home') {
      this.matchContext.homeScore += event.points;
    } else {
      this.matchContext.awayScore += event.points;
    }

    // 更新节次比分
    const periodScore = this.matchContext.periodScores.find(
      ps => ps.period === event.period
    );
    if (periodScore) {
      if (event.team === 'home') {
        periodScore.home += event.points;
      } else {
        periodScore.away += event.points;
      }
    } else {
      this.matchContext.periodScores.push({
        period: event.period,
        home: event.team === 'home' ? event.points : 0,
        away: event.team === 'away' ? event.points : 0
      });
    }
  }

  /**
   * 撤销得分事件
   */
  public undoEvent(eventId: string): boolean {
    const eventIndex = this.scoreHistory.findIndex(e => e.id === eventId);
    if (eventIndex === -1) {
      return false;
    }

    const event = this.scoreHistory[eventIndex];

    // 回退比分
    if (event.team === 'home') {
      this.matchContext.homeScore -= event.points;
    } else {
      this.matchContext.awayScore -= event.points;
    }

    // 移除事件
    this.scoreHistory.splice(eventIndex, 1);

    return true;
  }

  /**
   * 获取得分历史
   */
  public getScoreHistory(): ScoreHistory {
    const byPeriod = new Map<number, { homeEvents: number; awayEvents: number }>();
    const byType: Record<string, number> = {};

    this.scoreHistory.forEach(event => {
      // 按节次统计
      if (!byPeriod.has(event.period)) {
        byPeriod.set(event.period, { homeEvents: 0, awayEvents: 0 });
      }
      const periodStats = byPeriod.get(event.period)!;
      if (event.team === 'home') {
        periodStats.homeEvents++;
      } else {
        periodStats.awayEvents++;
      }

      // 按类型统计
      if (!byType[event.eventType]) {
        byType[event.eventType] = 0;
      }
      byType[event.eventType]++;
    });

    return {
      matchId: '', // 从外部设置
      sport: this.matchContext.sport as SportEngine,
      events: [...this.scoreHistory],
      summary: {
        totalEvents: this.scoreHistory.length,
        byPeriod: Array.from(byPeriod.entries()).map(([period, stats]) => ({
          period,
          ...stats
        })),
        byType: byType as Record<ScoreEventType, number>
      }
    };
  }

  /**
   * 更新比赛上下文
   */
  public updateMatchContext(updates: Partial<MatchContext>): void {
    this.matchContext = { ...this.matchContext, ...updates };
  }

  /**
   * 获取当前比赛上下文
   */
  public getMatchContext(): MatchContext {
    return { ...this.matchContext };
  }

  /**
   * 添加违规记录
   */
  public addViolation(violation: RuleViolation): void {
    this.violations.push(violation);
  }

  /**
   * 获取违规记录
   */
  public getViolations(): RuleViolation[] {
    return [...this.violations];
  }

  /**
   * 生成事件ID
   */
  protected generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 重置引擎
   */
  public reset(): void {
    this.scoreHistory = [];
    this.violations = [];
    this.matchContext.homeScore = 0;
    this.matchContext.awayScore = 0;
    this.matchContext.periodScores = [];
  }
}
