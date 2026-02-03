import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, Paperclip, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ChatInterface() {
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
          <div className="absolute -top-10 left-0 right-0 flex justify-center gap-2">
             <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur text-xs rounded-full h-7 border-border shadow-sm text-muted-foreground hover:text-primary">
                "Change countertop to marble"
             </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input 
                className="pr-10 h-12 rounded-xl bg-background border-border shadow-inner text-sm" 
                placeholder="Direct the AI to refine the design..." 
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                    <Paperclip className="w-4 h-4" />
                 </Button>
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                    <Mic className="w-4 h-4" />
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
