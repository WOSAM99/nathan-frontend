import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, Paperclip, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

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

function GeneratingIndicator({ progress }: { progress: number }) {
  const stages = [
    { threshold: 0, label: "Analyzing request..." },
    { threshold: 25, label: "Processing design elements..." },
    { threshold: 50, label: "Generating render..." },
    { threshold: 75, label: "Finalizing details..." },
    { threshold: 95, label: "Almost done..." },
  ];
  
  const currentStage = stages.filter(s => progress >= s.threshold).pop();
  
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white border border-border text-accent shadow-sm">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none shadow-sm min-w-[200px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{currentStage?.label}</span>
            <span className="text-[10px] font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-amber-600 font-medium">AI is working</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary/40" />
      </div>
      <h3 className="text-sm font-medium text-primary mb-2">Start a Conversation</h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        Describe design changes you'd like to explore, and the AI will generate new iterations for your space.
      </p>
    </div>
  );
}

interface ChatInterfaceProps {
  propertyId?: string;
  roomId?: string;
  referenceImages?: string[];
  onIterationGenerated?: (iteration: { id: string; image_url: string; version: string }) => void;
}

export function ChatInterface({ propertyId, roomId, referenceImages = [], onIterationGenerated }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      role: "user" as const,
      content: inputValue
    };
    setMessages(prev => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue("");
    setIsTyping(true);
    setGenerationProgress(0);
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 95) {
        progress = 95;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
      setGenerationProgress(Math.min(Math.round(progress), 95));
    }, 300);
    
    try {
      if (propertyId && roomId) {
        const result = await api.regenerateDesign({
          property_id: propertyId,
          room_id: roomId,
          prompt: prompt,
          reference_images: referenceImages,
        });
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setGenerationProgress(100);
        
        setTimeout(() => {
          setIsTyping(false);
          setGenerationProgress(0);
          
          const aiMessage = {
            id: messages.length + 2,
            role: "assistant" as const,
            content: `I've generated a new design iteration (${result.version}). The updated render reflects your feedback.`,
            image: result.image_url
          };
          setMessages(prev => [...prev, aiMessage]);
          
          if (onIterationGenerated) {
            onIterationGenerated({
              id: result.iteration_id,
              image_url: result.image_url,
              version: result.version,
            });
          }
        }, 300);
      } else {
        setTimeout(() => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          setGenerationProgress(100);
          
          setTimeout(() => {
            setIsTyping(false);
            setGenerationProgress(0);
            const aiResponses = [
              "I've processed your request and generated a new iteration. The updated design incorporates your feedback while maintaining the overall aesthetic.",
              "Understood! I'm applying those changes now. The new render shows improved spatial flow based on your direction.",
              "Great choice! I've updated the design to reflect your preferences. Take a look at the comparison view to see the changes."
            ];
            const aiMessage = {
              id: messages.length + 2,
              role: "assistant" as const,
              content: aiResponses[Math.floor(Math.random() * aiResponses.length)]
            };
            setMessages(prev => [...prev, aiMessage]);
          }, 300);
        }, 3000);
      }
    } catch (error) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setIsTyping(false);
      setGenerationProgress(0);
      toast.error(error instanceof Error ? error.message : "Failed to generate design");
      
      const errorMessage = {
        id: messages.length + 2,
        role: "assistant" as const,
        content: "I apologize, but I encountered an error generating the design. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden" role="region" aria-label="Design chat interface">
      <div className="p-4 border-b border-border flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isTyping ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse")} />
          <h3 className="architectural-label text-primary">Design Agent</h3>
          {isTyping && <span className="text-[10px] text-amber-600 font-medium">Generating...</span>}
        </div>
        <button className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1" aria-label="View chat history">
          History
        </button>
      </div>

      <ScrollArea className="flex-1 p-4 bg-background/50">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-white border border-border text-accent shadow-sm" : "bg-primary text-white"}`} aria-hidden="true">
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
            {isTyping && <GeneratingIndicator progress={generationProgress} />}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-white border-t border-border">
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                className={cn(
                  "pr-20 h-12 rounded-xl bg-background border-border shadow-inner text-sm focus:ring-2 focus:ring-primary focus:ring-offset-1",
                  isListening && "border-red-400 ring-2 ring-red-400/20"
                )}
                placeholder={isListening ? "Listening..." : "Direct the AI to refine the design..."} 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                data-testid="chat-input"
                aria-label="Chat message input"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-1" 
                    data-testid="button-attach"
                    aria-label="Attach file"
                 >
                    <Paperclip className="w-4 h-4" />
                 </Button>
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className={cn(
                      "h-8 w-8 rounded-full transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      isListening 
                        ? "bg-red-500 text-white hover:bg-red-600" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={startListening}
                    data-testid="button-mic"
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                    aria-pressed={isListening}
                 >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                 </Button>
              </div>
            </div>
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
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
