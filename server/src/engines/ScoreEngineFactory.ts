/**
 * 计分引擎工厂
 */
import { BaseScoreEngine } from './ScoreEngine.js';
import { BasketballScoreEngine } from './BasketballScoreEngine.js';
import { FootballScoreEngine } from './FootballScoreEngine.js';
import {
  MatchContext,
  BasketballRules,
  FootballRules,
  SportEngine,
  EngineConfig
} from '../types/scoreEngine.js';

export class ScoreEngineFactory {
  /**
   * 创建计分引擎
   */
  public static createEngine(
    sport: SportEngine,
    matchContext: MatchContext,
    config?: Partial<EngineConfig>
  ): BaseScoreEngine {
    switch (sport) {
      case SportEngine.BASKETBALL:
        const basketballRules: BasketballRules = {
          maxFoulsPerPeriod: 5,
          maxFoulsPerPlayer: 6,
          freeThrowFoulLimit: 4,
          shotClockDuration: 24,
          shotClockResetOnOffensiveRebound: 14,
          bonusFoulThreshold: 5,
          doubleBonusFoulThreshold: 8,
          ...config?.rules
        };

        return new BasketballScoreEngine(matchContext, basketballRules);

      case SportEngine.FOOTBALL:
        const footballRules: FootballRules = {
          maxYellowCardsBeforeRed: 2,
          directRedCardEjection: true,
          offsideRule: true,
          extraTimePenaltyFormat: 'full_time',
          ...config?.rules
        };

        return new FootballScoreEngine(matchContext, footballRules);

      default:
        throw new Error(`不支持的运动类型: ${sport}`);
    }
  }

  /**
   * 创建篮球引擎（便捷方法）
   */
  public static createBasketballEngine(
    matchContext: MatchContext,
    customRules?: Partial<BasketballRules>
  ): BasketballScoreEngine {
    const rules: BasketballRules = {
      maxFoulsPerPeriod: 5,
      maxFoulsPerPlayer: 6,
      freeThrowFoulLimit: 4,
      shotClockDuration: 24,
      shotClockResetOnOffensiveRebound: 14,
      bonusFoulThreshold: 5,
      doubleBonusFoulThreshold: 8,
      ...customRules
    };

    return new BasketballScoreEngine(matchContext, rules);
  }

  /**
   * 创建足球引擎（便捷方法）
   */
  public static createFootballEngine(
    matchContext: MatchContext,
    customRules?: Partial<FootballRules>
  ): FootballScoreEngine {
    const rules: FootballRules = {
      maxYellowCardsBeforeRed: 2,
      directRedCardEjection: true,
      offsideRule: true,
      extraTimePenaltyFormat: 'full_time',
      ...customRules
    };

    return new FootballScoreEngine(matchContext, rules);
  }

  /**
   * 获取默认篮球规则
   */
  public static getDefaultBasketballRules(): BasketballRules {
    return {
      maxFoulsPerPeriod: 5,
      maxFoulsPerPlayer: 6,
      freeThrowFoulLimit: 4,
      shotClockDuration: 24,
      shotClockResetOnOffensiveRebound: 14,
      bonusFoulThreshold: 5,
      doubleBonusFoulThreshold: 8
    };
  }

  /**
   * 获取默认足球规则
   */
  public static getDefaultFootballRules(): FootballRules {
    return {
      maxYellowCardsBeforeRed: 2,
      directRedCardEjection: true,
      offsideRule: true,
      extraTimePenaltyFormat: 'full_time'
    };
  }
}
