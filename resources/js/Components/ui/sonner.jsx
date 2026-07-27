import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        style: {
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          color: '#ffffff',
          fontSize: '0.9rem',
          fontWeight: '500',
          padding: '14px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          gap: '12px',
        },
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-gray-400",
          actionButton: "group-[.toast]:bg-red-600 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-gray-300",
          closeButton: "group-[.toast]:text-white group-[.toast]:border-none group-[.toast]:bg-transparent group-[.toast]:opacity-60 group-[.toast]:hover:opacity-100",
        },
      }}
      icons={{
        success: (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(22, 163, 74, 0.2)', color: '#22c55e', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </span>
        ),
        error: (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(220, 38, 38, 0.2)', color: '#ef4444', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </span>
        ),
        warning: (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
        ),
        info: (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </span>
        ),
      }}
      closeButton
      {...props}
    />
  )
}

export { Toaster }
