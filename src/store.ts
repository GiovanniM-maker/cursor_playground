import { create } from 'zustand'
import { Chat, Folder, Message, RootTree } from './types'

function uid(prefix = 'id'): string { return `${prefix}_${Math.random().toString(36).slice(2, 9)}` }

type State = {
  tree: RootTree
  currentFolderId: string | null
  search: string
}

type Actions = {
  setSearch: (q: string) => void
  enterFolder: (folderId: string | null) => void
  addChat: () => void
  addFolder: () => void
  renameChat: (chatId: string, title: string) => void
  renameFolder: (folderId: string, name: string) => void
  deleteChat: (chatId: string) => void
  deleteFolder: (folderId: string) => void
  moveChatUp: (chatId: string) => void
  moveChatDown: (chatId: string) => void
  moveChatToFolder: (chatId: string, targetFolderId: string | null) => void
  moveChatBefore: (chatId: string, beforeChatId: string) => void
}

function now() { return Date.now() }

function createInitialData(): RootTree {
  const now1 = now()
  const c1: Chat = { type: 'chat', id: uid('chat'), title: 'Chat 1', updatedAt: now1, createdAt: now1, messages: [
    { id: uid('m'), role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' },
    { id: uid('m'), role: 'user', content: 'Vorrei uno stile Apple per una chat.' },
  ] }
  const now2 = now()
  const c2: Chat = { type: 'chat', id: uid('chat'), title: 'Chat 2', updatedAt: now2, createdAt: now2, messages: [] }
  const f1: Folder = { type: 'folder', id: uid('folder'), name: 'Lavoro', children: [c2] }
  return [c1, f1]
}

function findParentAndIndex(tree: RootTree, id: string, parent: Folder | null = null): { parent: Folder | null, index: number } | null {
  const list = parent ? parent.children : tree
  const idx = list.findIndex(n => n.id === id)
  if (idx !== -1) return { parent, index: idx }
  for (const node of list) {
    if (node.type === 'folder') {
      const found = findParentAndIndex(tree, id, node)
      if (found) return found
    }
  }
  return null
}

function getListByFolder(tree: RootTree, folderId: string | null): Array<Chat | Folder> {
  if (!folderId) return tree
  const stack: Array<Folder> = []
  const dfs = (nodes: RootTree) => {
    for (const n of nodes) {
      if (n.type === 'folder') {
        if (n.id === folderId) { stack.push(n); return }
        dfs(n.children as RootTree)
      }
    }
  }
  dfs(tree)
  return stack.length ? stack[0].children : tree
}

export const useChatStore = create<State & Actions>((set, get) => ({
  tree: createInitialData(),
  currentFolderId: null,
  search: '',

  setSearch: (q) => set({ search: q }),
  enterFolder: (folderId) => set({ currentFolderId: folderId }),

  addChat: () => set(state => {
    const nowTime = now()
    const chat: Chat = { type: 'chat', id: uid('chat'), title: 'Nuova chat', updatedAt: nowTime, createdAt: nowTime, messages: [] }
    const updated = structuredClone(state.tree) as RootTree
    const list = getListByFolder(updated, state.currentFolderId)
    list.unshift(chat)
    return { tree: updated }
  }),

  addFolder: () => set(state => {
    const folder: Folder = { type: 'folder', id: uid('folder'), name: 'Nuova cartella', children: [] }
    const updated = structuredClone(state.tree) as RootTree
    const list = getListByFolder(updated, state.currentFolderId)
    list.unshift(folder)
    return { tree: updated }
  }),

  renameChat: (chatId, title) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, chatId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    const node = list[loc.index]
    if (node.type === 'chat') node.title = title
    return { tree: updated }
  }),

  renameFolder: (folderId, name) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, folderId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    const node = list[loc.index]
    if (node.type === 'folder') node.name = name
    return { tree: updated }
  }),

  deleteChat: (chatId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, chatId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    list.splice(loc.index, 1)
    return { tree: updated }
  }),

  deleteFolder: (folderId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, folderId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    list.splice(loc.index, 1)
    // If we were inside this folder, go to root
    if (state.currentFolderId === folderId) return { tree: updated, currentFolderId: null }
    return { tree: updated }
  }),

  moveChatUp: (chatId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, chatId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    if (loc.index > 0) {
      const [item] = list.splice(loc.index, 1)
      list.splice(loc.index - 1, 0, item)
    }
    return { tree: updated }
  }),

  moveChatDown: (chatId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, chatId)
    if (!loc) return {}
    const list = loc.parent ? loc.parent.children : updated
    if (loc.index < list.length - 1) {
      const [item] = list.splice(loc.index, 1)
      list.splice(loc.index + 1, 0, item)
    }
    return { tree: updated }
  }),

  moveChatToFolder: (chatId, targetFolderId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const loc = findParentAndIndex(updated, chatId)
    if (!loc) return {}
    const fromList = loc.parent ? loc.parent.children : updated
    const [item] = fromList.splice(loc.index, 1)
    if (item.type !== 'chat') return {}

    if (targetFolderId === null) {
      (updated as RootTree).unshift(item)
    } else {
      const locTarget = findParentAndIndex(updated, targetFolderId)
      if (!locTarget) return {}
      const target = (locTarget.parent ? locTarget.parent.children : updated)[locTarget.index]
      if (target.type === 'folder') target.children.unshift(item)
    }
    return { tree: updated }
  }),

  moveChatBefore: (chatId, beforeChatId) => set(state => {
    const updated = structuredClone(state.tree) as RootTree
    const locFrom = findParentAndIndex(updated, chatId)
    const locTo = findParentAndIndex(updated, beforeChatId)
    if (!locFrom || !locTo) return {}
    const fromList = locFrom.parent ? locFrom.parent.children : updated
    const toList = locTo.parent ? locTo.parent.children : updated
    const [item] = fromList.splice(locFrom.index, 1)
    if (item.type !== 'chat') return {}
    const insertIndex = toList.findIndex(n => n.id === beforeChatId)
    toList.splice(insertIndex, 0, item)
    return { tree: updated }
  }),
}))

// Helpers for searching across tree
export function flattenChats(tree: RootTree): Chat[] {
  const out: Chat[] = []
  const walk = (nodes: RootTree) => {
    for (const n of nodes) {
      if (n.type === 'chat') out.push(n)
      else walk(n.children as RootTree)
    }
  }
  walk(tree)
  return out
}


