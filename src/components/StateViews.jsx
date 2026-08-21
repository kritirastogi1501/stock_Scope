import { Loader2, Inbox, AlertTriangle, SearchX } from 'lucide-react'

export function LoadingState({ label = 'Loading data…', compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-ink-600 ${compact ? 'py-6' : 'py-16'}`}>
      <Loader2 size={compact ? 18 : 24} className="animate-spin text-accent mb-2" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11 h-11 rounded-full bg-paper-100 border border-paper-300 flex items-center justify-center mb-3">
        <Icon size={20} className="text-ink-600" />
      </div>
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {description && <p className="text-2xs text-ink-600 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong loading this data.' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-11 h-11 rounded-full bg-loss-bg border border-loss/20 flex items-center justify-center mb-3">
        <AlertTriangle size={20} className="text-loss" />
      </div>
      <p className="text-sm font-medium text-ink-900">{message}</p>
    </div>
  )
}

export function NoResultsState({ query }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matching stocks"
      description={query ? `No results found for “${query}”. Try a different ticker or company name.` : 'Try a different search term.'}
    />
  )
}
