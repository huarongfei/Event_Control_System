/**
 * 计时器路由
 */
import { Router } from 'express';
import {
  startTimer,
  pauseTimer,
  nextPeriod,
  setTime,
  addTime,
  subtractTime,
  resetShotClock,
  getTimerStatus,
  resetTimers
} from '../controllers/timerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 基础计时操作
router.post('/matches/:matchId/start', startTimer);
router.post('/matches/:matchId/pause', pauseTimer);
router.post('/matches/:matchId/next-period', nextPeriod);
router.get('/matches/:matchId/status', getTimerStatus);
router.post('/matches/:matchId/reset', resetTimers);

// 时间调整
router.put('/matches/:matchId/timers/:timerType/set', setTime);
router.put('/matches/:matchId/timers/:timerType/add', addTime);
router.put('/matches/:matchId/timers/:timerType/subtract', subtractTime);

// 篮球特定操作
router.post('/matches/:matchId/reset-shot-clock', resetShotClock);

export default router;
