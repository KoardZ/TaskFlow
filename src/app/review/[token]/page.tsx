'use client';

import React, { useEffect, useState, use } from 'react';
import { TicketItem } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  X,
  Upload,
  Calendar,
  User,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

export default function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviewer info (LIFF or fallback)
  const [reviewerName, setReviewerName] = useState<string>('');
  const [reviewerPicture, setReviewerPicture] = useState<string | null>(null);
  const [reviewerLineId, setReviewerLineId] = useState<string | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);

  // Lightbox for previewing attachments
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Action states
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionFile, setRejectionFile] = useState<File | null>(null);
  const [rejectionPreviewUrl, setRejectionPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'APPROVE' | 'REJECT' | null>(null);

  // 1. Fetch Ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/by-token/${token}`);
      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
      } else {
        setError(data.error || 'ไม่พบข้อมูลตั๋วงานนี้');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [token]);

  // 2. Initialize LINE LIFF if available
  useEffect(() => {
    const initLiff = async () => {
      try {
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        const liffId = settingsData?.data?.liffId || process.env.NEXT_PUBLIC_LIFF_ID;

        if (liffId && typeof window !== 'undefined') {
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setReviewerName(profile.displayName || '');
            setReviewerPicture(profile.pictureUrl || null);
            setReviewerLineId(profile.userId || null);
            setIsLiffReady(true);
          } else if (liff.isInClient()) {
            liff.login();
          }
        }
      } catch (err) {
        console.warn('LIFF init skipped or not in LINE app:', err);
      }
    };

    initLiff();
  }, []);

  // Handle Approve Confirm
  const handleConfirmApprove = async () => {
    if (!ticket) return;
    const cleanName = reviewerName.trim();
    if (!cleanName) {
      alert('กรุณาระบุชื่อผู้ตรวจรับงานก่อนยืนยันอนุมัติ');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/tickets/${ticket.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          reviewerName: cleanName,
          reviewerPicture,
          reviewerLineId,
          reviewToken: token,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
        setActionSuccess('APPROVE');
        setShowApproveConfirm(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EB0A1E', '#10B981', '#38BDF8', '#FFFFFF'],
        });
      } else {
        alert(data.error || 'บันทึกผลไม่สำเร็จ');
      }
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reject / Request Changes (with optional screenshot attachment)
  const handleReject = async () => {
    if (!ticket) return;
    const cleanName = reviewerName.trim();
    if (!cleanName) {
      alert('กรุณาระบุชื่อผู้ตรวจรับงานก่อนส่งแจ้งแก้ไข');
      return;
    }
    if (!rejectionReason.trim()) {
      alert('กรุณาระบุจุดที่ต้องการให้ทีม Dev แก้ไขเพิ่มเติม');
      return;
    }

    try {
      setSubmitting(true);

      let attachments: any[] = [];
      if (rejectionFile) {
        const formData = new FormData();
        formData.append('file', rejectionFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          attachments.push({
            fileUrl: uploadData.fileUrl,
            fileName: uploadData.fileName,
            fileType: uploadData.fileType,
          });
        }
      }

      const res = await fetch(`/api/tickets/${ticket.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
          reviewerName: cleanName,
          reviewerPicture,
          reviewerLineId,
          reviewToken: token,
          attachments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
        setActionSuccess('REJECT');
        setShowRejectForm(false);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(235, 10, 30, 0.2)', borderTopColor: '#EB0A1E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>กำลังโหลดข้อมูลงาน...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="glass-panel" style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}>
          <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: '#F8FAFC' }}>
            ไม่พบตั๋วงาน
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: 20 }}>
            {error || 'ลิงก์นี้อาจหมดอายุหรือไม่ถูกต้อง'}
          </p>
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft size={16} /> กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = ticket.status === 'APPROVED';
  const isRework = ticket.status === 'REWORK';
  const isReady = ticket.status === 'READY_FOR_REVIEW';
  const isPendingDev = ticket.status === 'BACKLOG' || ticket.status === 'IN_PROGRESS';
  const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 70px', maxWidth: 680, margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#EB0A1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '0.9rem',
            }}
          >
            TF
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.2, color: '#F8FAFC' }}>
              TaskFlow
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 1 }}>ตรวจรับงานซอฟต์แวร์</p>
          </div>
        </div>

        {/* ผู้ตรวจรับ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--border-card)',
          }}
        >
          {reviewerPicture ? (
            <img src={reviewerPicture} alt="Avatar" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: reviewerName.trim() ? '#38BDF8' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#0B0F17', fontWeight: 800 }}>
              {reviewerName.trim() ? reviewerName.trim()[0].toUpperCase() : '?'}
            </div>
          )}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: reviewerName.trim() ? '#E2E8F0' : '#94A3B8' }}>
            {reviewerName.trim() || 'ยังไม่ระบุชื่อ'}
          </span>
          {isLiffReady && (
            <span title="ยืนยันตัวตนผ่าน LINE แล้ว" style={{ width: 8, height: 8, borderRadius: '50%', background: '#06C755' }} />
          )}
        </div>
      </header>

      {/* 2. Success Banners */}
      {actionSuccess === 'APPROVE' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <CheckCircle2 size={24} color="#10B981" />
          <div>
            <h4 style={{ color: '#6EE7B7', fontWeight: 700, fontSize: '0.95rem' }}>ขอบคุณสำหรับการตรวจรับงาน</h4>
            <p style={{ color: '#A7F3D0', fontSize: '0.825rem' }}>ระบบส่งข้อความยืนยันผลเข้าแชตกลุ่ม LINE เรียบร้อยแล้วครับ</p>
          </div>
        </div>
      )}

      {actionSuccess === 'REJECT' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #EF4444',
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AlertTriangle size={24} color="#EF4444" />
          <div>
            <h4 style={{ color: '#FDA4AF', fontWeight: 700, fontSize: '0.95rem' }}>ส่งข้อคิดเห็นให้ทีม Dev เรียบร้อยแล้ว</h4>
            <p style={{ color: '#FECDD3', fontSize: '0.825rem' }}>ทีม Dev จะรีบดำเนินการแก้ไขและแจ้งให้ตรวจใหม่อีกครั้งครับ</p>
          </div>
        </div>
      )}

      {/* 3. การ์ดรายละเอียดตั๋วงาน */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        {/* หัวการ์ด */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ticket-tag" style={{ color: '#38BDF8', fontSize: '0.85rem' }}>
              {formattedTicketId}
            </span>
            <span className={`badge badge-${ticket.status.toLowerCase().replace(/_/g, '')}`}>
              {ticket.status === 'READY_FOR_REVIEW' && '🔍 รอตรวจรับงาน'}
              {ticket.status === 'APPROVED' && '✅ ตรวจผ่านแล้ว'}
              {ticket.status === 'REWORK' && '🔄 แจ้งแก้ไข'}
              {ticket.status === 'IN_PROGRESS' && '⚡ กำลังทำ'}
              {ticket.status === 'BACKLOG' && '📋 รอดำเนินการ'}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            สร้างเมื่อ: {new Date(ticket.createdAt).toLocaleDateString('th-TH')}
          </span>
        </div>

        {/* ชื่อเรื่อง */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, lineHeight: 1.4, color: '#F8FAFC' }}>
          {ticket.title}
        </h2>

        {/* ส่วนที่ 1: รายละเอียดความต้องการเดิม */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            padding: 16,
            borderRadius: 10,
            border: '1px solid var(--border-card)',
            marginBottom: 18,
          }}
        >
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
            📝 รายละเอียดที่แจ้งไว้:
          </h4>
          <p style={{ fontSize: '0.925rem', color: '#E2E8F0', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {ticket.description}
          </p>

          {/* รูปภาพที่แนบมา (คลิกเพื่อเปิด Lightbox) */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 8, fontWeight: 600 }}>
                รูปภาพที่แนบมา (คลิกเพื่อดูรูปขยาย):
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ticket.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.4)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <img src={att.fileUrl} alt={att.fileName} style={{ width: 90, height: 90, objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ส่วนที่ 2: สิ่งที่ทีม Dev แก้ไข */}
        {(ticket.status === 'READY_FOR_REVIEW' || ticket.status === 'APPROVED' || ticket.releaseNote) && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.07)',
              padding: 16,
              borderRadius: 10,
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: 20,
            }}
          >
            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> สิ่งที่ทีม Dev ได้แก้ไขไป:
            </h4>
            <p style={{ fontSize: '0.925rem', color: '#E0F2FE', lineHeight: 1.6 }}>
              {ticket.releaseNote || 'ทีม Dev ได้แก้ไขและขึ้นระบบพร้อมสำหรับการตรวจรับงานแล้วครับ'}
            </p>
          </div>
        )}

        {/* ส่วนที่ 3: ปุ่มเปิดทดสอบระบบ */}
        {ticket.stagingUrl && !isPendingDev && (
          <div style={{ marginBottom: 22 }}>
            <a
              href={ticket.stagingUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                borderRadius: 10,
                fontWeight: 700,
                background: '#1E293B',
              }}
            >
              <ExternalLink size={18} /> เปิดทดสอบระบบ (คลิกเพื่อตรวจงาน)
            </a>
            <p style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', marginTop: 6 }}>
              {ticket.stagingUrl}
            </p>
          </div>
        )}

        {/* ส่วนที่ 4: แผงปุ่มสำหรับลูกค้า */}
        {isApproved ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10,
              padding: 20,
              textAlign: 'center',
            }}
          >
            <ShieldCheck size={40} color="#10B981" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399', marginBottom: 4 }}>
              งานนี้ตรวจผ่านและอนุมัติเรียบร้อยแล้ว
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>
              อนุมัติโดย: <strong style={{ color: '#FFFFFF' }}>{ticket.reviewerName || 'ผู้ตรวจรับ'}</strong> เมื่อ{' '}
              {ticket.reviewedAt ? new Date(ticket.reviewedAt).toLocaleString('th-TH') : 'เรียบร้อย'}
            </p>
          </div>
        ) : isRework ? (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: 10,
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <AlertTriangle size={18} color="#EF4444" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FDA4AF' }}>
                กำลังอยู่ระหว่างการแก้ไขเพิ่มเติม
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#E2E8F0', marginBottom: 6 }}>
              จุดที่แจ้งแก้ไข: <strong style={{ color: '#FECDD3' }}>&ldquo;{ticket.rejectionReason}&rdquo;</strong>
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              ทีม Dev กำลังนำข้อเสนอแนะนี้ไปแก้ไข และจะแจ้งให้ตรวจใหม่อีกครั้งครับ
            </p>
          </div>
        ) : isPendingDev ? (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
            }}
          >
            <Clock size={36} color="#38BDF8" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#BAE6FD', marginBottom: 6 }}>
              {ticket.status === 'IN_PROGRESS' ? 'งานนี้อยู่ระหว่างการพัฒนาโดยทีม Dev' : 'งานนี้อยู่ในคิวรอดำเนินการ'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
              สถานะปัจจุบัน: <strong>{ticket.status === 'IN_PROGRESS' ? 'กำลังพัฒนา' : 'รอดำเนินการ'}</strong> (ยังไม่เปิดให้ตรวจรับงาน)<br />
              เมื่อทีม Dev ดำเนินการแก้ไขเรียบร้อยแล้ว ระบบจะส่งแจ้งเตือนเข้าแชต LINE เพื่อให้ท่านเข้าตรวจรับงานอีกครั้งครับ
            </p>
          </div>
        ) : isReady ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* ชื่อผู้ตรวจรับงาน (บังคับระบุ) */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px 14px' }}>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: '#F8FAFC', fontWeight: 700 }}>ชื่อผู้ตรวจรับงาน *</span>
                  <span style={{ fontSize: '0.725rem', color: !reviewerName.trim() ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                    {!reviewerName.trim() ? 'จำเป็นต้องระบุ' : '✓ ระบุแล้ว'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="พิมพ์ชื่อของคุณ เช่น คุณสมชาย, แอดมินตาล"
                  style={{
                    borderColor: !reviewerName.trim() ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.4)',
                  }}
                />
                {!reviewerName.trim() && (
                  <p style={{ fontSize: '0.75rem', color: '#FDA4AF', marginTop: 4 }}>
                    * กรุณาระบุชื่อผู้ตรวจรับก่อนกดยืนยันอนุมัติหรือส่งแจ้งแก้ไข
                  </p>
                )}
              </div>

              {/* ปุ่มอนุมัติผ่านงาน */}
              <button
                onClick={() => {
                  if (!reviewerName.trim()) {
                    alert('กรุณาระบุชื่อผู้ตรวจรับงานก่อนกดยืนยันอนุมัติ');
                    return;
                  }
                  setShowApproveConfirm(true);
                }}
                disabled={submitting}
                className="btn btn-success"
                style={{ width: '100%', padding: '15px', fontSize: '1.05rem', borderRadius: 10, fontWeight: 800 }}
              >
                <CheckCircle2 size={20} /> อนุมัติผ่านงาน (Approve)
              </button>

              {/* ปุ่มแจ้งแก้ไข */}
              {!showRejectForm ? (
                <button
                  onClick={() => {
                    if (!reviewerName.trim()) {
                      alert('กรุณาระบุชื่อผู้ตรวจรับงานก่อนแจ้งแก้ไข');
                      return;
                    }
                    setShowRejectForm(true);
                  }}
                  disabled={submitting}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}
                >
                  <MessageSquare size={16} /> ต้องการให้แก้ไขเพิ่มเติม (แจ้ง Rework)
                </button>
              ) : (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 10,
                    padding: 16,
                    marginTop: 4,
                  }}
                >
                  <label className="input-label" style={{ color: '#FDA4AF' }}>
                    ระบุจุดที่ต้องการให้ทีม Dev ปรับปรุงแก้ไข:
                  </label>
                  <textarea
                    rows={4}
                    className="textarea-field"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 12 }}
                    placeholder="อธิบายสิ่งที่ต้องการให้แก้ไข เช่น สีปุ่มยังไม่ตรง, หน้าจอมือถือข้อความซ้อนทับ..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />

                  {/* แนบรูปภาพ Screenshot จุดที่ต้องการให้แก้ */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label" style={{ color: '#FDA4AF' }}>
                      แนบภาพหน้าจอจุดที่พบปัญหา (ถ้ามี):
                    </label>
                    <div
                      style={{
                        border: '2px dashed rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        padding: 12,
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'rgba(0, 0, 0, 0.3)',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setRejectionFile(file);
                            setRejectionPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                      />
                      {rejectionPreviewUrl ? (
                        <div style={{ position: 'relative', zIndex: 2 }}>
                          <img
                            src={rejectionPreviewUrl}
                            alt="Preview"
                            style={{ maxHeight: 110, borderRadius: 6, margin: '0 auto 6px', objectFit: 'contain' }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectionFile(null);
                              setRejectionPreviewUrl(null);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#FDA4AF' }}
                          >
                            ลบรูป
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload size={20} color="#FDA4AF" style={{ margin: '0 auto 4px' }} />
                          <p style={{ fontSize: '0.775rem', color: '#FECDD3' }}>คลิกเพื่อแนบรูปภาพประกอบจุดที่ต้องแก้ไข</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleReject}
                      disabled={submitting}
                      className="btn btn-danger"
                      style={{ flex: 1, padding: '11px' }}
                    >
                      <Send size={16} /> ยืนยันส่งให้ทีม Dev แก้ไข
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="btn btn-secondary"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. ประวัติการอัปเดตงาน (Audit Timeline) */}
      {ticket.activities && ticket.activities.length > 0 && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8', marginBottom: 14 }}>
            🕒 ประวัติการอัปเดตงาน:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ticket.activities.map((act) => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.8rem' }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: act.action === 'APPROVED' ? '#10B981' : act.action === 'REJECTED' ? '#EF4444' : '#38BDF8',
                    marginTop: 5,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#F8FAFC', fontWeight: 600 }}>{act.details || act.action}</div>
                  <div style={{ color: '#64748B', fontSize: '0.725rem', marginTop: 1 }}>
                    โดย {act.actor === 'CLIENT' ? 'ลูกค้า' : act.actor === 'DEV' ? 'ทีม Dev' : act.actor} เมื่อ {new Date(act.createdAt).toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Modal: ยืนยันอนุมัติผ่านงาน */}
      {showApproveConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <CheckCircle2 size={38} color="#10B981" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>ยืนยันการตรวจรับงาน</h3>
              <p style={{ fontSize: '0.825rem', color: '#94A3B8', marginTop: 4 }}>
                รายการ #{ticket.ticketNumber}: <strong>{ticket.title}</strong>
              </p>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', textAlign: 'center', marginBottom: 16 }}>
              ยืนยันว่าการแก้ไขบนระบบถูกต้องเรียบร้อยและพร้อมปิดงาน?
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.85rem' }}>
              <div style={{ color: '#94A3B8', fontSize: '0.75rem', marginBottom: 2 }}>ลงชื่ออนุมัติโดย:</div>
              <div style={{ color: '#F8FAFC', fontWeight: 700 }}>{reviewerName.trim()}</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleConfirmApprove}
                disabled={submitting}
                className="btn btn-success"
                style={{ flex: 1, padding: '11px', fontWeight: 700 }}
              >
                {submitting ? 'กำลังบันทึก...' : 'ยืนยันอนุมัติ'}
              </button>
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="btn btn-secondary"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Lightbox ดูรูปขยาย */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 760, padding: 16, background: '#0F172A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.825rem', color: '#F8FAFC', fontWeight: 600 }}>{previewImage.name}</span>
              <button onClick={() => setPreviewImage(null)} className="btn btn-secondary" style={{ padding: '3px 8px' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ textAlign: 'center', background: '#000000', borderRadius: 8, overflow: 'hidden', padding: 8 }}>
              <img
                src={previewImage.url}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', margin: '0 auto' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer */}
      <footer style={{ marginTop: 32, textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
        TaskFlow - ระบบติดตามและตรวจรับงานซอฟต์แวร์
      </footer>
    </div>
  );
}
