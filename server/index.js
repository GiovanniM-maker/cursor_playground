import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { VertexAI } from '@google-cloud/vertexai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const projectId = process.env.GOOGLE_PROJECT_ID
const location = process.env.GOOGLE_LOCATION || 'us-central1'
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Google Cloud credentials. Please set GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY.')
  process.exit(1)
}

const vertex = new VertexAI({
  project: projectId,
  location,
  googleAuthOptions: {
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  },
})

const MODEL_MAP = {
  NANOBANANA: 'gemini-2.5-flash-image',
  GEMINI_25_FLASH_PREVIEW: 'gemini-2.5-flash-preview',
  IMAGEN: 'imagegeneration@005',
}

function buildSafetySettings(safetyOff) {
  if (safetyOff) {
    return [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    ]
  }
  return undefined
}

app.post('/api/generate', async (req, res) => {
  const { model, prompt, settings = {}, attachments = [] } = req.body

  try {
    const mappedModel = MODEL_MAP[model]
    if (!mappedModel) {
      res.status(400).json({ error: 'Unknown model' })
      return
    }

    if (model === 'IMAGEN') {
      const generativeModel = vertex.getGenerativeModel({
        model: mappedModel,
      })

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'image/png',
        },
      }

      const result = await generativeModel.generateContent(request)
      const images =
        result.response?.candidates?.flatMap(candidate =>
          candidate.content?.parts
            ?.filter(part => part.inlineData)
            .map(part => ({
              mimeType: part.inlineData?.mimeType,
              data: part.inlineData?.data,
            })) ?? []
        ) ?? []

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      if (images.length === 0) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'No image generated' })}\n\n`)
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        res.end()
        return
      }

      for (const image of images) {
        res.write(
          `data: ${JSON.stringify({
            type: 'image',
            mimeType: image.mimeType,
            data: image.data,
          })}\n\n`
        )
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()
      return
    }

    const generativeModel = vertex.getGenerativeModel({
      model: mappedModel,
      safetySettings: buildSafetySettings(settings.safetyOff),
    })

    const parts = [{ text: prompt }]

    for (const att of attachments) {
      if (att.type?.startsWith('image/') && att.base64) {
        parts.push({
          inlineData: {
            data: att.base64,
            mimeType: att.type,
          },
        })
      }
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const generationConfig = {
      temperature: Number(settings.temperature) || 1,
      topP: Number(settings.topP) || 0.95,
      maxOutputTokens: Number(settings.maxTokens) || 32768,
    }

    const request = {
      contents: [{ role: 'user', parts }],
      generationConfig,
    }

    const streamResult = await generativeModel.generateContentStream(request)

    for await (const chunk of streamResult.stream) {
      const candidates = chunk.candidates ?? []
      for (const candidate of candidates) {
        const candidateParts = candidate.content?.parts ?? []
        for (const part of candidateParts) {
          if (part.text) {
            res.write(`data: ${JSON.stringify({ type: 'text', content: part.text })}\n\n`)
          }
          if (part.inlineData) {
            res.write(
              `data: ${JSON.stringify({
                type: 'image',
                mimeType: part.inlineData.mimeType,
                data: part.inlineData.data,
              })}\n\n`
            )
          }
        }
      }
    }

    const finalResponse = await streamResult.response
    for (const candidate of finalResponse.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData) {
          res.write(
            `data: ${JSON.stringify({
              type: 'image',
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data,
            })}\n\n`
          )
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

