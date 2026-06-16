import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/product/ProductCard'
import SortDropdown from '../components/common/SortDropdown'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Cele mai recente' },
  { value: 'created_at',  label: 'Cele mai vechi' },
  { value: 'product__price',  label: 'Preț crescător' },
  { value: '-product__price', label: 'Preț descrescător' },
]

const CONDITIONS = [
  { value: 'new',      label: 'Nou cu etichete' },
  { value: 'like_new', label: 'Ca nou' },
  { value: 'good',     label: 'Stare bună' },
  { value: 'fair',     label: 'Stare acceptabilă' },
  { value: 'poor',     label: 'Stare slabă' },
]

const DEFAULT_FILTERS = {
  ordering:  '-created_at',
  category:  '',
  condition: '',
  min_price: '',
  max_price: '',
  search:    '',
}

export default function WishlistPage() {
  const [items, setItems]         = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState(DEFAULT_FILTERS)
  const [page, setPage]           = useState(1)
  const [removing, setRemoving]   = useState(null)

  const PAGE_SIZE  = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    api.get('/categories/').then(({ data }) => setCategories(data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, ordering: filters.ordering }
    if (filters.category)  params.category  = filters.category
    if (filters.condition) params.condition = filters.condition
    if (filters.min_price) params.min_price = filters.min_price
    if (filters.max_price) params.max_price = filters.max_price
    if (filters.search)    params.search    = filters.search

    api.get('/wishlist/', { params })
      .then(({ data }) => {
        setItems(data.results || [])
        setTotal(data.count || 0)
      })
      .finally(() => setLoading(false))
  }, [filters, page])

  const handleFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  const handleRemove = async (itemId) => {
    setRemoving(itemId)
    try {
      await api.delete(`/wishlist/${itemId}/`)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      setTotal((t) => t - 1)
    } finally {
      setRemoving(null)
    }
  }

  const activeFiltersCount = [filters.category, filters.condition, filters.min_price, filters.max_price]
    .filter(Boolean).length

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favorite</h1>
          {!loading && (
            <p className="text-sm text-gray-400 mt-0.5">
              {total === 0 ? 'Niciun produs salvat' : `${total} ${total === 1 ? 'produs salvat' : 'produse salvate'}`}
            </p>
          )}
        </div>

        {/* Search + sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Caută în favorite..."
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-400 font-yanone"
          />
            <SortDropdown
              options={SORT_OPTIONS}
              value={filters.ordering}
              onChange={(val) => handleFilter('ordering', val)}
            />
        </div>
      </div>

      <div className="flex gap-6">

        {/* Filter sidebar */}
        <aside className="hidden sm:block w-52 shrink-0 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Filtre</span>
            {activeFiltersCount > 0 && (
              <button onClick={handleReset} className="text-xs text-pink-700 bg-pink-100 border-4 border-pink-300 rounded-xl px-2 py-0.5 hover:bg-pink-200 transition focus:outline-none focus:ring-2 focus:ring-pink-200">
                Resetează ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Category */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Categorie</p>
            <select
              value={filters.category}
              onChange={(e) => handleFilter('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Toate</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Stare</p>
            <div className="space-y-1.5">
              {CONDITIONS.map((c) => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="condition"
                    value={c.value}
                    checked={filters.condition === c.value}
                    onChange={() => handleFilter('condition', c.value)}
                    className="accent-brand-500"
                  />
                  <span className={`text-sm ${filters.condition === c.value ? 'text-brand-600 font-medium' : 'text-gray-600 group-hover:text-gray-800'}`}>
                    {c.label}
                  </span>
                </label>
              ))}
              {filters.condition && (
                <button onClick={() => handleFilter('condition', '')} className="text-xs text-gray-400 hover:text-gray-600 mt-1">
                  ✕ Resetează starea
                </button>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preț (RON)</p>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" placeholder="Min"
                value={filters.min_price}
                onChange={(e) => handleFilter('min_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <span className="text-gray-400 shrink-0">—</span>
              <input
                type="number" min="0" placeholder="Max"
                value={filters.max_price}
                onChange={(e) => handleFilter('max_price', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="font-medium">
                {activeFiltersCount > 0 ? 'Niciun produs cu filtrele selectate' : 'Lista de favorite e goală'}
              </p>
              {activeFiltersCount > 0 ? (
                <button onClick={handleReset} className="mt-3 text-sm text-pink-700 bg-pink-100 border-4 border-pink-300 rounded-xl px-3 py-1 hover:bg-pink-200 transition focus:outline-none focus:ring-2 focus:ring-pink-200">
                  Resetează filtrele
                </button>
              ) : (
                <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition">
                  Explorează produse
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="relative group/card">
                    <ProductCard product={item.product_detail} />
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removing === item.id}
                      title="Elimină din favorite"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-red-400 hover:text-red-600 transition opacity-0 group-hover/card:opacity-100 disabled:opacity-50"
                    >
                      {removing === item.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-brand-50 transition"
                  >
                    ← Înapoi
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-brand-50 transition"
                  >
                    Înainte →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
