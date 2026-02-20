/**
 * 足球计分引擎
 */
import { BaseScoreEngine } from './ScoreEngine.js';
import {
  ScoreEvent,
  ScoreEventType,
  ScoreRule,
  MatchContext,
  FootballRules,
  SportEngine
} from '../types/scoreEngine.js';

export class FootballScoreEngine extends BaseScoreEngine {
  private footballRules: FootballRules;
  private yellowCards: Map<string, { team: 'home' | 'away'; count: number }> = new Map();

  constructor(matchContext: MatchContext, rules: FootballRules) {
    super(matchContext);
    this.footballRules = rules;
  }

  /**
   * 初始化足球规则
   */
  protected initializeRules(): ScoreRule[] {
    return [
      // 进球
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.GOAL,
        points: 1,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4], // 包括加时赛
        validation: (event, context) => {
          // 检查是否越位（如果启用了越位规则）
          if (this.footballRules.offsideRule) {
            if (event.metadata?.isOffside) {
              return { isValid: false, error: '越位，进球无效' };
            }
          }
          return { isValid: true };
        }
      },
      // 点球进球
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.PENALTY_GOAL,
        points: 1,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: () => ({ isValid: true })
      },
      // 乌龙球
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.OWN_GOAL,
        points: 1,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: (event) => {
          // 乌龙球要给对方加分
          return { isValid: true };
        }
      },
      // 点球未进
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.MISSED_PENALTY,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: () => ({ isValid: true })
      },
      // 黄牌
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.YELLOW_CARD,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: (event, context) => {
          if (!event.playerId) {
            return { isValid: false, error: '黄牌需要指定球员' };
          }

          // 检查是否累积两张黄牌
          const playerKey = `${event.team}-${event.playerId}`;
          const yellowCardInfo = this.yellowCards.get(playerKey);

          if (yellowCardInfo && yellowCardInfo.count >= 1) {
            // 第二张黄牌，自动红牌
            return {
              isValid: true,
              warning: '球员累积两张黄牌，将被罚下（红牌）'
            };
          }

          return { isValid: true };
        }
      },
      // 红牌
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.RED_CARD,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: () => ({ isValid: true })
      },
      // 换人
      {
        sport: SportEngine.FOOTBALL,
        eventType: ScoreEventType.SUBSTITUTION,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: () => ({ isValid: true })
      }
    ];
  }

  /**
   * 重写添加得分事件方法，处理乌龙球和黄牌逻辑
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

    // 如果有效，处理特殊逻辑
    if (fullEvent.isValid) {
      // 处理黄牌
      if (fullEvent.eventType === ScoreEventType.YELLOW_CARD && fullEvent.playerId) {
        this.handleYellowCard(fullEvent);
      }
      // 处理乌龙球（给对方加分）
      else if (fullEvent.eventType === ScoreEventType.OWN_GOAL) {
        const oppositeTeam = fullEvent.team === 'home' ? 'away' : 'home';
        fullEvent.team = oppositeTeam; // 修改为对方队得分
        this.updateScore(fullEvent);
        this.scoreHistory.push({ ...fullEvent, metadata: { ...fullEvent.metadata, isOwnGoal: true } });
      }
      else if (fullEvent.points > 0) {
        this.updateScore(fullEvent);
        this.scoreHistory.push(fullEvent);
      } else {
        this.scoreHistory.push(fullEvent);
      }
    }

    return fullEvent;
  }

  /**
   * 处理黄牌
   */
  private handleYellowCard(event: ScoreEvent): void {
    if (!event.playerId) return;

    const playerKey = `${event.team}-${event.playerId}`;
    const yellowCardInfo = this.yellowCards.get(playerKey);

    if (yellowCardInfo) {
      // 第二张黄牌，累积
      yellowCardInfo.count++;

      // 如果超过阈值，自动转为红牌
      if (yellowCardInfo.count >= this.footballRules.maxYellowCardsBeforeRed) {
        // 创建红牌事件
        const redCardEvent: ScoreEvent = {
          ...event,
          id: this.generateEventId(),
          eventType: ScoreEventType.RED_CARD,
          points: 0,
          timestamp: new Date(),
          isValid: true,
          validationError: undefined,
          metadata: {
            ...event.metadata,
            secondYellowCard: true,
            originalYellowCardId: event.id
          }
        };
        this.scoreHistory.push(redCardEvent);
      }
    } else {
      this.yellowCards.set(playerKey, { team: event.team, count: 1 });
    }
  }

  /**
   * 检查球员是否被罚下
   */
  public isPlayerSentOff(playerId: string): boolean {
    // 检查红牌
    const hasRedCard = this.scoreHistory.some(
      event => event.playerId === playerId &&
               event.eventType === ScoreEventType.RED_CARD
    );

    if (hasRedCard) return true;

    // 检查两张黄牌
    const playerKey = `home-${playerId}`;
    const homeYellowCards = this.yellowCards.get(playerKey);
    if (homeYellowCards && homeYellowCards.count >= this.footballRules.maxYellowCardsBeforeRed) {
      return true;
    }

    const awayKey = `away-${playerId}`;
    const awayYellowCards = this.yellowCards.get(awayKey);
    if (awayYellowCards && awayYellowCards.count >= this.footballRules.maxYellowCardsBeforeRed) {
      return true;
    }

    return false;
  }

  /**
   * 获取球队黄牌数量
   */
  public getTeamYellowCards(team: 'home' | 'away'): number {
    let count = 0;

    this.yellowCards.forEach((info, key) => {
      if (info.team === team) {
        count += info.count;
      }
    });

    return count;
  }

  /**
   * 获取球队红牌数量
   */
  public getTeamRedCards(team: 'home' | 'away'): number {
    return this.scoreHistory.filter(
      event => event.team === team &&
               event.eventType === ScoreEventType.RED_CARD
    ).length;
  }

  /**
   * 获取场上球员数量（考虑红牌和黄牌）
   */
  public getPlayersOnField(team: 'home' | 'away'): number {
    const redCards = this.getTeamRedCards(team);
    const maxPlayers = 11; // 足球标准上场人数
    const minPlayers = 7; // 最低可比赛人数

    return Math.max(minPlayers, maxPlayers - redCards);
  }

  /**
   * 检查是否可以进行换人
   */
  public canSubstitute(team: 'home' | 'away'): boolean {
    const usedSubstitutions = this.scoreHistory.filter(
      event => event.team === team &&
               event.eventType === ScoreEventType.SUBSTITUTION
    ).length;

    // 标准比赛每队可换5人
    const maxSubstitutions = 5;

    return usedSubstitutions < maxSubstitutions;
  }

  /**
   * 获取换人记录
   */
  public getSubstitutions(team: 'home' | 'away'): ScoreEvent[] {
    return this.scoreHistory.filter(
      event => event.team === team &&
               event.eventType === ScoreEventType.SUBSTITUTION
    );
  }

  /**
   * 检查进球是否有效
   */
  public isGoalValid(event: ScoreEvent): boolean {
    if (!event.isValid) return false;

    // 检查越位
    if (this.footballRules.offsideRule && event.metadata?.isOffside) {
      return false;
    }

    return true;
  }

  /**
   * 记录越位
   */
  public recordOffside(event: ScoreEvent): void {
    event.metadata = {
      ...event.metadata,
      isOffside: true
    };
  }

  /**
   * 获取足球特定统计
   */
  public getFootballStats(team: 'home' | 'away') {
    const goals = this.scoreHistory.filter(e =>
      e.team === team &&
      (e.eventType === ScoreEventType.GOAL ||
       e.eventType === ScoreEventType.PENALTY_GOAL)
    ).length;

    const ownGoalsConceded = this.scoreHistory.filter(e =>
      e.team !== team &&
      e.eventType === ScoreEventType.OWN_GOAL
    ).length;

    const penaltiesScored = this.scoreHistory.filter(e =>
      e.team === team &&
      e.eventType === ScoreEventType.PENALTY_GOAL
    ).length;

    const penaltiesMissed = this.scoreHistory.filter(e =>
      e.team === team &&
      e.eventType === ScoreEventType.MISSED_PENALTY
    ).length;

    const yellowCards = this.getTeamYellowCards(team);
    const redCards = this.getTeamRedCards(team);
    const playersOnField = this.getPlayersOnField(team);

    return {
      goals,
      goalsConceded: this.matchContext.sport === SportEngine.FOOTBALL
        ? (team === 'home' ? this.matchContext.awayScore : this.matchContext.homeScore)
        : 0,
      ownGoalsConceded,
      penaltiesScored,
      penaltiesMissed,
      penaltyConversionRate: (penaltiesScored + penaltiesMissed) > 0
        ? Math.round((penaltiesScored / (penaltiesScored + penaltiesMissed)) * 100 * 100) / 100
        : 0,
      yellowCards,
      redCards,
      playersOnField,
      remainingSubstitutions: 5 - this.getSubstitutions(team).length
    };
  }
}
