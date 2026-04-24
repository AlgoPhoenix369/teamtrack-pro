import { useState, useRef, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { useAuth } from '../../context/AuthContext'
import {
  Bot, X, Send, KeyRound, Eye, EyeOff, Trash2, Minimize2, Maximize2,
  RefreshCw, LogOut,
} from 'lucide-react'

const STORAGE_KEY = 'claude_api_key'
const HISTORY_KEY = 'claude_chat_history'
const MAX_HISTORY  = 40

const buildSystem = user =>
  `You are an AI assistant embedded in TeamTrack Pro — a job-application and team task-tracking system.
The user is ${user?.name || 'a team member'} (role: ${user?.role?.replace('_', ' ') || 'unknown'}).
Help them with job applications, interview preparation, resume tips, productivity, and general questions.
Be concise and practical. Use plain text, not markdown headers.`

export default function ClaudeChat() {
  const { user }       = useAuth()
  const [open, setOpen]       = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [apiKey, setApiKey]   = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey]  = useState(false)
  const [signedIn, setSignedIn] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
  })
  const [input, setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const [keyError, setKeyError] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const abortRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const persistMessages = msgs => {
    const trimmed = msgs.slice(-MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    setMessages(trimmed)
  }

  const handleSignIn = () => {
    const key = keyInput.trim()
    if (!key.startsWith('sk-ant-')) {
      setKeyError('Key must start with sk-ant-')
      return
    }
    localStorage.setItem(STORAGE_KEY, key)
    setApiKey(key)
    setSignedIn(true)
    setKeyInput('')
    setKeyError('')
  }

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setSignedIn(false)
    setKeyInput('')
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY)
    setMessages([])
  }

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg = { role: 'user', content: text }
    const newMsgs = [...messages, userMsg]
    persistMessages(newMsgs)
    setInput('')
    setStreaming(true)

    // Placeholder assistant message for streaming
    const placeholder = { role: 'assistant', content: '' }
    setMessages([...newMsgs, placeholder])

    try {
      const client  = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
      const history = newMsgs.slice(-20).map(m => ({ role: m.role, content: m.content }))

      let accumulated = ''
      const stream = client.messages.stream({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     buildSystem(user),
        messages:   history,
      })

      abortRef.current = stream

      stream.on('text', chunk => {
        accumulated += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      })

      await stream.finalMessage()
      const finalMsgs = [...newMsgs, { role: 'assistant', content: accumulated }]
      persistMessages(finalMsgs)
    } catch (err) {
      const errMsg = err?.status === 401
        ? '⚠ Invalid API key. Please sign out and re-enter your key.'
        : err?.status === 429
        ? '⚠ Rate limit reached. Please wait a moment.'
        : `⚠ Error: ${err?.message || 'Unknown error'}`
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: errMsg }
        return updated
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Panel size
  const panelH = expanded ? 'h-[80vh]' : 'h-[520px]'
  const panelW = expanded ? 'w-[480px]' : 'w-[360px]'

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700
            shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          title="Chat with Claude"
        >
          <Bot size={24} className="text-white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className={`fixed bottom-6 right-6 z-50 ${panelW} ${panelH} flex flex-col rounded-2xl shadow-2xl
          bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-200`}>

          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 flex-shrink-0">
            <Bot size={18} className="text-white" />
            <span className="text-white font-semibold text-sm flex-1">Claude Assistant</span>
            {signedIn && (
              <>
                <button onClick={() => setExpanded(v => !v)} className="text-blue-200 hover:text-white p-1 rounded transition-colors" title={expanded ? 'Shrink' : 'Expand'}>
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button onClick={clearHistory} className="text-blue-200 hover:text-white p-1 rounded transition-colors" title="Clear history">
                  <Trash2 size={14} />
                </button>
                <button onClick={handleSignOut} className="text-blue-200 hover:text-white p-1 rounded transition-colors" title="Sign out">
                  <LogOut size={14} />
                </button>
              </>
            )}
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white p-1 rounded transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Sign-in screen */}
          {!signedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <Bot size={28} className="text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Connect Claude</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Enter your Anthropic API key to enable the AI assistant.
                  Your key is stored locally and never sent to our servers.
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={e => { setKeyInput(e.target.value); setKeyError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                    placeholder="sk-ant-..."
                    className="w-full pl-8 pr-9 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl
                      bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {keyError && <p className="text-xs text-red-500">{keyError}</p>}
                <button
                  onClick={handleSignIn}
                  disabled={!keyInput.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-sm font-semibold
                    disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Connect
                </button>
              </div>

              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                className="text-xs text-blue-500 hover:underline">
                Get an API key →
              </a>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot size={32} className="mx-auto text-gray-200 dark:text-slate-700 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                      Hi {user?.name?.split(' ')[0]}! Ask me anything — interview prep, application tips, productivity, or anything else.
                    </p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Bot size={12} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${m.role === 'user'
                        ? 'bg-blue-700 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-sm'
                      }`}>
                      {m.content}
                      {m.role === 'assistant' && streaming && i === messages.length - 1 && m.content === '' && (
                        <span className="inline-flex gap-1 mt-1">
                          {[0,1,2].map(d => (
                            <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${d * 150}ms` }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-slate-800 flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Ask Claude…"
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800
                    text-gray-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:opacity-50 max-h-28 overflow-y-auto"
                  style={{ lineHeight: '1.5' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center
                    disabled:opacity-40 transition-colors"
                >
                  {streaming
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Send size={14} />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
