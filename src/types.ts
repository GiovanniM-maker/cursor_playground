export type Role = 'user' | 'assistant'

export type Attachment = {
  id: string
  name: string
  type: string
  size: number
  url?: string
}

export type Message = {
  id: string
  role: Role
  content: string
  attachments?: Attachment[]
  images?: string[]
}

export type Chat = {
  type: 'chat'
  id: string
  title: string
  messages: Message[]
  updatedAt: number
  createdAt: number
}

export type Folder = {
  type: 'folder'
  id: string
  name: string
  children: Array<Chat | Folder>
}

export type RootTree = Array<Chat | Folder>


