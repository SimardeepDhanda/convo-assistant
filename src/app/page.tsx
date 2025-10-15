'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, RotateCcw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Scenario {
  setting: string;
  persona: string;
  goal: string;
}

const scenarios = [
  {
    setting: "I'm asking for directions to the nearest coffee shop",
    persona: "Supportive",
    goal: "Get clear, helpful directions"
  },
  {
    setting: "I'm ordering food at a restaurant",
    persona: "Direct",
    goal: "Place my order efficiently"
  },
  {
    setting: "I'm asking about store hours",
    persona: "Skeptical",
    goal: "Get accurate information about opening times"
  },
  {
    setting: "I'm asking for help finding a product in a store",
    persona: "Busy Executive",
    goal: "Quickly locate what I need"
  },
  {
    setting: "I'm asking about return policy",
    persona: "Impatient",
    goal: "Understand the return process"
  },
  {
    setting: "I'm asking for a recommendation",
    persona: "Supportive",
    goal: "Get helpful suggestions"
  },
  {
    setting: "I'm asking about parking",
    persona: "Direct",
    goal: "Find available parking spots"
  },
  {
    setting: "I'm asking about prices",
    persona: "Skeptical",
    goal: "Get accurate pricing information"
  }
];


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const randomizeScenario = () => {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setCurrentScenario(randomScenario);
    setMessages([]);
    setShowFeedback(false);
    setFeedback('');
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, chunks:', audioChunks.length);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);
        console.log('Audio blob type:', audioBlob.type);
        
        if (audioBlob.size === 0) {
          console.error('No audio data recorded');
          alert('No audio recorded. Please check your microphone permissions.');
          return;
        }
        
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Transcribing audio...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Transcribe response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcribe API error:', errorText);
        alert('Transcription failed. Please try again.');
        return;
      }
      
      const data = await response.json();
      console.log('Transcribe response:', data);
      
      if (data.text && data.text.trim()) {
        console.log('Transcribed text:', data.text);
        await sendMessage(data.text);
      } else {
        console.error('No text in response:', data);
        alert('No speech detected. Please try speaking louder or closer to the microphone.');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Transcription error. Please try again.');
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentScenario) return;
    
    console.log('Sending message:', content);
    console.log('Current scenario:', currentScenario);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          scenario: currentScenario,
        }),
      });
      
      console.log('Chat response status:', response.status);
      const data = await response.json();
      console.log('Chat response:', data);
      
      if (data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Play TTS
        if (data.audioUrl) {
          console.log('Playing TTS audio...');
          await playTTS(data.audioUrl);
        }
      } else {
        console.error('No message in response:', data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (audioUrl: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      // Audio started playing
      
      audio.onended = () => {
        // Audio finished playing
      };
      
      audio.onerror = () => {
        // Audio error occurred
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      // Audio error occurred
    }
  };

  const endSession = async () => {
    if (messages.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          scenario: currentScenario,
        }),
      });
      
      const data = await response.json();
      setFeedback(data.feedback);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error getting feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Conversation Assistant</h1>
          <p className="text-gray-400">Practice conversations with AI personas</p>
        </header>

        {!currentScenario ? (
          <div className="text-center">
            <div className="bg-gray-800 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Choose Your Scenario</h2>
              <p className="text-gray-400 mb-6">
                Either type your own scenario or let us randomize one for you
              </p>
              
              <div className="space-y-4">
                <textarea
                  placeholder="Describe your scenario (e.g., 'I'm pitching my startup to investors')"
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg resize-none"
                  rows={3}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.trim()) {
                      setCurrentScenario({
                        setting: value.trim(),
                        persona: 'Supportive',
                        goal: 'Have a productive conversation'
                      });
                    }
                  }}
                />
                
                <div className="text-gray-400">or</div>
                
                <button
                  onClick={randomizeScenario}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={20} />
                  Randomize Scenario
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Scenario Display */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Current Scenario</h3>
                  <p className="text-gray-300 mb-2"><strong>Your Role:</strong> {currentScenario.setting}</p>
                  <p className="text-gray-300 mb-2"><strong>AI Persona:</strong> {currentScenario.persona}</p>
                  <p className="text-gray-300"><strong>Your Goal:</strong> {currentScenario.goal}</p>
                </div>
                <button
                  onClick={randomizeScenario}
                  className="text-gray-400 hover:text-white"
                  title="New scenario"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-gray-800 rounded-lg h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice Input Area */}
              <div className="border-t border-gray-700 p-4">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    {isRecording ? 'Listening... Release to send' : 'Hold to talk'}
                  </p>
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-200 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 scale-110'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                  </button>
                  {isLoading && (
                    <p className="text-gray-400 mt-2">Processing...</p>
                  )}
                </div>
              </div>
            </div>

            {/* End Session Button */}
            <div className="text-center">
              <button
                onClick={endSession}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium"
                disabled={isLoading || messages.length === 0}
              >
                End Session & Get Feedback
              </button>
            </div>

            {/* Feedback Display */}
            {showFeedback && feedback && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Session Feedback</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap">{feedback}</p>
                </div>
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setMessages([]);
                    setFeedback('');
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Start New Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}