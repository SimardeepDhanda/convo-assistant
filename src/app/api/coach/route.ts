import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, scenario } = await request.json();
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const conversationText = messages
      .map((msg: {role: string, content: string}) => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
      .join('\n');

    const coachPrompt = `You are a conversation coach analyzing a practice session. 

Scenario: ${scenario?.setting || 'General conversation'}
Persona: ${scenario?.persona || 'Supportive'}
Goal: ${scenario?.goal || 'Have a productive conversation'}

Conversation:
${conversationText}

Please provide constructive feedback focusing on:
1. Clarity and coherence of communication
2. Empathy and engagement with the AI persona
3. Ability to ask and answer follow-up questions
4. Adaptability to the persona's tone and style
5. Specific suggestions for improvement

Write your feedback in a supportive, coaching tone. Focus on actionable advice rather than just criticism. Keep it concise but comprehensive.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: coachPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || 'Unable to generate feedback at this time.';

    return NextResponse.json({
      feedback,
    });
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
