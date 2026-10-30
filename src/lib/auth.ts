import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'dev_auth_token';

export async function getDevUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8').trim();
    if (!decoded) return null;
    // Ignore legacy fixed passcodes so existing cookies re-prompt for a real name
    if (decoded === '1234' || decoded === 'admin1234') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function checkDevAuth(): Promise<boolean> {
  const user = await getDevUser();
  return !!user;
}

export async function setDevAuthCookie(name: string): Promise<string | null> {
  const cleanName = (name || '').trim();
  if (!cleanName) return null;

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, Buffer.from(cleanName, 'utf-8').toString('base64'), {
    httpOnly: true,
    secure: false, // Allow both HTTP and HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return cleanName;
}

export async function clearDevAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

