import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CONDITION_LABEL = {
  new: 'Nou cu etichete',
  like_new: 'Ca nou',
  good: 'Bună stare',
  fair: 'Stare acceptabilă',
  poor: 'Stare slabă',
}

const STATUS_LABEL = {
  active: { text: 'Disponibil', color: 'bg-green-100 text-green-700' },
  reserved: { text: 'Rezervat', color: 'bg-yellow-100 text-yellow-700' },
  sold: { text: 'Vândut', color: 'bg-red-100 text-red-700' },
}

function StarScore({ label, value }) {
  if (value === null) return null
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value} / 5</span>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [summary, setSummary] = useState(null)
  const [activeImg, setActiveImg] = useState(0)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [shippingMethod, setShippingMethod] = useState('posta_romana')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [error, setError] = useState('')

  const SHIPPING_OPTIONS = [
    { value: 'posta_romana', label: 'Poșta Română', cost: 15 },
    { value: 'fan_courier',  label: 'Fan Courier',  cost: 20 },
    { value: 'cargus',       label: 'Cargus',       cost: 18 },
    { value: 'dpd',          label: 'DPD',          cost: 17 },
    { value: 'ridicare',     label: 'Ridicare personală', cost: 0 },
  ]

  const selectedShipping = SHIPPING_OPTIONS.find((o) => o.value === shippingMethod)
  const totalPrice = product ? (parseFloat(product.price) + (selectedShipping?.cost || 0)).toFixed(2) : '0.00'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}/`)
      .then(({ data }) => {
        setProduct(data)
        return api.get(`/users/${data.seller_id}/review-summary/`)
      })
      .then(({ data }) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user) return
    api.get('/wishlist/')
      .then(({ data }) => {
        const found = data.results.find((item) => item.product === parseInt(id))
        setInWishlist(!!found)
      })
      .catch(() => {})
  }, [id, user])

  const handleWishlistToggle = async () => {
    if (!user) { navigate('/login'); return }
    setWishlistLoading(true)
    try {
      const { data } = await api.post('/wishlist/toggle/', { product: parseInt(id) })
      setInWishlist(data.added)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleContactSeller = async () => {
    if (!user) { navigate('/login'); return }
    const { data } = await api.post('/conversations/start/', { product_id: parseInt(id) })
    navigate(`/messages?conversation=${data.id}`)
  }

  const handleBuy = async () => {
    if (!shippingAddress.trim()) { setError('Adresa de livrare este obligatorie.'); return }
    if (shippingMethod !== 'ridicare' && !shippingAddress.trim()) {
      setError('Adresa de livrare este obligatorie.')
      return
    }
    setBuyLoading(true)
    setError('')
    try {
      await api.post('/orders/', {
        product: parseInt(id),
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        shipping_address: shippingAddress,
      })
      setShowBuyModal(false)
      navigate('/orders')
    } catch (err) {
      setError(err.response?.data?.product?.[0] || err.response?.data?.shipping_address?.[0] || 'A apărut o eroare.')
    } finally {
      setBuyLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-8 animate-pulse">
        <div className="flex-1 bg-gray-100 rounded-2xl aspect-square" />
        <div className="w-80 space-y-4">
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-10 bg-gray-100 rounded w-1/2" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!product) return <p className="text-gray-500">Produsul nu a fost găsit.</p>

  const images = product.images || []
  const isSeller = user?.username === product.seller_username
  const statusInfo = STATUS_LABEL[product.status] || { text: product.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="flex flex-col lg:flex-row gap-8">

      {/* Left — image gallery */}
      <div className="flex-1 space-y-3">
        <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
          {images.length > 0 ? (
            <img
              src={images[activeImg]?.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-brand-500' : 'border-transparent'}`}
              >
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right — details */}
      <div className="w-full lg:w-80 space-y-4">

        {/* Status badge */}
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
          {statusInfo.text}
        </span>

        <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
        <p className="text-3xl font-bold text-brand-600">{product.price} RON</p>

        {/* Meta */}
        <div className="text-sm text-gray-600 space-y-1 border-t border-gray-100 pt-4">
          {product.brand    && <p><span className="font-medium">Brand:</span> {product.brand}</p>}
          {product.size     && <p><span className="font-medium">Mărime:</span> {product.size}</p>}
          {product.condition && <p><span className="font-medium">Stare:</span> {CONDITION_LABEL[product.condition]}</p>}
          {product.location && <p><span className="font-medium">Locație:</span> {product.location}</p>}
          {product.category && <p><span className="font-medium">Categorie:</span> {product.category.name}</p>}
        </div>

        {/* Description */}
        {product.description && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Descriere</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Seller */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">Vânzător</p>
          <p className="font-semibold text-gray-800">@{product.seller_username}</p>
          {summary && summary.total_reviews > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-400">{summary.total_reviews} recenzii · Scor general: <span className="font-semibold text-gray-700">{summary.overall_score}/5</span></p>
              <StarScore label="Comunicare" value={summary.avg_communication} />
              <StarScore label="Viteză livrare" value={summary.avg_shipping_speed} />
              <StarScore label="Timp răspuns" value={summary.avg_response_time} />
            </div>
          )}
        </div>

        {/* Actions */}
        {!isSeller && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            {product.status === 'active' && (
              <button
                onClick={() => { if (!user) { navigate('/login'); return } setShowBuyModal(true) }}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Cumpără acum
              </button>
            )}

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition ${inWishlist ? 'border-red-400 text-red-500 hover:bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {inWishlist ? 'Salvat la favorite' : 'Adaugă la favorite'}
            </button>

            <button
              onClick={handleContactSeller}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contactează vânzătorul
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          {product.views_count} vizualizări · Adăugat {new Date(product.created_at).toLocaleDateString('ro-RO')}
        </p>
      </div>

      {/* Buy modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Confirmă comanda</h2>

            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="font-medium text-gray-800">{product.title}</p>
              <p className="text-gray-500 mt-0.5">Preț produs: <span className="font-semibold text-gray-700">{product.price} RON</span></p>
            </div>

            {/* Shipping method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metodă de livrare</label>
              <div className="space-y-2">
                {SHIPPING_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${shippingMethod === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.value}
                        checked={shippingMethod === opt.value}
                        onChange={() => setShippingMethod(opt.value)}
                        className="accent-brand-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-600">
                      {opt.cost === 0 ? 'Gratuit' : `${opt.cost} RON`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shipping address — hidden for pickup */}
            {shippingMethod !== 'ridicare' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresă de livrare</label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => { setShippingAddress(e.target.value); setError('') }}
                  placeholder="Strada, numărul, orașul, județul"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            )}

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Metodă de plată</label>
              <div className="flex gap-2">
                {[{ value: 'cash', label: '💵 Cash la livrare' }, { value: 'card', label: '💳 Card (simulat)' }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${paymentMethod === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {paymentMethod === 'card' && (
                <p className="text-xs text-gray-400 mt-2 text-center">Plata cu cardul este simulată — nu se introduc date reale.</p>
              )}
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-700">Total de plată</span>
              <span className="text-lg font-bold text-brand-600">{totalPrice} RON</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowBuyModal(false); setError('') }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Anulează
              </button>
              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {buyLoading ? 'Se procesează...' : 'Plasează comanda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
