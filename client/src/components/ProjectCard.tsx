import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";

interface ProjectCardProps {
  id: string;
  title: string;
  location: string;
  status: "In Progress" | "Completed" | "Planning";
  image: string;
  timeline?: string;
  roi?: string;
  completion?: number;
}

export function ProjectCard({ id, title, location, status, image, timeline, roi, completion }: ProjectCardProps) {
  return (
    <div className="group architectural-card overflow-hidden flex flex-col h-full bg-card">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <Badge 
            variant="secondary" 
            className="rounded-sm bg-white/90 backdrop-blur-md border-none text-primary uppercase text-[10px] tracking-widest font-bold px-2 py-1 shadow-sm"
          >
            {status}
          </Badge>
        </div>
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-4">{location}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-t border-border pt-4">
            {timeline && (
              <div className="flex flex-col">
                <span className="architectural-label mb-1">Timeline</span>
                <span className="font-medium text-primary">{timeline}</span>
              </div>
            )}
            {roi && (
              <div className="flex flex-col text-right">
                <span className="architectural-label mb-1">ROI</span>
                <span className="font-medium text-emerald-600">{roi}</span>
              </div>
            )}
             {status === "Planning" && (
              <div className="flex flex-col text-right w-full">
                <span className="architectural-label mb-1">Drafts</span>
                <span className="font-medium text-primary">4 Ready</span>
              </div>
            )}
          </div>

          <Link href={`/studio/${id}`}>
            <a className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-primary hover:text-white rounded-lg text-xs font-medium uppercase tracking-wider transition-all duration-200 group-hover:bg-primary group-hover:text-white">
              Open Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
