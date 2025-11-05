import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_CLOUD_API_KEY || '')

// Helper per safety settings
function getSafetySettings(settings) {
  return [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: settings.hateSpeech || 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: settings.dangerousContent || 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: settings.sexuallyExplicit || 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: settings.harassment || 'BLOCK_MEDIUM_AND_ABOVE' },
  ]
}

// POST /api/generate - Endpoint unificato per tutti i modelli
app.post('/api/generate', async (req, res) => {
  const { model, prompt, settings, attachments } = req.body

  try {
    if (model === 'NANOBANANA' || model === 'GEMINI_25_FLASH_PREVIEW') {
      const modelName = model === 'NANOBANANA' 
        ? 'gemini-2.5-flash-image'
        : 'gemini-2.5-flash-preview'

      const genModel = genAI.getGenerativeModel({ 
        model: modelName,
        safetySettings: settings.safetyOff ? getSafetySettings({ hateSpeech: 'BLOCK_NONE', dangerousContent: 'BLOCK_NONE', sexuallyExplicit: 'BLOCK_NONE', harassment: 'BLOCK_NONE' }) : undefined
      })

      // Prepare content parts
      const parts = [{ text: prompt }]
      
      // Handle attachments (images, files)
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.type?.startsWith('image/') && att.base64) {
            parts.push({
              inlineData: {
                data: att.base64,
                mimeType: att.type
              }
            })
          }
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

      const result = await genModel.generateContentStream({
        contents: [{ role: 'user', parts }],
        generationConfig
      })

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
        }
      }

      // Check for images in response
      const response = await result.response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            res.write(`data: ${JSON.stringify({ type: 'image', mimeType: part.inlineData.mimeType, data: part.inlineData.data })}\n\n`)
          }
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()

    } else if (model === 'IMAGEN') {
      // Imagen API call (placeholder - implementare con Google Cloud Imagen)
      res.status(501).json({ error: 'Imagen API not yet implemented' })
    } else {
      res.status(400).json({ error: 'Unknown model' })
    }

  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

