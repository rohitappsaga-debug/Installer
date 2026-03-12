import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { UserRole } from '../../types';
import { UtensilsCrossed, Lock, Mail } from 'lucide-react';

interface MobileLoginProps {
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  restaurantName?: string;
}

export function MobileLogin({ onLogin, restaurantName }: MobileLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('waiter');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onLogin(email.trim(), password.trim(), selectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Guaranteed Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          loading="eager"
        />
        {/* Softening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/60 to-primary/30 backdrop-blur-[3px]" />

        {/* Decorative Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            {restaurantName || 'Restaurant Management System'}
          </h1>
          <p className="text-muted-foreground">Internal Restaurant Portal</p>
        </div>

        <Card className="p-8 shadow-xl bg-card/80 backdrop-blur-md border-border/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@restaurant.com"
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

            <div className="space-y-2">
              <Label>Select Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('waiter')}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${selectedRole === 'waiter'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background/50 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30'
                    }`}
                >
                  <span className="text-2xl">👨‍💼</span>
                  <span className="font-medium text-sm">Waiter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${selectedRole === 'admin'
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background/50 text-muted-foreground hover:bg-muted/50 hover:border-muted-foreground/30'
                    }`}
                >
                  <span className="text-2xl">👔</span>
                  <span className="font-medium text-sm">Manager</span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </Button>
          </form>

        </Card>
      </div>
    </div>
  );
}
