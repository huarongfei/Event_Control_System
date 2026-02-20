/**
 * 计时器管理器工厂
 */
import { MatchTimerManager } from './MatchTimerManager.js';

export class TimerManagerFactory {
  private static instances: Map<string, MatchTimerManager> = new Map();

  /**
   * 创建或获取比赛计时器管理器
   */
  public static getMatchTimerManager(
    matchId: string,
    sport: 'basketball' | 'football' | 'ice_hockey' | 'esports',
    periodCount?: number
  ): MatchTimerManager {
    if (this.instances.has(matchId)) {
      return this.instances.get(matchId)!;
    }

    const manager = new MatchTimerManager(matchId, sport, periodCount);
    this.instances.set(matchId, manager);

    return manager;
  }

  /**
   * 移除比赛计时器管理器
   */
  public static removeMatchTimerManager(matchId: string): boolean {
    const manager = this.instances.get(matchId);

    if (manager) {
      manager.destroy();
      this.instances.delete(matchId);
      return true;
    }

    return false;
  }

  /**
   * 获取所有活跃的比赛
   */
  public static getActiveMatches(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 清除所有计时器管理器
   */
  public static clearAll(): void {
    this.instances.forEach(manager => manager.destroy());
    this.instances.clear();
  }
}
