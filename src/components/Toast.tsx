'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 380,
          width: 'calc(100% - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const config = {
            success: {
              border: 'rgba(16, 185, 129, 0.35)',
              glow: '0 8px 24px -4px rgba(16, 185, 129, 0.25)',
              icon: <CheckCircle2 size={20} color="#10B981" />,
              accent: '#10B981',
            },
            error: {
              border: 'rgba(239, 68, 68, 0.35)',
              glow: '0 8px 24px -4px rgba(239, 68, 68, 0.25)',
              icon: <AlertCircle size={20} color="#EF4444" />,
              accent: '#EF4444',
            },
            warning: {
              border: 'rgba(245, 158, 11, 0.35)',
              glow: '0 8px 24px -4px rgba(245, 158, 11, 0.25)',
              icon: <AlertTriangle size={20} color="#F59E0B" />,
              accent: '#F59E0B',
            },
            info: {
              border: 'rgba(56, 189, 248, 0.35)',
              glow: '0 8px 24px -4px rgba(56, 189, 248, 0.25)',
              icon: <Info size={24} color="#38BDF8" />,
              accent: '#38BDF8',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: '#111827',
                border: `1px solid ${config.border}`,
                boxShadow: `${config.glow}, 0 12px 28px -4px rgba(0, 0, 0, 0.6)`,
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>{config.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: config.accent,
                      marginBottom: 2,
                    }}
                  >
                    {toast.title}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: '#F1F5F9',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                aria-label="ปิด"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
