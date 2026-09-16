import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkDevAuth } from '@/lib/auth';

export async function GET() {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await prisma.systemSetting.create({
        data: {
          id: 'default',
          projectName: 'TaskFlow',
          lineChannelToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
          lineGroupId: process.env.LINE_GROUP_ID || '',
          liffId: process.env.NEXT_PUBLIC_LIFF_ID || '',
          adminPasscode: process.env.ADMIN_PASSCODE || 'admin1234',
        },
      });
    }

    // Don't expose full token or passcode directly to unauthenticated requests
    const isAuth = await checkDevAuth();
    return NextResponse.json({
      success: true,
      data: {
        projectName: setting.projectName,
        defaultStagingUrl: setting.defaultStagingUrl,
        liffId: setting.liffId,
        lineGroupId: setting.lineGroupId,
        hasLineToken: !!setting.lineChannelToken,
        ...(isAuth
          ? {
              lineChannelToken: setting.lineChannelToken,
              adminPasscode: setting.adminPasscode,
            }
          : {}),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await checkDevAuth();
    if (!isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const setting = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: {
        projectName: body.projectName,
        defaultStagingUrl: body.defaultStagingUrl,
        lineChannelToken: body.lineChannelToken,
        lineGroupId: body.lineGroupId,
        liffId: body.liffId,
        adminPasscode: body.adminPasscode,
      },
      create: {
        id: 'default',
        projectName: body.projectName || 'TaskFlow',
        defaultStagingUrl: body.defaultStagingUrl,
        lineChannelToken: body.lineChannelToken,
        lineGroupId: body.lineGroupId,
        liffId: body.liffId,
        adminPasscode: body.adminPasscode || 'admin1234',
      },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
