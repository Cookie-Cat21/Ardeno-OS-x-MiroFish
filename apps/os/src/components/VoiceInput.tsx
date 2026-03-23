import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
}

export function VoiceInput({ onResult, className = "" }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error("Voice input failed");
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => { recognition.abort(); };
  }, [onResult]);

  const toggle = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  }, [listening]);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-lg transition-all ${listening ? "bg-destructive/20 text-destructive animate-pulse" : "hover:bg-accent text-muted-foreground hover:text-foreground"} ${className}`}
      title={listening ? "Stop listening" : "Voice input"}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
