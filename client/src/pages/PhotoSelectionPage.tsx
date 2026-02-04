import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight,
  Check,
  Search,
  Wand2,
  Armchair,
  BedDouble,
  Bath,
  Home,
  HelpCircle,
  MoreHorizontal,
  FolderInput,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { api, PropertyDetails } from "@/lib/api";
import { toast } from "sonner";

const categories = [
  { id: "kitchen", label: "Kitchen", icon: Home },
  { id: "living", label: "Living Room", icon: Armchair },
  { id: "bedrooms", label: "Bedrooms", icon: BedDouble },
  { id: "bathrooms", label: "Bathrooms", icon: Bath },
  { id: "exterior", label: "Exterior", icon: Home },
  { id: "uncategorized", label: "Uncategorized", icon: HelpCircle },
];

interface Photo {
  id: string;
  src: string;
  category: string;
  selected: boolean;
  filename: string;
  customCategoryInput?: string; // For editing custom category
}

export default function PhotoSelectionPage() {
  const params = useParams();
  const propertyId = params.id || "";
  const [, setLocation] = useLocation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("uncategorized");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPropertyImages();
  }, [propertyId]);

  const loadPropertyImages = async () => {
    try {
      const details = await api.getPropertyDetails(propertyId);
      // New API structure returns mls_images and comps_images
      // We only want MLS images for categorization
      const mlsImages = details.mls_images || [];

      const loadedPhotos = mlsImages.map(file => ({
        id: file.id,
        src: api.getImageUrl(file.id),
        category: file.category || "uncategorized",
        selected: false,
        filename: file.filename
      }));
      setPhotos(loadedPhotos);
    } catch (error) {
      toast.error("Failed to load images");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(p => p.category === selectedCategory);
  const selectedPhotos = photos.filter(p => p.selected);
  const selectedCount = selectedPhotos.length;

  const handleContinue = () => {
    // Navigate to the studio page for this property
    setLocation(`/studio/${propertyId}`);
  };

  const toggleSelection = (id: string) => {
    setPhotos(photos.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const moveSelectedPhotos = async (targetCategory: string) => {
    // Optimistic update
    setPhotos(photos.map(p =>
      p.selected ? { ...p, category: targetCategory, selected: false } : p
    ));

    // Persist changes
    const photosToUpdate = selectedPhotos;
    let failedCount = 0;

    // Process in parallel (limit concurrency?) or sequential?
    // Sequential for safety or parallel for speed. Parallel allows faster feedback.
    await Promise.all(photosToUpdate.map(async (photo) => {
      try {
        await api.updateImageCategory(propertyId, photo.id, targetCategory);
      } catch (err) {
        console.error(`Failed to update category for ${photo.id}`, err);
        failedCount++;
      }
    }));

    if (failedCount > 0) {
      toast.error(`Failed to save changes for ${failedCount} images`);
      // Ideally revert changes here, but simple refresh is easier fallback
      loadPropertyImages();
    } else {
      toast.success(`Moved ${selectedCount} images to ${categories.find(c => c.id === targetCategory)?.label}`);
    }
  };

  const moveSinglePhoto = async (id: string, targetCategory: string) => {
    // Optimistic update
    setPhotos(photos.map(p =>
      p.id === id ? { ...p, category: targetCategory } : p
    ));

    try {
      await api.updateImageCategory(propertyId, id, targetCategory);
      toast.success("Image moved");
    } catch (err) {
      toast.error("Failed to move image");
      console.error(err);
      // Revert
      loadPropertyImages();
    }
  };

  const saveCustomCategory = async (id: string, customCategory: string) => {
    if (!customCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Optimistic update
    setPhotos(photos.map(p =>
      p.id === id ? { ...p, category: customCategory.trim(), customCategoryInput: undefined } : p
    ));

    try {
      await api.updateImageCategory(propertyId, id, customCategory.trim());
      toast.success(`Saved as "${customCategory.trim()}"`);
    } catch (err) {
      toast.error("Failed to save category");
      console.error(err);
      // Revert
      loadPropertyImages();
    }
  };

  const enableCustomCategoryInput = (id: string) => {
    setPhotos(photos.map(p =>
      p.id === id ? { ...p, customCategoryInput: "" } : p
    ));
  };

  const updateCustomCategoryInput = (id: string, value: string) => {
    setPhotos(photos.map(p =>
      p.id === id ? { ...p, customCategoryInput: value } : p
    ));
  };

  const cancelCustomCategoryInput = (id: string) => {
    setPhotos(photos.map(p =>
      p.id === id ? { ...p, customCategoryInput: undefined } : p
    ));
  };

  // Calculate category counts dynamically
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: photos.filter(p => p.category === cat.id).length
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Categories */}
      <aside className="w-80 border-r border-border bg-sidebar flex flex-col p-6 fixed h-full z-10">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-sm font-medium text-primary">Subject Property</h2>
            <span className="architectural-label text-[10px]">MLS ID #{propertyId.slice(0, 6)}</span>
          </div>
          <p className="text-muted-foreground text-xs">Organization Utility</p>
        </div>

        <div className="mb-6">
          <h3 className="architectural-label mb-4">Room Buckets</h3>
          <p className="text-xs text-muted-foreground mb-6">Categorize photos by dragging into folders</p>

          <div className="space-y-1">
            {categoriesWithCounts.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{cat.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    isActive ? "bg-primary-foreground/20" : "bg-secondary"
                  )}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
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
        <header className="flex items-center justify-between mb-8 sticky top-0 bg-[#f8f9fa]/95 backdrop-blur z-20 py-4 -my-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-light text-primary">
              {categories.find(c => c.id === selectedCategory)?.label || "Library"}
            </h1>
            <span className="text-sm text-muted-foreground">
              {filteredPhotos.length} items • {selectedCount > 0 ? `${selectedCount} selected` : "Select items to organize"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {selectedCount > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="rounded-full bg-primary text-white shadow-md text-xs font-medium h-9 px-4 animate-in fade-in slide-in-from-right-4">
                    <FolderInput className="w-3 h-3 mr-2" />
                    Move {selectedCount} to...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Move to Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.filter(c => c.id !== selectedCategory).map((cat) => (
                    <DropdownMenuItem key={cat.id} onClick={() => moveSelectedPhotos(cat.id)}>
                      <cat.icon className="w-4 h-4 mr-2" />
                      {cat.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
          {filteredPhotos.map((photo) => (
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
                {/* Selection Indicator */}
                <div className={cn(
                  "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                  photo.selected ? "bg-primary text-white" : "bg-white/90 text-transparent border border-white/50"
                )}>
                  <Check className="w-3.5 h-3.5" />
                </div>

                {/* Individual Move Menu */}
                <div className="absolute top-3 left-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white text-muted-foreground hover:text-primary"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>Move to Category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {categories.filter(c => c.id !== photo.category).map((cat) => (
                        <DropdownMenuItem key={cat.id} onClick={() => moveSinglePhoto(photo.id, cat.id)}>
                          <cat.icon className="w-4 h-4 mr-2" />
                          {cat.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Custom Category Input for Uncategorized */}
                {selectedCategory === "uncategorized" && photo.customCategoryInput === undefined && (
                  <div className="absolute bottom-3 left-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full bg-white/90 backdrop-blur shadow-sm hover:bg-white text-xs"
                      onClick={() => enableCustomCategoryInput(photo.id)}
                    >
                      + Add Custom Category
                    </Button>
                  </div>
                )}

                {/* Custom Category Input Field */}
                {photo.customCategoryInput !== undefined && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-lg p-4 w-full max-w-[280px] shadow-lg">
                      <h4 className="text-sm font-medium mb-2">Enter Category Name</h4>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                        placeholder="e.g., Pool Area, Deck"
                        value={photo.customCategoryInput}
                        onChange={(e) => updateCustomCategoryInput(photo.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveCustomCategory(photo.id, photo.customCategoryInput || "");
                          } else if (e.key === 'Escape') {
                            cancelCustomCategoryInput(photo.id);
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => saveCustomCategory(photo.id, photo.customCategoryInput || "")}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => cancelCustomCategoryInput(photo.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredPhotos.length === 0 && (
            <div className="col-span-full aspect-[4/1] rounded-2xl border border-dashed border-border bg-secondary/10 flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm font-medium">No items in this category</p>
              <p className="text-xs opacity-60 mt-1">Move photos here to organize them</p>
            </div>
          )}
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
