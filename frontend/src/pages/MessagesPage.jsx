import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

function Avatar({ user, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm' }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-100 flex items-center justify-center overflow-hidden shrink-0`}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-brand-500">
          {user?.username?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  )
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ieri'
  if (diffDays < 7) return d.toLocaleDateString('ro-RO', { weekday: 'short' })
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const bottomRef = useRef()
  const inputRef = useRef()

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [convLoading, setConvLoading] = useState(false)
  const [mobileView, setMobileView] = useState('list')

  const activeId = searchParams.get('conversation')

  useEffect(() => {
    setListLoading(true)
    api.get('/conversations/')
      .then(({ data }) => setConversations(data.results || data))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => {
    if (!activeId) return
    setConvLoading(true)
    setMobileView('chat')
    api.get(`/conversations/${activeId}/`)
      .then(({ data }) => {
        setActiveConv(data)
        setMessages(data.messages || [])
        setConversations((prev) =>
          prev.map((c) => c.id === parseInt(activeId) ? { ...c, unread_count: 0 } : c)
        )
      })
      .finally(() => setConvLoading(false))
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConversation = (id) => {
    setSearchParams({ conversation: id })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !activeId) return
    setSending(true)
    try {
      const { data } = await api.post(`/conversations/${activeId}/messages/`, { content: input.trim() })
      setMessages((prev) => [...prev, { ...data, sender_username: user.username, created_at: data.created_at || new Date().toISOString() }])
      setInput('')
      setConversations((prev) =>
        prev.map((c) =>
          c.id === parseInt(activeId)
            ? { ...c, last_message: { content: data.content, created_at: data.created_at, sender_username: user.username } }
            : c
        )
      )
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 sm:-mx-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">

      {/* ── Left panel: conversation list ── */}
      <div className={`w-full sm:w-80 shrink-0 border-r border-gray-200 flex flex-col ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">
            Mesaje
            {totalUnread > 0 && (
              <span className="ml-2 bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalUnread}
              </span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 text-gray-400 px-4">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-medium text-sm">Nicio conversație</p>
              <p className="text-xs mt-1">Contactează un vânzător de pe pagina unui produs</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = parseInt(activeId) === conv.id
              const other = conv.other_participant
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isActive ? 'bg-brand-50' : ''}`}
                >
                  <Avatar user={other} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-sm text-gray-800 truncate">
                        @{other?.username}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatTime(conv.last_message?.created_at)}
                      </span>
                    </div>
                    {conv.product_title && (
                      <p className="text-xs text-brand-500 truncate">{conv.product_title}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                      {conv.last_message
                        ? `${conv.last_message.sender_username === user?.username ? 'Tu: ' : ''}${conv.last_message.content}`
                        : 'Niciun mesaj încă'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center mt-1">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right panel: chat ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
        {!activeConv && !convLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-medium">Selectează o conversație</p>
            </div>
          </div>
        ) : convLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                onClick={() => setMobileView('list')}
                className="sm:hidden text-gray-400 hover:text-gray-600 transition mr-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Avatar user={activeConv.other_participant} />
              <div className="flex-1 min-w-0">
                <Link
                  to={`/users/${activeConv.other_participant?.id}`}
                  className="font-semibold text-gray-800 hover:text-brand-600 transition"
                >
                  @{activeConv.other_participant?.username}
                </Link>
                {activeConv.product_title && (
                  <Link
                    to={`/products/${activeConv.product}`}
                    className="flex items-center gap-2 mt-0.5 group w-fit"
                  >
                    {activeConv.product_image && (
                      <img
                        src={activeConv.product_image}
                        alt=""
                        className="w-5 h-5 rounded object-cover"
                      />
                    )}
                    <span className="text-xs text-brand-500 group-hover:underline truncate">
                      {activeConv.product_title}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Niciun mesaj. Fii primul care scrie!</p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_username === user?.username
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-brand-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
