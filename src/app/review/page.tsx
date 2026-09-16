'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ReviewRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/review/${token}`);
    }
  }, [token, router]);

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090D16', color: '#94A3B8', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ color: '#F8FAFC', marginBottom: 8, fontSize: '1.2rem' }}>ไม่พบรหัสตั๋วงาน (Token)</h2>
          <p style={{ fontSize: '0.875rem' }}>กรุณาเปิดลิงก์ผ่านบัตรงานในแชต LINE อีกครั้ง</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090D16', color: '#38BDF8', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: '0.9rem', color: '#CBD5E1' }}>กำลังเปิดหน้าตรวจรับงาน...</p>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
      </div>
    </div>
  );
}

export default function ReviewRedirectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#090D16' }} />}>
      <ReviewRedirectContent />
    </Suspense>
  );
}
