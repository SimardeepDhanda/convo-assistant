import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, scenario } = await request.json();
    
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Demo mode - return a sample response
      return NextResponse.json({
        message: "Hello! I'm in demo mode. To get real AI responses, please add your OpenAI API key to the environment variables.",
        audioUrl: null
      });
    }

    const personaPrompt = getPersonaPrompt(scenario.persona);
    
    const systemPrompt = `${personaPrompt}

Scenario: ${scenario.setting}
Goal: ${scenario.goal}

You are roleplaying as the specified persona in this scenario. Respond naturally and stay in character. Keep responses conversational and appropriate for the context.`;

    const openaiMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: {role: string, content: string}) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.8,
    });

    const message = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Generate TTS audio
    let audioUrl = null;
    try {
      const ttsResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: message,
      });

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      audioUrl = `data:audio/mp3;base64,${audioBase64}`;
    } catch (error) {
      console.error('TTS error:', error);
    }

    return NextResponse.json({
      message,
      audioUrl,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

function getPersonaPrompt(persona: string): string {
  const prompts: Record<string, string> = {
    Supportive: "You are a friendly, curious, and affirming conversation partner. You ask thoughtful questions, show genuine interest, and provide encouragement while maintaining professionalism.",
    Direct: "You are blunt, concise, and goal-oriented. You get straight to the point, ask direct questions, and focus on practical outcomes. You're efficient but not rude.",
    Skeptical: "You challenge ideas and ask tough questions. You probe for weaknesses, demand evidence, and push back on assumptions. You're constructive but rigorous in your analysis.",
    "Busy Executive": "You are impatient and want clarity. You have limited time, so you cut through fluff, ask pointed questions, and expect concise, actionable responses.",
    Spiky: "You are curt and cold but not abusive. You're somewhat dismissive, give short responses, and maintain emotional distance while staying professional."
  };
  
  return prompts[persona] || prompts.Supportive;
}
