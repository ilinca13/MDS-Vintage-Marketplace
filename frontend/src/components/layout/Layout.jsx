import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 text-sm text-gray-400 py-4">
        <div className="max-w-7xl w-full mx-auto px-4 flex items-center justify-between">
          <span className="text-center w-full">© 2026 HolyGrail - Vintage Marketplace</span>
          <button
            type="button"
            aria-label="Mergi sus"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="ml-4 scroll-to-top inline-flex items-center justify-center w-8 h-8 bg-pink-200 hover:bg-pink-300 text-pink-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  )
}
