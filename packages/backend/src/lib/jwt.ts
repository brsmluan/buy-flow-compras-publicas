// =============================================================================
// BUY-FLOW BACKEND - JWT Utilities (jose library - edge compatible)
// =============================================================================

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { env } from '../config/index';
import type { TokenPayload } from '@buy-flow/shared/types';

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET || env.JWT_SECRET + '-refresh-v2');

interface JWTCustomPayload extends JWTPayload {
  sub: string;
  tenantId: string | null;
  email: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
}

export async function signAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTCustomPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTCustomPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTCustomPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    return payload as unknown as JWTCustomPayload;
  } catch {
    return null;
  }
}

export async function decodeToken(token: string): Promise<JWTCustomPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 0 });
    return payload as unknown as JWTCustomPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}