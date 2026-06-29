import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api'
import { motion } from 'framer-motion'
import { Send, Search, MessageSquare, UserCheck, Clock } from 'lucide-react'

export default function Chat() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  const loadContacts = useCallback(async () => {
    try {
      if (user.role === 'parent') {
        const children = await api.request('/parent/children', {})
        const teachers = [...new Set((Array.isArray(children) ? children : []).map(c => c.teacherName).filter(Boolean))]
        const users = await api.getUsers('teacher')
        setContacts(Array.isArray(users) ? users : [])
      } else {
        const users = await api.getUsers()
        setContacts((Array.isArray(users) ? users : []).filter(u => u.role === 'parent'))
      }
    } catch {} finally { setLoading(false) }
  }, [user.role])

  useEffect(() => { loadContacts() }, [loadContacts])

  const loadMessages = useCallback(async () => {
    if (!selected) return
    try {
      const msgs = await api.request(`/messages?senderId=${user.id}&receiverId=${selected.id}`, {})
      setMessages(Array.isArray(msgs) ? msgs : [])
    } catch {}
  }, [selected, user.id])

  useEffect(() => { loadMessages() }, [loadMessages])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!selected) return
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [selected, loadMessages])

  const sendMessage = async () => {
    if (!text.trim() || !selected) return
    try {
      await api.request('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: selected.id, text: text.trim(), content: text.trim() }),
      })
      setText('')
      loadMessages()
    } catch {}
  }

  const filtered = contacts.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Xabarlar</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">Xabarlar mavjud emas</p>
            </div>
          ) : (
            filtered.map(contact => (
              <button
                key={contact.id}
                onClick={() => setSelected(contact)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selected?.id === contact.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(contact.name || '?')[0].toUpperCase()}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name || 'Noma\'lum'}</p>
                  <p className="text-xs text-gray-400 truncate">{contact.role === 'teacher' ? 'O\'qituvchi' : 'Ota-ona'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-800/50">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Suhbatni boshlash uchun kontakt tanlang</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                {(selected.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.role === 'teacher' ? 'O\'qituvchi' : 'Ota-ona'}</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Xabar yuboring</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === user.id
                  return (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMe
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.text || msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                  placeholder="Xabar yozish..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500/50 outline-none text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="btn_primary !p-2.5 !rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
