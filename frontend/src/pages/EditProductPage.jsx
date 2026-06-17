import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import EXTRA_CATEGORIES from '../config/categories'
import { useAuth } from '../context/AuthContext'

const CONDITIONS = [
  { value: 'new',      label: 'Nou cu etichete' },
  { value: 'like_new', label: 'Ca nou' },
  { value: 'good',     label: 'Stare bună' },
  { value: 'fair',     label: 'Stare acceptabilă' },
  { value: 'poor',     label: 'Stare slabă' },
]

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One size', 'Alta']

export default function EditProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const submittingRef = useRef(false)

  const [categories, setCategories] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiHashtags, setAiHashtags] = useState([])
  const [flagWarning, setFlagWarning] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/products/${id}/`),
      api.get('/categories/'),
    ]).then(([{ data: product }, { data: cats }]) => {
      if (product.seller_username !== user?.username) {
        navigate(`/products/${id}`)
        return
      }
      setForm({
        title:       product.title,
        description: product.description,
        price:       product.price,
        category:    product.category?.id ? String(product.category.id) : '',
        condition:   product.condition,
        size:        product.size || '',
        brand:       product.brand || '',
        location:    product.location || '',
      })
      setExistingImages(product.images || [])
      const normalized = cats.map((c) => ({ ...c, id: String(c.id) }))
      setCategories(normalized)
    }).finally(() => setPageLoading(false))
  }, [id, user, navigate])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: undefined }))
  }

  const handleNewImages = async (e) => {
    const files = Array.from(e.target.files)
    const total = existingImages.length + newImages.length + files.length
    if (total > 8) {
      setErrors((er) => ({ ...er, images: 'Poți adăuga maxim 8 imagini total.' }))
      return
    }
    setNewImages((p) => [...p, ...files])
    setNewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
    setErrors((er) => ({ ...er, images: undefined }))
    setFlagWarning('')

    // Check first new image against Shein/Temu
    if (files[0]) {
      try {
        const fd = new FormData()
        fd.append('image', files[0])
        const { data } = await api.post('/ai/flag-image/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (data.flagged) setFlagWarning(data.reason)
      } catch { /* silent — flagging is non-blocking */ }
    }
  }

  const removeNewImage = (i) => {
    setNewImages((p) => p.filter((_, idx) => idx !== i))
    setNewPreviews((p) => {
      URL.revokeObjectURL(p[i])
      return p.filter((_, idx) => idx !== i)
    })
  }

  const removeExistingImage = async (imgId) => {
    try {
      await api.delete(`/products/${id}/images/${imgId}/`)
      setExistingImages((p) => p.filter((img) => img.id !== imgId))
    } catch {
      setErrors((er) => ({ ...er, images: 'Nu s-a putut șterge imaginea.' }))
    }
  }

  const generateWithAI = async () => {
    if (!form.title && !form.brand && existingImages.length === 0 && newImages.length === 0) {
      setErrors((er) => ({ ...er, description: ['Completează cel puțin titlul sau adaugă o imagine înainte de a genera.'] }))
      return
    }
    setAiLoading(true)
    setAiHashtags([])
    setErrors((er) => ({ ...er, description: undefined }))
    try {
      const fd = new FormData()
      if (form.title) fd.append('title', form.title)
      if (form.brand) fd.append('keywords', form.brand)
      if (form.condition) fd.append('condition', form.condition)
      const catName = categories.find((c) => String(c.id) === String(form.category))?.name || ''
      if (catName) fd.append('category', catName)

      if (newImages[0]) {
        fd.append('image', newImages[0])
      } else if (existingImages[0]?.image) {
        const resp = await fetch(existingImages[0].image)
        const blob = await resp.blob()
        fd.append('image', blob, 'product.jpg')
      }

      const { data } = await api.post('/ai/generate-description/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, description: data.description }))
      setAiHashtags(data.hashtags)
    } catch {
      setErrors((er) => ({ ...er, description: ['Nu s-a putut genera descrierea. Încearcă din nou.'] }))
    } finally {
      setAiLoading(false)
    }
  }

  const appendHashtag = (tag) => {
    setForm((f) => ({
      ...f,
      description: f.description ? `${f.description}\n${tag}` : tag,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setErrors({})
    try {
        // If user selected a client-side-only category, omit the `category` field
        // so the backend keeps the existing category. Otherwise include numeric id or null.
        const isExtra = EXTRA_CATEGORIES.some((c) => c.id === form.category)
        const payload = { ...form, price: parseFloat(form.price) }
        if (!isExtra) {
          payload.category = form.category ? Number(form.category) : null
        } else {
          // ensure we don't send the client-side id
          delete payload.category
        }

        await api.patch(`/products/${id}/`, payload)

      // Navigate immediately so the edit page unmounts and user can't resubmit.
      navigate(`/products/${id}`)

      // Upload new images in background; swallow errors.
      ;(async () => {
        for (let i = 0; i < newImages.length; i++) {
          try {
            const fd = new FormData()
            fd.append('image', newImages[i])
            fd.append('is_primary', existingImages.length === 0 && i === 0 ? 'true' : 'false')
            fd.append('order', existingImages.length + i)
            await api.post(`/products/${id}/images/`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          } catch (e) {
            // ignore
          }
        }
      })()
    } catch (err) {
      setErrors(err.response?.data || { non_field_errors: ['A apărut o eroare.'] })
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const fieldErr = (name) =>
    errors[name] ? <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p> : null

  if (pageLoading || !form) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/products/${id}`)} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editează anunțul</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Existing images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fotografii existente
          </label>
          {existingImages.length === 0 ? (
            <p className="text-sm text-gray-400 mb-2">Nicio fotografie adăugată încă.</p>
          ) : (
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <span className="absolute bottom-0 left-0 right-0 bg-brand-500/80 text-white text-[10px] text-center py-0.5">
                      Principală
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full w-5 h-5 flex items-center justify-center text-gray-600 text-xs shadow"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adaugă fotografii noi <span className="text-gray-400 font-normal">({existingImages.length + newImages.length}/8)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {newPreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full w-5 h-5 flex items-center justify-center text-gray-600 text-xs shadow"
                >
                  ✕
                </button>
              </div>
            ))}
            {existingImages.length + newImages.length < 8 && (
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 flex flex-col items-center justify-center text-gray-400 hover:text-brand-500 transition"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs mt-1">Adaugă</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
          {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
          {flagWarning && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-700">Imagine suspectă detectată</p>
                <p className="text-xs text-red-600 mt-0.5">{flagWarning}</p>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
          <input
            name="title" required value={form.title} onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {fieldErr('title')}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Descriere *</label>
            <button
              type="button"
              onClick={generateWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {aiLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Se generează...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generează cu AI
                </>
              )}
            </button>
          </div>
          <textarea
            name="description" required value={form.description} onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
          {fieldErr('description')}

          {aiHashtags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1.5">Hashtag-uri sugerate — click pentru a adăuga în descriere:</p>
              <div className="flex flex-wrap gap-1.5">
                {aiHashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendHashtag(tag)}
                    className="text-xs bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200 rounded-full px-2.5 py-0.5 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preț (RON) *</label>
            <input
              name="price" type="number" min="1" step="0.01" required
              value={form.price} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {fieldErr('price')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
            <select
              name="category" value={form.category} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Selectează...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Condition + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stare *</label>
            <select
              name="condition" value={form.condition} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mărime</label>
            <select
              name="size" value={form.size} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Selectează...</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Brand + Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              name="brand" value={form.brand} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
            <input
              name="location" value={form.location} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {errors.non_field_errors && (
          <p className="text-red-500 text-sm">{errors.non_field_errors[0]}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(`/products/${id}`)}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Anulează
          </button>
          <button
            type="submit" disabled={loading}
            className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? 'Se salvează...' : 'Salvează modificările'}
          </button>
        </div>
      </form>
    </div>
  )
}
