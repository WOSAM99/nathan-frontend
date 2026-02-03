import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderPlus, 
  Images, 
  Settings, 
  LogOut,
  Palette,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export function Layout({ children, title, actions }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Projects", href: "/dashboard" },
    { icon: Palette, label: "Studio", href: "/studio/123" }, // Mock ID
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              A
            </div>
            <span className="font-medium tracking-wide text-sm">ATELIER STUDIO</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-secondary text-primary" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </a>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div>
            {title && <h1 className="text-2xl font-light tracking-tight text-foreground">{title}</h1>}
          </div>
          <div className="flex items-center gap-4">
            {actions}
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium border border-border hover:bg-secondary/80 transition-colors cursor-pointer">
                  JD
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href="/">
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
