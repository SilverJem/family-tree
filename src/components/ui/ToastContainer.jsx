import { useEffect } from 'react'
import { useUIStore } from '../../store/useUIStore'

export function ToastContainer() {
  const toasts = useUIStore(s => s.toasts)
  const removeToast = useUIStore(s => s.removeToast)

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      zIndex: 9999
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const bg = toast.type === 'error' ? '#EF4444' : toast.type === 'success' ? '#10B981' : '#1E293B'
  
  return (
    <div style={{
      background: bg,
      color: 'white',
      padding: '12px 20px',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 300,
      gap: 16,
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{toast.message}</span>
      <button 
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          padding: 4
        }}
      >
        ✕
      </button>
    </div>
  )
}
