import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'orcamento_sessao';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error('AUTH_SECRET ausente ou curto demais. Gere uma chave de 32 bytes.');
  }
  return new TextEncoder().encode(value);
}

/** Token assinado (HS256) guardado num cookie httpOnly. */
export async function signSession(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function readSession(token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null; // expirado ou adulterado
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};
