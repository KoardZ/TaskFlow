import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabase } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await ensureDatabase();

    const ticket = await prisma.ticket.findUnique({
      where: { reviewToken: token },
      include: {
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'ไม่พบตั๋วงานหรือลิงก์ไม่ถูกต้อง' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
