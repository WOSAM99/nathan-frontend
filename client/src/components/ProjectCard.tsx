import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Image as ImageIcon } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  location: string;
  status: "Planning" | "In Progress" | "Completed";
  image?: string;
}

export function ProjectCard({ id, title, location, status, image }: ProjectCardProps) {
  const statusColors = {
    "Planning": "bg-blue-500/10 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-500/10 text-amber-700 border-amber-200",
    "Completed": "bg-emerald-500/10 text-emerald-700 border-emerald-200"
  };

  return (
    <Link href={`/studio/${id}`}>
      <div className="group h-full rounded-2xl border border-border bg-card overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer">
        <div className="relative h-[280px] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge className={`${statusColors[status]} border backdrop-blur-sm font-medium text-[10px] uppercase tracking-wider px-3 py-1`}>
              {status}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-primary mb-2 group-hover:text-primary/80 transition-colors">{title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>Updated Today</span>
            </div>
            <span className="text-primary font-bold">View →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
