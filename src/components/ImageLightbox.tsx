'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, Download, Image as ImageIcon } from 'lucide-react';

export interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  fileName?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageUrl,
  fileName,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const displayName = fileName || 'รูปภาพประกอบ';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1200,
        backgroundColor: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(17, 24, 39, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
            padding: '10px 16px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* File Name Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ImageIcon size={17} color="#38BDF8" />
            </div>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#F8FAFC',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                padding: '7px 12px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="เปิดภาพเต็มในแท็บใหม่"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">แท็บใหม่</span>
            </a>

            <a
              href={imageUrl}
              download={displayName}
              className="btn btn-secondary"
              style={{
                padding: '7px 12px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="ดาวน์โหลดรูปภาพ"
            >
              <Download size={14} />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                padding: '7px 10px',
                lineHeight: 1,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                color: '#F87171',
              }}
              title="ปิดหน้าต่าง (Esc)"
              aria-label="ปิด"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div
          style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: 14,
            overflow: 'hidden',
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={imageUrl}
            alt={displayName}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
