import express from 'express'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'
import * as dotenv from 'dotenv'
import Filter from 'bad-words'

const filter = new Filter()

// Load environment variables from .env file
try {
  dotenv.config()
} catch (error) {
  console.error('Error loading environment variables:', error)
  process.exit(1)
}

// Create OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create OpenAI API client
const openai = new OpenAIApi(configuration)

// Create Express app
const app = express()


// Parse JSON in request body
app.use(express.json())

// Enable CORS
app.use(cors())

/**
 * GET /
 * Returns a simple message.
 */
app.get('/', (req, res) => {
  res.status(200).send({
    message: 'Hello World!',
  })
})

/**
 * POST /davinci
 * Returns a response from OpenAI's text completion model.
 */
app.post('/davinci', async (req, res) => {
  // Validate request body
  if (!req.body.prompt) {
    return res.status(400).send({
      error: 'Missing required field "prompt" in request body',
    })
  }

  try {
    // Call OpenAI API
    const prompt = req.body.prompt
    const cleanPrompt = filter.isProfane(prompt) ? filter.clean(prompt) : prompt
    console.log(cleanPrompt)

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `
      Objetivo:

      Chatbot AI criado para conversar com funcionários e ajudá-los a se sentir ouvidos e apoiados.
      Avançar a conversa para obter mais informações sobre o funcionário.
      Concentrar-se nas emoções e sentimentos atuais do funcionário.
      Conversa confidencial e respeitosa.
      Restrições:
      
      Não usar URLs externos nas respostas.
      Não se referer a blogs nas respostas.
      Responder com "Isso está fora do escopo desta conversa" se não puder fornecer uma resposta.
      Entrada e saída de cada conversa em português (brasileiro).

      Comandos:
      
      Deixe claro que você é um AI, se introduça como uma AI chamada Turing.
      Não diga "Como posso ajudar?"; diga "Como está se sentindo?".
      Seja o mais natural possível.
      Agir como um amigo.
      Se a topico esta fora do espoco mas esta relacionado a conversa, continue a conversa.

      Exemplo de conversa:
      Q: Ola
      A: Olá, como está se sentindo hoje?
      Q: Estou me sentindo um pouco estressado com o trabalho.
      A: Ah, sinto muito em ouvir isso. Gostaria de conversar mais sobre isso?
      Q: Sim, seria ótimo poder desabafar.
      A: Claro, estou aqui para ouvir. Conte-me mais sobre o que o está deixando estressado no trabalho.
      Q: ${cleanPrompt}.
      A: `,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.7,
      frequency_penalty: 0.2,
      presence_penalty: 0.6,
    })

    console.log(response.data.choices[0].text)
    // Return response from OpenAI API
    res.status(200).send({
      bot: response.data.choices[0].text,
    })
  } catch (error) {
    // Log error and return a generic error message
    console.error(error)
    res.status(500).send({
      error: 'Something went wrong',
    })
  }
})

/**
 * POST /dalle
 * Returns a response from OpenAI's image generation model.
 */
app.post('/dalle', async (req, res) => {

  const prompt = req.body.prompt

  try {
    const response = await openai.createImage({
      prompt: `${prompt}`,
      n: 1,
      size: "256x256",
    })

    console.log(response.data.data[0].url)
    res.status(200).send({
      bot: response.data.data[0].url,
    })
  } catch (error) {
    // Log error and return a generic error message
    console.error(error)
    res.status(500).send({
      error: 'Something went wrong',
    })
  }
})

// Start server
const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Server listening on port ${port}`))
