import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import FilterSidebar from '../components/product/FilterSidebar'
import ProductCard from '../components/product/ProductCard'

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  condition: '',
  min_price: '',
  max_price: '',
  ordering: '-created_at',
  page: 1,
}

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Cele mai noi' },
  { value: 'created_at', label: 'Cele mai vechi' },
  { value: 'price', label: 'Preț crescător' },
  { value: '-price', label: 'Preț descrescător' },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') || '',
  })

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const PAGE_SIZE = 20
  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    api.get('/categories/').then(({ data }) => setCategories(data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.search)    params.search     = filters.search
    if (filters.category)  params.category   = filters.category
    if (filters.condition) params.condition  = filters.condition
    if (filters.min_price) params.min_price  = filters.min_price
    if (filters.max_price) params.max_price  = filters.max_price
    params.ordering = filters.ordering
    params.page     = filters.page

    api.get('/products/', { params })
      .then(({ data }) => {
        setProducts(data.results)
        setTotal(data.count)
      })
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    const q = searchParams.get('search')
    if (q !== null) setFilters((f) => ({ ...f, search: q, page: 1 }))
  }, [searchParams])

  return (
    <div className="flex gap-8">
      <FilterSidebar filters={filters} onChange={setFilters} categories={categories} />

      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Se încarcă...' : `${total} produse găsite`}
          </p>
          <select
            value={filters.ordering}
            onChange={(e) => setFilters((f) => ({ ...f, ordering: e.target.value, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">Niciun produs găsit</p>
            <p className="text-sm mt-1">Încearcă să schimbi filtrele</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              ← Înapoi
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {filters.page} / {totalPages}
            </span>
            <button
              disabled={filters.page === totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Înainte →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
