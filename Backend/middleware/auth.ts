import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models.js';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware to verify JWT token
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // Note: In production, ensure process.env.JWT_SECRET is defined
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      
      req.user = await User.findById(decoded.id).select('-password_hash');
      if (!req.user) {
        return res.status(401).json({ message: 'User account no longer exists' });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict access by role
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user?.role}' is not authorized to access this route.` 
      });
    }
    next();
  };
};