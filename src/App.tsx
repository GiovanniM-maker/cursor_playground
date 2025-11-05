import React from 'react'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [settingsOpen, setSettingsOpen] = React.useState(false)

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
        <div className="p-3">
          <button className="btn w-full">Nuova chat</button>
          <div className="mt-2">
            <input className="input" placeholder="Cerca chat..." />
          </div>
        </div>
        <div className="overflow-auto px-3 pb-3 space-y-2">
          <div className="border border-border rounded-lg p-2">Chat 1</div>
          <div className="border border-border rounded-lg p-2">Chat 2</div>
          <div className="border border-border rounded-lg p-2">Cartella ▸</div>
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

      {/* Chat area fills screen */}
      <div className="h-full grid grid-rows-[auto,1fr,auto]">
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
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-surface border border-border grid place-items-center">🙂</div>
            <div className="max-w-prose rounded-lg border border-border bg-white p-3 shadow-sm">
              Ciao! Come posso aiutarti oggi?
            </div>
          </div>
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-prose rounded-lg border border-border bg-white p-3 shadow-sm">
              Vorrei un’interfaccia in stile Apple per una chat.
            </div>
            <div className="h-8 w-8 rounded-lg bg-surface border border-border grid place-items-center">🧑‍💻</div>
          </div>

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
          <div className="mx-auto max-w-3xl flex gap-2">
            <input className="input" placeholder="Scrivi un messaggio..." />
            <button className="btn">Invia</button>
          </div>
        </footer>
      </div>
    </div>
  )
}


