import { NextRequest, NextResponse } from 'next/server';
import { setDevAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = (body.name || body.passcode || '').trim();
    if (!rawName) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุชื่อของคุณ' }, { status: 400 });
    }

    const userName = await setDevAuthCookie(rawName);
    if (!userName) {
      return NextResponse.json({ success: false, error: 'ชื่อไม่ถูกต้อง' }, { status: 400 });
    }

    return NextResponse.json({ success: true, userName });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

