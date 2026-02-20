/**
 * 篮球计分引擎
 */
import { BaseScoreEngine } from './ScoreEngine.js';
import {
  ScoreEvent,
  ScoreEventType,
  ScoreRule,
  MatchContext,
  BasketballRules,
  SportEngine
} from '../types/scoreEngine.js';

export class BasketballScoreEngine extends BaseScoreEngine {
  private basketballRules: BasketballRules;

  constructor(matchContext: MatchContext, rules: BasketballRules) {
    super(matchContext);
    this.basketballRules = rules;
  }

  /**
   * 初始化篮球规则
   */
  protected initializeRules(): ScoreRule[] {
    return [
      // 罚球命中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.FREE_THROW_MAKE,
        points: 1,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8], // 包括加时赛
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '罚球不需要进攻时钟' };
          }
          return { isValid: true };
        }
      },
      // 罚球未中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.FREE_THROW_MISS,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '罚球不需要进攻时钟' };
          }
          return { isValid: true };
        }
      },
      // 两分命中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.TWO_POINT_MAKE,
        points: 2,
        requiresPlayer: true,
        requiresShotClock: true,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '投篮需要进攻时钟' };
          }
          if (event.shotClock! < 0) {
            return { isValid: false, error: '进攻时钟不能为负数' };
          }
          return { isValid: true };
        }
      },
      // 两分未中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.TWO_POINT_MISS,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: true,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '投篮需要进攻时钟' };
          }
          return { isValid: true };
        }
      },
      // 三分命中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.THREE_POINT_MAKE,
        points: 3,
        requiresPlayer: true,
        requiresShotClock: true,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '投篮需要进攻时钟' };
          }
          if (event.shotClock! < 0) {
            return { isValid: false, error: '进攻时钟不能为负数' };
          }
          return { isValid: true };
        }
      },
      // 三分未中
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.THREE_POINT_MISS,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: true,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          if (event.shotClock === undefined) {
            return { isValid: false, error: '投篮需要进攻时钟' };
          }
          return { isValid: true };
        }
      },
      // 暂停
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.TIMEOUT,
        points: 0,
        requiresPlayer: false,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4],
        validation: (event, context) => {
          const teamTimeouts = event.team === 'home' ? context.homeTimeouts : context.awayTimeouts;
          if (teamTimeouts <= 0) {
            return { isValid: false, error: `${event.team === 'home' ? '主队' : '客队'}没有剩余暂停次数` };
          }
          return { isValid: true };
        }
      },
      // 普通犯规
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.FOUL,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: (event, context) => {
          const teamFouls = event.team === 'home' ? context.homeFouls : context.awayFouls;
          if (teamFouls >= this.basketballRules.maxFoulsPerPeriod) {
            return {
              isValid: true,
              warning: `球队犯规已达上限，将获得罚球`
            };
          }
          if (teamFouls >= this.basketballRules.freeThrowFoulLimit) {
            return {
              isValid: true,
              warning: `球队犯规超过${this.basketballRules.freeThrowFoulLimit}次，进入罚球状态`
            };
          }
          return { isValid: true };
        }
      },
      // 技术犯规
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.TECHNICAL_FOUL,
        points: 0,
        requiresPlayer: false,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: () => ({ isValid: true })
      },
      // 恶意犯规
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.FLAGRANT_FOUL,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: () => ({ isValid: true })
      },
      // 换人
      {
        sport: SportEngine.BASKETBALL,
        eventType: ScoreEventType.SUBSTITUTION,
        points: 0,
        requiresPlayer: true,
        requiresShotClock: false,
        allowedPeriods: [1, 2, 3, 4, 5, 6, 7, 8],
        validation: () => ({ isValid: true })
      }
    ];
  }

  /**
   * 检查是否进入罚球状态
   */
  public isInBonus(team: 'home' | 'away'): boolean {
    const teamFouls = team === 'home' ?
      this.matchContext.homeFouls :
      this.matchContext.awayFouls;

    return teamFouls >= this.basketballRules.freeThrowFoulLimit;
  }

  /**
   * 检查是否进入双罚球状态
   */
  public isInDoubleBonus(team: 'home' | 'away'): boolean {
    const teamFouls = team === 'home' ?
      this.matchContext.homeFouls :
      this.matchContext.awayFouls;

    return teamFouls >= this.basketballRules.doubleBonusFoulThreshold;
  }

  /**
   * 重置进攻时钟
   */
  public resetShotClock(team?: 'home' | 'away'): void {
    this.matchContext.shotClock = this.basketballRules.shotClockDuration;
  }

  /**
   * 进攻篮板重置进攻时钟
   */
  public resetShotClockOnOffensiveRebound(): void {
    this.matchContext.shotClock = this.basketballRules.shotClockResetOnOffensiveRebound;
  }

  /**
   * 记录犯规
   */
  public recordFoul(team: 'home' | 'away', playerId?: string): void {
    if (team === 'home') {
      this.matchContext.homeFouls++;
    } else {
      this.matchContext.awayFouls++;
    }
  }

  /**
   * 记录暂停
   */
  public recordTimeout(team: 'home' | 'away'): void {
    if (team === 'home') {
      this.matchContext.homeTimeouts--;
    } else {
      this.matchContext.awayTimeouts--;
    }
  }

  /**
   * 检查球员是否犯满离场
   */
  public isPlayerFouledOut(playerId: string): boolean {
    const playerFouls = this.scoreHistory.filter(
      event => event.playerId === playerId &&
               (event.eventType === ScoreEventType.FOUL ||
                event.eventType === ScoreEventType.TECHNICAL_FOUL)
    ).length;

    return playerFouls >= this.basketballRules.maxFoulsPerPlayer;
  }

  /**
   * 计算球队投篮命中率
   */
  public getTeamFieldGoalPercentage(team: 'home' | 'away'): number {
    const teamEvents = this.scoreHistory.filter(e => e.team === team);
    const made = teamEvents.filter(e =>
      e.eventType === ScoreEventType.TWO_POINT_MAKE ||
      e.eventType === ScoreEventType.THREE_POINT_MAKE
    ).length;
    const attempted = teamEvents.filter(e =>
      e.eventType === ScoreEventType.TWO_POINT_MAKE ||
      e.eventType === ScoreEventType.TWO_POINT_MISS ||
      e.eventType === ScoreEventType.THREE_POINT_MAKE ||
      e.eventType === ScoreEventType.THREE_POINT_MISS
    ).length;

    return attempted > 0 ? Math.round((made / attempted) * 100 * 100) / 100 : 0;
  }

  /**
   * 计算球队三分命中率
   */
  public getTeamThreePointPercentage(team: 'home' | 'away'): number {
    const teamEvents = this.scoreHistory.filter(e => e.team === team);
    const made = teamEvents.filter(e =>
      e.eventType === ScoreEventType.THREE_POINT_MAKE
    ).length;
    const attempted = teamEvents.filter(e =>
      e.eventType === ScoreEventType.THREE_POINT_MAKE ||
      e.eventType === ScoreEventType.THREE_POINT_MISS
    ).length;

    return attempted > 0 ? Math.round((made / attempted) * 100 * 100) / 100 : 0;
  }

  /**
   * 计算球队罚球命中率
   */
  public getTeamFreeThrowPercentage(team: 'home' | 'away'): number {
    const teamEvents = this.scoreHistory.filter(e => e.team === team);
    const made = teamEvents.filter(e =>
      e.eventType === ScoreEventType.FREE_THROW_MAKE
    ).length;
    const attempted = teamEvents.filter(e =>
      e.eventType === ScoreEventType.FREE_THROW_MAKE ||
      e.eventType === ScoreEventType.FREE_THROW_MISS
    ).length;

    return attempted > 0 ? Math.round((made / attempted) * 100 * 100) / 100 : 0;
  }

  /**
   * 获取篮球特定统计
   */
  public getBasketballStats(team: 'home' | 'away') {
    return {
      fieldGoalPercentage: this.getTeamFieldGoalPercentage(team),
      threePointPercentage: this.getTeamThreePointPercentage(team),
      freeThrowPercentage: this.getTeamFreeThrowPercentage(team),
      isInBonus: this.isInBonus(team),
      isInDoubleBonus: this.isInDoubleBonus(team),
      fouls: team === 'home' ? this.matchContext.homeFouls : this.matchContext.awayFouls,
      timeouts: team === 'home' ? this.matchContext.homeTimeouts : this.matchContext.awayTimeouts,
      shotClock: this.matchContext.shotClock
    };
  }
}
