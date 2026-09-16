import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pushLineMessage, createApprovedFlex, createReworkFlex } from '@/lib/line';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action,
      reviewerPicture,
      reviewerLineId,
      rejectionReason,
      reviewToken,
      attachments,
    } = body;

    const reviewerName = (body.reviewerName || '').trim();
    if (!reviewerName) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อผู้ตรวจรับงาน' },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    // Security check: verify token matches
    if (reviewToken && ticket.reviewToken !== reviewToken) {
      return NextResponse.json({ success: false, error: 'Invalid review token' }, { status: 403 });
    }

    // Security check: only allow review if status is READY_FOR_REVIEW
    if (ticket.status !== 'READY_FOR_REVIEW') {
      return NextResponse.json(
        { success: false, error: 'ตั๋วงานนี้ยังไม่อยู่ในสถานะรอตรวจรับงาน' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerName,
          reviewerPicture: reviewerPicture || null,
          reviewerLineId: reviewerLineId || null,
          rejectionReason: null,
          activities: {
            create: {
              action: 'APPROVED',
              actor: reviewerName,
              details: `อนุมัติผ่านงาน #${ticket.ticketNumber}`,
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

      // Send Flex Message: Approved
      const approvedFlex = createApprovedFlex({
        ticketNumber: updated.ticketNumber,
        title: updated.title,
        reviewerName: updated.reviewerName,
        reviewedAt: updated.reviewedAt,
      });
      await pushLineMessage([approvedFlex]);

      return NextResponse.json({ success: true, data: updated });
    } else if (action === 'REJECT') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุสิ่งที่ต้องการให้แก้ไขเพิ่มเติม' },
          { status: 400 }
        );
      }

      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'REWORK',
          reviewedAt: new Date(),
          reviewerName,
          reviewerPicture: reviewerPicture || null,
          reviewerLineId: reviewerLineId || null,
          rejectionReason,
          ...(attachments && attachments.length > 0
            ? {
                attachments: {
                  create: attachments.map((att: any) => ({
                    fileUrl: att.fileUrl,
                    fileName: att.fileName || 'rework-attachment',
                    fileType: att.fileType || 'image/png',
                  })),
                },
              }
            : {}),
          activities: {
            create: {
              action: 'REJECTED',
              actor: reviewerName,
              details: `แจ้งแก้ไขเพิ่มเติม: ${rejectionReason}`,
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

      // Send Flex Message: Rework
      const reworkFlex = createReworkFlex({
        ticketNumber: updated.ticketNumber,
        title: updated.title,
        reviewerName: updated.reviewerName,
        rejectionReason: updated.rejectionReason,
      });
      await pushLineMessage([reworkFlex]);

      return NextResponse.json({ success: true, data: updated });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
