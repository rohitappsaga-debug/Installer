import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { UtensilsCrossed, Lock, Mail } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (email: string, password: string) => void;
  restaurantName?: string;
}

export function AdminLogin({ onLogin, restaurantName }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Guaranteed Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          loading="eager"
        />
        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/60 to-primary/20 backdrop-blur-[2px]" />

        {/* Managerial Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6 shadow-2xl ring-4 ring-background/20 backdrop-blur-md">
            <UtensilsCrossed className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight drop-shadow-md">
            {restaurantName || 'Restaurant Management System'}
          </h1>
          <p className="text-muted-foreground font-medium">Admin Dashboard Access</p>
        </div>

        <Card className="p-8 shadow-2xl bg-card/90 backdrop-blur-xl border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-input focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </Button>
          </form>

        </Card>

        <div className="mt-8 text-center text-sm text-foreground/50">
          <p>© 2025 {restaurantName || 'The Golden Fork'}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
