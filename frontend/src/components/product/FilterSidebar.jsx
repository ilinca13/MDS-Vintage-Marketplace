const CONDITIONS = [
  { value: 'new', label: 'Nou cu etichete' },
  { value: 'like_new', label: 'Ca nou' },
  { value: 'good', label: 'Bună stare' },
  { value: 'fair', label: 'Stare acceptabilă' },
  { value: 'poor', label: 'Stare slabă' },
]

export default function FilterSidebar({ filters, onChange, categories }) {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 })

  return (
    <aside className="w-56 shrink-0 space-y-6">

      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Categorie</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => set('category', '')}
              className={`text-sm w-full text-left px-2 py-1 rounded-lg transition ${!filters.category ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Toate
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => set('category', cat.id)}
                className={`text-sm w-full text-left px-2 py-1 rounded-lg transition ${filters.category === cat.id ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Preț (RON)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => set('min_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => set('max_price', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Stare</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => set('condition', '')}
              className={`text-sm w-full text-left px-2 py-1 rounded-lg transition ${!filters.condition ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Toate
            </button>
          </li>
          {CONDITIONS.map((c) => (
            <li key={c.value}>
              <button
                onClick={() => set('condition', c.value)}
                className={`text-sm w-full text-left px-2 py-1 rounded-lg transition ${filters.condition === c.value ? 'bg-brand-100 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({ search: '', category: '', condition: '', min_price: '', max_price: '', ordering: '-created_at', page: 1 })}
        className="text-sm text-red-500 hover:text-red-700 transition"
      >
        Resetează filtrele
      </button>
    </aside>
  )
}
