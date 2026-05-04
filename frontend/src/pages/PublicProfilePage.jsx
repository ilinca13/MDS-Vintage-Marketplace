import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/product/ProductCard'
import ReviewCard from '../components/review/ReviewCard'

const TABS = [
  { id: 'listings', label: 'Anunțuri active' },
  { id: 'reviews',  label: 'Recenzii' },
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

export default function PublicProfilePage() {
  const { id } = useParams()

  const [profile, setProfile]   = useState(null)
  const [summary, setSummary]   = useState(null)
  const [products, setProducts] = useState([])
  const [reviews, setReviews]   = useState([])
  const [activeTab, setActiveTab] = useState('listings')
  const [loading, setLoading]   = useState(true)
  const [tabLoading, setTabLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/users/${id}/`),
      api.get(`/users/${id}/review-summary/`),
    ])
      .then(([{ data: prof }, { data: sm }]) => {
        setProfile(prof)
        setSummary(sm)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!profile) return
    setTabLoading(true)
    if (activeTab === 'listings') {
      api.get('/products/', { params: { seller: profile.username } })
        .then(({ data }) => setProducts(data.results || []))
        .finally(() => setTabLoading(false))
    } else {
      api.get('/reviews/', { params: { seller: id } })
        .then(({ data }) => setReviews(data.results || []))
        .finally(() => setTabLoading(false))
    }
  }, [activeTab, profile, id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="flex gap-5 items-center">
          <div className="w-20 h-20 rounded-full bg-gray-100" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) return <p className="text-gray-500">Utilizatorul nu a fost găsit.</p>

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
  const joinYear = new Date(profile.date_joined).getFullYear()

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-5 items-center">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-brand-500">
              {profile.username[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <span className="text-sm text-gray-400">@{profile.username}</span>
          </div>
          {profile.bio && <p className="text-sm text-gray-600 mt-1">{profile.bio}</p>}
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </span>
            )}
            <span>Membru din {joinYear}</span>
            {summary && summary.total_reviews > 0 && (
              <span className="font-medium text-brand-600">⭐ {summary.overall_score}/5 · {summary.total_reviews} recenzii</span>
            )}
          </div>
        </div>
      </div>

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

        {/* Listings tab */}
        {activeTab === 'listings' && (
          tabLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="font-medium">Niciun anunț activ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          tabLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {summary && summary.total_reviews > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-brand-600">{summary.overall_score}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Scor general</p>
                      <p className="text-xs text-gray-400">{summary.total_reviews} recenzii</p>
                    </div>
                  </div>
                  <StarBar label="Comunicare"    value={summary.avg_communication} />
                  <StarBar label="Viteză livrare" value={summary.avg_shipping_speed} />
                  <StarBar label="Timp răspuns"  value={summary.avg_response_time} />
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="font-medium">Nicio recenzie încă</p>
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
