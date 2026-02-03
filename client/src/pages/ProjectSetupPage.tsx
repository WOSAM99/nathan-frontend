import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ProjectSetupPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mlsFiles, setMlsFiles] = useState<File[]>([]);
  const [compFiles, setCompFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const mlsInputRef = useRef<HTMLInputElement>(null);
  const compInputRef = useRef<HTMLInputElement>(null);

  const handleMlsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMlsFiles(Array.from(e.target.files));
    }
  };

  const handleCompUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCompFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mlsFiles.length === 0) {
      toast.error("Please upload at least one MLS document");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const allFiles = [...mlsFiles, ...compFiles];
      const result = await api.uploadDocument("new", allFiles, notes);
      toast.success("Project initialized successfully");
      if (result.property_id) {
        setLocation(`/organize/${result.property_id}`);
      } else {
        setLocation("/organize");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xs">
              A
          </div>
          <span className="font-medium tracking-wide text-sm">DESIGN AI WORKSPACE</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          Draft Project v1.0
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-3xl font-light text-primary mb-3">Project Setup</h1>
          <p className="text-muted-foreground">Upload documentation and context to begin transformation.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-8">
          
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <Label className="architectural-label">MLS URL / Listing PDF</Label>
             </div>
             <input 
               type="file" 
               ref={mlsInputRef}
               onChange={handleMlsUpload}
               accept=".pdf,.jpg,.jpeg,.png"
               multiple
               className="hidden"
               data-testid="input-mls-file"
             />
             <div 
               onClick={() => mlsInputRef.current?.click()}
               className="h-32 border border-dashed border-border rounded-xl bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 group"
               data-testid="dropzone-mls"
             >
                <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {mlsFiles.length > 0 ? `${mlsFiles.length} file(s) selected` : "Select or drop file"}
                </span>
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <Label className="architectural-label">Comp PDFS / References</Label>
             </div>
             <input 
               type="file" 
               ref={compInputRef}
               onChange={handleCompUpload}
               accept=".pdf,.jpg,.jpeg,.png"
               multiple
               className="hidden"
               data-testid="input-comp-file"
             />
             <div 
               onClick={() => compInputRef.current?.click()}
               className="h-32 border border-dashed border-border rounded-xl bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 group"
               data-testid="dropzone-comp"
             >
                <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {compFiles.length > 0 ? `${compFiles.length} file(s) selected` : "Add Reference Material"}
                </span>
             </div>
          </div>

          <div className="space-y-3">
             <Label className="architectural-label">Optional Notes</Label>
             <Textarea 
                placeholder="Add specific instructions or client preferences..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="architectural-input min-h-[120px] resize-none text-sm"
                data-testid="input-notes"
             />
          </div>

          <div className="pt-4 flex justify-center">
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-48 h-12 rounded-full bg-primary text-primary-foreground font-medium text-xs uppercase tracking-widest hover:bg-primary/90 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                "Import Photos"
              )}
            </Button>
          </div>

        </form>
      </main>

      <footer className="py-6 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Security: End-to-end encrypted data processing enabled.</p>
      </footer>
    </div>
  );
}
