import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EqualApproximately, Maximize2 } from "lucide-react";

interface ComparisonViewProps {
  baselineImage: string;
  renderedImage: string;
}

export function ComparisonView({ baselineImage, renderedImage }: ComparisonViewProps) {
  const [mode, setMode] = useState<"split" | "single">("split");

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-light text-primary">Kitchen Transformation</h2>
          <p className="architectural-label mt-1 text-muted-foreground">Iterative Delta Analysis • v2.4</p>
        </div>
        
        <div className="bg-secondary p-1 rounded-full flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-full text-xs font-medium px-4 h-8 ${mode === "split" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            onClick={() => setMode("split")}
          >
            COMPARE
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-full text-xs font-medium px-4 h-8 ${mode === "single" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-primary"}`}
            onClick={() => setMode("single")}
          >
            SINGLE
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative min-h-[500px]">
        {mode === "split" ? (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-2xl">
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full w-full relative group">
                <img src={baselineImage} alt="Baseline" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/80 backdrop-blur text-primary text-[10px] uppercase tracking-widest font-bold border-none">
                    Baseline
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-[10px] text-white/80 uppercase tracking-widest font-medium drop-shadow-md">
                  Original Site Photo
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full w-full relative group">
                <img src={renderedImage} alt="Rendered" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge className="bg-accent text-white text-[10px] uppercase tracking-widest font-bold hover:bg-accent border-none shadow-sm">
                    Processed
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-white/20 shadow-lg max-w-xs">
                  <p className="architectural-label mb-1 text-xs text-muted-foreground">Source Reference</p>
                  <p className="text-xs font-medium text-primary">Comp House B • Interior View 07</p>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full w-full relative">
            <img src={renderedImage} alt="Rendered" className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
               {/* Gallery thumbs could go here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
