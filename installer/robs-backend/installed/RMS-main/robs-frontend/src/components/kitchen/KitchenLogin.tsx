import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { ChefHat, Lock, Mail } from 'lucide-react';

interface KitchenLoginProps {
  onLogin: (email: string, password: string) => void;
  restaurantName?: string;
}

export function KitchenLogin({ onLogin, restaurantName }: KitchenLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Sim delay
    onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Guaranteed Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          loading="eager"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-green-950/60 backdrop-blur-[3px]" />

        {/* Specialized Kitchen Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-green-900/15 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-2xl mb-4 shadow-xl shadow-green-900/50 ring-4 ring-green-900/30">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{restaurantName || 'Restaurant Management System'}</h1>
          <p className="text-green-400 font-medium tracking-wide uppercase text-sm">Back of House Access</p>
        </div>

        <Card className="p-8 shadow-2xl bg-zinc-900/95 backdrop-blur-xl border-zinc-800 text-zinc-100 ring-1 ring-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400">Access ID / Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="kitchen@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/40 border-zinc-700 text-zinc-100 focus:border-green-500 focus:ring-green-500/20 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400">Passcode</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-black/40 border-zinc-700 text-zinc-100 focus:border-green-500 focus:ring-green-500/20 h-12"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Kitchen Display'}
            </Button>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              Authorized Personnel Only
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
