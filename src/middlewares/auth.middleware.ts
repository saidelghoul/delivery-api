import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util.js';
import type { JwtPayload } from 'jsonwebtoken';

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  enterpriseId?: string | null;
}
// Extend Express Request type to include user data
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    enterpriseId?: string | null | undefined;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'You are not logged in' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing from header' });
    }
    // 2. Verify token
    const decoded = verifyAccessToken(token) as AccessTokenPayload;

    // 3. Grant access and attach user info to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      enterpriseId: decoded.enterpriseId,
    };

    next();
  } catch (_) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
