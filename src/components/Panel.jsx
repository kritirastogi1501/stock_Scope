export default function Panel({ title, subtitle, right, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`bg-white border border-paper-300 rounded-md shadow-panel ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between border-b border-paper-200 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink-900 font-display">{title}</h2>}
            {subtitle && <p className="text-2xs text-ink-600 mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
