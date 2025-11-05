import React from 'react'
import { useChatStore, flattenChats } from './store'
import { Message, Attachment } from './types'

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
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const { tree, currentFolderId, search, setSearch, enterFolder, addChat, addFolder, renameChat, renameFolder, deleteChat, deleteFolder, moveChatUp, moveChatDown, moveChatToFolder, moveChatBefore } = useChatStore()

  // Chat state (per demo - later bind to selected chat from store)
  const [messages, setMessages] = React.useState<Message[]>([
    { id: 'm1', role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }
  ])
  const [input, setInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
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
        `fixed inset-y-0 left-0 z-30 w-[280px] transform bg-white border-r border-border shadow-soft transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`
      }>
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-sm font-medium">Chat</span>
          <button className="btn px-2 py-1" aria-label="Chiudi sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex gap-2">
            <button className="btn w-full" onClick={() => addChat()}>Nuova chat</button>
            <button className="btn" onClick={() => addFolder()} aria-label="Nuova cartella">📁+</button>
          </div>
          <div className="mt-2">
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca chat e contenuti..." />
          </div>
        </div>
        <div className="overflow-auto px-3 pb-3 divide-y divide-border">
          {currentFolderId && (
            <div className="text-xs text-dim px-1 py-2">
              <button className="btn" onClick={() => enterFolder(null)}>← Indietro</button>
            </div>
          )}
          {(currentList as any[]).map((n: any, index: number) => (
            n.type === 'chat' ? (
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
                    <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-white shadow-soft p-1 text-sm">
                      <button className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); promptRenameChat(n.id, n.title) }}>Rinomina</button>
                      <button className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); moveChatUp(n.id) }}>Sposta su</button>
                      <button className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); moveChatDown(n.id) }}>Sposta giù</button>
                      <div className="px-3 pt-2 pb-1 text-xs text-dim">Muovi in</div>
                      <button className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); moveChatToFolder(n.id, null) }}>Radice</button>
                      {flattenFolders(tree).map(f => (
                        <button key={f.id} className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); moveChatToFolder(n.id, f.id) }}>{f.name}</button>
                      ))}
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 hover:bg-surface text-red-600" onClick={() => { setOpenMenuId(null); deleteChat(n.id) }}>Elimina</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={n.id}
                className="py-2 flex items-center justify-between"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const src = dragChatId || e.dataTransfer.getData('text/plain'); if (src) moveChatToFolder(src, n.id); setDragChatId(null) }}
              >
                <button className="text-sm font-medium text-left truncate flex-1" onClick={() => enterFolder(n.id)}>{n.name}</button>
                <div className="ml-2 relative" ref={openMenuId === n.id ? menuRef : undefined}>
                  <button className="opacity-0 group-hover:opacity-100 transition text-lg px-2" onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)} aria-label="Altro">⋯</button>
                  {openMenuId === n.id && (
                    <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-white shadow-soft p-1 text-sm">
                      <button className="w-full text-left px-3 py-2 hover:bg-surface" onClick={() => { setOpenMenuId(null); promptRenameFolder(n.id, n.name) }}>Rinomina</button>
                      <div className="border-t border-border my-1" />
                      <button className="w-full text-left px-3 py-2 hover:bg-surface text-red-600" onClick={() => { setOpenMenuId(null); deleteFolder(n.id) }}>Elimina</button>
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

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

      {/* Chat area: shifts on desktop when sidebar open */}
      <div className={`h-full grid grid-rows-[auto,1fr,auto] transition-[margin] duration-200 ${sidebarOpen ? 'md:ml-[280px]' : ''}`}>
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
        <main className="relative overflow-auto p-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              <div className="max-w-prose rounded-lg border border-border bg-white p-3 shadow-sm">
                <div>{m.content}</div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.attachments.map(a => (
                      <span key={a.id} className="px-2 py-1 text-xs rounded-full border border-border bg-surface">{a.name}</span>
                    ))}
                  </div>
                )}
                {m.role === 'assistant' && (
                  <div className="mt-2 flex gap-2 text-xs">
                    <button className="btn" title="Copia" onClick={() => navigator.clipboard.writeText(m.content)}>📋</button>
                    <button className="btn" title="Rigenera" onClick={() => setMessages(prev => prev.filter(x => x.id !== m.id))}>🔁</button>
                  </div>
                )}
              </div>
              {m.role === 'assistant' && isGenerating && messages[messages.length-1]?.id === m.id && (
                <span className="text-dim text-xs" aria-hidden>⏳</span>
              )}
            </div>
          ))}

          {/* Floating Model Settings button/panel on top-right */}
          <div className="fixed right-3 top-3 z-20">
            <div className="relative">
              <button
                className="btn bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
                onClick={() => setSettingsOpen(v => !v)}
                aria-expanded={settingsOpen}
              >
                ⚙︎ Modello
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-[320px] rounded-xl border border-border bg-white p-3 shadow-soft">
                  <div className="mb-2">
                    <h2 className="text-sm font-semibold">Impostazioni modello</h2>
                    <p className="text-xs text-dim">Scegli modello e parametri</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-dim mb-1">Modello</label>
                      <select className="input">
                        <option>NANOBANANA</option>
                        <option>GEMINI 2.5 Flash Preview</option>
                        <option>Imagen</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-dim mb-1">Temperatura</label>
                        <input type="number" className="input" defaultValue={1} step="0.1" />
                      </div>
                      <div>
                        <label className="block text-xs text-dim mb-1">Top‑p</label>
                        <input type="number" className="input" defaultValue={0.95} step="0.05" />
                      </div>
                      <div>
                        <label className="block text-xs text-dim mb-1">Max tokens</label>
                        <input type="number" className="input" defaultValue={2048} />
                      </div>
                      <div>
                        <label className="block text-xs text-dim mb-1">Custom instructions</label>
                        <input type="text" className="input" placeholder="Es. rispondi conciso" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="border-t border-border p-3 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-3xl w-full flex flex-col gap-2">
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


