import { useEffect, useRef, useState } from 'react'

export default function SortDropdown({ options = [], value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onDoc(e) {
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDoc)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-sm bg-brand-100 text-brand-700 font-medium rounded-2xl px-4 py-2 transition inline-flex items-center gap-2"
      >
        <span>{selected ? selected.label : 'Ordonează'}</span>
        <svg className={`w-4 h-4 transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path d="M6 8l4 4 4-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div role="menu" className="py-1">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                role="menuitem"
                className={`w-full text-left px-3 py-2 text-sm transition hover:bg-brand-50 ${value === o.value ? 'font-medium text-brand-700' : 'text-gray-700'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
