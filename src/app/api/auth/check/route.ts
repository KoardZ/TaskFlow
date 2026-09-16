import { NextResponse } from 'next/server';
import { checkDevAuth } from '@/lib/auth';

export async function GET() {
  const authenticated = await checkDevAuth();
  return NextResponse.json({ authenticated });
}
