import React from 'react'

function Sidebar() {
  return (
    <aside className="panel h-full flex flex-col">
      <div className="border-b border-border p-3">
        <div className="flex gap-2">
          <button className="btn w-full">Nuova chat</button>
        </div>
        <div className="mt-2">
          <input className="input" placeholder="Cerca chat..." />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        <div className="border border-border rounded-lg p-2">Chat 1</div>
        <div className="border border-border rounded-lg p-2">Chat 2</div>
        <div className="border border-border rounded-lg p-2">Cartella ▸</div>
      </div>
    </aside>
  )
}

function Chat() {
  return (
    <section className="panel h-full grid grid-rows-[auto,1fr,auto]">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-medium">Chat</h1>
        <div className="text-dim text-sm">Pronta</div>
      </header>
      <div className="overflow-auto p-4 space-y-3">
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
      </div>
      <footer className="border-t border-border p-3">
        <div className="flex gap-2">
          <input className="input" placeholder="Scrivi un messaggio..." />
          <button className="btn">Invia</button>
        </div>
      </footer>
    </section>
  )
}

function ModelSettings() {
  return (
    <aside className="panel h-full p-3">
      <div className="mb-3">
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
    </aside>
  )
}

export default function App() {
  return (
    <div className="h-full p-3">
      <div className="grid h-full grid-cols-[280px,1fr,320px] gap-3">
        <Sidebar />
        <Chat />
        <ModelSettings />
      </div>
    </div>
  )
}


