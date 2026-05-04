import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  pending:   { label: 'În așteptare',   color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmată',     color: 'bg-blue-100 text-blue-700' },
  shipped:   { label: 'Expediată',      color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Livrată',        color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Anulată',        color: 'bg-red-100 text-red-700' },
}

const SHIPPING_LABEL = {
  posta_romana: 'Poșta Română',
  fan_courier:  'Fan Courier',
  cargus:       'Cargus',
  dpd:          'DPD',
  ridicare:     'Ridicare personală',
}

const PAYMENT_LABEL = {
  cash: 'Cash la livrare',
  card: 'Card (simulat)',
}

const SELLER_TRANSITIONS = {
  pending:   [{ status: 'confirmed', label: 'Confirmă comanda', style: 'bg-brand-500 hover:bg-brand-600 text-white' },
              { status: 'cancelled', label: 'Anulează',          style: 'border border-red-300 text-red-500 hover:bg-red-50' }],
  confirmed: [{ status: 'shipped',   label: 'Marchează expediată', style: 'bg-brand-500 hover:bg-brand-600 text-white' },
              { status: 'cancelled', label: 'Anulează',             style: 'border border-red-300 text-red-500 hover:bg-red-50' }],
  shipped:   [{ status: 'delivered', label: 'Marchează livrată', style: 'bg-green-500 hover:bg-green-600 text-white' },
              { status: 'cancelled', label: 'Anulează',           style: 'border border-red-300 text-red-500 hover:bg-red-50' }],
  delivered: [],
  cancelled: [],
}

function OrderCard({ order, isSeller, onStatusChange }) {
  const [updating, setUpdating] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ communication_score: 5, shipping_speed_score: 5, response_time_score: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [hasReview, setHasReview] = useState(order.has_review || false)

  const product = order.product_detail
  const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
  const total = (parseFloat(order.price_at_purchase) + parseFloat(order.shipping_cost)).toFixed(2)
  const transitions = isSeller ? (SELLER_TRANSITIONS[order.status] || []) : []

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(newStatus)
    try {
      const { data } = await api.patch(`/orders/${order.id}/status/`, { status: newStatus })
      onStatusChange(order.id, data.status)
    } catch {
      /* silent */
    } finally {
      setUpdating(null)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    try {
      await api.post('/reviews/', { order: order.id, ...reviewForm })
      setHasReview(true)
      setShowReviewModal(false)
    } catch {
      /* silent */
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex gap-4">
        {/* Product image */}
        <Link to={`/products/${order.product}`} className="shrink-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
            {product?.primary_image ? (
              <img src={product.primary_image} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <Link to={`/products/${order.product}`} className="font-semibold text-gray-800 hover:text-brand-600 transition truncate">
              {product?.title || `Produs #${order.product}`}
            </Link>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {isSeller ? (
              <span>
                Cumpărător:{' '}
                <Link to={`/users/${order.buyer_id}`} className="font-medium text-brand-600 hover:underline">
                  @{order.buyer_username}
                </Link>
              </span>
            ) : (
              <span>
                Vânzător:{' '}
                <Link to={`/users/${order.seller_id}`} className="font-medium text-brand-600 hover:underline">
                  @{order.seller_username}
                </Link>
              </span>
            )}
            <span>{SHIPPING_LABEL[order.shipping_method] || order.shipping_method}</span>
            <span>{PAYMENT_LABEL[order.payment_method] || order.payment_method}</span>
            <span>{new Date(order.created_at).toLocaleDateString('ro-RO')}</span>
          </div>

          {order.shipping_address && order.shipping_method !== 'ridicare' && (
            <p className="text-xs text-gray-400 mt-1 truncate">📍 {order.shipping_address}</p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">{order.price_at_purchase} RON</span>
            {parseFloat(order.shipping_cost) > 0 && (
              <span className="text-sm text-gray-400">+ {order.shipping_cost} RON livrare</span>
            )}
            <span className="font-bold text-brand-600">= {total} RON</span>
          </div>
        </div>
      </div>

      {/* Seller action buttons */}
      {isSeller && transitions.length > 0 && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
          {transitions.map((t) => (
            <button
              key={t.status}
              onClick={() => handleStatusUpdate(t.status)}
              disabled={!!updating}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${t.style}`}
            >
              {updating === t.status ? 'Se actualizează...' : t.label}
            </button>
          ))}
        </div>
      )}

      {/* Buyer: leave review on delivered orders */}
      {!isSeller && order.status === 'delivered' && !hasReview && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-300 text-brand-600 hover:bg-brand-50 text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Lasă o recenzie
          </button>
        </div>
      )}

      {!isSeller && order.status === 'delivered' && hasReview && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            to={`/users/${order.seller_id}?tab=reviews${order.review_id ? `&review=${order.review_id}` : ''}`}
            className="text-xs text-green-600 font-medium flex items-center gap-1 hover:text-green-700 hover:underline w-fit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Recenzie trimisă — vezi pe profilul vânzătorului
          </Link>
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Lasă o recenzie</h2>
            <p className="text-sm text-gray-500 mb-4">pentru @{order.seller_username}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {[
                { key: 'communication_score',   label: 'Comunicare' },
                { key: 'shipping_speed_score',  label: 'Viteză livrare' },
                { key: 'response_time_score',   label: 'Timp răspuns' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}: <span className="text-brand-600 font-bold">{reviewForm[key]}/5</span>
                  </label>
                  <input
                    type="range" min="1" max="5" step="1"
                    value={reviewForm[key]}
                    onChange={(e) => setReviewForm((f) => ({ ...f, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentariu (opțional)</label>
                <textarea
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Descrie experiența ta..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {reviewLoading ? 'Se trimite...' : 'Trimite recenzia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchases')

  useEffect(() => {
    setLoading(true)
    api.get('/orders/')
      .then(({ data }) => setOrders(data.results || data))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
    )
  }

  const purchases = orders.filter((o) => o.buyer_username === user?.username)
  const sales     = orders.filter((o) => o.seller_username === user?.username)
  const current   = activeTab === 'purchases' ? purchases : sales
  const isSeller  = activeTab === 'sales'

  const TABS = [
    { id: 'purchases', label: `Achiziții (${purchases.length})` },
    { id: 'sales',     label: `Vânzări (${sales.length})` },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comenzile mele</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
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

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-14 h-14 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 16H4L5 9z" />
          </svg>
          <p className="font-medium">
            {activeTab === 'purchases' ? 'Nicio achiziție încă' : 'Nicio vânzare încă'}
          </p>
          {activeTab === 'purchases' && (
            <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition">
              Explorează produse
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {current.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSeller={isSeller}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
