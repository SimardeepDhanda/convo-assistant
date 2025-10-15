import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Demo mode - return sample transcription
      return NextResponse.json({
        text: "Demo mode: Your speech would be transcribed here with a real API key."
      });
    }

    // Convert File to Buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Create a File object for OpenAI API
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    console.log('Audio file size:', audioBuffer.byteLength);
    console.log('Audio file type:', audioFile.type);
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    console.log('Transcription result:', transcription);

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
