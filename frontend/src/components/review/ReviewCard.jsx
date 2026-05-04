import { Link } from 'react-router-dom'

export default function ReviewCard({ rv }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">

      {/* Product preview */}
      {rv.product_id && (
        <Link
          to={`/products/${rv.product_id}`}
          className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 transition group"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
            {rv.product_image ? (
              <img src={rv.product_image} alt={rv.product_title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Produsul recenziei</p>
            <p className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition truncate">
              {rv.product_title}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      {/* Reviewer + score */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-medium text-gray-800">@{rv.reviewer_username}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(rv.created_at).toLocaleDateString('ro-RO')}
          </p>
        </div>
        <span className="text-lg font-bold text-brand-600">{rv.average_score} / 5</span>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex justify-between text-gray-500">
          <span>Comunicare</span>
          <span className="font-medium text-gray-700">{rv.communication_score}/5</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Viteză livrare</span>
          <span className="font-medium text-gray-700">{rv.shipping_speed_score}/5</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Timp răspuns</span>
          <span className="font-medium text-gray-700">{rv.response_time_score}/5</span>
        </div>
      </div>

      {/* Comment */}
      {rv.comment && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 italic">
          "{rv.comment}"
        </p>
      )}
    </div>
  )
}
