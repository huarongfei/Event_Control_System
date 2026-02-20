/**
 * 计时器单元测试
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Timer, TimerMode, TimerStatus, TimerType } from '../Timer.js';

describe('Timer', () => {
  let timer: Timer;

  beforeEach(() => {
    timer = new Timer({
      id: 'test-timer',
      matchId: 'test-match',
      type: TimerType.GAME,
      mode: TimerMode.COUNTDOWN,
      initialTime: 60000, // 60秒
      autoStart: false
    });
  });

  afterEach(() => {
    timer.destroy();
  });

  test('应该正确初始化计时器', () => {
    const state = timer.getState();
    expect(state.status).toBe(TimerStatus.IDLE);
    expect(state.currentTime).toBe(60000);
    expect(state.initialTime).toBe(60000);
  });

  test('应该正确启动计时器', () => {
    timer.start();

    const state = timer.getState();
    expect(state.status).toBe(TimerStatus.RUNNING);
    expect(state.startedAt).toBeDefined();
  });

  test('应该正确暂停计时器', () => {
    timer.start();
    timer.pause();

    const state = timer.getState();
    expect(state.status).toBe(TimerStatus.PAUSED);
    expect(state.pausedAt).toBeDefined();
  });

  test('应该正确重置计时器', () => {
    timer.start();
    timer.reset();

    const state = timer.getState();
    expect(state.status).toBe(TimerStatus.IDLE);
    expect(state.currentTime).toBe(60000);
    expect(state.elapsedTime).toBe(0);
  });

  test('倒计时应该正确减少时间', (done) => {
    let changeCount = 0;

    timer.on('change', (state) => {
      changeCount++;
      if (changeCount > 10) {
        expect(state.currentTime).toBeLessThan(60000);
        timer.pause();
        done();
      }
    });

    timer.start();
  }, 5000);

  test('应该正确设置时间', () => {
    timer.setTime(30000);

    const state = timer.getState();
    expect(state.currentTime).toBe(30000);
  });

  test('应该正确增加时间', () => {
    timer.addTime(10000);

    const state = timer.getState();
    expect(state.currentTime).toBe(70000);
  });

  test('应该正确减少时间', () => {
    timer.subtractTime(10000);

    const state = timer.getState();
    expect(state.currentTime).toBe(50000);
  });

  test('应该在时间耗尽时完成', (done) => {
    const shortTimer = new Timer({
      id: 'short-timer',
      matchId: 'test-match',
      type: TimerType.GAME,
      mode: TimerMode.COUNTDOWN,
      initialTime: 100, // 100ms
      autoStart: true
    });

    shortTimer.on('change', (state) => {
      if (state.status === TimerStatus.COMPLETED) {
        expect(state.remainingTime).toBe(0);
        shortTimer.destroy();
        done();
      }
    });
  }, 1000);

  test('应该正确记录事件', () => {
    timer.start();
    timer.pause();
    timer.stop();

    const events = timer.getEvents();
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0].type).toBe('start');
    expect(events[1].type).toBe('pause');
    expect(events[2].type).toBe('stop');
  });

  test('应该支持监听器', () => {
    const mockCallback = jest.fn();

    timer.on('change', mockCallback);
    timer.start();

    expect(mockCallback).toHaveBeenCalled();

    timer.off('change', mockCallback);
    timer.stop();
  });

  test('正计时模式应该增加时间', (done) => {
    const countUpTimer = new Timer({
      id: 'countup-timer',
      matchId: 'test-match',
      type: TimerType.GAME,
      mode: TimerMode.COUNTUP,
      initialTime: 0,
      autoStart: false
    });

    let initialTime: number;

    countUpTimer.on('change', (state) => {
      if (state.status === TimerStatus.RUNNING) {
        initialTime = state.currentTime;
      } else if (state.currentTime > initialTime && state.status === TimerStatus.RUNNING) {
        expect(state.currentTime).toBeGreaterThan(0);
        countUpTimer.pause();
        countUpTimer.destroy();
        done();
      }
    });

    countUpTimer.start();
  }, 2000);
});
