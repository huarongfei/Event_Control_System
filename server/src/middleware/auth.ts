import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const generateToken = (user: { id: string; username: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = async (token: string): Promise<any> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const tokenKey = `token:${decoded.id}:${token}`;
    const isBlacklisted = await redisClient.get(tokenKey);
    
    if (isBlacklisted) {
      throw new Error('Token has been invalidated');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const invalidateToken = async (userId: string, token: string): Promise<void> => {
  const tokenKey = `token:${userId}:${token}`;
  const expiry = 24 * 60 * 60;
  await redisClient.setEx(tokenKey, expiry, 'blacklisted');
};
