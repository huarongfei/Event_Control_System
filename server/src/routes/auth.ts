import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  getUsers,
  updateUser,
  deleteUser
} from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { UserRole } from '../../../shared/types/index.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, authorizeRoles([UserRole.SUPER_ADMIN, UserRole.EVENT_OPERATOR]), getUsers);
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, authorizeRoles([UserRole.SUPER_ADMIN]), deleteUser);

export default router;
