import { NextRequest, NextResponse } from 'next/server';
import { setDevAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();
    if (!passcode) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสผ่าน' }, { status: 400 });
    }

    const valid = await setDevAuthCookie(passcode);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
