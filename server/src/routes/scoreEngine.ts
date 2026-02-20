/**
 * 计分引擎路由
 */
import { Router } from 'express';
import {
  addScoreEvent,
  undoEvent,
  getScoreHistory,
  getMatchStats,
  updateGameClock,
  recordFoul,
  recordTimeout,
  resetShotClock,
  recordYellowCard,
  recordRedCard,
  getEngineStatus
} from '../controllers/scoreEngineController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 基础得分操作
router.post('/matches/:matchId/score-events', addScoreEvent);
router.delete('/matches/:matchId/score-events/:eventId', undoEvent);
router.get('/matches/:matchId/score-history', getScoreHistory);
router.get('/matches/:matchId/stats', getMatchStats);
router.get('/matches/:matchId/engine-status', getEngineStatus);

// 时钟控制
router.put('/matches/:matchId/game-clock', updateGameClock);
router.post('/matches/:matchId/reset-shot-clock', resetShotClock);

// 犯规和暂停
router.post('/matches/:matchId/foul', recordFoul);
router.post('/matches/:matchId/timeout', recordTimeout);

// 足球特定操作
router.post('/matches/:matchId/yellow-card', recordYellowCard);
router.post('/matches/:matchId/red-card', recordRedCard);

export default router;
