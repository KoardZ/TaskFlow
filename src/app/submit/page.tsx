'use client';

import React, { useState } from 'react';
import {
  Send,
  Upload,
  CheckCircle2,
  ArrowLeft,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function SubmitTicketPage() {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('UI_DESIGN');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.warning('กรุณากรอกหัวข้อและรายละเอียดให้ครบถ้วน');
      return;
    }

    try {
      setSubmitting(true);

      // Upload file first if present
      let attachments: any[] = [];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
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

      // Create ticket
      const categoryLabel =
        category === 'UI_DESIGN'
          ? 'หน้าเว็บ/ดีไซน์'
          : category === 'FUNCTIONALITY'
          ? 'ฟังก์ชันการทำงาน'
          : category === 'DATA_REPORT'
          ? 'ข้อมูล/รายงาน'
          : 'ทั่วไป';

      const combinedTitle = `[${categoryLabel}] ${title.trim()}`;

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: combinedTitle,
          description,
          priority,
          createdBy: 'CLIENT',
          attachments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedTicket(data.data);
        toast.success('ส่งตั๋วงานให้ทีม Dev สำเร็จ');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  if (createdTicket) {
    const formattedId = `TF-${String(createdTicket.ticketNumber).padStart(2, '0')}`;

    return (
      <div style={{ minHeight: '100vh', padding: '40px 16px', maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: 32, textAlign: 'center', width: '100%' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={32} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8, color: '#F8FAFC' }}>
            ส่งเรื่องให้ทีม Dev เรียบร้อยแล้ว
          </h2>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, padding: 14, margin: '18px 0', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>หมายเลขตั๋วงาน:</div>
            <div className="ticket-tag" style={{ fontSize: '1.3rem', color: '#38BDF8', marginTop: 2 }}>
              {formattedId}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#CBD5E1', marginTop: 6 }}>
              {createdTicket.title}
            </div>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.5 }}>
            เรื่องของคุณถูกบันทึกเข้าสู่บอร์ดของทีม Dev เรียบร้อยแล้ว เมื่อทีมงานแก้ไขเสร็จจะส่งแจ้งเตือนเข้าแชต LINE ให้กดตรวจงานทันทีครับ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                setCreatedTicket(null);
                setTitle('');
                setDescription('');
                setFile(null);
                setPreviewUrl(null);
              }}
              className="btn btn-taskflow"
              style={{ padding: '12px' }}
            >
              + ส่งเรื่องใหม่อีกรายการ
            </button>
            <Link href="/" className="btn btn-secondary">
              <ArrowLeft size={16} /> กลับสู่หน้าบอร์ดหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px 70px', maxWidth: 620, margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" className="btn btn-secondary" style={{ padding: '8px 12px' }} title="กลับหน้าบอร์ดหลัก">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
            TaskFlow
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>
            แจ้งคอมเมนต์ / เปิดตั๋วแก้ไขงาน
          </h1>
        </div>
      </header>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Category */}
        <div>
          <label className="input-label">หมวดหมู่งานที่เกี่ยวข้อง *</label>
          <select
            className="select-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="UI_DESIGN">🎨 หน้าเว็บ / ดีไซน์ (UI/UX)</option>
            <option value="FUNCTIONALITY">⚙️ ฟังก์ชันการทำงาน / บั๊กในระบบ</option>
            <option value="DATA_REPORT">📊 ข้อมูล / รายงาน / สรุปยอด</option>
            <option value="OTHER">💬 อื่นๆ ทั่วไป</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="input-label">หัวข้อเรื่องที่ต้องการให้ปรับปรุง / แก้ไข *</label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="เช่น ปุ่มกดยืนยันบนมือถือไม่ตอบสนอง, ขอปรับสีตัวอักษรให้อ่านง่ายขึ้น..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="input-label">ระดับความสำคัญ</label>
          <select
            className="select-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="LOW">⚪ ทั่วไป - ปรับปรุงเมื่อสะดวก</option>
            <option value="MEDIUM">🔵 ปานกลาง - สำคัญปกติ</option>
            <option value="HIGH">🟠 สูง - ควรได้รับการแก้ไขโดยเร็ว</option>
            <option value="URGENT">🔴 เร่งด่วน - กระทบการทำงานหลัก</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="input-label">รายละเอียดสิ่งที่พบหรือต้องการให้แก้ไข *</label>
          <textarea
            rows={5}
            required
            className="textarea-field"
            placeholder="อธิบายขั้นตอนที่พบปัญหา หรือสิ่งที่ต้องการให้ปรับปรุงแก้ไขอย่างละเอียด..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Screenshot Upload */}
        <div>
          <label className="input-label">แนบรูปภาพประกอบ (ถ้ามี)</label>
          <div
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 10,
              padding: 20,
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(15, 23, 42, 0.5)',
              position: 'relative',
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
            />
            {previewUrl ? (
              <div style={{ position: 'relative', zIndex: 2 }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: 160, borderRadius: 6, margin: '0 auto 8px', objectFit: 'contain' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>คลิกเพื่อเปลี่ยนรูปภาพ</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#FDA4AF' }}
                  >
                    ลบรูป
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Upload size={26} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                <p style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                  คลิกหรือลากไฟล์รูปภาพประกอบมาวางที่นี่
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                  รองรับไฟล์ PNG, JPG, WebP
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-taskflow"
          style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: 4 }}
        >
          {submitting ? 'กำลังส่งข้อมูล...' : <><Send size={16} /> ส่งเรื่องให้ทีม Dev</>}
        </button>
      </form>
    </div>
  );
}
