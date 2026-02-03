import { Layout } from "@/components/Layout";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { Link } from "wouter";

// Mock Data
import kitchenImg from "@/assets/images/kitchen-modern_1.jpg";
import livingImg from "@/assets/images/living-room-luxury_1.jpg";
import bedroomImg from "@/assets/images/bedroom-modern.jpg";

const projects = [
  {
    id: "1",
    title: "123 Magnolia St",
    location: "Beverly Hills, CA",
    status: "In Progress" as const,
    image: livingImg,
    timeline: "12 Days Left",
  },
  {
    id: "2",
    title: "458 Silver Lake Blvd",
    location: "Los Angeles, CA",
    status: "Completed" as const,
    image: kitchenImg,
    roi: "+22.4%",
  },
  {
    id: "3",
    title: "88 Oakmont Dr",
    location: "Bel Air, CA",
    status: "Planning" as const,
    image: bedroomImg,
  },
];

export default function DashboardPage() {
  return (
    <Layout 
      title="Project Portfolio"
      actions={
        <Link href="/new-project">
            <Button className="rounded-full px-6 h-11 bg-primary text-primary-foreground font-medium text-xs uppercase tracking-wider hover:bg-primary/90 shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            New Project
            </Button>
        </Link>
      }
    >
      <div className="mb-8">
        <p className="text-muted-foreground mt-[-20px] mb-6 text-sm">Manage and monitor your active renovation investments.</p>
        
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search addresses..." 
              className="pl-10 rounded-full border-border bg-white shadow-sm hover:shadow-md transition-shadow h-10"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-white border-border shadow-sm hover:bg-secondary">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div key={project.id} className="h-[420px]">
            <ProjectCard {...project} />
          </div>
        ))}

        {/* Empty State / Add New Placeholder */}
        <div className="h-[420px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center hover:border-primary/20 hover:bg-secondary/30 transition-colors group cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">Initiate New Project</h3>
          <p className="text-muted-foreground text-sm max-w-[200px]">Setup takes less than 2 minutes</p>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest">
        <span>© 2026 Atelier Interiors</span>
        <div className="flex gap-6">
            <span className="cursor-pointer hover:text-primary">Privacy</span>
            <span className="cursor-pointer hover:text-primary">Support</span>
        </div>
        <div className="font-bold text-primary">84% Capacity</div>
      </div>
    </Layout>
  );
}
