import { NextResponse } from 'next/server';
import { getDevUser } from '@/lib/auth';

export async function GET() {
  const userName = await getDevUser();
  return NextResponse.json({ authenticated: !!userName, userName });
}

