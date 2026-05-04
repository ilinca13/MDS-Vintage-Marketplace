import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const CONDITIONS = [
  { value: 'new',      label: 'Nou cu etichete' },
  { value: 'like_new', label: 'Ca nou' },
  { value: 'good',     label: 'Bună stare' },
  { value: 'fair',     label: 'Stare acceptabilă' },
  { value: 'poor',     label: 'Stare slabă' },
]

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One size', 'Alta']

export default function EditProductPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef()

  const [categories, setCategories] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

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
        category:    product.category?.id || '',
        condition:   product.condition,
        size:        product.size || '',
        brand:       product.brand || '',
        location:    product.location || '',
      })
      setExistingImages(product.images || [])
      setCategories(cats)
    }).finally(() => setPageLoading(false))
  }, [id, user, navigate])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: undefined }))
  }

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files)
    const total = existingImages.length + newImages.length + files.length
    if (total > 8) {
      setErrors((er) => ({ ...er, images: 'Poți adăuga maxim 8 imagini total.' }))
      return
    }
    setNewImages((p) => [...p, ...files])
    setNewPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
    setErrors((er) => ({ ...er, images: undefined }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await api.patch(`/products/${id}/`, {
        ...form,
        price: parseFloat(form.price),
        category: form.category || null,
      })

      for (let i = 0; i < newImages.length; i++) {
        const fd = new FormData()
        fd.append('image', newImages[i])
        fd.append('is_primary', existingImages.length === 0 && i === 0 ? 'true' : 'false')
        fd.append('order', existingImages.length + i)
        await api.post(`/products/${id}/images/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate(`/products/${id}`)
    } catch (err) {
      setErrors(err.response?.data || { non_field_errors: ['A apărut o eroare.'] })
    } finally {
      setLoading(false)
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

          {/* New images to add */}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Descriere *</label>
          <textarea
            name="description" required value={form.description} onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
          {fieldErr('description')}
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
