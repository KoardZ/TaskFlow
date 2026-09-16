import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabase } from '@/lib/prisma';
import { checkDevAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDatabase();
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDatabase();

    const body = await req.json();
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.stagingUrl !== undefined) updateData.stagingUrl = body.stagingUrl;
    if (body.status !== undefined) updateData.status = body.status;

    // Delete attachments if requested
    if (Array.isArray(body.deletedAttachmentIds) && body.deletedAttachmentIds.length > 0) {
      await prisma.attachment.deleteMany({
        where: {
          id: { in: body.deletedAttachmentIds },
          ticketId: id,
        },
      });
    }

    // Add new attachments if provided
    if (Array.isArray(body.newAttachments) && body.newAttachments.length > 0) {
      for (const att of body.newAttachments) {
        await prisma.attachment.create({
          data: {
            ticketId: id,
            fileUrl: att.fileUrl,
            fileName: att.fileName || 'attachment',
            fileType: att.fileType || 'image/png',
          },
        });
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        ticketId: id,
        action: 'EDITED',
        actor: 'DEV',
        details: 'แก้ไขข้อมูลตั๋วงาน',
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureDatabase();

    // Delete related records first to ensure clean cascade in SQLite
    await prisma.activityLog.deleteMany({ where: { ticketId: id } });
    await prisma.attachment.deleteMany({ where: { ticketId: id } });

    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete ticket' }, { status: 500 });
  }
}
