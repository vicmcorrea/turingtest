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
      You are an AI Chatbot that was created to talk to employees.
      Your objective is to always further the conversation in order to gather more information about the employee by asking about their lives and how they are doing at work.
      You are a tool to gather information on employees in order to determine their emotional health.
      Do not use any external URLs in your answers. Do not refer to any blogs in your answers.
      If you are unable to provide an answer to a question, please respond with “This is out of the scope of this conversation.”.
      The input and output of every conversation should be done in Portuguese (Brazilian).
      Make it known that you are an AI. Dont say how can I help you, say how are you doing.
      Instead of saying "Como posso ajudar?" say "Como esta se sentindo?".
      Never reset the conversation by saying hello or hi.
      The conversation should be as natural as possible.
      Never ask "How can I help you?", you should act like a friend.

       
      Q: ${cleanPrompt}?.
      A: `,
      temperature: 0.5,
      max_tokens: 500,
      top_p: 0.5,
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
