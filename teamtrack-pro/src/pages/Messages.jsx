import { useState, useEffect, useRef, useCallback } from 'react'
import { messageService } from '../services/messageService'
import { adminService } from '../services/adminService'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import { useOnlineUsers } from '../hooks/useOnlineUsers'
import { db } from '../services/mockDb'
import toast from 'react-hot-toast'
import { MessageSquare, Send, Search, Lock } from 'lucide-react'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ── helpers ───────────────────────────────────────────────────────────
const fmtTime = iso => {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const ROLE_COLOR = {
  super_admin: 'bg-purple-600',
  view_admin:  'bg-blue-600',
  tasker:      'bg-slate-500',
}

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  view_admin:  'View Admin',
  tasker:      'Tasker',
}

// ── Avatar ────────────────────────────────────────────────────────────
function Avatar({ user, size = 8 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${ROLE_COLOR[user?.role] || 'bg-slate-500'}`}
      style={{ fontSize: size <= 8 ? '12px' : '16px' }}>
      {user?.name?.[0]?.toUpperCase()}
    </div>
  )
}

// ── ContactList ───────────────────────────────────────────────────────
function ContactList({ contacts, threads, selected, onSelect, currentUserId, unreadMap, isOnline }) {
  const [query, setQuery] = useState('')

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <aside className="w-full md:w-72 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <h2 className="font-bold text-gray-900 dark:text-white text-base mb-3">Messages</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search contacts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">No contacts found</p>
        )}
        {filtered.map(contact => {
          const threadMsgs = threads[contact.id] || []
          const last = threadMsgs[threadMsgs.length - 1]
          const unread = unreadMap[contact.id] || 0
          const isActive = selected?.id === contact.id

          return (
            <button key={contact.id} onClick={() => onSelect(contact)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                ${isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
              <div className="relative flex-shrink-0">
                <Avatar user={contact} size={9} />
                {unread > 0
                  ? <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  : <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isOnline(contact.id) ? 'bg-green-400' : 'bg-slate-400'}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-slate-200'}`}>
                    {contact.name}
                  </span>
                  {last && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">{fmtTime(last.created_at)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    contact.role === 'super_admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    contact.role === 'view_admin'  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                  }`}>{ROLE_LABEL[contact.role]}</span>
                  {last && (
                    <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 dark:text-slate-300 font-medium' : 'text-gray-400 dark:text-slate-500'}`}>
                      {last.from_user_id === currentUserId ? 'You: ' : ''}{last.text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

// ── ChatArea ──────────────────────────────────────────────────────────
function ChatArea({ contact, messages, currentUser, onSend }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input and clear text when switching contacts
  useEffect(() => {
    inputRef.current?.focus()
    setText('')
  }, [contact?.id])

  const handleSend = async e => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')           // clear immediately so it feels responsive
    await onSend(trimmed)
    setSending(false)
    inputRef.current?.focus()
  }

  // Group messages by date for date separators
  const grouped = []
  let lastDate = ''
  for (const msg of messages) {
    const d = new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d }
    grouped.push({ type: 'msg', msg })
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <Avatar user={contact} size={9} />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{contact.name}</p>
          <p className={`text-xs font-medium ${
            contact.role === 'super_admin' ? 'text-purple-600 dark:text-purple-400' :
            contact.role === 'view_admin'  ? 'text-blue-600 dark:text-blue-400' :
            'text-gray-400 dark:text-slate-500'
          }`}>{ROLE_LABEL[contact.role]}</p>
        </div>
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${ROLE_COLOR[contact.role]}`}>
              {contact.name[0]}
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Start a conversation with <span className="font-semibold">{contact.name}</span>
            </p>
          </div>
        )}
        {grouped.map((item, i) => {
          if (item.type === 'date') return (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">{item.label}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            </div>
          )

          const { msg } = item
          const isMine = msg.from_user_id === currentUser.id

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
              <div className={`flex items-end gap-2 max-w-[72%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMine && <Avatar user={contact} size={7} />}
                <div>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isMine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 rounded-bl-sm border border-gray-100 dark:border-slate-600'
                    }`}>
                    {msg.text}
                  </div>
                  <p className={`text-xs text-gray-400 dark:text-slate-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                    {fmtTime(msg.created_at)}
                    {isMine && (
                      <span className="ml-1">
                        {msg.read_by_recipient ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <input
          ref={inputRef}
          className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-2xl px-4 py-2.5 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Message ${contact.name}…`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
          <Send size={15} className="text-white" />
        </button>
      </form>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyState({ isRestricted }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-gray-50 dark:bg-slate-900">
      {isRestricted ? (
        <>
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
            <Lock size={28} className="text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-slate-300">Restricted Messaging</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
              You can only message super admins. Messaging between team members is not permitted.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
            <MessageSquare size={28} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-slate-300">Select a conversation</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Choose a contact on the left to start messaging.</p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth()
  const { tick, ping } = useRealtime()
  const { isOnline } = useOnlineUsers()
  const [allMessages, setAllMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [contacts, setContacts] = useState([])

  // Load contacts once (from Supabase in production, mock in dev)
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const allUsers = USE_MOCK ? db.getUsers() : await adminService.getAllUsers()
        setContacts(messageService.getAllowedContacts(user, allUsers))
      } catch {
        setContacts(db.getUsers().filter(u => u.id !== user.id && u.is_active))
      }
    }
    loadContacts()
  }, [user])

  // Load messages on mount and whenever tick fires (after send/receive)
  const load = useCallback(async () => {
    try {
      const msgs = await messageService.getMessages(user.id)
      setAllMessages(msgs)
    } catch {
      // silently fail — optimistic state still shows sent messages
    }
  }, [user.id])

  useEffect(() => { load() }, [load, tick])

  // Build thread map: contactId → sorted messages
  const threads = {}
  for (const msg of allMessages) {
    const otherId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id
    if (!threads[otherId]) threads[otherId] = []
    threads[otherId].push(msg)
  }

  // Unread count per contact
  const unreadMap = {}
  for (const msg of allMessages) {
    if (msg.to_user_id === user.id && !msg.read_by_recipient) {
      unreadMap[msg.from_user_id] = (unreadMap[msg.from_user_id] || 0) + 1
    }
  }

  const threadMessages = selected ? (threads[selected.id] || []) : []

  const handleSelect = async contact => {
    setSelected(contact)
    await messageService.markRead(contact.id, user.id)
    setAllMessages(prev => prev.map(m =>
      m.from_user_id === contact.id && m.to_user_id === user.id
        ? { ...m, read_by_recipient: true } : m
    ))
  }

  const handleSend = async text => {
    if (!selected) return
    // Optimistic: add a temp message immediately so thread feels instant
    const tempMsg = {
      id:               'temp-' + Date.now(),
      from_user_id:     user.id,
      to_user_id:       selected.id,
      text,
      read_by_recipient: false,
      created_at:        new Date().toISOString(),
    }
    setAllMessages(prev => [...prev, tempMsg])
    try {
      const msg = await messageService.sendMessage(user.id, selected.id, text)
      if (msg) {
        // Replace temp with real message from DB (has proper id)
        setAllMessages(prev => prev.map(m => m.id === tempMsg.id ? msg : m))
        ping()
      }
    } catch {
      // Remove the temp message if send failed
      setAllMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      toast.error('Failed to send message')
    }
  }

  const isRestricted = user.role !== 'super_admin'

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mx-6 my-4 bg-white dark:bg-slate-800">
      <ContactList
        contacts={contacts}
        threads={threads}
        selected={selected}
        onSelect={handleSelect}
        currentUserId={user.id}
        unreadMap={unreadMap}
        isOnline={isOnline}
      />

      {selected
        ? <ChatArea
            contact={selected}
            messages={threadMessages}
            currentUser={user}
            onSend={handleSend}
          />
        : <EmptyState isRestricted={isRestricted} />
      }
    </div>
  )
}
