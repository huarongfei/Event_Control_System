/**
 * 比赛分析器
 */
import { MatchAnalytics, DataPoint } from '../types/analytics.js';
import { v4 as uuidv4 } from 'uuid';

export class MatchAnalyzer {
  /**
   * 分析比赛
   */
  public analyzeMatch(matchData: any): MatchAnalytics {
    const homeTeam = this.analyzeTeamPerformance(matchData, 'home');
    const awayTeam = this.analyzeTeamPerformance(matchData, 'away');
    const keyMoments = this.identifyKeyMoments(matchData);
    const momentum = this.calculateMomentum(matchData);
    const scoringRuns = this.identifyScoringRuns(matchData);

    return {
      matchId: matchData.id,
      sport: matchData.sport,
      homeTeam,
      awayTeam,
      keyMoments,
      momentum,
      scoringRuns
    };
  }

  /**
   * 分析球队表现
   */
  private analyzeTeamPerformance(matchData: any, team: 'home' | 'away'): any {
    const teamData = matchData[`${team}Team`];
    const scoreEvents = matchData.scoreEvents.filter(
      (e: any) => e.team === team
    );

    const statistics = this.calculateTeamStats(scoreEvents, matchData.sport);

    return {
      id: teamData.id,
      name: teamData.name,
      score: teamData.score,
      statistics
    };
  }

  /**
   * 计算球队统计
   */
  private calculateTeamStats(events: any[], sport: string): any {
    if (sport === 'basketball') {
      return this.calculateBasketballStats(events);
    } else if (sport === 'football') {
      return this.calculateFootballStats(events);
    }

    return {};
  }

  /**
   * 计算篮球统计
   */
  private calculateBasketballStats(events: any[]): any {
    const twoPoints = events.filter(e => e.eventType === 'two_point_make');
    const threePoints = events.filter(e => e.eventType === 'three_point_make');
    const freeThrows = events.filter(e => e.eventType === 'free_throw_make');

    const twoPointMisses = events.filter(e => e.eventType === 'two_point_miss');
    const threePointMisses = events.filter(e => e.eventType === 'three_point_miss');
    const freeThrowMisses = events.filter(e => e.eventType === 'free_throw_miss');

    return {
      fieldGoals: {
        made: twoPoints.length + threePoints.length,
        attempted: twoPoints.length + threePoints.length + twoPointMisses.length + threePointMisses.length,
        percentage: this.calculatePercentage(
          twoPoints.length + threePoints.length,
          twoPoints.length + threePoints.length + twoPointMisses.length + threePointMisses.length
        )
      },
      threePointers: {
        made: threePoints.length,
        attempted: threePoints.length + threePointMisses.length,
        percentage: this.calculatePercentage(
          threePoints.length,
          threePoints.length + threePointMisses.length
        )
      },
      freeThrows: {
        made: freeThrows.length,
        attempted: freeThrows.length + freeThrowMisses.length,
        percentage: this.calculatePercentage(
          freeThrows.length,
          freeThrows.length + freeThrowMisses.length
        )
      },
      fouls: events.filter(e => e.eventType === 'foul').length,
      timeouts: events.filter(e => e.eventType === 'timeout').length
    };
  }

  /**
   * 计算足球统计
   */
  private calculateFootballStats(events: any[]): any {
    return {
      goals: events.filter(e => e.eventType === 'goal').length,
      ownGoals: events.filter(e => e.eventType === 'own_goal').length,
      yellowCards: events.filter(e => e.eventType === 'yellow_card').length,
      redCards: events.filter(e => e.eventType === 'red_card').length,
      penaltiesScored: events.filter(e => e.eventType === 'penalty_goal').length,
      penaltiesMissed: events.filter(e => e.eventType === 'missed_penalty').length
    };
  }

  /**
   * 计算百分比
   */
  private calculatePercentage(made: number, attempted: number): number {
    if (attempted === 0) return 0;
    return Math.round((made / attempted) * 100 * 100) / 100;
  }

  /**
   * 识别关键时刻
   */
  private identifyKeyMoments(matchData: any): Array<{
    time: number;
    type: string;
    description: string;
    impact: number;
  }> {
    const keyMoments: any[] = [];
    const events = matchData.scoreEvents;
    const periodDuration = this.getPeriodDuration(matchData.sport);

    events.forEach((event: any) => {
      let impact = 0;
      let type = 'score';
      let description = '';

      // 进球得分
      if (event.points > 0) {
        const timePercent = (event.gameClock / periodDuration) * 100;
        const isLateGame = timePercent > 80;
        const isCloseGame = this.isCloseGame(matchData, event);

        if (isLateGame && isCloseGame) {
          impact = 5;
          type = 'game_winning_shot';
          description = `关键时刻 - ${event.team} 得分`;
        } else if (isCloseGame) {
          impact = 3;
          description = `关键得分 - ${event.team}`;
        } else {
          impact = 1;
          description = `${event.team} 得分`;
        }
      }
      // 犯规
      else if (event.eventType.includes('foul')) {
        const fouls = this.getTeamFouls(matchData, event.team);
        if (fouls >= 5) {
          impact = 3;
          type = 'critical_foul';
          description = `关键犯规 - ${event.team} 犯规次数已达${fouls}次`;
        } else {
          impact = 1;
          type = 'foul';
          description = `${event.team} 犯规`;
        }
      }
      // 暂停
      else if (event.eventType === 'timeout') {
        impact = 2;
        type = 'timeout';
        description = `${event.team} 暂停`;
      }

      if (impact > 0) {
        keyMoments.push({
          time: event.gameClock,
          type,
          description,
          impact
        });
      }
    });

    return keyMoments.sort((a, b) => b.impact - a.impact).slice(0, 20);
  }

  /**
   * 比赛是否接近
   */
  private isCloseGame(matchData: any, event: any): boolean {
    const homeScore = matchData.homeTeam.score;
    const awayScore = matchData.awayTeam.score;
    return Math.abs(homeScore - awayScore) <= 10;
  }

  /**
   * 获取球队犯规次数
   */
  private getTeamFouls(matchData: any, team: string): number {
    return matchData.scoreEvents.filter(
      (e: any) => e.team === team && e.eventType.includes('foul')
    ).length;
  }

  /**
   * 获取节次时长
   */
  private getPeriodDuration(sport: string): number {
    switch (sport) {
      case 'basketball':
        return 720; // 12分钟
      case 'football':
        return 2700; // 45分钟
      default:
        return 720;
    }
  }

  /**
   * 计算动量
   */
  private calculateMomentum(matchData: any): DataPoint[] {
    const momentum: DataPoint[] = [];
    const events = matchData.scoreEvents;
    const windowSize = 5;

    for (let i = windowSize; i < events.length; i++) {
      const windowEvents = events.slice(i - windowSize, i);
      const homePoints = windowEvents
        .filter((e: any) => e.team === 'home')
        .reduce((sum: number, e: any) => sum + e.points, 0);
      const awayPoints = windowEvents
        .filter((e: any) => e.team === 'away')
        .reduce((sum: number, e: any) => sum + e.points, 0);

      momentum.push({
        timestamp: new Date(events[i].timestamp),
        value: homePoints - awayPoints
      });
    }

    return momentum;
  }

  /**
   * 识别得分高潮
   */
  private identifyScoringRuns(matchData: any): Array<{
    team: string;
    start: number;
    end: number;
    points: number;
    duration: number;
  }> {
    const runs: any[] = [];
    const events = matchData.scoreEvents;
    const threshold = 8; // 得分高潮阈值

    let currentRun: any = null;

    events.forEach((event: any) => {
      if (event.points > 0) {
        const team = event.team;

        if (!currentRun) {
          currentRun = {
            team,
            start: event.gameClock,
            end: event.gameClock,
            points: event.points,
            duration: 0
          };
        } else if (currentRun.team === team) {
          currentRun.end = event.gameClock;
          currentRun.points += event.points;
          currentRun.duration = currentRun.start - currentRun.end;
        } else {
          // 队伍切换，保存当前高潮
          if (currentRun.points >= threshold) {
            runs.push(currentRun);
          }
          currentRun = {
            team,
            start: event.gameClock,
            end: event.gameClock,
            points: event.points,
            duration: 0
          };
        }
      }
    });

    // 保存最后一个高潮
    if (currentRun && currentRun.points >= threshold) {
      runs.push(currentRun);
    }

    return runs.sort((a, b) => b.points - a.points);
  }
}
