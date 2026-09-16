'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TicketItem, TicketStatus, Priority } from '@/lib/types';
import {
  Plus,
  Search,
  Settings,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  Smartphone,
  Eye,
  RefreshCw,
  LayoutGrid,
  List,
  ShieldCheck,
  ClipboardList,
  Cpu,
  RotateCcw,
  ShieldAlert,
  X,
  ArrowUpRight,
  User,
  Building2,
  Layers,
  Upload,
  Image as ImageIcon,
  Paperclip,
  Pencil,
  GripVertical,
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface ColumnConfig {
  id: TicketStatus;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  color: string;
  bgGradient: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'BACKLOG',
    label: 'รอดำเนินการ',
    icon: ClipboardList,
    color: '#94A3B8',
    bgGradient: 'rgba(148, 163, 184, 0.1)',
  },
  {
    id: 'IN_PROGRESS',
    label: 'กำลังทำ',
    icon: Cpu,
    color: '#38BDF8',
    bgGradient: 'rgba(56, 189, 248, 0.1)',
  },
  {
    id: 'READY_FOR_REVIEW',
    label: 'รอตรวจรับ',
    icon: ShieldAlert,
    color: '#F59E0B',
    bgGradient: 'rgba(245, 158, 11, 0.1)',
  },
  {
    id: 'APPROVED',
    label: 'ตรวจผ่านแล้ว',
    icon: CheckCircle2,
    color: '#10B981',
    bgGradient: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'REWORK',
    label: 'แจ้งแก้ไข',
    icon: RotateCcw,
    color: '#EF4444',
    bgGradient: 'rgba(239, 68, 68, 0.1)',
  },
];

export default function DevDashboard() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

  // Drag and Drop state
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<TicketStatus | null>(null);

  // Modals state
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [selectedTicketForReady, setSelectedTicketForReady] = useState<TicketItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [lastFlexPayload, setLastFlexPayload] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Edit ticket state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editStagingUrl, setEditStagingUrl] = useState('');
  const [editDeletedAttachmentIds, setEditDeletedAttachmentIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<{ id: string; file: File; preview: string; name: string }[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Lightbox modal for previewing images
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // New ticket form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newStagingUrl, setNewStagingUrl] = useState('');
  const [newTicketFile, setNewTicketFile] = useState<File | null>(null);
  const [newTicketPreviewUrl, setNewTicketPreviewUrl] = useState<string | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Ready for Review form
  const [readyStagingUrl, setReadyStagingUrl] = useState('');
  const [readyReleaseNote, setReadyReleaseNote] = useState('');
  const [readyFile, setReadyFile] = useState<File | null>(null);
  const [readyPreviewUrl, setReadyPreviewUrl] = useState<string | null>(null);
  const [sendingLine, setSendingLine] = useState(false);

  // Settings form
  const [settingsData, setSettingsData] = useState({
    projectName: 'TaskFlow',
    defaultStagingUrl: '',
    lineChannelToken: '',
    lineGroupId: '',
    liffId: '',
    adminPasscode: 'admin1234',
  });

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Settings & Auth status
  const checkAuthAndSettings = async () => {
    try {
      const authRes = await fetch('/api/auth/check');
      const authData = await authRes.json();
      setIsAuthenticated(authData.authenticated);

      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.success) {
        setSettingsData((prev) => ({ ...prev, ...setData.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    checkAuthAndSettings();
  }, []);

  // Handle Passcode login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setPasscode('');
        fetchTickets();
      } else {
        alert(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      alert('เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  // Handle File selection for New Ticket
  const handleNewTicketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewTicketFile(file);
      setNewTicketPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle File selection for Ready for Review
  const handleReadyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReadyFile(file);
      setReadyPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle File selection for Edit Ticket (Multiple allowed)
  const handleEditNewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newItems = filesArray.map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      }));
      setEditNewFiles((prev) => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  // Remove newly attached file before saving edit
  const handleRemoveEditNewFile = (id: string) => {
    setEditNewFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Toggle deletion of an existing attachment in edit modal
  const handleToggleDeleteExistingAttachment = (attId: string) => {
    setEditDeletedAttachmentIds((prev) =>
      prev.includes(attId) ? prev.filter((id) => id !== attId) : [...prev, attId]
    );
  };

  // Create Ticket with optional image upload
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert('กรุณากรอกหัวข้อและรายละเอียดงาน');
      return;
    }

    try {
      setCreatingTicket(true);

      let attachments: any[] = [];
      if (newTicketFile) {
        const formData = new FormData();
        formData.append('file', newTicketFile);
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

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          priority: newPriority,
          stagingUrl: newStagingUrl || settingsData.defaultStagingUrl,
          createdBy: 'DEV',
          attachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewTicketModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewStagingUrl('');
        setNewTicketFile(null);
        setNewTicketPreviewUrl(null);
        fetchTickets();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการสร้างตั๋วงาน');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setCreatingTicket(false);
    }
  };

  // Quick move status (supports Drag & Drop)
  const handleMoveStatus = async (ticket: TicketItem, newStatus: TicketStatus) => {
    if (newStatus === 'READY_FOR_REVIEW') {
      setSelectedTicketForReady(ticket);
      setReadyStagingUrl(ticket.stagingUrl || settingsData.defaultStagingUrl || '');
      setReadyReleaseNote(ticket.releaseNote || 'ทีม Dev ได้แก้ไขและนำขึ้นระบบเรียบร้อยแล้ว');
      setReadyFile(null);
      setReadyPreviewUrl(null);
      setShowReadyModal(true);
      return;
    }

    if (newStatus === 'APPROVED') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#38BDF8', '#F59E0B'],
        });
      } catch (e) {
        // ignore
      }
    }

    // Optimistic UI update for instant feedback
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTickets();
      } else if (res.status === 401) {
        fetchTickets();
        setShowAuthModal(true);
      } else {
        fetchTickets();
        alert(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (err) {
      console.error(err);
      fetchTickets();
    }
  };

  // Confirm Ready for Review & Send LINE Flex Message
  const handleConfirmReadyForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForReady) return;

    try {
      setSendingLine(true);

      let attachments: any[] = [];
      if (readyFile) {
        const formData = new FormData();
        formData.append('file', readyFile);
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

      const res = await fetch(`/api/tickets/${selectedTicketForReady.id}/ready-for-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagingUrl: readyStagingUrl,
          releaseNote: readyReleaseNote,
          attachments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowReadyModal(false);
        fetchTickets();

        if (data.lineResult?.payload) {
          setLastFlexPayload(data.lineResult.payload[0]);
          setShowSimulatorModal(true);
        }
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการส่งตรวจงาน');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งตรวจงาน');
    } finally {
      setSendingLine(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      const data = await res.json();
      if (data.success) {
        setShowSettingsModal(false);
        alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        alert(data.error || 'บันทึกการตั้งค่าไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // Open Edit Ticket Modal
  const handleOpenEditModal = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTicket(ticket);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditPriority(ticket.priority as Priority);
    setEditStagingUrl(ticket.stagingUrl || '');
    setEditDeletedAttachmentIds([]);
    setEditNewFiles([]);
    setShowEditModal(true);
  };

  // Save Ticket Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('กรุณากรอกหัวข้อและรายละเอียดงาน');
      return;
    }

    try {
      setSavingEdit(true);

      // Upload newly added attachments if any
      const newAttachments: { fileUrl: string; fileName: string; fileType: string }[] = [];
      for (const item of editNewFiles) {
        const formData = new FormData();
        formData.append('file', item.file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          newAttachments.push({
            fileUrl: uploadData.fileUrl,
            fileName: uploadData.fileName,
            fileType: uploadData.fileType,
          });
        }
      }

      const res = await fetch(`/api/tickets/${editingTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          priority: editPriority,
          stagingUrl: editStagingUrl.trim(),
          deletedAttachmentIds: editDeletedAttachmentIds,
          newAttachments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setEditingTicket(null);
        setEditDeletedAttachmentIds([]);
        setEditNewFiles([]);
        fetchTickets();
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการแก้ไขตั๋วงาน');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ยืนยันการลบตั๋วงานนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTickets();
      } else if (res.status === 401) {
        setShowAuthModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const formattedNum = `TF-${String(t.ticketNumber).padStart(2, '0')}`;
      const rawNum = `#${t.ticketNumber}`;
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        rawNum.includes(search) ||
        formattedNum.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchCreator = creatorFilter === 'ALL' || t.createdBy === creatorFilter;
      return matchSearch && matchPriority && matchCreator;
    });
  }, [tickets, search, priorityFilter, creatorFilter]);

  // Metric Stats - ALL UNITS CONSISTENTLY IN THAI: "รายการ"
  const stats = useMemo(() => {
    const total = tickets.length;
    const ready = tickets.filter((t) => t.status === 'READY_FOR_REVIEW').length;
    const approved = tickets.filter((t) => t.status === 'APPROVED').length;
    const rework = tickets.filter((t) => t.status === 'REWORK').length;
    const passRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, ready, approved, rework, passRate };
  }, [tickets]);

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Bar */}
      <nav className="glass-nav" style={{ padding: '10px 24px', flexShrink: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo & Project Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #EB0A1E 0%, #B30006 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '-0.02em',
                boxShadow: '0 2px 10px rgba(235, 10, 30, 0.3)',
              }}
            >
              TF
            </div>

            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                TaskFlow
              </h1>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 1 }}>
                ระบบติดตามและตรวจรับงาน
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/submit"
              target="_blank"
              className="btn btn-secondary"
              title="เปิดฟอร์มสำหรับลูกค้าเพื่อแจ้งคอมเมนต์หรือเปิดตั๋วใหม่"
              style={{ fontSize: '0.8rem', padding: '7px 12px' }}
            >
              <Smartphone size={15} color="#38BDF8" /> ฟอร์มลูกค้าแจ้งเรื่อง
            </Link>

            <button
              onClick={() => setShowNewTicketModal(true)}
              className="btn btn-taskflow"
              style={{ fontSize: '0.825rem', padding: '7px 14px' }}
            >
              <Plus size={16} /> สร้างตั๋วงาน
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn btn-secondary"
              title="ตั้งค่าระบบ & เชื่อมต่อ LINE"
              style={{ padding: '8px' }}
            >
              <Settings size={17} />
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                title="คลิกเพื่อออกจากระบบ Dev"
                style={{ padding: '7px 12px', fontSize: '0.75rem', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <Unlock size={14} /> Dev Active
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-secondary"
                title="เข้าสู่ระบบด้วยรหัส Dev เพื่อจัดการบอร์ด"
                style={{ padding: '7px 12px', fontSize: '0.75rem', color: '#FDA4AF' }}
              >
                <Lock size={14} /> ใส่รหัส Dev
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. สรุปภาพรวม (Metric Cards) - ทุกการ์ดใช้หน่วย "รายการ" สม่ำเสมอ ไม่ไทยคำอังกฤษคำ */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11, 15, 23, 0.7)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {/* Card 1: งานทั้งหมด */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 600 }}>งานทั้งหมด</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, marginTop: 2 }}>
                {stats.total} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} color="#94A3B8" />
            </div>
          </div>

          {/* Card 2: รอตรวจรับงาน */}
          <div
            className="glass-panel"
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: '3px solid #F59E0B',
              background: stats.ready > 0 ? 'rgba(245, 158, 11, 0.06)' : undefined,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.725rem', color: '#FCD34D', fontWeight: 600 }}>รอตรวจรับงาน</span>
                {stats.ready > 0 && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                )}
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FCD34D', lineHeight: 1.2, marginTop: 2 }}>
                {stats.ready} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={17} color="#F59E0B" />
            </div>
          </div>

          {/* Card 3: ตรวจผ่านแล้ว */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.725rem', color: '#6EE7B7', fontWeight: 600 }}>ตรวจผ่านแล้ว</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>{stats.passRate}% สำเร็จ</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2 }}>
                {stats.approved} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ width: `${stats.passRate}%`, height: '100%', background: '#10B981', borderRadius: 99 }} />
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} color="#10B981" />
            </div>
          </div>

          {/* Card 4: แจ้งแก้ไขเพิ่ม */}
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: stats.rework > 0 ? '#FDA4AF' : '#94A3B8', fontWeight: 600 }}>แจ้งแก้ไขเพิ่ม</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stats.rework > 0 ? '#EF4444' : '#F8FAFC', lineHeight: 1.2, marginTop: 2 }}>
                {stats.rework} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={17} color="#EF4444" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. แถบเครื่องมือ ค้นหา และกรองข้อมูล */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11, 15, 23, 0.5)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1680, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* ค้นหาและตัวกรอง */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 auto', minWidth: 280, maxWidth: 840 }}>
            {/* ค้นหา */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 160 }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: 36, paddingRight: search ? 32 : 12, height: 38, fontSize: '0.825rem' }}
                placeholder="ค้นหาชื่องาน, รายละเอียด, หมายเลข..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: 11, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* กรองความสำคัญ */}
            <select
              className="select-field"
              style={{ minWidth: 185, width: 185, flexShrink: 0, height: 38, padding: '0 28px 0 12px', fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">ความสำคัญ: ทั้งหมด</option>
              <option value="URGENT">🔴 เร่งด่วน</option>
              <option value="HIGH">🟠 สูง</option>
              <option value="MEDIUM">🔵 ปานกลาง</option>
              <option value="LOW">⚪ ทั่วไป</option>
            </select>

            {/* กรองผู้เปิด */}
            <select
              className="select-field"
              style={{ minWidth: 160, width: 160, flexShrink: 0, height: 38, padding: '0 28px 0 12px', fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer' }}
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
            >
              <option value="ALL">ผู้เปิด: ทั้งหมด</option>
              <option value="CLIENT">ลูกค้า (Client)</option>
              <option value="DEV">ทีม Dev</option>
            </select>
          </div>

          {/* สลับมุมมอง และ รีเฟรช */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {viewMode === 'KANBAN' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                  fontSize: '0.75rem',
                  color: '#BAE6FD',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={13} color="#38BDF8" />
                <span>ลากการ์ดวางข้ามคอลัมน์เพื่อเปลี่ยนสถานะ</span>
              </div>
            )}

            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: 3, borderRadius: 8, border: '1px solid var(--border-card)' }}>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`btn ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 12px', fontSize: '0.775rem', borderRadius: 6 }}
              >
                <LayoutGrid size={14} /> มุมมองบอร์ด
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`btn ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 12px', fontSize: '0.775rem', borderRadius: 6 }}
              >
                <List size={14} /> มุมมองตาราง
              </button>
            </div>

            <button
              onClick={fetchTickets}
              className="btn btn-secondary"
              style={{ padding: '7px 11px', fontSize: '0.75rem' }}
              title="รีเฟรชบอร์ด"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. พื้นที่แสดงผล: มุมมองบอร์ด หรือ มุมมองตาราง */}
      <main style={{ flex: 1, minHeight: 0, padding: '12px 24px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 1680, width: '100%', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'KANBAN' ? (
            /* KANBAN VIEW */
            <div className="kanban-grid" style={{ flex: 1, minHeight: 0, height: '100%' }}>
              {COLUMNS.map((col) => {
                const colTickets = filteredTickets.filter((t) => t.status === col.id);
                const IconComponent = col.icon;

                return (
                  <div
                    key={col.id}
                    className={`kanban-column ${dragOverColId === col.id ? 'drag-over' : ''}`}
                    style={{
                      '--col-highlight': col.color,
                      '--col-highlight-bg': col.bgGradient,
                      '--col-highlight-glow': `${col.color}40`,
                    } as React.CSSProperties}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverColId !== col.id) {
                        setDragOverColId(col.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        if (dragOverColId === col.id) {
                          setDragOverColId(null);
                        }
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
                      setDragOverColId(null);
                      setDraggedTicketId(null);
                      if (!ticketId) return;

                      const ticket = tickets.find((t) => t.id === ticketId);
                      if (!ticket) return;
                      if (ticket.status === col.id) return;

                      handleMoveStatus(ticket, col.id);
                    }}
                  >
                    {/* หัวคอลัมน์ */}
                    <div className="kanban-column-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: col.bgGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconComponent size={14} color={col.color} />
                        </div>
                        <span style={{ color: '#F8FAFC', fontSize: '0.85rem', fontWeight: 700 }}>
                          {col.label}
                        </span>
                      </div>

                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: col.color,
                        }}
                      >
                        {colTickets.length}
                      </span>
                    </div>

                    {/* การ์ดในคอลัมน์ */}
                    <div className="kanban-column-body">
                      {colTickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748B', fontSize: '0.8rem' }}>
                          ไม่มีรายการในสถานะนี้
                        </div>
                      ) : (
                        colTickets.map((ticket) => {
                          const priorityClass = `badge-priority-${ticket.priority.toLowerCase()}`;
                          const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;
                          const priorityLabel =
                            ticket.priority === 'URGENT'
                              ? 'เร่งด่วน'
                              : ticket.priority === 'HIGH'
                              ? 'สูง'
                              : ticket.priority === 'MEDIUM'
                              ? 'ปานกลาง'
                              : 'ทั่วไป';

                          return (
                            <div
                              key={ticket.id}
                              draggable={true}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', ticket.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedTicketId(ticket.id);
                              }}
                              onDragEnd={() => {
                                setDraggedTicketId(null);
                                setDragOverColId(null);
                              }}
                              className={`ticket-card ${
                                draggedTicketId === ticket.id ? 'is-dragging' : ''
                              } ${
                                ticket.status === 'READY_FOR_REVIEW'
                                  ? 'ready-review'
                                  : ticket.status === 'APPROVED'
                                  ? 'approved'
                                  : ticket.status === 'REWORK'
                                  ? 'rework'
                                  : ''
                              }`}
                              style={{ flexShrink: 0 }}
                            >
                              {/* หัวการ์ด: รหัส & ความสำคัญ & ผู้เปิด & Drag Grip */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="ticket-tag" style={{ color: '#38BDF8' }}>
                                    {formattedTicketId}
                                  </span>
                                  <span className={`badge ${priorityClass}`} style={{ fontSize: '0.625rem', padding: '2px 6px' }}>
                                    {priorityLabel}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span
                                    style={{
                                      fontSize: '0.675rem',
                                      color: ticket.createdBy === 'CLIENT' ? '#38BDF8' : '#64748B',
                                    }}
                                  >
                                    {ticket.createdBy === 'CLIENT' ? 'ลูกค้า' : 'ทีม Dev'}
                                  </span>
                                  <span title="คลิกลากเพื่อย้ายสถานะ" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <GripVertical size={14} className="drag-grip" color="#64748B" />
                                  </span>
                                </div>
                              </div>

                              {/* ชื่อเรื่อง */}
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC', marginBottom: 6, lineHeight: 1.45 }}>
                                {ticket.title}
                              </h3>

                              {/* รายละเอียด */}
                              <p
                                style={{
                                  fontSize: '0.775rem',
                                  color: '#94A3B8',
                                  marginBottom: 10,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.45,
                                }}
                              >
                                {ticket.description}
                              </p>

                              {/* รูปภาพที่แนบมา (คลิกเพื่อดูรูปเต็ม) */}
                              {ticket.attachments && ticket.attachments.length > 0 && (
                                <div style={{ marginBottom: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                  {ticket.attachments.map((att) => (
                                    <button
                                      key={att.id}
                                      type="button"
                                      onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                      style={{
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: 6,
                                        overflow: 'hidden',
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'block',
                                        width: 44,
                                        height: 44,
                                        flexShrink: 0,
                                      }}
                                      title="คลิกเพื่อดูรูปภาพขยาย"
                                    >
                                      <img
                                        src={att.fileUrl}
                                        alt={att.fileName}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                      />
                                    </button>
                                  ))}
                                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                    แนบ {ticket.attachments.length} รูป
                                  </span>
                                </div>
                              )}

                              {/* สิ่งที่ทีม Dev แก้ไข */}
                              {ticket.status === 'READY_FOR_REVIEW' && (
                                <div
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.25)',
                                    borderRadius: 6,
                                    padding: '6px 8px',
                                    marginBottom: 10,
                                    fontSize: '0.725rem',
                                  }}
                                >
                                  <div style={{ color: '#FCD34D', fontWeight: 700, marginBottom: 2 }}>
                                    💡 สิ่งที่ทีม Dev แก้ไข:
                                  </div>
                                  <div style={{ color: '#FEF3C7', lineHeight: 1.4 }}>
                                    {ticket.releaseNote || 'แก้ไขเรียบร้อย พร้อมให้ตรวจรับงานครับ'}
                                  </div>
                                </div>
                              )}

                              {/* ตรวจผ่านแล้ว */}
                              {ticket.status === 'APPROVED' && ticket.reviewerName && (
                                <div
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    borderRadius: 6,
                                    padding: '5px 8px',
                                    marginBottom: 10,
                                    fontSize: '0.725rem',
                                    color: '#A7F3D0',
                                  }}
                                >
                                  ✓ อนุมัติโดย: <strong>{ticket.reviewerName}</strong>
                                </div>
                              )}

                              {/* แจ้งแก้ไขเพิ่ม */}
                              {ticket.status === 'REWORK' && ticket.rejectionReason && (
                                <div
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: 6,
                                    padding: '5px 8px',
                                    marginBottom: 10,
                                    fontSize: '0.725rem',
                                    color: '#FECDD3',
                                  }}
                                >
                                  จุดที่ต้องแก้เพิ่ม: &ldquo;{ticket.rejectionReason}&rdquo;
                                </div>
                              )}

                              {/* ส่วนท้ายการ์ด: คลีน ชัดเจน พร้อมปุ่มตรวจงานตามสถานะ */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingTop: 8,
                                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                  marginTop: 'auto',
                                  flexShrink: 0,
                                }}
                              >
                                <div>
                                  {ticket.status === 'READY_FOR_REVIEW' && (
                                    <Link
                                      href={`/review/${ticket.reviewToken}`}
                                      target="_blank"
                                      className="btn btn-line"
                                      style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                      title="เปิดหน้าตรวจรับงานของลูกค้า"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Eye size={12} /> ตรวจรับงาน
                                    </Link>
                                  )}

                                  {ticket.status === 'APPROVED' && (
                                    <Link
                                      href={`/review/${ticket.reviewToken}`}
                                      target="_blank"
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 8px', fontSize: '0.7rem', color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                      title="เปิดดูใบรับงานที่อนุมัติแล้ว"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Eye size={12} /> ใบรับงาน
                                    </Link>
                                  )}

                                  {ticket.status === 'REWORK' && (
                                    <Link
                                      href={`/review/${ticket.reviewToken}`}
                                      target="_blank"
                                      className="btn btn-secondary"
                                      style={{ padding: '3px 8px', fontSize: '0.7rem', color: '#FDA4AF', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                      title="เปิดดูคอมเมนต์ที่แจ้งแก้ไข"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Eye size={12} /> คอมเมนต์
                                    </Link>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                  <button
                                    onClick={(e) => handleOpenEditModal(ticket, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#94A3B8',
                                      cursor: 'pointer',
                                      padding: '3px 6px',
                                      borderRadius: 4,
                                    }}
                                    title="แก้ไขข้อมูลตั๋วงาน"
                                  >
                                    <Pencil size={13} />
                                  </button>

                                  <button
                                    onClick={(e) => handleDeleteTicket(ticket.id, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#64748B',
                                      cursor: 'pointer',
                                      padding: '3px 6px',
                                      borderRadius: 4,
                                    }}
                                    title="ลบตั๋ว"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Drop Target Indicator */}
                      {dragOverColId === col.id && draggedTicketId && (
                        <div
                          className="drop-indicator"
                          style={{
                            borderColor: col.color,
                            color: col.color,
                            background: col.bgGradient,
                          }}
                        >
                          ✦ วางที่นี่เพื่อย้ายไป &ldquo;{col.label}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="table-container" style={{ flex: 1, minHeight: 0, height: '100%' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>รหัสตั๋ว</th>
                    <th>ชื่องานและรายละเอียด</th>
                    <th style={{ width: 100 }}>ความสำคัญ</th>
                    <th style={{ width: 130 }}>สถานะ</th>
                    <th style={{ width: 110 }}>ผู้เปิดตั๋ว</th>
                    <th style={{ width: 90, textAlign: 'center' }}>รูปแนบ</th>
                    <th style={{ width: 150 }}>ลิงก์ทดสอบ</th>
                    <th style={{ width: 140 }}>อัปเดตล่าสุด</th>
                    <th style={{ width: 110, textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                        ไม่พบรายการตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const priorityClass = `badge-priority-${ticket.priority.toLowerCase()}`;
                      const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;
                      const priorityLabel =
                        ticket.priority === 'URGENT'
                          ? 'เร่งด่วน'
                          : ticket.priority === 'HIGH'
                          ? 'สูง'
                          : ticket.priority === 'MEDIUM'
                          ? 'ปานกลาง'
                          : 'ทั่วไป';

                      return (
                        <tr key={ticket.id}>
                          <td>
                            <span className="ticket-tag" style={{ color: '#38BDF8' }}>
                              {formattedTicketId}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>
                              {ticket.title}
                            </div>
                            <div style={{ fontSize: '0.775rem', color: '#94A3B8', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ticket.description}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${priorityClass}`}>
                              {priorityLabel}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${ticket.status.toLowerCase().replace(/_/g, '')}`}>
                              {ticket.status === 'READY_FOR_REVIEW' && 'รอตรวจรับ'}
                              {ticket.status === 'APPROVED' && 'ตรวจผ่านแล้ว'}
                              {ticket.status === 'REWORK' && 'แจ้งแก้ไข'}
                              {ticket.status === 'IN_PROGRESS' && 'กำลังทำ'}
                              {ticket.status === 'BACKLOG' && 'รอดำเนินการ'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: ticket.createdBy === 'CLIENT' ? '#38BDF8' : '#94A3B8' }}>
                              {ticket.createdBy === 'CLIENT' ? 'ลูกค้า' : 'ทีม Dev'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {ticket.attachments && ticket.attachments.length > 0 ? (
                              <button
                                onClick={() => {
                                  const first = ticket.attachments?.[0];
                                  if (first) setPreviewImage({ url: first.fileUrl, name: first.fileName });
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                title="คลิกดูรูป"
                              >
                                <Paperclip size={12} /> {ticket.attachments.length}
                              </button>
                            ) : (
                              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            {ticket.stagingUrl ? (
                              <a
                                href={ticket.stagingUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.775rem', textDecoration: 'none' }}
                              >
                                <span>เปิดทดสอบ</span>
                                <ArrowUpRight size={12} />
                              </a>
                            ) : (
                              <span style={{ color: '#64748B', fontSize: '0.75rem' }}>-</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                              {new Date(ticket.updatedAt).toLocaleDateString('th-TH')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {ticket.status === 'READY_FOR_REVIEW' && (
                                <Link
                                  href={`/review/${ticket.reviewToken}`}
                                  target="_blank"
                                  className="btn btn-line"
                                  style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                                  title="เปิดหน้าตรวจรับงานของลูกค้า"
                                >
                                  <Eye size={12} /> ตรวจงาน
                                </Link>
                              )}

                              {ticket.status === 'APPROVED' && (
                                <Link
                                  href={`/review/${ticket.reviewToken}`}
                                  target="_blank"
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.725rem', color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                                  title="เปิดดูใบรับงานที่อนุมัติแล้ว"
                                >
                                  <Eye size={12} /> ใบรับงาน
                                </Link>
                              )}

                              {ticket.status === 'REWORK' && (
                                <Link
                                  href={`/review/${ticket.reviewToken}`}
                                  target="_blank"
                                  className="btn btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.725rem', color: '#FDA4AF', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                  title="เปิดดูคอมเมนต์ที่แจ้งแก้ไข"
                                >
                                  <Eye size={12} /> คอมเมนต์
                                </Link>
                              )}
                              <button
                                onClick={(e) => handleOpenEditModal(ticket, e)}
                                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                                title="แก้ไขข้อมูลตั๋วงาน"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteTicket(ticket.id, e)}
                                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                                title="ลบตั๋ว"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 5. Modal: รูปภาพขนาดใหญ่ (Image Lightbox) */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 800, padding: 18, background: '#0F172A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC' }}>
                {previewImage.name || 'ภาพหน้าจอที่แนบมา'}
              </div>
              <button onClick={() => setPreviewImage(null)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ textAlign: 'center', background: '#000000', borderRadius: 8, overflow: 'hidden', padding: 10 }}>
              <img
                src={previewImage.url}
                alt="Full Preview"
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', margin: '0 auto' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: สร้างตั๋วงานใหม่ (พร้อมฟังก์ชันแนบรูป) */}
      {showNewTicketModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(235, 10, 30, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color="#EB0A1E" />
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>สร้างตั๋วงานใหม่</h2>
              </div>
              <button onClick={() => setShowNewTicketModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">ชื่องานหรือปัญหาที่ต้องแก้ไข *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="เช่น ปรับสีปุ่มในหน้ารายการ, แก้ไขบั๊กคำนวณยอดเงิน..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">ระดับความสำคัญ</label>
                <select
                  className="select-field"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                >
                  <option value="LOW">⚪ ทั่วไป - ปรับปรุงเมื่อสะดวก</option>
                  <option value="MEDIUM">🔵 ปานกลาง - สำคัญปกติ</option>
                  <option value="HIGH">🟠 สูง - ควรแก้ไขโดยเร็ว</option>
                  <option value="URGENT">🔴 เร่งด่วน - กระทบงานหลัก</option>
                </select>
              </div>

              <div>
                <label className="input-label">รายละเอียดคำอธิบายงาน *</label>
                <textarea
                  rows={4}
                  required
                  className="textarea-field"
                  placeholder="ระบุรายละเอียด สิ่งที่ต้องการให้ทำ หรือขั้นตอนที่พบปัญหา..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              {/* แนบรูปภาพประกอบ */}
              <div>
                <label className="input-label">แนบรูปภาพประกอบ (ถ้ามี)</label>
                <div
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    padding: 16,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.5)',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewTicketFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                  />
                  {newTicketPreviewUrl ? (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <img
                        src={newTicketPreviewUrl}
                        alt="Preview"
                        style={{ maxHeight: 130, borderRadius: 6, margin: '0 auto 8px', objectFit: 'contain' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>คลิกเพื่อเปลี่ยนรูป</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTicketFile(null);
                            setNewTicketPreviewUrl(null);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#FDA4AF' }}
                        >
                          ลบรูป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} color="#94A3B8" style={{ margin: '0 auto 6px' }} />
                      <p style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>
                        คลิกหรือลากไฟล์รูปภาพประกอบมาวางที่นี่
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="input-label">ลิงก์ทดสอบระบบ (ไม่บังคับ)</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com"
                  value={newStagingUrl}
                  onChange={(e) => setNewStagingUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="submit" disabled={creatingTicket} className="btn btn-taskflow" style={{ flex: 1, padding: '11px' }}>
                  {creatingTicket ? 'กำลังสร้างตั๋วงาน...' : 'สร้างตั๋วงาน'}
                </button>
                <button type="button" onClick={() => setShowNewTicketModal(false)} className="btn btn-secondary">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6.1 Modal: แก้ไขตั๋วงาน (Edit Ticket Modal) */}
      {showEditModal && editingTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Pencil size={18} color="#38BDF8" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC' }}>
                    แก้ไขตั๋วงาน TF-{String(editingTicket.ticketNumber).padStart(2, '0')}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    อัปเดตรายละเอียด ระดับความสำคัญ ลิงก์ทดสอบ หรือจัดการรูปภาพแนบ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTicket(null);
                }}
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning when ticket is already APPROVED */}
            {editingTicket.status === 'APPROVED' && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: '0.775rem',
                  color: '#FCD34D',
                }}
              >
                <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>ข้อควรระวัง:</strong> ตั๋วนี้ได้รับการอนุมัติผ่านงานแล้ว การแก้ไขหัวข้อหรือรายละเอียดอาจส่งผลกระทบต่อหลักฐานการตรวจรับงานเดิม
                </div>
              </div>
            )}

            {/* Notice when ticket is in READY_FOR_REVIEW */}
            {editingTicket.status === 'READY_FOR_REVIEW' && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: '0.775rem',
                  color: '#BAE6FD',
                }}
              >
                <AlertTriangle size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  ตั๋วนี้อยู่ระหว่างรอตรวจรับงาน หากมีการแก้ไขข้อมูลสำคัญ ลูกค้าจะเห็นข้อมูลที่เปลี่ยนแปลงในหน้าตรวจงานทันที
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">ชื่องานหรือปัญหาที่ต้องแก้ไข *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="เช่น ปรับสีปุ่มในหน้ารายการ..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 12 }}>
                <div>
                  <label className="input-label">ระดับความสำคัญ</label>
                  <select
                    className="select-field"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                  >
                    <option value="LOW">⚪ ทั่วไป - ปรับปรุงเมื่อสะดวก</option>
                    <option value="MEDIUM">🔵 ปานกลาง - สำคัญปกติ</option>
                    <option value="HIGH">🟠 สูง - ควรแก้ไขโดยเร็ว</option>
                    <option value="URGENT">🔴 เร่งด่วน - กระทบงานหลัก</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">ลิงก์ทดสอบระบบ (ไม่บังคับ)</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://example.com"
                    value={editStagingUrl}
                    onChange={(e) => setEditStagingUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">รายละเอียดคำอธิบายงาน *</label>
                <textarea
                  rows={4}
                  required
                  className="textarea-field"
                  placeholder="ระบุรายละเอียดสิ่งที่ต้องการให้ทำ หรือขั้นตอนที่พบปัญหา..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              {/* Attachments Section: Manage existing & Add new */}
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="input-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ImageIcon size={14} color="#38BDF8" /> รูปภาพประกอบ
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {((editingTicket.attachments?.filter(a => !editDeletedAttachmentIds.includes(a.id)).length || 0) + editNewFiles.length)} รูป
                  </span>
                </div>

                {/* 1. Existing Attachments List */}
                {editingTicket.attachments && editingTicket.attachments.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: 6, fontWeight: 600 }}>
                      รูปเดิมที่แนบไว้ ({editingTicket.attachments.length} รูป)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                      {editingTicket.attachments.map((att) => {
                        const isDeleted = editDeletedAttachmentIds.includes(att.id);
                        return (
                          <div
                            key={att.id}
                            style={{
                              position: 'relative',
                              borderRadius: 8,
                              overflow: 'hidden',
                              border: isDeleted
                                ? '1.5px dashed rgba(239, 68, 68, 0.6)'
                                : '1px solid rgba(255, 255, 255, 0.12)',
                              background: isDeleted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                              opacity: isDeleted ? 0.5 : 1,
                              transition: 'all 0.2s ease',
                              padding: 4,
                            }}
                          >
                            <div
                              onClick={() => {
                                if (!isDeleted) setPreviewImage({ url: att.fileUrl, name: att.fileName });
                              }}
                              style={{
                                cursor: isDeleted ? 'default' : 'pointer',
                                height: 68,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 6,
                                overflow: 'hidden',
                                background: 'rgba(0, 0, 0, 0.3)',
                              }}
                              title={isDeleted ? 'รูปนี้จะถูกลบเมื่อกดบันทึก' : 'คลิกเพื่อดูรูปขนาดเต็ม'}
                            >
                              <img
                                src={att.fileUrl}
                                alt={att.fileName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div style={{ padding: '4px 2px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  color: isDeleted ? '#F87171' : '#94A3B8',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 55,
                                }}
                                title={att.fileName}
                              >
                                {isDeleted ? 'จะถูกลบ' : att.fileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleDeleteExistingAttachment(att.id)}
                                style={{
                                  border: 'none',
                                  background: isDeleted ? 'rgba(56, 189, 248, 0.25)' : 'rgba(239, 68, 68, 0.2)',
                                  color: isDeleted ? '#38BDF8' : '#EF4444',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  padding: '2px 5px',
                                  fontSize: '0.65rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  fontWeight: 600,
                                }}
                                title={isDeleted ? 'ยกเลิกการลบ (คืนค่า)' : 'ลบรูปนี้'}
                              >
                                {isDeleted ? 'คืนค่า' : <Trash2 size={11} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. New Files Preview List */}
                {editNewFiles.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.72rem', color: '#10B981', marginBottom: 6, fontWeight: 600 }}>
                      รูปใหม่ที่จะเพิ่ม ({editNewFiles.length} รูป)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                      {editNewFiles.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            position: 'relative',
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            background: 'rgba(16, 185, 129, 0.08)',
                            padding: 4,
                          }}
                        >
                          <div
                            onClick={() => setPreviewImage({ url: item.preview, name: item.name })}
                            style={{
                              cursor: 'pointer',
                              height: 68,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              overflow: 'hidden',
                              background: 'rgba(0, 0, 0, 0.3)',
                            }}
                            title="คลิกเพื่อดูตัวอย่าง"
                          >
                            <img
                              src={item.preview}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                          <div style={{ padding: '4px 2px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                color: '#A7F3D0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 65,
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditNewFile(item.id)}
                              style={{
                                border: 'none',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                borderRadius: 4,
                                cursor: 'pointer',
                                padding: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="ยกเลิกรูปนี้"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Upload Dropzone for New Attachments */}
                <div
                  style={{
                    border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.4)',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditNewFilesChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Upload size={18} color="#38BDF8" />
                    <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 500 }}>
                      คลิกหรือลากไฟล์รูปภาพประกอบมาวางเพื่อเพิ่มรูปใหม่ (เลือกได้หลายรูป)
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-taskflow"
                  style={{ flex: 1, padding: '11px' }}
                >
                  {savingEdit ? 'กำลังบันทึกการแก้ไข...' : 'บันทึกการแก้ไข'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTicket(null);
                  }}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: ส่งให้ลูกค้าตรวจงาน (พร้อมแนบรูปผลงาน) */}
      {showReadyModal && selectedTicketForReady && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(6, 199, 85, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={18} color="#06C755" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>ส่งงานให้ลูกค้าตรวจรับ</h2>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  ตั๋ว #{selectedTicketForReady.ticketNumber}: {selectedTicketForReady.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReadyForReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">🌐 ลิงก์สำหรับให้ลูกค้ากดทดสอบระบบ:</label>
                <input
                  type="url"
                  required
                  className="input-field"
                  placeholder="https://example.com"
                  value={readyStagingUrl}
                  onChange={(e) => setReadyStagingUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">💡 สรุปสิ่งที่ทีม Dev ได้แก้ไข:</label>
                <textarea
                  rows={3}
                  required
                  className="textarea-field"
                  placeholder="เช่น ปรับแก้สีปุ่มและทดสอบบนมือถือเรียบร้อยแล้ว พร้อมให้ตรวจงานครับ"
                  value={readyReleaseNote}
                  onChange={(e) => setReadyReleaseNote(e.target.value)}
                />
              </div>

              {/* แนบรูปผลงาน */}
              <div>
                <label className="input-label">แนบรูปภาพประกอบผลงานหลังแก้ (ถ้ามี):</label>
                <div
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    padding: 14,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.5)',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReadyFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                  />
                  {readyPreviewUrl ? (
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <img
                        src={readyPreviewUrl}
                        alt="Preview"
                        style={{ maxHeight: 120, borderRadius: 6, margin: '0 auto 6px', objectFit: 'contain' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>เปลี่ยนรูป</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReadyFile(null);
                            setReadyPreviewUrl(null);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#FDA4AF' }}
                        >
                          ลบรูป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="#94A3B8" style={{ margin: '0 auto 4px' }} />
                      <p style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>คลิกเพื่อแนบรูปภาพผลงานหลังแก้ไข</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(6, 199, 85, 0.08)', border: '1px solid rgba(6, 199, 85, 0.25)', borderRadius: 8, padding: 12, fontSize: '0.775rem', color: '#CBD5E1' }}>
                <strong style={{ color: '#06C755' }}>ระบบจะส่งแจ้งเตือนเข้า LINE อัตโนมัติ:</strong>
                <p style={{ marginTop: 2, color: '#94A3B8' }}>ลูกค้าสามารถคลิกปุ่มในการ์ด LINE เพื่อเปิดตรวจงานและกดอนุมัติได้ทันที</p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="submit"
                  disabled={sendingLine}
                  className="btn btn-line"
                  style={{ flex: 1, padding: '12px' }}
                >
                  {sendingLine ? 'กำลังส่งแจ้งเตือน...' : <><Send size={16} /> ยืนยันส่งตรวจงานผ่าน LINE</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReadyModal(false)}
                  className="btn btn-secondary"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal: จำลอง Flex Message บน LINE */}
      {showSimulatorModal && lastFlexPayload && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={20} color="#06C755" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>ตัวอย่างการ์ด LINE ที่ส่งถึงลูกค้า</h3>
              </div>
              <button onClick={() => setShowSimulatorModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#111827', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ background: '#0B0F17', padding: '16px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EB0A1E' }}>
                  TaskFlow - งานพร้อมตรวจรับ
                </div>
                <div style={{ fontSize: '0.975rem', fontWeight: 800, color: '#FFFFFF', marginTop: 4 }}>
                  {lastFlexPayload.contents?.header?.contents?.[1]?.text || selectedTicketForReady?.title}
                </div>
              </div>

              <div style={{ background: '#FFFFFF', color: '#0F172A', padding: '16px 18px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>สิ่งที่ทีม Dev แก้ไข:</div>
                <div style={{ fontSize: '0.875rem', marginTop: 4, lineHeight: 1.5, color: '#1E293B' }}>
                  {lastFlexPayload.contents?.body?.contents?.[1]?.text || readyReleaseNote}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14 }}>
                <a
                  href={lastFlexPayload.contents?.footer?.contents?.[0]?.action?.uri || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-line"
                  style={{ width: '100%', borderRadius: 8, padding: '10px' }}
                >
                  เปิดตรวจสอบและอนุมัติงาน
                </a>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
              คุณสามารถคลิกปุ่มด้านบนเพื่อทดสอบเปิดหน้าตรวจงานของลูกค้าได้ทันที
            </p>
          </div>
        </div>
      )}

      {/* 9. Modal: ตั้งค่าระบบ & LINE */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={20} color="#EB0A1E" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>ตั้งค่าระบบ & เชื่อมต่อ LINE</h2>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">ชื่อโปรเจกต์:</label>
                <input
                  type="text"
                  className="input-field"
                  value={settingsData.projectName}
                  onChange={(e) => setSettingsData({ ...settingsData, projectName: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label">ลิงก์ทดสอบระบบเริ่มต้น (Default URL):</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com"
                  value={settingsData.defaultStagingUrl || ''}
                  onChange={(e) => setSettingsData({ ...settingsData, defaultStagingUrl: e.target.value })}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06C755', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={16} /> ตั้งค่า LINE Developers:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="input-label">LINE Channel Access Token:</label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="ใส่ Channel Access Token สำหรับส่ง Push Message"
                      value={settingsData.lineChannelToken || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, lineChannelToken: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">LINE Group ID (กลุ่มลูกค้าที่จะให้ส่งแจ้งเตือนเข้า):</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น C1234567890abcdef..."
                      value={settingsData.lineGroupId || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, lineGroupId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">LINE LIFF ID (สำหรับเปิดหน้าตรวจงานในแอป LINE):</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น 165xxxxxxx-xxxxxxx"
                      value={settingsData.liffId || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, liffId: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <label className="input-label">รหัสผ่าน Dev Admin Passcode:</label>
                <input
                  type="password"
                  className="input-field"
                  value={settingsData.adminPasscode || ''}
                  onChange={(e) => setSettingsData({ ...settingsData, adminPasscode: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="submit" className="btn btn-taskflow" style={{ flex: 1, padding: '11px' }}>
                  บันทึกการตั้งค่า
                </button>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">
                  ปิด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: ปลดล็อก Dev Passcode */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 24, maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(235, 10, 30, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Lock size={20} color="#EB0A1E" />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>ยืนยันสิทธิ์ทีม Dev</h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>กรุณากรอกรหัสผ่านเพื่อแก้ไขข้อมูลบนบอร์ด</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                required
                className="input-field"
                placeholder="กรอกรหัสผ่าน (ค่าเริ่มต้น: admin1234)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-taskflow" style={{ width: '100%', padding: '11px' }}>
                ปลดล็อก
              </button>
              <button type="button" onClick={() => setShowAuthModal(false)} className="btn btn-secondary">
                ยกเลิก
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
