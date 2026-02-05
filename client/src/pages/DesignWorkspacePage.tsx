import { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Utensils,
  Sofa,
  Bed,
  Bath,
  Trees,
  Car,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, PropertyDetails, PropertyImage } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";

const defaultRoomCategories = [
  { id: "kitchen", label: "Kitchen", icon: Utensils, count: 4 },
  { id: "living", label: "Living Room", icon: Sofa, count: 3 },
  { id: "bedroom", label: "Master Bedroom", icon: Bed, count: 2 },
  { id: "bathroom", label: "Primary Bath", icon: Bath, count: 2 },
  { id: "exterior", label: "Exterior", icon: Trees, count: 5 },
  { id: "garage", label: "Garage", icon: Car, count: 1 },
  { id: "entry", label: "Entry/Foyer", icon: Home, count: 1 },
];

export default function DesignWorkspacePage() {
  const { showSnackbar } = useAppSnackbar();

  const [, params] = useRoute("/studio/:id");
  const propertyId = params?.id;
  const [, setLocation] = useLocation();
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [roomCategories, setRoomCategories] = useState(defaultRoomCategories);
  const [activeRoom, setActiveRoom] = useState(defaultRoomCategories[0]);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null); // null means "All"

  // AI Iterations
  const [aiGeneratedIterations, setAiGeneratedIterations] = useState<
    Array<{
      id: string;
      label: string;
      img: string;
      timestamp: string;
      fullTime: string;
      version: string;
    }>
  >([]);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPropertyDetails = async () => {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const details = await api.getPropertyDetails(propertyId);
        setPropertyDetails(details);
      } catch (error) {
        console.error("Failed to load property details:", error);
        showSnackbar("Failed to load property details", "error");
      } finally {
        setLoading(false);
      }
    };

    loadPropertyDetails();
  }, [propertyId]);

  const handleIterationGenerated = (iteration: {
    id: string;
    image_url: string;
    version: string;
  }) => {
    const newIteration = {
      id: iteration.id,
      label: `AI Generated ${aiGeneratedIterations.length + 1}`,
      img: iteration.image_url,
      timestamp: "Just now",
      fullTime: new Date().toLocaleString(),
      version: iteration.version,
    };
    setAiGeneratedIterations((prev) => [newIteration, ...prev]);
    setUndoStack((prev) => [...prev, iteration.version]);
    setCurrentVersion(iteration.version);
    setRedoStack([]);
    showSnackbar(`Generated ${iteration.version}`, "success");
  };

  // Display lists
  const mlsImages = propertyDetails?.mls_images || [];
  const compsImages = propertyDetails?.comps_images || [];

  const toggleReference = (imgId: string) => {
    setSelectedReferences((prev) =>
      prev.includes(imgId) ? prev.filter((i) => i !== imgId) : [...prev, imgId],
    );
  };

  // Compute Market Comps groups
  const groupedComps = compsImages.reduce(
    (acc, img) => {
      const key = img.filename.split("_")[0] || "Reference";
      if (!acc[key]) acc[key] = [];
      acc[key].push(img);
      return acc;
    },
    {} as Record<string, PropertyImage[]>,
  );

  const marketComps = Object.entries(groupedComps).map(
    ([name, images], index) => ({
      id: `comp-${index}`,
      title: name.length > 20 ? name.substring(0, 20) + "..." : name,
      match: "Ref",
      assets: images,
    }),
  );

  // Extract unique categories from all images (include all categories)
  const allImages = [...mlsImages, ...compsImages];
  const uniqueCategories = Array.from(
    new Set(allImages.map((img) => img.category || "uncategorized")),
  ).sort();

  // Filter images based on selected category
  const filteredMlsImages = selectedCategoryFilter
    ? mlsImages.filter(
        (img) => (img.category || "uncategorized") === selectedCategoryFilter,
      )
    : mlsImages;

  const filteredCompsImages = selectedCategoryFilter
    ? compsImages.filter(
        (img) => (img.category || "uncategorized") === selectedCategoryFilter,
      )
    : compsImages;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-secondary"
                onClick={() => setLocation("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Dashboard</TooltipContent>
          </Tooltip>
          <span className="font-bold text-sm tracking-wide">STUDIO</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-4 rounded-full text-xs font-medium"
            onClick={() => setLocation(`/organize/${propertyId}`)}
          >
            Organize Photos
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 overflow-hidden h-[calc(100vh-64px)]">
        <div className="flex gap-6 h-full">
          {/* Left Column: MLS Grid & History */}
          <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
            {/* Category Filter Chips */}
            {uniqueCategories.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <h3 className="architectural-label text-primary mb-3">
                  Filter by Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      selectedCategoryFilter === null
                        ? "bg-primary text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                    )}
                  >
                    All ({allImages.length})
                  </button>
                  {uniqueCategories.map((category) => {
                    const count = allImages.filter(
                      (img) => (img.category || "uncategorized") === category,
                    ).length;
                    const displayLabel =
                      category === "uncategorized"
                        ? "Uncategorized"
                        : category.replace(/_/g, " ");
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategoryFilter(category)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize",
                          selectedCategoryFilter === category
                            ? "bg-primary text-white shadow-sm"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                        )}
                      >
                        {displayLabel} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MLS Images Grid (Upper Part) */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="architectural-label text-primary">
                  Subject Property (MLS)
                </h3>
                <span className="text-xs text-muted-foreground">
                  {filteredMlsImages.length} images
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {filteredMlsImages.map((img) => {
                  const isSelected = selectedReferences.includes(img.id);
                  const imageUrl = api.getImageUrl(img.id);
                  const caption =
                    img.caption || img.category || "Uncategorized";

                  return (
                    <div
                      key={img.id}
                      className={cn(
                        "group relative rounded-lg overflow-hidden border transition-all cursor-pointer",
                        isSelected
                          ? "ring-2 ring-primary border-primary"
                          : "border-border hover:border-primary/50",
                      )}
                      onClick={() => toggleReference(img.id)}
                    >
                      <div className="aspect-[4/3] bg-secondary relative">
                        <img
                          src={imageUrl}
                          alt={caption}
                          className="w-full h-full object-cover"
                        />

                        {/* Selection Overlay */}
                        <div
                          className={cn(
                            "absolute inset-0 transition-colors duration-200 flex items-center justify-center",
                            isSelected
                              ? "bg-primary/20"
                              : "bg-black/0 group-hover:bg-black/10",
                          )}
                        >
                          {isSelected && (
                            <div className="bg-primary text-white rounded-full p-1 shadow-sm animate-in zoom-in">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Selection Checkbox (always visible on hover) */}
                        <div
                          className={cn(
                            "absolute top-2 right-2 w-5 h-5 rounded border bg-white flex items-center justify-center transition-opacity",
                            isSelected
                              ? "border-primary text-primary opacity-100"
                              : "border-muted-foreground opacity-0 group-hover:opacity-100",
                          )}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>

                      <div className="p-2 bg-white border-t border-border">
                        <p
                          className="text-xs font-medium truncate"
                          title={caption}
                        >
                          {caption}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Iteration History */}
            {aiGeneratedIterations.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <h3 className="architectural-label text-primary mb-4">
                  Generated Iterations
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {aiGeneratedIterations.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg overflow-hidden border border-border"
                    >
                      <div className="aspect-video bg-secondary">
                        <img
                          src={item.img}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => window.open(item.img, "_blank")}
                        >
                          <Download className="w-3 h-3 mr-1" /> View
                        </Button>
                      </div>
                      <div className="p-2 bg-white text-[10px] text-muted-foreground border-t border-border flex justify-between">
                        <span>{item.version}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Comps Section (Sidebar-like but inside main scroll) */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
              <h3 className="architectural-label text-primary mb-4">
                Market Comps
              </h3>
              {(() => {
                // Regroup filtered comps
                const filteredGroupedComps = filteredCompsImages.reduce(
                  (acc, img) => {
                    const key = img.filename.split("_")[0] || "Reference";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(img);
                    return acc;
                  },
                  {} as Record<string, PropertyImage[]>,
                );

                const filteredMarketComps = Object.entries(
                  filteredGroupedComps,
                ).map(([name, images], index) => ({
                  id: `comp-${index}`,
                  title:
                    name.length > 20 ? name.substring(0, 20) + "..." : name,
                  match: "Ref",
                  assets: images,
                }));

                return filteredMarketComps.map((comp) => (
                  <div key={comp.id} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium mb-2">{comp.title}</h4>
                    <div className="grid grid-cols-4 gap-3">
                      {comp.assets.map((img) => {
                        const isSelected = selectedReferences.includes(img.id);
                        const imageUrl = api.getImageUrl(img.id);
                        const caption =
                          img.caption || img.category || "Uncategorized";
                        return (
                          <div
                            key={img.id}
                            className={cn(
                              "group relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer",
                              isSelected
                                ? "ring-2 ring-primary border-primary"
                                : "border-border hover:border-primary/50",
                            )}
                            onClick={() => toggleReference(img.id)}
                          >
                            <img
                              src={imageUrl}
                              className="w-full h-full object-cover"
                            />
                            <div
                              className={cn(
                                "absolute inset-0 flex items-center justify-center transition-colors",
                                isSelected
                                  ? "bg-primary/20"
                                  : "group-hover:bg-black/10",
                              )}
                            >
                              {isSelected && (
                                <div className="bg-primary text-white rounded-full p-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            {/* Caption overlay */}
                            {caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1">
                                <p
                                  className="text-[10px] text-white truncate"
                                  title={caption}
                                >
                                  {caption}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Right Column: Chat */}
          <div className="w-[400px] h-full flex-shrink-0">
            <ChatInterface
              propertyId={propertyId}
              referenceImages={selectedReferences}
              onIterationGenerated={handleIterationGenerated}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
