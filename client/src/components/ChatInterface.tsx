import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, Paperclip, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "I've analyzed the primary kitchen lighting and cabinetry from Comp B. Would you like to port the White Oak finish or the Brushed Nickel hardware first?"
    },
    {
      id: 2,
      role: "user",
      content: "Let's go with the White Oak finish for the cabinets and keep the existing layout."
    },
    {
      id: 3,
      role: "assistant",
      content: "Render complete. I've updated the cabinetry with the White Oak texture and balanced the lighting to match the reference pavilion.",
      image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&q=80&w=600"
    }
  ]);

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="architectural-label text-primary">Design Agent</h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">History</span>
      </div>

      <ScrollArea className="flex-1 p-4 bg-background/50">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-white border border-border text-accent shadow-sm" : "bg-primary text-white"}`}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <div className="text-xs font-bold">JD</div>}
              </div>
              
              <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "assistant" 
                    ? "bg-white border border-border text-primary rounded-tl-none" 
                    : "bg-primary text-primary-foreground rounded-tr-none"
                }`}>
                  {msg.content}
                </div>
                
                {msg.image && (
                  <div className="rounded-xl overflow-hidden border border-border shadow-sm w-full max-w-[240px]">
                    <img src={msg.image} alt="Render result" className="w-full h-auto" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-border">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                className={cn(
                  "pr-20 h-12 rounded-xl bg-background border-border shadow-inner text-sm",
                  isListening && "border-red-400 ring-2 ring-red-400/20"
                )}
                placeholder={isListening ? "Listening..." : "Direct the AI to refine the design..."} 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                data-testid="chat-input"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full" data-testid="button-attach">
                    <Paperclip className="w-4 h-4" />
                 </Button>
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className={cn(
                      "h-8 w-8 rounded-full transition-colors",
                      isListening 
                        ? "bg-red-500 text-white hover:bg-red-600" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={startListening}
                    data-testid="button-mic"
                 >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </Button>
              </div>
            </div>
            <Button size="icon" className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95">
              <Sparkles className="w-5 h-5" />
            </Button>
          </div>
          <div className="text-center mt-3">
             <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Press CMD + Enter to Submit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
