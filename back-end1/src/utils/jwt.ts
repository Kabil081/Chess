import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not set in environment variables');
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username?: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d', // Token expires in 7 days
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }
    const decoded = jwt.verify(token.trim(), getJwtSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};
