import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { ComparisonView } from "@/components/ComparisonView";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown, ArrowLeft, X, CheckCircle2, Home, Utensils, Sofa, Bed, Bath, Trees, Car, Building, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock Images
import baselineImg from "@/assets/images/room-baseline.jpg";
import kitchenImg from "@/assets/images/kitchen-modern_1.jpg";
import kitchenImg2 from "@/assets/images/kitchen-modern_2.jpg";
import livingImg from "@/assets/images/living-room-luxury_1.jpg";
import comp1 from "@/assets/images/comp-highland_1.jpg";
import comp2 from "@/assets/images/comp-highland_2.jpg";
import comp3 from "@/assets/images/comp-highland_3.jpg";
import comp4 from "@/assets/images/comp-highland_4.jpg";

const roomCategories = [
  { id: 'kitchen', label: 'Kitchen', icon: Utensils, count: 4 },
  { id: 'living', label: 'Living Room', icon: Sofa, count: 3 },
  { id: 'bedroom', label: 'Master Bedroom', icon: Bed, count: 2 },
  { id: 'bathroom', label: 'Primary Bath', icon: Bath, count: 2 },
  { id: 'exterior', label: 'Exterior', icon: Trees, count: 5 },
  { id: 'garage', label: 'Garage', icon: Car, count: 1 },
  { id: 'entry', label: 'Entry/Foyer', icon: Home, count: 1 },
];

export default function DesignWorkspacePage() {
  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [activeRoom, setActiveRoom] = useState(roomCategories[0]);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setRoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape to close dropdown
      if (event.key === 'Escape' && roomMenuOpen) {
        setRoomMenuOpen(false);
        return;
      }
      
      // Arrow keys for room navigation when dropdown is open
      if (roomMenuOpen) {
        const currentIndex = roomCategories.findIndex(r => r.id === activeRoom.id);
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % roomCategories.length;
          setActiveRoom(roomCategories[nextIndex]);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + roomCategories.length) % roomCategories.length;
          setActiveRoom(roomCategories[prevIndex]);
        } else if (event.key === 'Enter') {
          setRoomMenuOpen(false);
          toast.success(`Switched to ${activeRoom.label}`);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [roomMenuOpen, activeRoom]);

  const toggleReference = (img: string) => {
    setSelectedReferences(prev => 
      prev.includes(img) 
        ? prev.filter(i => i !== img) 
        : [...prev, img]
    );
  };

  const marketComps = [
      {
          id: "highland",
          title: "Highland Residence • Modern Transitional",
          match: "92%",
          assets: [comp1, comp2, comp3, comp4]
      }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Studio Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-border sticky top-0 z-30">
         <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                A
            </div>
            <div className="h-6 w-[1px] bg-border" />
            <span className="font-bold text-sm tracking-wide">STUDIO</span>
            
            <div className="ml-8 relative" ref={menuRef}>
               <button 
                  onClick={() => setRoomMenuOpen(!roomMenuOpen)}
                  className={cn(
                     "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                     roomMenuOpen 
                        ? "bg-primary text-white border-primary" 
                        : "bg-secondary border-border hover:border-primary/50"
                  )}
                  data-testid="room-category-dropdown"
               >
                  <span className={cn("architectural-label text-[9px]", roomMenuOpen ? "text-white/70" : "text-muted-foreground")}>ACTIVE SPACE</span>
                  <activeRoom.icon className={cn("w-3.5 h-3.5", roomMenuOpen ? "text-white" : "text-primary")} />
                  <span className={cn("text-xs font-medium", roomMenuOpen ? "text-white" : "text-primary")}>{activeRoom.label}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", roomMenuOpen ? "text-white rotate-180" : "text-muted-foreground")} />
               </button>

               {/* Dropdown Menu */}
               {roomMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="p-2 border-b border-border bg-secondary/50">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium px-2">Room Categories</p>
                     </div>
                     <div className="p-2 max-h-[300px] overflow-y-auto">
                        {roomCategories.map((room) => {
                           const isActive = activeRoom.id === room.id;
                           return (
                              <button
                                 key={room.id}
                                 onClick={() => {
                                    setActiveRoom(room);
                                    setRoomMenuOpen(false);
                                 }}
                                 className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group",
                                    isActive 
                                       ? "bg-primary text-white" 
                                       : "hover:bg-secondary"
                                 )}
                                 data-testid={`room-option-${room.id}`}
                              >
                                 <room.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                                 <span className={cn("text-sm font-medium flex-1", isActive ? "text-white" : "text-primary")}>{room.label}</span>
                                 <span className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                    isActive 
                                       ? "bg-white/20 text-white" 
                                       : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                 )}>
                                    {room.count} photos
                                 </span>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               )}
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-xs text-muted-foreground">Auto-saved</span>
            </div>
            <Button className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-6 h-9 hover:bg-primary/90 shadow-md">
               Export Package
            </Button>
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-primary">JD</div>
         </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-hidden h-[calc(100vh-64px)]">
         <div className="flex gap-6 h-full">
            {/* Left Column: Visual Canvas & History */}
            <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
               
               {/* Main Canvas */}
               <div className="h-[600px] w-full">
                  <ComparisonView 
                     baselineImage={baselineImg}
                     renderedImage={kitchenImg}
                  />
               </div>

               {/* Iteration History */}
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="architectural-label flex items-center gap-2">
                        <div className="w-4 h-4 border border-primary/30 rounded flex items-center justify-center">
                           <div className="w-2 h-2 bg-primary/30 rounded-[1px]" />
                        </div>
                        Iteration History
                     </h3>
                     <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-border">
                           <ChevronRight className="w-3 h-3 rotate-180" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-border">
                           <ChevronRight className="w-3 h-3" />
                        </Button>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                     {[
                        { id: 'v2.3', label: 'Polished Marble Edit', img: kitchenImg, timestamp: '2 hours ago', fullTime: 'Feb 3, 2026 at 10:24 AM' },
                        { id: 'v2.2', label: 'Walnut Cabinetry', img: kitchenImg2, timestamp: 'Yesterday', fullTime: 'Feb 2, 2026 at 3:45 PM' },
                        { id: 'v2.1', label: 'Recessed Lighting', img: livingImg, timestamp: '2 days ago', fullTime: 'Feb 1, 2026 at 11:30 AM' },
                        { id: 'v1.5', label: 'Open Floor Conc', img: baselineImg, timestamp: 'Jan 30', fullTime: 'Jan 30, 2026 at 9:15 AM' },
                     ].map((item) => (
                        <Tooltip key={item.id}>
                           <TooltipTrigger asChild>
                              <div className="group cursor-pointer" role="button" tabIndex={0} aria-label={`${item.label} - ${item.timestamp}`}>
                                 <div className="aspect-video rounded-lg overflow-hidden border border-border relative mb-2 group-hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                                    <img src={item.img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.label} />
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold text-primary shadow-sm">
                                       {item.id}
                                    </div>
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[9px] text-white flex items-center gap-1">
                                       <Clock className="w-2.5 h-2.5" />
                                       {item.timestamp}
                                    </div>
                                 </div>
                                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate group-hover:text-primary transition-colors">{item.label}</p>
                              </div>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="text-xs">
                              <p className="font-medium">{item.label}</p>
                              <p className="text-muted-foreground">{item.fullTime}</p>
                           </TooltipContent>
                        </Tooltip>
                     ))}
                  </div>
               </div>

               {/* Market Comps Section */}
               <div className="pb-10">
                  <div className="flex items-center justify-between mb-4 border-t border-border pt-6">
                     <h3 className="architectural-label flex items-center gap-2">
                        Market Comps
                     </h3>
                     <span className="text-[10px] font-bold text-accent cursor-pointer hover:underline">GLOBAL SEARCH</span>
                  </div>
                  
                  {marketComps.map((comp) => {
                    const isOpen = activeComp === comp.id;
                    return (
                        <div 
                            key={comp.id} 
                            className="bg-white border border-border rounded-xl shadow-sm transition-all duration-300 overflow-hidden"
                        >
                            <div 
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors group"
                                onClick={() => setActiveComp(isOpen ? null : comp.id)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <h4 className="text-sm font-medium text-primary group-hover:text-accent transition-colors">{comp.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Matched {comp.match} similarity to subject property layout.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary" className="bg-secondary text-primary border-none group-hover:bg-primary group-hover:text-white transition-colors">
                                            {comp.assets.length} ASSETS
                                        </Badge>
                                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="overflow-hidden">
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="bg-[#f8f9fa] rounded-lg p-4 border border-border/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Assets</p>
                                                {selectedReferences.length > 0 && (
                                                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {selectedReferences.length} selected as reference
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-4">
                                                {comp.assets.map((img, i) => {
                                                    const isSelected = selectedReferences.includes(img);
                                                    return (
                                                        <div 
                                                            key={i} 
                                                            className={cn(
                                                                "group cursor-pointer relative aspect-[4/3] rounded-lg overflow-hidden transition-all duration-200",
                                                                isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:shadow-md"
                                                            )}
                                                            onClick={() => toggleReference(img)}
                                                        >
                                                            <img src={img} className="w-full h-full object-cover" />
                                                            
                                                            {/* Selection Overlay */}
                                                            <div className={cn(
                                                                "absolute inset-0 transition-colors duration-200 flex items-center justify-center",
                                                                isSelected ? "bg-primary/20" : "bg-black/0 group-hover:bg-black/10"
                                                            )}>
                                                                {isSelected && (
                                                                    <div className="bg-primary text-white rounded-full p-1 shadow-sm animate-in zoom-in">
                                                                        <CheckCircle2 className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                                {!isSelected && (
                                                                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wide shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                                        Select
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                  })}
               </div>
            </div>

            {/* Right Column: Design Agent Chat */}
            <div className="w-[400px] h-full flex-shrink-0">
               <ChatInterface />
            </div>
         </div>
      </main>
    </div>
  );
}
