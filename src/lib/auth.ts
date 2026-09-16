import { cookies } from 'next/headers';
import { prisma } from './prisma';

const AUTH_COOKIE_NAME = 'dev_auth_token';

export async function checkDevAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  const setting = await prisma.systemSetting.findUnique({
    where: { id: 'default' },
  });

  const correctPasscode = setting?.adminPasscode || process.env.ADMIN_PASSCODE || 'admin1234';
  return token === Buffer.from(correctPasscode).toString('base64');
}

export async function setDevAuthCookie(passcode: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { id: 'default' },
  });

  const correctPasscode = setting?.adminPasscode || process.env.ADMIN_PASSCODE || 'admin1234';

  if (passcode === correctPasscode) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, Buffer.from(passcode).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return true;
  }
  return false;
}

export async function clearDevAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
