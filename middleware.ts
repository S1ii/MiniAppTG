import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware executing for path:', request.nextUrl.pathname);
  console.log('Request headers:', Object.fromEntries(request.headers));
  
  // Возвращаем ответ без изменений, но логируем информацию
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
} 