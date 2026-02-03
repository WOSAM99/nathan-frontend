import { Layout } from "@/components/Layout";
import { ComparisonView } from "@/components/ComparisonView";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft } from "lucide-react";

// Mock Images
import baselineImg from "@/assets/images/room-baseline.jpg";
import kitchenImg from "@/assets/images/kitchen-modern_1.jpg";
import kitchenImg2 from "@/assets/images/kitchen-modern_2.jpg";
import livingImg from "@/assets/images/living-room-luxury_1.jpg";

export default function DesignWorkspacePage() {
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
            
            <div className="ml-8 flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border">
               <span className="architectural-label text-[9px] text-muted-foreground">ACTIVE SPACE</span>
               <span className="text-xs font-medium text-primary">Kitchen</span>
               <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
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
                        { id: 'v2.3', label: 'Polished Marble Edit', img: kitchenImg },
                        { id: 'v2.2', label: 'Walnut Cabinetry', img: kitchenImg2 },
                        { id: 'v2.1', label: 'Recessed Lighting', img: livingImg },
                        { id: 'v1.5', label: 'Open Floor Conc', img: baselineImg },
                     ].map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                           <div className="aspect-video rounded-lg overflow-hidden border border-border relative mb-2 group-hover:border-primary/50 transition-colors">
                              <img src={item.img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.label} />
                              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-bold text-primary shadow-sm">
                                 {item.id}
                              </div>
                           </div>
                           <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate group-hover:text-primary transition-colors">{item.label}</p>
                        </div>
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
                  
                  <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                     <div>
                        <h4 className="text-sm font-medium text-primary">Highland Residence • Modern Transitional</h4>
                        <p className="text-xs text-muted-foreground mt-1">Matched 92% similarity to subject property layout.</p>
                     </div>
                     <Badge variant="secondary" className="bg-secondary text-primary border-none">12 ASSETS</Badge>
                  </div>
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
