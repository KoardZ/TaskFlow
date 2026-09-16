import { prisma } from './prisma';

interface SendLineResult {
  success: boolean;
  isSimulated?: boolean;
  error?: string;
  payload?: any;
}

// Helper to get active LINE settings from DB or .env
export async function getLineConfig() {
  const setting = await prisma.systemSetting.findUnique({
    where: { id: 'default' },
  });

  const token = setting?.lineChannelToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  const groupId = setting?.lineGroupId || process.env.LINE_GROUP_ID || '';
  const liffId = setting?.liffId || process.env.NEXT_PUBLIC_LIFF_ID || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return { token, groupId, liffId, appUrl };
}

// Send Flex Message via LINE Messaging API Push
export async function pushLineMessage(messages: any[]): Promise<SendLineResult> {
  const { token, groupId } = await getLineConfig();

  if (!token || !groupId) {
    console.log('[LINE SIMULATOR] No LINE credentials configured. Logging message payload:', JSON.stringify(messages, null, 2));
    return {
      success: true,
      isSimulated: true,
      payload: messages,
    };
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[LINE ERROR] Failed to push message:', errText);
      return { success: false, error: errText, payload: messages };
    }

    return { success: true, isSimulated: false, payload: messages };
  } catch (err: any) {
    console.error('[LINE EXCEPTION] Error pushing message:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

// 1. Flex Message: งานพร้อมตรวจ (Ready for Review)
export function createReadyForReviewFlex(ticket: {
  id: string;
  ticketNumber: number;
  title: string;
  releaseNote?: string | null;
  stagingUrl?: string | null;
  reviewToken: string;
  appUrl: string;
  liffId?: string;
}) {
  const reviewUrl = ticket.liffId
    ? `https://liff.line.me/${ticket.liffId}?token=${ticket.reviewToken}`
    : `${ticket.appUrl}/review/${ticket.reviewToken}`;

  const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

  return {
    type: 'flex',
    altText: `[TaskFlow] งานพร้อมตรวจรับ ${formattedTicketId}: ${ticket.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0B0F17',
        paddingAll: '18px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: 'TaskFlow: งานพร้อมตรวจรับ',
                color: '#EB0A1E',
                size: 'xs',
                weight: 'bold',
                flex: 1,
              },
              {
                type: 'text',
                text: formattedTicketId,
                color: '#94A3B8',
                size: 'xs',
                weight: 'bold',
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: ticket.title,
            weight: 'bold',
            color: '#FFFFFF',
            size: 'lg',
            margin: 'md',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        backgroundColor: '#FFFFFF',
        contents: [
          {
            type: 'text',
            text: '💡 สิ่งที่ทีม Dev ได้แก้ไข:',
            size: 'xs',
            color: '#64748B',
            weight: 'bold',
          },
          {
            type: 'text',
            text: ticket.releaseNote || 'ทีม Dev ได้แก้ไขและขึ้นระบบพร้อมสำหรับการตรวจรับงานแล้วครับ',
            size: 'sm',
            color: '#0F172A',
            wrap: true,
            margin: 'sm',
          },
          {
            type: 'separator',
            margin: 'xl',
            color: '#E2E8F0',
          },
          ...(ticket.stagingUrl
            ? [
                {
                  type: 'box',
                  layout: 'horizontal',
                  margin: 'lg',
                  contents: [
                    {
                      type: 'text',
                      text: 'ลิงก์ทดสอบ:',
                      size: 'xs',
                      color: '#64748B',
                      flex: 3,
                    },
                    {
                      type: 'text',
                      text: 'คลิกเพื่อเปิดทดสอบระบบ',
                      size: 'xs',
                      color: '#0284C7',
                      weight: 'bold',
                      flex: 6,
                      action: {
                        type: 'uri',
                        label: 'เปิดทดสอบระบบ',
                        uri: ticket.stagingUrl,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '14px',
        backgroundColor: '#F8FAFC',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: '#06C755',
            action: {
              type: 'uri',
              label: 'เปิดตรวจสอบและอนุมัติงาน',
              uri: reviewUrl,
            },
          },
          {
            type: 'text',
            text: 'คลิกเพื่อดูรายละเอียดและผลการดำเนินงาน',
            color: '#94A3B8',
            size: 'xxs',
            align: 'center',
            margin: 'sm',
          },
        ],
      },
    },
  };
}

// 2. Flex Message: ลูกค้าอนุมัติงานผ่านแล้ว (Approved)
export function createApprovedFlex(ticket: {
  ticketNumber: number;
  title: string;
  reviewerName?: string | null;
  reviewedAt?: Date | null;
}) {
  const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

  return {
    type: 'flex',
    altText: `[TaskFlow] ตรวจรับผ่านแล้ว ${formattedTicketId}: ${ticket.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: 'ตรวจรับผ่านแล้ว (APPROVED)',
            color: '#FFFFFF',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: `${formattedTicketId} - ${ticket.title}`,
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
            margin: 'sm',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: `ลูกค้า (${ticket.reviewerName || 'ผู้ตรวจรับ'}) ได้ตรวจสอบและอนุมัติงานเรียบร้อยแล้ว`,
            size: 'sm',
            color: '#0F172A',
            wrap: true,
          },
          {
            type: 'text',
            text: `เวลาที่อนุมัติ: ${new Date().toLocaleString('th-TH')}`,
            size: 'xs',
            color: '#64748B',
            margin: 'md',
          },
        ],
      },
    },
  };
}

// 3. Flex Message: ลูกค้าขอแก้ไขเพิ่มเติม (Rework / Rejected)
export function createReworkFlex(ticket: {
  ticketNumber: number;
  title: string;
  reviewerName?: string | null;
  rejectionReason?: string | null;
}) {
  const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

  return {
    type: 'flex',
    altText: `[TaskFlow] แจ้งแก้ไขเพิ่มเติม ${formattedTicketId}: ${ticket.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#DC2626',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: 'แจ้งแก้ไขเพิ่มเติม (REWORK)',
            color: '#FFFFFF',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: `${formattedTicketId} - ${ticket.title}`,
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
            margin: 'sm',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: `ผู้ส่งข้อคิดเห็น: ${ticket.reviewerName || 'ลูกค้า'}`,
            size: 'xs',
            color: '#64748B',
            weight: 'bold',
          },
          {
            type: 'text',
            text: 'จุดที่ต้องการให้แก้ไขเพิ่มเติม:',
            size: 'xs',
            color: '#64748B',
            margin: 'md',
            weight: 'bold',
          },
          {
            type: 'text',
            text: ticket.rejectionReason || 'มีจุดที่ต้องการให้ปรับปรุงแก้ไข',
            size: 'sm',
            color: '#B91C1C',
            wrap: true,
            margin: 'sm',
          },
        ],
      },
    },
  };
}

// 4. Flex Message: มีคอมเมนต์/ตั๋วใหม่จากลูกค้า
export function createNewTicketFlex(ticket: {
  ticketNumber: number;
  title: string;
  description: string;
  createdBy: string;
  appUrl: string;
}) {
  const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

  return {
    type: 'flex',
    altText: `[TaskFlow] มีการแจ้งเรื่องใหม่ ${formattedTicketId}: ${ticket.title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0F172A',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: 'มีงานแจ้งเข้ามาใหม่',
            color: '#38BDF8',
            size: 'xs',
            weight: 'bold',
          },
          {
            type: 'text',
            text: `${formattedTicketId} - ${ticket.title}`,
            weight: 'bold',
            color: '#FFFFFF',
            size: 'md',
            margin: 'sm',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: ticket.description,
            size: 'sm',
            color: '#0F172A',
            wrap: true,
          },
          {
            type: 'text',
            text: `ผู้เปิดเรื่อง: ${ticket.createdBy === 'CLIENT' ? 'ลูกค้า' : 'ทีม Dev'}`,
            size: 'xs',
            color: '#64748B',
            margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: 'เปิดดูบอร์ดงาน',
              uri: ticket.appUrl,
            },
          },
        ],
      },
    },
  };
}
