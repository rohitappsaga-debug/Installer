import { ReactNode } from 'react';
import { Home, Bell, User } from 'lucide-react';
import { Badge } from './ui/badge';

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  unreadNotifications?: number;
  restaurantName?: string;
}

export function MobileLayout({
  children,
  currentPage,
  onNavigate,
  unreadNotifications = 0,
  restaurantName,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-16">
      {children}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-20">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onNavigate('tables')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentPage === 'tables' || currentPage === 'menu' || currentPage === 'order' || currentPage === 'bill'
              ? 'text-primary'
              : 'text-muted-foreground'
              }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => onNavigate('notifications')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 relative ${currentPage === 'notifications' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Bell className="w-6 h-6" />
            {unreadNotifications > 0 && (
              <Badge className="absolute top-1 right-1/4 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadNotifications}
              </Badge>
            )}
            <span className="text-xs">Alerts</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${currentPage === 'profile' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
