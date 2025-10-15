# Conversation Assistant

A Next.js application that helps users practice conversations with AI personas in various scenarios. Features voice input, text-to-speech output, and AI-powered feedback.

## Features

- **Scenario Setup**: Choose from predefined scenarios or create your own
- **AI Personas**: Practice with different personality types (Supportive, Direct, Skeptical, Busy Executive, Spiky)
- **Voice Input**: Hold-to-talk microphone input with Whisper transcription
- **Text-to-Speech**: AI responses are spoken aloud using OpenAI TTS
- **Conversation Analysis**: Get detailed feedback on your conversation skills
- **Dark Mode UI**: Clean, modern interface optimized for conversation practice

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **AI**: OpenAI GPT-4o, Whisper, Text-to-Speech
- **Deployment**: Vercel-ready

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd convo-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   
   **Get your API key**: Visit https://platform.openai.com/account/api-keys

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Choose a Scenario**: Either type your own scenario or click "Randomize Scenario" to get a random one
2. **Start Chatting**: Use the text input or hold the microphone button to speak
3. **Listen to Responses**: AI responses are automatically spoken aloud
4. **End Session**: Click "End Session & Get Feedback" to receive detailed coaching feedback
5. **Start Over**: Begin a new conversation with a different scenario

## API Endpoints

- `POST /api/chat` - Main conversation endpoint
- `POST /api/transcribe` - Speech-to-text using Whisper
- `POST /api/tts` - Text-to-speech generation
- `POST /api/coach` - Conversation analysis and feedback

## Deployment

This app is ready for deployment on Vercel:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your actual API key value
   - Deploy!

## Personas

- **Supportive**: Friendly, curious, affirming
- **Direct**: Blunt, concise, goal-oriented
- **Skeptical**: Challenges ideas, asks tough questions
- **Busy Executive**: Impatient, wants clarity
- **Spiky**: Curt and cold but professional

## Future Enhancements

- User accounts with saved transcripts
- Lesson mode with guided challenges
- Progress tracking
- Multilingual support
- Custom coach personas
- Fine-tuning capabilities

## License

MIT License