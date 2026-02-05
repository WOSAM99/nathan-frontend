import { useState, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";

interface ComparisonViewProps {
  baselineImage: string;
  renderedImage: string;
}

export function ComparisonView({
  baselineImage,
  renderedImage,
}: ComparisonViewProps) {
  const { showSnackbar } = useAppSnackbar();

  const [mode, setMode] = useState<"split" | "single">("split");
  const [swapped, setSwapped] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const leftImage = swapped ? renderedImage : baselineImage;
  const rightImage = swapped ? baselineImage : renderedImage;
  const leftLabel = swapped ? "Processed" : "Baseline";
  const rightLabel = swapped ? "Baseline" : "Processed";

  const handleSwap = useCallback(() => {
    setSwapped((prev) => !prev);
    showSnackbar("Views swapped", "success");
  }, [showSnackbar]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    showSnackbar("Zoom reset", "success");
  }, [showSnackbar]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col h-full gap-4",
        isFullscreen && "fixed inset-0 z-50 bg-black p-6",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <h2
            className={cn(
              "text-xl font-light",
              isFullscreen ? "text-white" : "text-primary",
            )}
          >
            Kitchen Transformation
          </h2>
          <p
            className={cn(
              "architectural-label mt-1",
              isFullscreen ? "text-white/60" : "text-muted-foreground",
            )}
          >
            Iterative Delta Analysis • v2.4
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/80 backdrop-blur rounded-full p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-white"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-primary min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-white"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-white"
              onClick={handleResetZoom}
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {mode === "split" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-medium h-8 gap-2 border-border hover:border-primary/50"
              onClick={handleSwap}
              aria-label="Swap comparison sides"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Swap
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

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
      </div>

      <div
        className={cn(
          "flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative min-h-[500px]",
          isFullscreen && "border-none rounded-none",
        )}
      >
        {mode === "split" ? (
          <ResizablePanelGroup
            direction="horizontal"
            className="h-full w-full rounded-2xl"
          >
            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full w-full relative group overflow-hidden">
                <img
                  src={leftImage}
                  alt={leftLabel}
                  className="w-full h-full object-cover transition-transform duration-200 cursor-grab active:cursor-grabbing"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
                <div className="absolute top-4 left-4">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-bold border-none",
                      leftLabel === "Baseline"
                        ? "bg-white/80 backdrop-blur text-primary"
                        : "bg-accent text-white",
                    )}
                  >
                    {leftLabel}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 text-[10px] text-white/80 uppercase tracking-widest font-medium drop-shadow-md">
                  {leftLabel === "Baseline"
                    ? "Original Site Photo"
                    : "AI Generated"}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="h-full w-full relative group overflow-hidden">
                <img
                  src={rightImage}
                  alt={rightLabel}
                  className="w-full h-full object-cover transition-transform duration-200 cursor-grab active:cursor-grabbing"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-bold hover:bg-accent border-none shadow-sm",
                      rightLabel === "Processed"
                        ? "bg-accent text-white"
                        : "bg-white/80 backdrop-blur text-primary",
                    )}
                  >
                    {rightLabel}
                  </Badge>
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-white/20 shadow-lg max-w-xs">
                  <p className="architectural-label mb-1 text-xs text-muted-foreground">
                    Source Reference
                  </p>
                  <p className="text-xs font-medium text-primary">
                    Comp House B • Interior View 07
                  </p>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full w-full relative overflow-hidden">
            <img
              src={renderedImage}
              alt="Rendered"
              className="w-full h-full object-cover transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4"></div>
          </div>
        )}
      </div>
    </div>
  );
}
