import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { ArrowRight, Check, Search, Wand2, Armchair, BedDouble, Bath, Home, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Using mock images from our assets
import kitchenImg from "@/assets/images/kitchen-modern_1.jpg";
import kitchenImg2 from "@/assets/images/kitchen-modern_2.jpg";
import livingImg from "@/assets/images/living-room-luxury_1.jpg";
import livingImg2 from "@/assets/images/living-room-luxury_2.jpg";
import bedroomImg from "@/assets/images/bedroom-modern.jpg";
import exteriorImg from "@/assets/images/exterior-modern.jpg";
import baselineImg from "@/assets/images/room-baseline.jpg";

const categories = [
  { id: "kitchen", label: "Kitchen", icon: Home, count: 12 },
  { id: "living", label: "Living Room", icon: Armchair, count: 8 },
  { id: "bedrooms", label: "Bedrooms", icon: BedDouble, count: 4 },
  { id: "bathrooms", label: "Bathrooms", icon: Bath, count: 2 },
  { id: "exterior", label: "Exterior", icon: Home, count: 1 }, // Changed from 0 to 1 based on assets
  { id: "unknown", label: "Unknown", icon: HelpCircle, count: 19, active: true },
];

const initialPhotos = [
  { id: 1, src: kitchenImg, category: "kitchen" },
  { id: 2, src: livingImg, category: "living" },
  { id: 3, src: bedroomImg, category: "bedrooms" },
  { id: 4, src: exteriorImg, category: "exterior" },
  { id: 5, src: baselineImg, category: "unknown", selected: true },
  { id: 6, src: kitchenImg2, category: "kitchen" },
  { id: 7, src: livingImg2, category: "living" },
  { id: 8, src: baselineImg, category: "unknown" },
];

export default function PhotoSelectionPage() {
  const [, setLocation] = useLocation();
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedCategory, setSelectedCategory] = useState("unknown");

  const handleContinue = () => {
    setLocation("/studio/123");
  };

  const toggleSelection = (id: number) => {
    setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Categories */}
      <aside className="w-80 border-r border-border bg-sidebar flex flex-col p-6 fixed h-full z-10">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-1">
             <h2 className="text-sm font-medium text-primary">Subject Property</h2>
             <span className="architectural-label text-[10px]">MLS ID #482910</span>
          </div>
          <p className="text-muted-foreground text-xs">Organization Utility</p>
        </div>

        <div className="mb-6">
          <h3 className="architectural-label mb-4">Room Buckets</h3>
          <p className="text-xs text-muted-foreground mb-6">Categorize photos by dragging into folders</p>
          
          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200",
                  cat.id === selectedCategory 
                    ? "bg-white shadow-md text-primary font-medium scale-[1.02]" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <cat.icon className={cn("w-4 h-4", cat.id === selectedCategory ? "text-primary" : "text-muted-foreground/70")} />
                  {cat.label}
                </div>
                <span className={cn("text-xs font-mono", cat.id === selectedCategory ? "text-primary opacity-100" : "opacity-50")}>
                  {cat.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs mb-2 font-medium">
            <span className="architectural-label">Progress</span>
            <span>58%</span>
          </div>
          <Progress value={58} className="h-1 bg-secondary" />
          <p className="mt-4 text-[10px] text-muted-foreground leading-relaxed">
            Sorting all subject property images ensures the AI correctly identifies design contexts.
          </p>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 ml-80 p-8 min-h-screen bg-[#f8f9fa]">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-light text-primary">Subject Property Library</h1>
            <span className="text-sm text-muted-foreground">45 items total • 26 categorized</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-white shadow-sm border border-border">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="outline" size="sm" className="rounded-full bg-white shadow-sm border border-border text-xs font-medium h-9 px-4 hover:text-primary">
                  <Wand2 className="w-3 h-3 mr-2" />
                  Suggest Auto-Sort
                </Button>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className={cn(
                "group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                photo.selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.02]" : "hover:shadow-md"
              )}
              onClick={() => toggleSelection(photo.id)}
            >
              <img src={photo.src} alt="Property" className="w-full h-full object-cover" />
              
              <div className={cn(
                "absolute inset-0 bg-black/10 transition-opacity duration-200",
                photo.selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <div className={cn(
                  "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                  photo.selected ? "bg-primary text-white" : "bg-white/90 text-transparent border border-white/50"
                )}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
          
          <div className="aspect-[4/3] rounded-2xl border border-dashed border-border bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground text-[10px] uppercase tracking-widest font-medium">
             End of Library
          </div>
        </div>
      </main>

      {/* Floating Footer Action */}
      <div className="fixed bottom-8 right-8 z-20 flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
        <span className="architectural-label bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-border">Awaiting Final Review</span>
        <Button 
          onClick={handleContinue}
          className="h-12 pl-6 pr-4 rounded-full bg-primary text-primary-foreground font-medium text-xs uppercase tracking-widest hover:bg-primary/90 shadow-strong hover:translate-y-[-2px] transition-all"
        >
          Looks Good, Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
