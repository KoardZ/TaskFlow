import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabase } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDatabase();

    const { status, actor = 'DEV' } = await req.json();
    const validStatuses = ['BACKLOG', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'APPROVED', 'REWORK'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        activities: {
          create: {
            action: 'STATUS_CHANGED',
            actor,
            details: `เปลี่ยนสถานะเป็น ${status}`,
          },
        },
      },
      include: {
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
