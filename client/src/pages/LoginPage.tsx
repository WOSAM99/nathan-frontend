import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login({ email, password });
      toast.success("Welcome back!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto mb-6">
            A
          </div>
          <p className="architectural-label mb-2">DESIGN AI WORKSPACE</p>
          <h1 className="text-3xl font-light text-primary">Sign In</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label className="architectural-label text-xs">Email Address</Label>
            <Input 
              type="email" 
              placeholder="name@studio.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="architectural-input h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-primary shadow-none transition-all placeholder:text-muted-foreground/40"
              required
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label className="architectural-label text-xs">Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="architectural-input h-12 bg-transparent border-t-0 border-x-0 border-b border-border rounded-none px-0 focus:ring-0 focus:border-primary shadow-none transition-all placeholder:text-muted-foreground/40"
              required
              data-testid="input-password"
            />
          </div>

          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              Reset Password
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-sm bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold hover:bg-primary/90 mt-4 shadow-lg"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Sign In"}
          </Button>
        </form>
      </div>

      <p className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
        High-End Interior Workspace v1.0
      </p>
    </div>
  );
}
