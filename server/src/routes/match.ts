import { Router } from 'express';
import {
  createMatch,
  getMatches,
  getMatch,
  updateMatch,
  deleteMatch,
  updateMatchStatus,
  lockMatch
} from '../controllers/matchController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { UserRole } from '../../../shared/types/index.js';

const router = Router();

router.post('/',
  authenticateToken,
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.EVENT_OPERATOR, UserRole.DIRECTOR]),
  createMatch
);

router.get('/',
  authenticateToken,
  getMatches
);

router.get('/:id',
  authenticateToken,
  getMatch
);

router.put('/:id',
  authenticateToken,
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.EVENT_OPERATOR, UserRole.DIRECTOR]),
  updateMatch
);

router.delete('/:id',
  authenticateToken,
  authorizeRoles([UserRole.SUPER_ADMIN]),
  deleteMatch
);

router.patch('/:id/status',
  authenticateToken,
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.EVENT_OPERATOR, UserRole.DIRECTOR]),
  updateMatchStatus
);

router.patch('/:id/lock',
  authenticateToken,
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.EVENT_OPERATOR, UserRole.DIRECTOR]),
  lockMatch
);

export default router;
