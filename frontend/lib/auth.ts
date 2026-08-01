import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'caculus_tsa_secret_key_2026_super_secure';
const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET_KEY);

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'student';
  name: string;
  studentId: string;
  isVip?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function signJoseToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_BYTES);
}

export async function verifyJoseToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_BYTES);
    return verified.payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Sync legacy fallbacks
export function signToken(payload: TokenPayload): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, JWT_SECRET_KEY) as TokenPayload;
  } catch {
    return null;
  }
}
