import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function ToastStack({ toasts, dismissToast }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-md border border-ink-800 bg-ink-900 text-paper-50 px-4 py-3 shadow-lg text-sm min-w-[240px] animate-[fadeIn_0.15s_ease-out]"
        >
          {t.variant === 'error' ? (
            <XCircle size={16} className="text-loss shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-gain shrink-0" />
          )}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="text-paper-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
