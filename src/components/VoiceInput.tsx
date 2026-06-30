import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check for webkitSpeechRecognition or SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setErrorMsg('Could not detect speech. Please try again.');
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
      setErrorMsg('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        id="btn-voice-input"
        onClick={toggleListening}
        disabled={disabled}
        className={`p-3 rounded-full border transition-all duration-300 relative ${
          isListening
            ? 'bg-red-50 text-red-600 border-red-200 shadow-md animate-pulse'
            : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Stop listening' : 'Start hands-free voice command'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {errorMsg && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-zinc-900 text-white text-xs py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md flex items-center gap-1.5 border border-zinc-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
