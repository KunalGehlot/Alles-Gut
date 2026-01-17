import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token format' });
    return;
  }

  const token = parts[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    res.status(500).json({ error: 'Internal Server Error', message: 'Server misconfiguration' });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    (req as AuthenticatedRequest).userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

export function generateAccessToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}

export function generateRefreshToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign({ userId, type: 'refresh' }, jwtSecret, { expiresIn: '30d' });
}

export function verifyRefreshToken(token: string): string | null {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload & { type?: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded.userId;
  } catch {
    return null;
  }
}
