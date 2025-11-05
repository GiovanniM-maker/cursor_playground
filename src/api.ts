import { Message, Attachment } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function* generateStream(
  model: string,
  prompt: string,
  settings: {
    temperature: number
    topP: number
    maxTokens: number
    safetyOff?: boolean
    customInstructions?: string
  },
  attachments?: Attachment[]
): AsyncGenerator<{ type: 'text' | 'image' | 'done', content?: string, mimeType?: string, data?: string }> {
  const response = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      settings,
      attachments: attachments?.map(a => ({ 
        type: a.type, 
        base64: a.url || '',
        name: a.name 
      }))
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Generation failed')
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) throw new Error('No response body')

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          yield data
          if (data.type === 'done') return
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

