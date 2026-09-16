import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabase } from '@/lib/prisma';
import { pushLineMessage, createReadyForReviewFlex, getLineConfig } from '@/lib/line';
import { checkDevAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await checkDevAuth();
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'กรุณาใส่รหัส Dev เพื่อส่งงานให้ลูกค้าตรวจรับ' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await ensureDatabase();

    const { stagingUrl, releaseNote, attachments } = await req.json();

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    // Update ticket state to READY_FOR_REVIEW
    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'READY_FOR_REVIEW',
        stagingUrl: stagingUrl || ticket.stagingUrl,
        releaseNote: releaseNote || ticket.releaseNote,
        readyAt: new Date(),
        ...(attachments && attachments.length > 0
          ? {
              attachments: {
                create: attachments.map((att: any) => ({
                  fileUrl: att.fileUrl,
                  fileName: att.fileName || 'review-attachment',
                  fileType: att.fileType || 'image/png',
                })),
              },
            }
          : {}),
        activities: {
          create: {
            action: 'SENT_REVIEW',
            actor: 'DEV',
            details: `ส่งตรวจงานเข้ากลุ่ม LINE: ${releaseNote || 'แก้เสร็จแล้ว'}`,
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

    // Send LINE Flex Message
    const { appUrl, liffId } = await getLineConfig();
    const flexMessage = createReadyForReviewFlex({
      id: updated.id,
      ticketNumber: updated.ticketNumber,
      title: updated.title,
      releaseNote: updated.releaseNote,
      stagingUrl: updated.stagingUrl,
      reviewToken: updated.reviewToken,
      appUrl,
      liffId: liffId || undefined,
    });

    const lineResult = await pushLineMessage([flexMessage]);

    const cleanLiffId = liffId?.replace(/\/+$/, '').trim();
    const cleanAppUrl = appUrl.replace(/\/+$/, '');

    return NextResponse.json({
      success: true,
      data: updated,
      lineResult,
      reviewUrl: cleanLiffId
        ? `https://liff.line.me/${cleanLiffId}/review/${updated.reviewToken}`
        : `${cleanAppUrl}/review/${updated.reviewToken}`,
    });
  } catch (error: any) {
    console.error('Error sending ready for review:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
