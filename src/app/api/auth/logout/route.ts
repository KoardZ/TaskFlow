import { NextResponse } from 'next/server';
import { clearDevAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearDevAuthCookie();
  return NextResponse.json({ success: true });
}
