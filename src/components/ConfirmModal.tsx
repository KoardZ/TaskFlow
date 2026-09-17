'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  itemInfo?: {
    badge?: string;
    title: string;
  };
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  itemInfo,
  confirmText = 'ยืนยันการลบ',
  cancelText = 'ยกเลิก',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isLoading) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      bg: 'rgba(239, 68, 68, 0.16)',
      border: 'rgba(239, 68, 68, 0.35)',
      glow: '0 0 24px rgba(239, 68, 68, 0.3)',
      icon: <Trash2 size={24} color="#EF4444" />,
      buttonClass: 'btn-danger',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.16)',
      border: 'rgba(245, 158, 11, 0.35)',
      glow: '0 0 24px rgba(245, 158, 11, 0.3)',
      icon: <AlertTriangle size={24} color="#F59E0B" />,
      buttonClass: 'btn-taskflow',
    },
    info: {
      bg: 'rgba(56, 189, 248, 0.16)',
      border: 'rgba(56, 189, 248, 0.35)',
      glow: '0 0 24px rgba(56, 189, 248, 0.3)',
      icon: <Info size={24} color="#38BDF8" />,
      buttonClass: 'btn-primary',
    },
  }[type];

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          padding: 24,
          borderRadius: 16,
          background: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header with Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost"
            style={{
              padding: 6,
              borderRadius: 8,
              color: '#94A3B8',
              lineHeight: 1,
            }}
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center icon with pulse glow */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: iconConfig.bg,
              border: `1px solid ${iconConfig.border}`,
              boxShadow: iconConfig.glow,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            {iconConfig.icon}
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#F8FAFC',
              letterSpacing: '-0.01em',
              marginBottom: 8,
            }}
          >
            {title}
          </h3>

          {description && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#94A3B8',
                lineHeight: 1.55,
                margin: '0 auto',
                maxWidth: 360,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Optional Ticket / Item Info Box */}
        {itemInfo && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {itemInfo.badge && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(235, 10, 30, 0.15)',
                  color: '#FF6B7A',
                  border: '1px solid rgba(235, 10, 30, 0.3)',
                  flexShrink: 0,
                }}
              >
                {itemInfo.badge}
              </span>
            )}
            <span
              style={{
                fontSize: '0.85rem',
                color: '#E2E8F0',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {itemInfo.title}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: '11px',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 10,
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn ${iconConfig.buttonClass}`}
            style={{
              flex: 1.2,
              padding: '11px',
              fontWeight: 700,
              fontSize: '0.9rem',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
