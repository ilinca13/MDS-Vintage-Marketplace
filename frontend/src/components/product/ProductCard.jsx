import { Link } from 'react-router-dom'

const CONDITION_LABEL = {
  new: 'Nou cu etichete',
  like_new: 'Ca nou',
  good: 'Bună stare',
  fair: 'Stare acceptabilă',
  poor: 'Stare slabă',
}

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {product.brand && <span className="mr-1">{product.brand} ·</span>}
          {product.size && <span className="mr-1">{product.size} ·</span>}
          {CONDITION_LABEL[product.condition] || product.condition}
        </p>
        <p className="text-base font-bold text-brand-600 mt-2">{product.price} RON</p>
      </div>
    </Link>
  )
}
