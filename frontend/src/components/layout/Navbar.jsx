import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-brand-600 shrink-0">
          Vintage
        </Link>

        {/* Search */}
        <form
          className="flex-1 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault()
            const q = e.target.q.value.trim()
            if (q) navigate(`/?search=${encodeURIComponent(q)}`)
          }}
        >
          <input
            name="q"
            type="search"
            placeholder="Caută produse, branduri..."
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </form>

        {/* Nav links */}
        <nav className="flex items-center gap-3 text-sm shrink-0">
          <Link
            to="/sell"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-full transition"
          >
            + Vinde
          </Link>

          {user ? (
            <>
              <Link to="/messages" className="text-gray-600 hover:text-brand-600 transition" title="Mesaje">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>

              <Link to="/wishlist" className="text-gray-600 hover:text-brand-600 transition" title="Favorite">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              <Link to="/orders" className="text-gray-600 hover:text-brand-600 transition" title="Comenzi">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>

              <Link to="/profile" className="flex items-center gap-1 text-gray-700 hover:text-brand-600 transition font-medium">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                  {user.username[0].toUpperCase()}
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Ieși
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-brand-600 font-medium transition">
                Intră în cont
              </Link>
              <Link
                to="/register"
                className="border border-brand-500 text-brand-600 hover:bg-brand-50 font-medium px-4 py-2 rounded-full transition"
              >
                Înregistrare
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
