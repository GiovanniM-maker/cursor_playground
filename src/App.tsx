import React from 'react'
import { useChatStore, flattenChats } from './store'
import { Message, Attachment } from './types'
import Loader from './Loader'

function flattenFolders(tree: any[]): { id: string, name: string }[] {
  const out: { id: string, name: string }[] = []
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === 'folder') {
        out.push({ id: n.id, name: n.name })
        walk(n.children)
      }
    }
  }
  walk(tree)
  return out
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [foldersSidebarOpen, setFoldersSidebarOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [settingsSections, setSettingsSections] = React.useState({
    model: false,
    system: true,
    minimap: true
  })

  const { tree, currentFolderId, search, setSearch, enterFolder, addChat, addFolder, renameChat, renameFolder, deleteChat, deleteFolder, moveChatUp, moveChatDown, moveChatToFolder, moveChatBefore } = useChatStore()

  // Separate chats from folders
  const chatsOnly = React.useMemo(() => tree.filter(n => n.type === 'chat'), [tree])
  const foldersOnly = React.useMemo(() => flattenFolders(tree), [tree])

  // Chat state (per demo - later bind to selected chat from store)
  const [messages, setMessages] = React.useState<Message[]>([
    { id: 'm1', role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }
  ])
  const [input, setInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
  const generationAbortRef = React.useRef<AbortController | null>(null)

  function onAttachFiles(files: FileList | null) {
    if (!files) return
    const next: Attachment[] = []
    for (const f of Array.from(files)) {
      next.push({ id: `${f.name}-${f.size}-${crypto.randomUUID?.() ?? Math.random()}`, name: f.name, type: f.type || 'application/octet-stream', size: f.size })
    }
    setAttachments(prev => [...prev, ...next])
  }

  function removeAttachment(id: string) {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text && attachments.length === 0) return
    const userMsg: Message = { id: `u_${Date.now()}`,'role':'user','content': text,'attachments': attachments }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setAttachments([])

    // Start generation
    setIsGenerating(true)
    generationAbortRef.current = new AbortController()
    const controller = generationAbortRef.current

    // Simulated AI response streaming
    const chunks = ['Sto elaborando la tua richiesta', ' e preparo un design', ' in stile Apple minimal.', ' Fatto!']
    let acc = ''
    const assistantId = `a_${Date.now()}`
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '…' }])

    for (const piece of chunks) {
      if (controller.signal.aborted) break
      await new Promise(r => setTimeout(r, 600))
      acc += piece
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: acc } : m))
    }
    setIsGenerating(false)
    generationAbortRef.current = null
  }

  function stopGeneration() {
    generationAbortRef.current?.abort()
    setIsGenerating(false)
  }

  const currentList = React.useMemo(() => {
    // compute the list to render for current folder
    const getListByFolder = (folderId: string | null) => {
      if (!folderId) return tree
      const stack: any[] = []
      const dfs = (nodes: any[]) => {
        for (const n of nodes) {
          if (n.type === 'folder') {
            if (n.id === folderId) { stack.push(n); return }
            dfs(n.children)
          }
        }
      }
      dfs(tree as any)
      return stack.length ? stack[0].children : tree
    }
    let list = getListByFolder(currentFolderId)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    const all = flattenChats(tree)
    const filteredIds = new Set(
      all.filter(c => c.title.toLowerCase().includes(q) || c.messages.some(m => m.content.toLowerCase().includes(q))).map(c => c.id)
    )
    // Show only chats matching (folders are shown if they contain matching chats)
    const filterTree = (nodes: any[]): any[] => nodes.map(n => {
      if (n.type === 'chat') return filteredIds.has(n.id) ? n : null
      const kids = filterTree(n.children).filter(Boolean)
      if (kids.length) return { ...n, children: kids }
      return null
    }).filter(Boolean)
    list = filterTree(getListByFolder(currentFolderId))
    return list as any
  }, [tree, currentFolderId, search])

  function promptRenameChat(id: string, current: string) {
    const name = window.prompt('Nuovo nome chat:', current)
    if (name && name.trim()) renameChat(id, name.trim())
  }
  function promptRenameFolder(id: string, current: string) {
    const name = window.prompt('Nuovo nome cartella:', current)
    if (name && name.trim()) renameFolder(id, name.trim())
  }

  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!(e.target instanceof Node)) return
      if (!menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // drag and drop
  const [dragChatId, setDragChatId] = React.useState<string | null>(null)

  return (
    <div className="h-full relative bg-surface">
      {/* Sidebar overlay, non-card */}
      <div className={
        `fixed inset-y-0 left-0 z-30 w-[280px] transform bg-panel border-r border-border shadow-soft transition-transform duration-200 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`
      }>
        <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
          <span className="text-sm font-medium">Chat</span>
          <button className="btn px-2 py-1" aria-label="Chiudi sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="p-3 space-y-2 border-b border-border flex-shrink-0">
          <div className="flex gap-2">
            <button className="btn w-full flex items-center justify-center gap-2" onClick={() => addChat()}>
              <span>➕</span>
              <span>Nuova chat</span>
            </button>
            <button className="action-btn-minimal" onClick={() => addFolder()} aria-label="Nuova cartella" title="Nuova cartella">
              📁
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim">🔍</span>
            <input className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca chat e contenuti..." />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3 min-h-0">
          {/* Chat section */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-dim uppercase tracking-wide mb-2 px-1">Chat</div>
            <div className="divide-y divide-border">
              {chatsOnly.map((n: any) => (
                <div
                  key={n.id}
                  className="py-2 flex items-center justify-between group"
                  draggable
                  onDragStart={(e) => { setDragChatId(n.id); e.dataTransfer.setData('text/plain', n.id) }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const src = dragChatId || e.dataTransfer.getData('text/plain'); if (src && src !== n.id) moveChatBefore(src, n.id); setDragChatId(null) }}
                >
                  <button className="text-sm text-left truncate flex-1" onClick={() => {/* future: open chat */}}>{n.title}</button>
                  <div className="ml-2 relative" ref={openMenuId === n.id ? menuRef : undefined}>
                    <button className="opacity-0 group-hover:opacity-100 transition text-lg px-2" onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)} aria-label="Altro">⋯</button>
                    {openMenuId === n.id && (
                      <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-border bg-panel shadow-soft p-1 text-sm">
                        <button className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); promptRenameChat(n.id, n.title) }}>Rinomina</button>
                        <button className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); moveChatUp(n.id) }}>Sposta su</button>
                        <button className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); moveChatDown(n.id) }}>Sposta giù</button>
                        <div className="px-3 pt-2 pb-1 text-xs text-dim">Muovi in</div>
                        <button className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); moveChatToFolder(n.id, null) }}>Radice</button>
                        {flattenFolders(tree).map(f => (
                          <button key={f.id} className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); moveChatToFolder(n.id, f.id) }}>{f.name}</button>
                        ))}
                        <div className="border-t border-border my-1" />
                        <button className="w-full text-left px-3 py-2 hover:bg-panel-2 text-red-400" onClick={() => { setOpenMenuId(null); deleteChat(n.id) }}>Elimina</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Folders section */}
          <div>
            <button className="w-full flex items-center justify-between px-1 py-2 mb-2 hover:bg-panel-2 rounded" onClick={() => setFoldersSidebarOpen(true)}>
              <div className="text-xs font-semibold text-dim uppercase tracking-wide">Cartelle</div>
              <span className="text-dim">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Folders sidebar (secondary) */}
      {foldersSidebarOpen && (
        <div className="fixed inset-y-0 left-[280px] z-30 w-[280px] transform bg-panel border-r border-border shadow-soft transition-transform duration-200 flex flex-col">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
            <span className="text-sm font-medium">Cartelle</span>
            <button className="btn px-2 py-1" aria-label="Chiudi" onClick={() => setFoldersSidebarOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-auto px-3 pb-3 divide-y divide-border min-h-0">
            {tree.filter((n: any) => n.type === 'folder').map((f: any) => (
              <div
                key={f.id}
                className="py-2 flex items-center justify-between group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const src = dragChatId || e.dataTransfer.getData('text/plain'); if (src) moveChatToFolder(src, f.id); setDragChatId(null) }}
              >
                <button className="text-sm font-medium text-left truncate flex-1" onClick={() => enterFolder(f.id)}>{f.name}</button>
                <div className="ml-2 relative" ref={openMenuId === f.id ? menuRef : undefined}>
                  <button className="opacity-0 group-hover:opacity-100 transition text-lg px-2" onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)} aria-label="Altro">⋯</button>
                  {openMenuId === f.id && (
                    <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-border bg-panel shadow-soft p-1 text-sm">
                      <button className="w-full text-left px-3 py-2 hover:bg-panel-2" onClick={() => { setOpenMenuId(null); promptRenameFolder(f.id, f.name) }}>Rinomina</button>
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 hover:bg-panel-2 text-red-400" onClick={() => { setOpenMenuId(null); deleteFolder(f.id) }}>Elimina</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reopen sidebar button when closed */}
      {!sidebarOpen && (
        <button
          className="fixed left-3 top-3 z-20 btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Apri sidebar"
        >
          ☰ Chat
        </button>
      )}

      {/* Dim backdrop on mobile when sidebar is open (not affecting the sidebar) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Chat area: shifts on desktop when sidebar(s) open */}
      <div className={`h-full grid grid-rows-[auto,1fr,auto] transition-[margin] duration-200 ${sidebarOpen && foldersSidebarOpen ? 'md:ml-[560px]' : sidebarOpen ? 'md:ml-[280px]' : ''}`}>
        <header className="px-4 py-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            {sidebarOpen ? (
              <button className="btn" onClick={() => setSidebarOpen(false)} aria-label="Chiudi sidebar">✕</button>
            ) : (
              <button className="btn" onClick={() => setSidebarOpen(true)} aria-label="Apri sidebar">☰</button>
            )}
            <h1 className="text-base font-medium">Chat</h1>
          </div>
          <div className="text-dim text-sm">Pronta</div>
        </header>
        <main className="relative overflow-auto p-4">
          <div className="mx-auto max-w-[70%] space-y-3">
            {messages.map(m => {
              const isLastGenerating = m.role === 'assistant' && isGenerating && messages[messages.length-1]?.id === m.id
              return (
                <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && isLastGenerating ? (
                    <Loader />
                  ) : (
                    <>
                      {m.role === 'user' ? (
                        <>
                          <div className="max-w-prose rounded-lg bg-accent text-white p-3 shadow-sm">
                            {editingMessageId === m.id ? (
                              <div className="space-y-2">
                                <textarea
                                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white placeholder-white/60 resize-none"
                                  value={input}
                                  onChange={e => setInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, content: input } : msg))
                                      setEditingMessageId(null)
                                      setInput('')
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingMessageId(null)
                                      setInput('')
                                    }
                                  }}
                                  autoFocus
                                />
                                <div className="flex gap-2 text-xs">
                                  <button className="px-2 py-1 bg-white/20 rounded hover:bg-white/30" onClick={() => {
                                    setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, content: input } : msg))
                                    setEditingMessageId(null)
                                    setInput('')
                                  }}>Salva</button>
                                  <button className="px-2 py-1 bg-white/20 rounded hover:bg-white/30" onClick={() => {
                                    setEditingMessageId(null)
                                    setInput('')
                                  }}>Annulla</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>{m.content}</div>
                                {m.attachments && m.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {m.attachments.map(a => (
                                      <span key={a.id} className="px-2 py-1 text-xs rounded-full bg-white/20 text-white">{a.name}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-2 flex gap-2">
                                  <button className="copy" onClick={() => navigator.clipboard.writeText(m.content)} title="Copia">
                                    <svg className="clipboard" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6.35 6.35" aria-hidden>
                                      <path d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z" fill="currentColor"/>
                                    </svg>
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
                                      <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" fill="currentColor"/>
                                    </svg>
                                  </button>
                                  <button className="action-btn-minimal" onClick={() => { setEditingMessageId(m.id); setInput(m.content) }} title="Modifica">
                                    ✏️
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="max-w-prose text-text">
                            <div>{m.content}</div>
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {m.attachments.map(a => (
                                  <span key={a.id} className="px-2 py-1 text-xs rounded-full border border-border bg-surface">{a.name}</span>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 flex gap-2">
                              <button className="copy" onClick={() => navigator.clipboard.writeText(m.content)} title="Copia">
                                <svg className="clipboard" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6.35 6.35" aria-hidden>
                                  <path d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.735h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z" fill="currentColor"/>
                                </svg>
                                <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
                                  <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121z" fill="currentColor"/>
                                </svg>
                              </button>
                              <button className="action-btn-minimal" onClick={async () => {
                                const msgIndex = messages.findIndex(msg => msg.id === m.id)
                                const prevMsg = messages[msgIndex - 1]
                                if (prevMsg && prevMsg.role === 'user') {
                                  // Remove current AI response and regenerate
                                  setMessages(prev => prev.filter((msg, idx) => idx < msgIndex))
                                  setIsGenerating(true)
                                  generationAbortRef.current = new AbortController()
                                  const controller = generationAbortRef.current
                                  const chunks = ['Rigenerazione in corso', ' e preparo una nuova risposta', ' basata sulla tua richiesta.', ' Fatto!']
                                  let acc = ''
                                  const assistantId = `a_${Date.now()}`
                                  setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '…' }])
                                  for (const piece of chunks) {
                                    if (controller.signal.aborted) break
                                    await new Promise(r => setTimeout(r, 600))
                                    acc += piece
                                    setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: acc } : msg))
                                  }
                                  setIsGenerating(false)
                                  generationAbortRef.current = null
                                }
                              }} title="Rigenera">
                                🔄
                              </button>
                              <button className="delete-btn" onClick={() => setMessages(prev => prev.filter(x => x.id !== m.id))} title="Elimina">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 14" className="svgIcon bin-top">
                                  <g clipPath="url(#clip0_35_24)">
                                    <path fill="currentColor" d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"/>
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_35_24">
                                      <rect fill="white" height="14" width="69"></rect>
                                    </clipPath>
                                  </defs>
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 57" className="svgIcon bin-bottom">
                                  <g clipPath="url(#clip0_35_22)">
                                    <path fill="currentColor" d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"/>
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_35_22">
                                      <rect fill="white" height="57" width="69"></rect>
                                    </clipPath>
                                  </defs>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Floating Model Settings button/panel on top-right */}
          <div className="fixed right-3 top-3 z-20">
            <div className="relative">
              <button
                className="btn bg-panel/80 backdrop-blur supports-[backdrop-filter]:bg-panel/60"
                onClick={() => setSettingsOpen(v => !v)}
                aria-expanded={settingsOpen}
              >
                ⚙︎ Modello
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-[400px] rounded-xl border border-border bg-panel shadow-soft overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Impostazioni</h2>
                    <button className="text-dim hover:text-text" onClick={() => setSettingsOpen(false)}>✕</button>
                  </div>
                  
                  {/* Model settings section */}
                  <div className="border-b border-border">
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-panel-2 transition"
                      onClick={() => setSettingsSections({ ...settingsSections, model: !settingsSections.model })}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">Impostazioni del modello</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-panel-2 text-dim">gemini-2.5-flash-preview</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-dim">⋯</span>
                        <span className="text-dim">{settingsSections.model ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {settingsSections.model && (
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <label className="block text-xs text-dim mb-1">Modello</label>
                          <select className="input w-full">
                            <option>NANOBANANA</option>
                            <option>gemini-2.5-flash-preview</option>
                            <option>Imagen</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-dim mb-1">Temperatura</label>
                            <input type="number" className="input w-full" defaultValue={1} step="0.1" />
                          </div>
                          <div>
                            <label className="block text-xs text-dim mb-1">Top‑p</label>
                            <input type="number" className="input w-full" defaultValue={0.95} step="0.05" />
                          </div>
                          <div>
                            <label className="block text-xs text-dim mb-1">Max tokens</label>
                            <input type="number" className="input w-full" defaultValue={2048} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* System instructions section */}
                  <div className="border-b border-border">
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-panel-2 transition"
                      onClick={() => setSettingsSections({ ...settingsSections, system: !settingsSections.system })}
                    >
                      <span className="text-sm font-semibold">Istruzioni di sistema</span>
                      <div className="flex items-center gap-2">
                        <span className="text-dim">⋯</span>
                        <span className="text-dim">{settingsSections.system ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {settingsSections.system && (
                      <div className="px-4 pb-4">
                        <textarea
                          className="input w-full min-h-[100px] resize-none"
                          placeholder="Fornisci al modello un contesto per comprendere l'attività e fornire risposte su misura"
                          defaultValue="Fornisci al modello un contesto per comprendere l'attività e fornire risposte su misura"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mini map section */}
                  <div>
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-panel-2 transition"
                      onClick={() => setSettingsSections({ ...settingsSections, minimap: !settingsSections.minimap })}
                    >
                      <span className="text-sm font-semibold">Mini mappa</span>
                      <span className="text-dim">{settingsSections.minimap ? '▲' : '▼'}</span>
                    </button>
                    {settingsSections.minimap && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-dim">Utilizza l'input del prompt per avviare una conversazione.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="p-3">
          <div className="mx-auto max-w-[70%] w-full flex flex-col gap-2">
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Scrivi un messaggio..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); isGenerating ? stopGeneration() : sendMessage() } }} />
              <label className="btn cursor-pointer">
                📎
                <input type="file" multiple className="hidden" onChange={e => onAttachFiles(e.target.files)} />
              </label>
              {isGenerating ? (
                <button className="btn" title="Ferma" onClick={stopGeneration}>■</button>
              ) : (
                <button className="btn" title="Invia" onClick={sendMessage}>Invia</button>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="attachments flex flex-wrap gap-2">
                {attachments.map(a => (
                  <span key={a.id} className="px-2 py-1 text-xs rounded-full border border-border bg-surface inline-flex items-center gap-2">
                    {a.name}
                    <button className="btn" onClick={() => removeAttachment(a.id)} aria-label="Rimuovi">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}


