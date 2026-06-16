import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import EXTRA_CATEGORIES from '../config/categories'

const CONDITIONS = [
  { value: 'new',      label: 'Nou cu etichete' },
  { value: 'like_new', label: 'Ca nou' },
  { value: 'good',     label: 'Stare bună' },
  { value: 'fair',     label: 'Stare acceptabilă' },
  { value: 'poor',     label: 'Stare slabă' },
]

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One size', 'Alta']

export default function SellPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef()
  const submittingRef = useRef(false)

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    category: '', condition: 'good', size: '', brand: '', location: '',
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiHashtags, setAiHashtags] = useState([])

  useEffect(() => {
    api.get('/categories/').then(({ data }) => {
      const normalized = data.map((c) => ({ ...c, id: String(c.id) }))
      setCategories(normalized)
    })
  }, [])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: undefined }))
  }

  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 8) {
      setErrors((er) => ({ ...er, images: 'Poți adăuga maxim 8 imagini.' }))
      return
    }
    setImages((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    setErrors((er) => ({ ...er, images: undefined }))
  }

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i])
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const generateWithAI = async () => {
    if (!form.title && !form.brand && images.length === 0) {
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
      images.forEach((img) => fd.append('images', img))

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
      const { data: product } = await api.post('/products/', {
        ...form,
        price: parseFloat(form.price),
        // If user picked a client-side-only category (one of EXTRA_CATEGORIES), send null
        category: EXTRA_CATEGORIES.some((c) => c.id === form.category) ? null : (form.category ? Number(form.category) : null),
      })

      // Navigate to main page immediately so the create page unmounts and user can't repost.
      navigate('/')

      // Upload images in background (fire-and-forget). Errors are swallowed.
      ;(async () => {
        for (let i = 0; i < images.length; i++) {
          try {
            const fd = new FormData()
            fd.append('image', images[i])
            fd.append('is_primary', i === 0 ? 'true' : 'false')
            fd.append('order', i)
            await api.post(`/products/${product.id}/images/`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          } catch (e) {
            // ignore upload errors — product page is shown regardless
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Adaugă un produs</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fotografii <span className="text-gray-400 font-normal">(maxim 8, prima va fi cea principală)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-brand-500/80 text-white text-[10px] text-center py-0.5">
                    Principală
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full w-5 h-5 flex items-center justify-center text-gray-600 text-xs shadow"
                >
                  ✕
                </button>
              </div>
            ))}

            {previews.length < 8 && (
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImages}
          />
          {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
          <input
            name="title" required value={form.title} onChange={handleChange}
            placeholder="ex: Geacă de piele vintage anii 80"
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
            rows={4} placeholder="Descrie starea, materialul, istoricul produsului..."
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
              placeholder="0.00"
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
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
              placeholder="ex: Levi's, Zara, H&M..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Locație</label>
            <input
              name="location" value={form.location} onChange={handleChange}
              placeholder="ex: București, Cluj..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {errors.non_field_errors && (
          <p className="text-red-500 text-sm">{errors.non_field_errors[0]}</p>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? 'Se publică...' : 'Publică anunțul'}
        </button>
      </form>
    </div>
  )
}
