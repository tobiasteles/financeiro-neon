import { NextResponse, type NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/session';

/**
 * Só checa a assinatura do cookie (jose roda no Edge). A consulta ao banco
 * e a checagem de dono ficam nas páginas e nas server actions.
 */
export async function middleware(request: NextRequest) {
  const userId = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const path = request.nextUrl.pathname;

  if (!userId && path.startsWith('/painel')) {
    return NextResponse.redirect(new URL('/entrar', request.url));
  }
  if (userId && path === '/entrar') {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/painel/:path*', '/entrar'],
};
