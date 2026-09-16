import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabase } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { pushLineMessage, createNewTicketFlex } from '@/lib/line';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    await ensureDatabase();

    let count = await prisma.ticket.count();
    if (count === 0) {
      // Auto seed sample tickets
      await prisma.ticket.createMany({
        data: [
          {
            ticketNumber: 1,
            title: 'ปรับขนาดฟอนต์หัวข้อและสีปุ่มกดในหน้า Checkout ให้ตรงตาม CI',
            description: 'ลูกค้าแจ้งในการประชุมเมื่อวานว่า สีปุ่มยังเป็นสีเทา อยากให้ปรับเป็นสีเขียวมรกต และขยายขนาดฟอนต์บนมือถือ',
            priority: 'HIGH',
            status: 'BACKLOG',
            reviewToken: randomUUID(),
            createdBy: 'DEV',
          },
          {
            ticketNumber: 2,
            title: 'แก้ปัญหาการคำนวณส่วนลดคูปองผิดพลาดเมื่อยอดสั่งซื้อมีเศษสตางค์',
            description: 'พบเคสที่ลูกค้ากรอกคูปอง 10% แล้วระบบปัดเศษทศนิยมทำให้ยอดรวมคลาดเคลื่อน 1 บาท',
            priority: 'URGENT',
            status: 'IN_PROGRESS',
            stagingUrl: 'https://staging.example.com/checkout',
            reviewToken: randomUUID(),
            createdBy: 'CLIENT',
          },
          {
            ticketNumber: 3,
            title: 'ปรับปรุงการแสดงผลหน้าประวัติการสั่งซื้อบนมือถือ (Mobile Responsive)',
            description: 'แก้ไขตารางให้กลายเป็น Card view บนหน้าจอขนาดเล็กกว่า 768px เพื่อให้อ่านง่ายขึ้น',
            priority: 'MEDIUM',
            status: 'READY_FOR_REVIEW',
            stagingUrl: 'https://staging.example.com/orders',
            releaseNote: 'ปรับ UI ตารางให้เป็น Responsive Card พร้อมแสดงสถานะการจัดส่งสีสันชัดเจนแล้วครับ',
            reviewToken: randomUUID(),
            readyAt: new Date(),
            createdBy: 'DEV',
          },
        ],
      });
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        attachments: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority = 'MEDIUM', createdBy = 'DEV', stagingUrl, attachments } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกหัวข้อและรายละเอียดงาน' },
        { status: 400 }
      );
    }

    await ensureDatabase();

    // Determine next ticket number
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;

    const reviewToken = randomUUID();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority,
        status: 'BACKLOG',
        stagingUrl: stagingUrl || null,
        reviewToken,
        createdBy,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att: any) => ({
                fileUrl: att.fileUrl,
                fileName: att.fileName || 'attachment',
                fileType: att.fileType || 'image/png',
              })),
            }
          : undefined,
        activities: {
          create: {
            action: 'CREATED',
            actor: createdBy,
            details: `สร้างตั๋วงาน #${ticketNumber}`,
          },
        },
      },
      include: {
        attachments: true,
        activities: true,
      },
    });

    // If created by Client via LIFF, send notification to LINE group
    if (createdBy === 'CLIENT') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const flex = createNewTicketFlex({
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        createdBy: 'ลูกค้า (Client via LINE)',
        appUrl,
      });
      await pushLineMessage([flex]);
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
