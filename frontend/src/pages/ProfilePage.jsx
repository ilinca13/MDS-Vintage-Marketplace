import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/product/ProductCard'
import ReviewCard from '../components/review/ReviewCard'

const TABS = [
  { id: 'active', label: 'Anunțuri active' },
  { id: 'sold',   label: 'Vândute' },
  { id: 'reviews', label: 'Recenzii primite' },
]

function StarBar({ label, value }) {
  if (value === null || value === undefined) return null
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-brand-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, fetchMe } = useAuth()
  const avatarInputRef = useRef()

  const [activeTab, setActiveTab] = useState('active')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', bio: '', location: '', phone_number: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        first_name:   user.first_name || '',
        last_name:    user.last_name  || '',
        bio:          user.bio        || '',
        location:     user.location   || '',
        phone_number: user.phone_number || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    if (activeTab === 'active' || activeTab === 'sold') {
      setProductsLoading(true)
      api.get('/products/', { params: { seller: user.username, status: activeTab, page_size: 50 } })
        .then(({ data }) => setProducts(data.results || []))
        .finally(() => setProductsLoading(false))
    }
    if (activeTab === 'reviews') {
      setReviewsLoading(true)
      Promise.all([
        api.get('/reviews/', { params: { seller: user.id } }),
        api.get(`/users/${user.id}/review-summary/`),
      ])
        .then(([{ data: rv }, { data: sm }]) => {
          setReviews(rv.results || [])
          setSummary(sm)
        })
        .finally(() => setReviewsLoading(false))
    }
  }, [activeTab, user])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setFormErrors((er) => ({ ...er, [e.target.name]: undefined }))
    setSaveSuccess(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})
    setSaveSuccess(false)
    try {
      await api.patch('/users/me/', form)
      await fetchMe()
      setSaveSuccess(true)
      setEditMode(false)
    } catch (err) {
      setFormErrors(err.response?.data || {})
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      await api.patch('/users/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchMe()
    } catch {
      /* silent */
    }
  }

  const fieldErr = (name) =>
    formErrors[name] ? <p className="text-red-500 text-xs mt-1">{formErrors[name][0]}</p> : null

  if (!user) return null

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
  const joinYear = new Date(user.date_joined).getFullYear()

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={() => avatarInputRef.current.click()}
            title="Schimbă fotografia"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-brand-500">
                {user.username[0].toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <span className="text-sm text-gray-400">@{user.username}</span>
          </div>
          {user.bio && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {user.location}
              </span>
            )}
            <span>Membru din {joinYear}</span>
            {user.email && <span>{user.email}</span>}
          </div>
        </div>

        {/* Edit toggle */}
        <button
          onClick={() => { setEditMode((v) => !v); setSaveSuccess(false) }}
          className="shrink-0 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          {editMode ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Anulează
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editează profilul
            </>
          )}
        </button>
      </div>

      {/* Edit form */}
      {editMode && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Modifică informațiile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prenume</label>
                <input name="first_name" value={form.first_name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                {fieldErr('first_name')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume</label>
                <input name="last_name" value={form.last_name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                {fieldErr('last_name')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                placeholder="Spune ceva despre tine..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              {fieldErr('bio')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="ex: București"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                {fieldErr('location')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input name="phone_number" value={form.phone_number} onChange={handleChange}
                  placeholder="07xx xxx xxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                {fieldErr('phone_number')}
              </div>
            </div>

            {saveSuccess && (
              <p className="text-green-600 text-sm font-medium">Modificările au fost salvate.</p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditMode(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Anulează
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition">
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === t.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active / Sold listings */}
        {(activeTab === 'active' || activeTab === 'sold') && (
          productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">Niciun produs{activeTab === 'sold' ? ' vândut' : ' activ'}</p>
              {activeTab === 'active' && (
                <Link to="/sell"
                  className="inline-block mt-4 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition">
                  Adaugă primul anunț
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          reviewsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary scores */}
              {summary && summary.total_reviews > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-brand-600">{summary.overall_score}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Scor general</p>
                      <p className="text-xs text-gray-400">{summary.total_reviews} recenzii</p>
                    </div>
                  </div>
                  <StarBar label="Comunicare" value={summary.avg_communication} />
                  <StarBar label="Viteză livrare" value={summary.avg_shipping_speed} />
                  <StarBar label="Timp răspuns" value={summary.avg_response_time} />
                </div>
              )}

              {/* Individual reviews */}
              {reviews.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="font-medium">Nicio recenzie primită încă</p>
                </div>
              ) : (
                reviews.map((rv) => <ReviewCard key={rv.id} rv={rv} />)
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
