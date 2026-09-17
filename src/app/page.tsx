'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TicketItem, TicketStatus } from '@/lib/types';
import {
  Plus,
  Search,
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
  ArrowRightLeft,
  ArrowRight,
  Calendar,
  History,
  Maximize2,
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import ConfirmModal from '@/components/ConfirmModal';
import ImageLightbox from '@/components/ImageLightbox';
import { useToast } from '@/components/Toast';

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
  const toast = useToast();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

  // Drag and Drop state
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<TicketStatus | null>(null);

  // Modals state
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [selectedTicketForReady, setSelectedTicketForReady] = useState<TicketItem | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Custom Confirm Delete modal state
  const [ticketToDelete, setTicketToDelete] = useState<TicketItem | null>(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  // Edit ticket state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStagingUrl, setEditStagingUrl] = useState('');
  const [editDeletedAttachmentIds, setEditDeletedAttachmentIds] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<{ id: string; file: File; preview: string; name: string }[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Lightbox modal for previewing images
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Ticket Detail modal state
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<TicketItem | null>(null);

  // Responsive & Quick Move state for Mobile/Tablet
  const [activeMobileCol, setActiveMobileCol] = useState<TicketStatus>('BACKLOG');
  const [quickMoveTicket, setQuickMoveTicket] = useState<TicketItem | null>(null);

  // New ticket form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
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
    adminPasscode: '',
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
    // Auto redirect to /review/[token] if ?token=... is present in URL (e.g. from LINE LIFF)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        window.location.replace(`/review/${token}`);
        return;
      }
    }

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
        toast.success('เข้าสู่ระบบสำเร็จ');
      } else {
        toast.error(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      toast.error('เข้าสู่ระบบไม่สำเร็จ');
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
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!newTitle.trim() || !newDescription.trim()) {
      toast.warning('กรุณากรอกหัวข้อและรายละเอียดงาน');
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
          priority: 'MEDIUM',
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
        toast.success('สร้างตั๋วงานเรียบร้อยแล้ว');
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการสร้างตั๋วงาน');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setCreatingTicket(false);
    }
  };

  // Quick move status (supports Drag & Drop)
  const handleMoveStatus = async (ticket: TicketItem, newStatus: TicketStatus) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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
        toast.error(data.error || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (err) {
      console.error(err);
      fetchTickets();
    }
  };

  // Confirm Ready for Review & Send LINE Flex Message
  const handleConfirmReadyForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
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
        toast.success('ส่งงานให้ลูกค้าตรวจรับและส่งแจ้งเตือน LINE เรียบร้อยแล้ว');
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการส่งตรวจงาน');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการส่งตรวจงาน');
    } finally {
      setSendingLine(false);
    }
  };

  // Open Edit Ticket Modal
  const handleOpenEditModal = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setEditingTicket(ticket);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditStagingUrl(ticket.stagingUrl || '');
    setEditDeletedAttachmentIds([]);
    setEditNewFiles([]);
    setShowEditModal(true);
  };

  // Save Ticket Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!editingTicket) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.warning('กรุณากรอกหัวข้อและรายละเอียดงาน');
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
        toast.success('บันทึกการแก้ไขตั๋วงานสำเร็จ');
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการแก้ไขตั๋วงาน');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Ticket Handlers (Custom Confirm Modal)
  const promptDeleteTicket = (ticket: TicketItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setTicketToDelete(ticket);
  };

  const handleDeleteTicket = (id: string, e?: React.MouseEvent) => {
    const t = tickets.find((item) => item.id === id);
    if (t) {
      promptDeleteTicket(t, e);
    }
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeletingTicket(true);
      const res = await fetch(`/api/tickets/${ticketToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        const deletedNum = ticketToDelete.ticketNumber;
        setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
        if (selectedTicketForDetail?.id === ticketToDelete.id) {
          setSelectedTicketForDetail(null);
        }
        setTicketToDelete(null);
        fetchTickets();
        toast.success(`ลบตั๋วงาน TF-${String(deletedNum).padStart(2, '0')} เรียบร้อยแล้ว`);
      } else if (res.status === 401) {
        setShowAuthModal(true);
      } else {
        toast.error(data.error || 'เกิดข้อผิดพลาดในการลบตั๋วงาน');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setDeletingTicket(false);
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
      return matchSearch;
    });
  }, [tickets, search]);

  // Metric Stats - ALL UNITS CONSISTENTLY IN THAI: "รายการ"
  const stats = useMemo(() => {
    const total = tickets.length;
    const ready = tickets.filter((t) => t.status === 'READY_FOR_REVIEW').length;
    const approved = tickets.filter((t) => t.status === 'APPROVED').length;
    const rework = tickets.filter((t) => t.status === 'REWORK').length;

    return { total, ready, approved, rework };
  }, [tickets]);

  // Synchronize currentDetailTicket with latest ticket state
  const currentDetailTicket = useMemo(() => {
    if (!selectedTicketForDetail) return null;
    return tickets.find((t) => t.id === selectedTicketForDetail.id) || selectedTicketForDetail;
  }, [selectedTicketForDetail, tickets]);

  return (
    <div className="app-dashboard-container">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                  return;
                }
                setShowNewTicketModal(true);
              }}
              className="btn btn-taskflow"
              style={{ fontSize: '0.825rem', padding: '7px 14px' }}
              title={!isAuthenticated ? 'ใส่รหัส Dev เพื่อสร้างตั๋วงาน' : 'สร้างตั๋วงานใหม่'}
            >
              {isAuthenticated ? <Plus size={16} /> : <Lock size={14} />} <span className="nav-action-text">สร้างตั๋วงาน</span>
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                title="คลิกเพื่อออกจากระบบ Dev"
                style={{ padding: '7px 12px', fontSize: '0.75rem', color: '#34D399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <Unlock size={14} /> <span className="nav-action-text">Dev Active</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-secondary"
                title="เข้าสู่ระบบด้วยรหัส Dev เพื่อจัดการบอร์ด"
                style={{ padding: '7px 12px', fontSize: '0.75rem', color: '#FDA4AF' }}
              >
                <Lock size={14} /> <span className="nav-action-text">ใส่รหัส Dev</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. สรุปภาพรวม (Metric Cards) */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11, 15, 23, 0.7)', flexShrink: 0 }}>
        <div className="metrics-grid-container" style={{ maxWidth: 1680, margin: '0 auto' }}>
          {/* Card 1: งานทั้งหมด */}
          <div className="glass-panel metric-card-inner" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 600 }}>งานทั้งหมด</span>
              <div className="metric-number" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, marginTop: 2 }}>
                {stats.total} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={17} color="#94A3B8" />
            </div>
          </div>

          {/* Card 2: รอตรวจรับงาน */}
          <div
            className="glass-panel metric-card-inner"
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
              <div className="metric-number" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FCD34D', lineHeight: 1.2, marginTop: 2 }}>
                {stats.ready} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={17} color="#F59E0B" />
            </div>
          </div>

          {/* Card 3: ตรวจผ่านแล้ว */}
          <div className="glass-panel metric-card-inner" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: '#6EE7B7', fontWeight: 600 }}>ตรวจผ่านแล้ว</span>
              <div className="metric-number" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, marginTop: 2 }}>
                {stats.approved} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={17} color="#10B981" />
            </div>
          </div>

          {/* Card 4: แจ้งแก้ไขเพิ่ม */}
          <div className="glass-panel metric-card-inner" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: stats.rework > 0 ? '#FDA4AF' : '#94A3B8', fontWeight: 600 }}>แจ้งแก้ไขเพิ่ม</span>
              <div className="metric-number" style={{ fontSize: '1.45rem', fontWeight: 800, color: stats.rework > 0 ? '#EF4444' : '#F8FAFC', lineHeight: 1.2, marginTop: 2 }}>
                {stats.rework} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>รายการ</span>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RotateCcw size={17} color="#EF4444" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. แถบเครื่องมือ ค้นหา และกรองข้อมูล */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11, 15, 23, 0.5)', flexShrink: 0 }}>
        <div className="filter-bar-inner" style={{ maxWidth: 1680, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* ค้นหาและตัวกรอง */}
          <div className="filter-controls-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 260, maxWidth: 840 }}>
            {/* ค้นหา */}
            <div className="search-box-wrapper">
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
          </div>

          {/* สลับมุมมอง และ รีเฟรช */}
          <div className="filter-actions-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: 3, borderRadius: 8, border: '1px solid var(--border-card)' }}>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`btn ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 10px', fontSize: '0.775rem', borderRadius: 6 }}
              >
                <LayoutGrid size={14} /> <span><span className="nav-action-text">มุมมอง</span>บอร์ด</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`btn ${viewMode === 'TABLE' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '5px 10px', fontSize: '0.775rem', borderRadius: 6 }}
              >
                <List size={14} /> <span><span className="nav-action-text">มุมมอง</span>ตาราง</span>
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
      <main className="main-content-area">
        <div style={{ maxWidth: 1680, width: '100%', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'KANBAN' ? (
            /* KANBAN VIEW */
            <>
              {/* แถบแท็บเลือกคอลัมน์บน Tablet/Mobile */}
              <div className="mobile-column-tabs">
                {COLUMNS.map((col) => {
                  const count = filteredTickets.filter((t) => t.status === col.id).length;
                  const isActive = activeMobileCol === col.id;
                  const IconComponent = col.icon;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
                      style={{
                        '--tab-color': col.color,
                        '--tab-bg': col.bgGradient,
                        '--tab-glow': `${col.color}40`,
                      } as React.CSSProperties}
                      onClick={() => {
                        setActiveMobileCol(col.id);
                        document.getElementById(`col-${col.id}`)?.scrollIntoView({
                          behavior: 'smooth',
                          inline: 'center',
                          block: 'nearest',
                        });
                      }}
                    >
                      <IconComponent size={13} color={isActive ? col.color : '#94A3B8'} />
                      <span>{col.label}</span>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: isActive ? col.color : 'rgba(255, 255, 255, 0.1)',
                          color: isActive ? '#000000' : '#CBD5E1',
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="kanban-grid" style={{ flex: 1, minHeight: 0, height: '100%' }}>
                {COLUMNS.map((col) => {
                  const colTickets = filteredTickets.filter((t) => t.status === col.id);
                  const IconComponent = col.icon;

                  return (
                    <div
                      key={col.id}
                      id={`col-${col.id}`}
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
                      setDragOverColId(null);
                      setDraggedTicketId(null);
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                        return;
                      }
                      const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
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
                          const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

                          return (
                            <div
                              key={ticket.id}
                              draggable={isAuthenticated}
                              onClick={() => setSelectedTicketForDetail(ticket)}
                              onDragStart={(e) => {
                                if (!isAuthenticated) {
                                  e.preventDefault();
                                  setShowAuthModal(true);
                                  return;
                                }
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
                              style={{ flexShrink: 0, cursor: 'pointer' }}
                              title="คลิกเพื่อดูรายละเอียดตั๋วงาน"
                            >
                              {/* หัวการ์ด: รหัส & Drag Grip */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className="ticket-tag" style={{ color: '#38BDF8' }}>
                                  {formattedTicketId}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span
                                    style={{
                                      fontSize: '0.675rem',
                                      color: ticket.createdBy === 'CLIENT' ? '#38BDF8' : '#64748B',
                                    }}
                                  >
                                    {ticket.createdBy === 'CLIENT' ? 'ลูกค้า' : 'ทีม Dev'}
                                  </span>
                                  {isAuthenticated && (
                                    <span title="คลิกลากเพื่อย้ายสถานะ" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      <GripVertical size={14} className="drag-grip" color="#64748B" />
                                    </span>
                                  )}
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage({ url: att.fileUrl, name: att.fileName });
                                      }}
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
                                  {!isAuthenticated && !['READY_FOR_REVIEW', 'APPROVED', 'REWORK'].includes(ticket.status) && (
                                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                      {ticket.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                                    </span>
                                  )}
                                </div>

                                {isAuthenticated && (
                                  <div
                                    style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuickMoveTicket(ticket);
                                      }}
                                      style={{
                                        background: 'rgba(56, 189, 248, 0.08)',
                                        border: '1px solid rgba(56, 189, 248, 0.22)',
                                        color: '#38BDF8',
                                        cursor: 'pointer',
                                        padding: '4px 7px',
                                        borderRadius: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                      }}
                                      title="ย้ายสถานะ (Quick Move สำหรับมือถือ/แท็บเล็ต)"
                                    >
                                      <ArrowRightLeft size={13} style={{ pointerEvents: 'none' }} />
                                    </button>

                                    <button
                                      type="button"
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditModal(ticket, e);
                                      }}
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        padding: '4px 7px',
                                        borderRadius: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                      }}
                                      title="แก้ไขข้อมูลตั๋วงาน"
                                    >
                                      <Pencil size={13} style={{ pointerEvents: 'none' }} />
                                    </button>

                                    <button
                                      type="button"
                                      draggable={false}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTicket(ticket.id, e);
                                      }}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        color: '#F87171',
                                        cursor: 'pointer',
                                        padding: '4px 7px',
                                        borderRadius: 6,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                      }}
                                      title="ลบตั๋วงาน"
                                    >
                                      <Trash2 size={13} style={{ pointerEvents: 'none' }} />
                                    </button>
                                  </div>
                                )}
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
            </>
          ) : (
            /* TABLE VIEW */
            <div className="table-container" style={{ flex: 1, minHeight: 0, height: '100%' }}>
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>รหัสตั๋ว</th>
                    <th>ชื่องานและรายละเอียด</th>
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
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                        ไม่พบรายการตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const formattedTicketId = `TF-${String(ticket.ticketNumber).padStart(2, '0')}`;

                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => setSelectedTicketForDetail(ticket)}
                          style={{ cursor: 'pointer' }}
                          title="คลิกเพื่อดูรายละเอียดตั๋วงาน"
                        >
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                onClick={(e) => e.stopPropagation()}
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
                              {isAuthenticated ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickMoveTicket(ticket);
                                    }}
                                    style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.22)', color: '#38BDF8', cursor: 'pointer', padding: '4px 7px', borderRadius: 6 }}
                                    title="ย้ายสถานะ"
                                  >
                                    <ArrowRightLeft size={13} style={{ pointerEvents: 'none' }} />
                                  </button>
                                  <button
                                    onClick={(e) => handleOpenEditModal(ticket, e)}
                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', cursor: 'pointer', padding: '4px 7px', borderRadius: 6 }}
                                    title="แก้ไขข้อมูลตั๋วงาน"
                                  >
                                    <Pencil size={13} style={{ pointerEvents: 'none' }} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteTicket(ticket.id, e)}
                                    style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#F87171', cursor: 'pointer', padding: '4px 7px', borderRadius: 6 }}
                                    title="ลบตั๋วงาน"
                                  >
                                    <Trash2 size={13} style={{ pointerEvents: 'none' }} />
                                  </button>
                                </>
                              ) : (
                                !['READY_FOR_REVIEW', 'APPROVED', 'REWORK'].includes(ticket.status) && (
                                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>ดูอย่างเดียว</span>
                                )
                              )}
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

              <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTicket(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '11px' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-taskflow"
                  style={{ flex: 1.5, padding: '11px' }}
                >
                  {savingEdit ? 'กำลังบันทึกการแก้ไข...' : 'บันทึกการแก้ไข'}
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
                placeholder="กรอกรหัสผ่าน"
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

      {/* 11. Modal: ย้ายสถานะตั๋วงาน (Quick Move สำหรับ Mobile / Touch) */}
      {quickMoveTicket && (
        <div className="modal-overlay" onClick={() => setQuickMoveTicket(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 420, padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span className="ticket-tag" style={{ color: '#38BDF8', fontSize: '0.8rem' }}>
                    TF-{String(quickMoveTicket.ticketNumber).padStart(2, '0')}
                  </span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC' }}>
                    ย้ายสถานะงาน
                  </h3>
                </div>
                <p style={{ fontSize: '0.775rem', color: '#94A3B8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {quickMoveTicket.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickMoveTicket(null)}
                className="btn btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>เลือกสถานะที่ต้องการเปลี่ยน:</p>
              {COLUMNS.map((col) => {
                const IconComp = col.icon;
                const isCurrent = quickMoveTicket.status === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      const target = quickMoveTicket;
                      setQuickMoveTicket(null);
                      handleMoveStatus(target, col.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isCurrent ? `1.5px solid ${col.color}` : '1px solid var(--border-card)',
                      background: isCurrent ? col.bgGradient : 'rgba(15, 23, 42, 0.6)',
                      cursor: isCurrent ? 'default' : 'pointer',
                      opacity: isCurrent ? 0.6 : 1,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: col.bgGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={16} color={col.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
                          {col.label}
                        </div>
                        {isCurrent && (
                          <div style={{ fontSize: '0.7rem', color: col.color, fontWeight: 500 }}>
                            สถานะปัจจุบัน
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={15} color={isCurrent ? col.color : '#64748B'} />
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(11, 15, 23, 0.5)', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setQuickMoveTicket(null)}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '9px 16px', fontSize: '0.825rem' }}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Modal: ดูรายละเอียดตั๋วงาน (Ticket Detail Modal) */}
      {currentDetailTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicketForDetail(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 0,
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 23, 42, 0.95)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  className="ticket-tag"
                  style={{
                    color: '#38BDF8',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  TF-{String(currentDetailTicket.ticketNumber).padStart(2, '0')}
                </span>

                <span
                  className={`badge badge-${currentDetailTicket.status.toLowerCase().replace(/_/g, '')}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {currentDetailTicket.status === 'READY_FOR_REVIEW' && 'รอตรวจรับ'}
                  {currentDetailTicket.status === 'APPROVED' && 'ตรวจผ่านแล้ว'}
                  {currentDetailTicket.status === 'REWORK' && 'แจ้งแก้ไข'}
                  {currentDetailTicket.status === 'IN_PROGRESS' && 'กำลังทำ'}
                  {currentDetailTicket.status === 'BACKLOG' && 'รอดำเนินการ'}
                </span>

                <span style={{ fontSize: '0.75rem', color: currentDetailTicket.createdBy === 'CLIENT' ? '#38BDF8' : '#94A3B8' }}>
                  เปิดโดย: <strong>{currentDetailTicket.createdBy === 'CLIENT' ? 'ลูกค้า' : 'ทีม Dev'}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicketForDetail(null)}
                className="btn btn-ghost"
                style={{ padding: '6px', color: '#94A3B8' }}
                title="ปิดหน้าต่าง"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* ชื่องาน */}
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.45, margin: 0 }}>
                  {currentDetailTicket.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: '0.75rem', color: '#64748B', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} /> สร้างเมื่อ {new Date(currentDetailTicket.createdAt).toLocaleString('th-TH')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> อัปเดตล่าสุด {new Date(currentDetailTicket.updatedAt).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              {/* รายละเอียดคำอธิบายงาน */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClipboardList size={15} color="#38BDF8" /> รายละเอียดงาน
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    fontSize: '0.875rem',
                    color: '#E2E8F0',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {currentDetailTicket.description}
                </div>
              </div>

              {/* ลิงก์ทดสอบระบบ (Staging URL) */}
              {currentDetailTicket.stagingUrl && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={15} color="#38BDF8" /> ลิงก์ทดสอบระบบ
                  </div>
                  <a
                    href={currentDetailTicket.stagingUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38BDF8',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>{currentDetailTicket.stagingUrl}</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              )}

              {/* รูปภาพแนบ (Enhanced Preview & Gallery) */}
              {currentDetailTicket.attachments && currentDetailTicket.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={15} color="#38BDF8" />
                      <span>รูปภาพแนบ ({currentDetailTicket.attachments.length} รูป)</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      คลิกที่รูปเพื่อเปิดดูขนาดเต็ม
                    </span>
                  </div>

                  {currentDetailTicket.attachments.length === 1 ? (
                    // Single Image: Featured Large Preview Card
                    (() => {
                      const att = currentDetailTicket.attachments[0];
                      return (
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            background: '#030712',
                            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          <div
                            onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                            style={{
                              position: 'relative',
                              maxHeight: 280,
                              minHeight: 180,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              background: '#000000',
                              overflow: 'hidden',
                            }}
                            title={`คลิกเพื่อดูรูปเต็ม: ${att.fileName}`}
                          >
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              style={{
                                maxWidth: '100%',
                                maxHeight: 280,
                                objectFit: 'contain',
                                display: 'block',
                                transition: 'transform 0.2s ease',
                              }}
                            />
                            {/* Hover overlay hint */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(3, 7, 18, 0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                opacity: 0,
                                transition: 'opacity 0.18s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                            >
                              <div
                                style={{
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: 8,
                                  padding: '8px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  color: '#FFFFFF',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                                }}
                              >
                                <Maximize2 size={15} color="#38BDF8" />
                                <span>คลิกเพื่อดูรูปขนาดเต็ม</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div
                            style={{
                              padding: '10px 14px',
                              background: 'rgba(15, 23, 42, 0.9)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#E2E8F0',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {att.fileName}
                            </span>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 4 }}
                              >
                                <Maximize2 size={12} />
                                <span>ขยาย</span>
                              </button>
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 4 }}
                                title="เปิดในแท็บใหม่"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Multiple Images: Clean Grid with Larger Cards
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {currentDetailTicket.attachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            background: '#030712',
                            position: 'relative',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <div
                            onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                            style={{
                              height: 150,
                              cursor: 'pointer',
                              position: 'relative',
                              background: '#000000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.4)',
                                opacity: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'opacity 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                            >
                              <div
                                style={{
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  borderRadius: 6,
                                  padding: '5px 10px',
                                  color: '#FFFFFF',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <Maximize2 size={13} color="#38BDF8" />
                                <span>ดูรูปเต็ม</span>
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '8px 10px',
                              background: 'rgba(15, 23, 42, 0.85)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              fontSize: '0.75rem',
                              color: '#E2E8F0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                            }}
                          >
                            {att.fileName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* กล่องสถานะพิเศษ: รอตรวจรับงาน (READY_FOR_REVIEW) */}
              {currentDetailTicket.status === 'READY_FOR_REVIEW' && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ color: '#FCD34D', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldAlert size={16} color="#F59E0B" /> สิ่งที่ทีม Dev แก้ไข (Release Note):
                    </div>
                    <Link
                      href={`/review/${currentDetailTicket.reviewToken}`}
                      target="_blank"
                      className="btn btn-line"
                      style={{ padding: '5px 12px', fontSize: '0.775rem' }}
                    >
                      <Eye size={13} /> เปิดหน้าตรวจรับงาน
                    </Link>
                  </div>
                  <div style={{ color: '#FEF3C7', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {currentDetailTicket.releaseNote || 'ทีม Dev ได้แก้ไขและนำขึ้นระบบเรียบร้อยแล้ว'}
                  </div>
                </div>
              )}

              {/* กล่องสถานะพิเศษ: ตรวจผ่านแล้ว (APPROVED) */}
              {currentDetailTicket.status === 'APPROVED' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ color: '#34D399', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} color="#10B981" /> ตรวจผ่านแล้ว (อนุมัติงานเรียบร้อย)
                    </div>
                    {currentDetailTicket.reviewerName && (
                      <div style={{ color: '#A7F3D0', fontSize: '0.8rem', marginTop: 4 }}>
                        อนุมัติโดย: <strong>{currentDetailTicket.reviewerName}</strong>
                        {currentDetailTicket.reviewedAt && (
                          <span style={{ color: '#6EE7B7', marginLeft: 8 }}>
                            ({new Date(currentDetailTicket.reviewedAt).toLocaleString('th-TH')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/review/${currentDetailTicket.reviewToken}`}
                    target="_blank"
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.775rem', color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  >
                    <Eye size={13} /> ดูใบรับงาน
                  </Link>
                </div>
              )}

              {/* กล่องสถานะพิเศษ: แจ้งแก้ไข (REWORK) */}
              {currentDetailTicket.status === 'REWORK' && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ color: '#F87171', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RotateCcw size={16} color="#EF4444" /> จุดที่ต้องแก้ไขเพิ่มเติม:
                    </div>
                    <Link
                      href={`/review/${currentDetailTicket.reviewToken}`}
                      target="_blank"
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.775rem', color: '#FDA4AF', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <Eye size={13} /> ดูคอมเมนต์
                    </Link>
                  </div>
                  <div style={{ color: '#FECDD3', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    &ldquo;{currentDetailTicket.rejectionReason || 'มีการแจ้งแก้ไขเพิ่มเติม'}&rdquo;
                  </div>
                </div>
              )}

              {/* ประวัติการทำงาน (Timeline) */}
              {currentDetailTicket.activities && currentDetailTicket.activities.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <History size={15} color="#38BDF8" /> ประวัติการทำงาน ({currentDetailTicket.activities.length} รายการ)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8, borderLeft: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    {currentDetailTicket.activities.map((act) => (
                      <div key={act.id} style={{ position: 'relative', paddingLeft: 14 }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: -13,
                            top: 6,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background:
                              act.action === 'APPROVED'
                                ? '#10B981'
                                : act.action === 'REJECTED'
                                ? '#EF4444'
                                : act.action === 'SENT_REVIEW'
                                ? '#F59E0B'
                                : '#38BDF8',
                          }}
                        />
                        <div style={{ fontSize: '0.775rem', color: '#F1F5F9' }}>
                          <span style={{ fontWeight: 600, color: '#BAE6FD' }}>{act.actor}</span>: {act.details || act.action}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
                          {new Date(act.createdAt).toLocaleString('th-TH')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions (เฉพาะตอนล็อกอิน Dev) */}
            {isAuthenticated && (
              <div
                style={{
                  padding: '14px 22px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(11, 15, 23, 0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 8,
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const target = currentDetailTicket;
                    setSelectedTicketForDetail(null);
                    setQuickMoveTicket(target);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.775rem', color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                >
                  <ArrowRightLeft size={13} /> ย้ายสถานะ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = currentDetailTicket;
                    setSelectedTicketForDetail(null);
                    handleOpenEditModal(target);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.775rem' }}
                >
                  <Pencil size={13} /> แก้ไข
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = currentDetailTicket;
                    promptDeleteTicket(target);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.775rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={13} /> ลบ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Modal สำหรับยืนยันการลบตั๋วงาน */}
      <ConfirmModal
        isOpen={!!ticketToDelete}
        title="ยืนยันการลบตั๋วงาน"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบตั๋วงานนี้? ข้อมูลและไฟล์แนบทั้งหมดของตั๋วงานนี้จะไม่สามารถกู้คืนได้"
        itemInfo={
          ticketToDelete
            ? {
                badge: `TF-${String(ticketToDelete.ticketNumber).padStart(2, '0')}`,
                title: ticketToDelete.title,
              }
            : undefined
        }
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        type="danger"
        isLoading={deletingTicket}
        onConfirm={confirmDeleteTicket}
        onClose={() => {
          if (!deletingTicket) setTicketToDelete(null);
        }}
      />

      {/* Top-Level Image Lightbox Modal (z-index 1200) */}
      <ImageLightbox
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || null}
        fileName={previewImage?.name}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
