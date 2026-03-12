import { User } from '../../types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User as UserIcon, Bell, HelpCircle, LogOut, ChevronRight, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onBack: () => void;
  restaurantName?: string;
}

export function ProfileScreen({ user, onLogout, onBack, restaurantName }: ProfileScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const isDark = darkMode;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [darkMode]);

  const getInitials = (name: string) => {
    return name
      .split('')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <button onClick={onBack} className="text-primary-foreground/90 mb-2">← Back</button>
        <h2 className="font-bold">Profile & Settings</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-foreground font-semibold mb-1">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-primary mt-1">{getRoleName(user.role)}</p>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <div>
          <h3 className="text-foreground px-2 mb-3">Settings</h3>
          <Card className="divide-y divide-border bg-card border-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-foreground">Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive order updates</div>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-foreground">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Toggle dark theme</div>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </Card>
        </div>

        {/* Other Options */}
        <div>
          <h3 className="text-foreground px-2 mb-3">Support</h3>
          <Card className="divide-y divide-border bg-card border-border">
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-foreground">Help & Support</div>
                  <div className="text-sm text-muted-foreground">Get assistance</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-foreground">Account Settings</div>
                  <div className="text-sm text-muted-foreground">Manage your account</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* App Info */}
        <Card className="p-4 bg-muted/50 border-border">
          <div className="text-center text-sm text-muted-foreground">
            <p>Version 1.0.0</p>
            <p className="mt-1">{restaurantName ? `${restaurantName} POS System` : 'The Golden Fork POS System'}</p>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
